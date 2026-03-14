# ARCHITECTURE.md — ArvyaX Journal System Design

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ArvyaX Journal                              │
│                                                                     │
│  ┌─────────────┐   HTTP/REST    ┌──────────────┐   Async ORM      │
│  │  Next.js 14 │ ─────────────► │  FastAPI     │ ──────────────►  │
│  │  (Frontend) │ ◄───────────── │  (Backend)   │   SQLAlchemy     │
│  └─────────────┘   JSON / SSE   └──────────────┘                  │
│                                        │                            │
│                                        │  Gemini API               │
│                                        ▼                            │
│                                 ┌──────────────┐                   │
│                                 │  PostgreSQL  │                   │
│                                 │  (or SQLite) │                   │
│                                 └──────────────┘                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. How would you scale this to 100,000 users?

### Database Layer
- **Connection pooling**: Use **PgBouncer** between FastAPI and PostgreSQL to handle thousands of concurrent connections efficiently (PostgreSQL handles ~100 active connections; PgBouncer pools thousands into that)
- **Read replicas**: Route `GET` endpoints to PostgreSQL read replicas; writes go to primary
- **Indexes**: Ensure `idx_entries_user_id` and `idx_entries_created_at DESC` for fast per-user queries
- **Partitioning**: Partition `journal_entries` by `created_at` (monthly) once data exceeds 10M rows

### API Layer
- **Horizontal scaling**: Run FastAPI behind a **load balancer** (Nginx / AWS ALB) with multiple Uvicorn+Gunicorn workers
- **Kubernetes**: Deploy via K8s with HPA (Horizontal Pod Autoscaler) that scales pods based on CPU/request rate
- **Async throughout**: FastAPI + SQLAlchemy async + asyncpg means a single pod handles 1000s of concurrent requests with no thread blocking

### LLM Layer
- **Caching** (implemented): Hash-based DB cache eliminates redundant LLM calls for identical text — at scale, this alone saves 40-60% of API spend
- **Queue**: At high volume, offload LLM calls to a **job queue** (Celery + Redis) so API responds immediately and analysis arrives via WebSocket/polling
- **Rate limit pass-through**: SlowAPI limits protect the LLM API budget automatically

### Frontend
- **CDN**: Deploy Next.js on **Vercel Edge Network** — static assets + ISR cached globally
- **SSR → Static**: Pre-render pages where possible; user-specific data fetched client-side

---

## 2. How would you reduce LLM cost?

| Strategy | Implementation | Savings Estimate |
|---|---|---|
| **Hash-based caching** ✅ | SHA-256 of text stored in DB; cache hit skips LLM | 40–60% |
| **Prompt compression** | Strip punctuation/stopwords before LLM call | 10–15% |
| **Batching** | Accumulate 10 entries, analyze in one call | 60–70% |
| **Model tiering** | Use `gemini-2.5-pro` for high-quality reasoning; cache results to mitigate cost | 80% vs previous GPT-4 usage |
| **Semantic deduplication** | Vector similarity (cosine) to reuse analysis for *similar* (not identical) text | 20–30% additional |
| **TTL cache** | Cache responses for 24h in Redis; repeat entries by same user within a day hit cache | 30% |

**Current implementation**: Strategy 1 (hash-based caching) is fully implemented in the codebase.

---

## 3. How would you cache repeated analysis?

### Current Implementation (DB hash cache)
```
POST /api/journal/analyze
  │
  ├── SHA-256(text.lower().strip()) → hash
  │
  ├── SELECT FROM journal_entries WHERE text_hash = hash AND emotion IS NOT NULL
  │     └── HIT  → return cached {emotion, keywords, summary}
  │     └── MISS → call Gemini API → store result → return
```

### Production Enhancement: Redis Cache
```
POST /api/journal/analyze
  │
  ├── Check Redis: GET analysis:{text_hash}
  │     └── HIT  → return in ~1ms (vs ~2s LLM latency)
  │     └── MISS → call Gemini → SET analysis:{hash} (TTL: 7 days) → return
```

```python
# Redis caching layer (production upgrade)
import redis.asyncio as redis

r = redis.Redis.from_url(os.getenv("REDIS_URL"))

async def cached_analyze(text: str) -> dict:
    key = f"analysis:{sha256(text)}"
    cached = await r.get(key)
    if cached:
        return json.loads(cached)
    result = await analyze_emotion(text)
    await r.setex(key, 604800, json.dumps(result))  # 7-day TTL
    return result
```

**Cache invalidation**: TTL-based (7 days). No active invalidation needed since text→emotion mapping is deterministic.

---

## 4. How would you protect sensitive journal data?

### Encryption at Rest
- **PostgreSQL**: Enable `pgcrypto` extension; encrypt `text` column with AES-256
- **SQLite**: Use `SQLCipher` for encrypted SQLite databases
- **Backups**: Encrypt all DB dumps with GPG before storing in S3

### Encryption in Transit
- **TLS/HTTPS**: Enforce HTTPS everywhere via Nginx + Let's Encrypt (auto-renewal via Certbot)
- **HSTS**: Add `Strict-Transport-Security` header to prevent downgrade attacks

### Authentication & Authorization
- **JWT tokens**: Each request carries a signed JWT (RS256) with `userId` claim
- **Ownership check**: `WHERE user_id = jwt_user_id` on every query — users can only read their own entries
- **Refresh token rotation**: Short-lived access tokens (15 min) + secure HTTP-only cookie refresh tokens

### Data Minimisation
- **Purpose limitation**: Gemini only receives the journal text (no userId, email, or PII)
- **Opt-out**: Users can delete all their entries via `DELETE /api/journal/:userId`
- **Field-level encryption**: Encrypt `text` column client-side before sending (E2E encryption option)

### Infrastructure
- **Secrets management**: Gemini API keys stored in environment variables, rotated via AWS Secrets Manager / Vault — never committed to git
- **Rate limiting** ✅: 60 req/min per IP prevents brute-force data harvesting
- **Audit logs**: Log all data access with timestamp, userId, and endpoint (not the actual content)
- **GDPR compliance**: Provide data export (`GET /api/journal/:userId`) and deletion endpoints

---

## Data Model

```sql
CREATE TABLE journal_entries (
  id         TEXT PRIMARY KEY,           -- UUID
  user_id    TEXT NOT NULL,              -- indexed
  ambience   TEXT NOT NULL,              -- forest | ocean | mountain
  text       TEXT NOT NULL,              -- journal entry body
  emotion    TEXT,                       -- LLM: calm | joyful | etc.
  keywords   JSON,                       -- LLM: ["rain", "peace"]
  summary    TEXT,                       -- LLM: one-line summary
  text_hash  TEXT UNIQUE,               -- SHA-256 for cache lookup
  created_at TIMESTAMPTZ DEFAULT now()  -- indexed DESC
);
```

---

## API Flow Diagram

```
User writes entry
      │
      ▼
POST /api/journal
      │
      ├── 1. Validate request (Pydantic)
      ├── 2. hash = SHA-256(text)
      ├── 3. SELECT cached analysis by hash?
      │         ├── YES → reuse {emotion, keywords, summary}
      │         └── NO  → call Gemini API → parse JSON response
      ├── 4. INSERT journal_entries
      └── 5. Return 201 with full entry
```
