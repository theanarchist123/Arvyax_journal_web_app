# ArvyaX Journal — AI-Assisted Nature Journal

> A full-stack AI journal system where users reflect on immersive nature sessions (forest, ocean, mountain), with LLM-powered emotion analysis and mental-state insights.

![Tech Stack](https://img.shields.io/badge/FastAPI-Python-009688?style=flat-square&logo=fastapi)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)
![Gemini](https://img.shields.io/badge/Gemini-2.5--Pro-4285F4?style=flat-square&logo=google)

---

## ✨ Features

- **Journal entries** — write reflections with forest/ocean/mountain ambience
- **LLM emotion analysis** — Gemini AI identifies emotions, keywords, and summaries
- **Streaming responses** — live typewriter animation as AI analyzes your entry
- **Insights dashboard** — animated stats, emotion bar chart, keyword cloud
- **Ambience-reactive UI** — UI color theme changes with your chosen session type
- **Caching** — identical text reuses previous LLM result (saves API cost)
- **Rate limiting** — 60 requests/minute per IP
- **Docker Compose** — one command to run everything

---

## 🚀 Quick Start

### Option A — Local (SQLite, no Docker needed)

**Backend**
```bash
cd backend

# 1. Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
copy .env.example .env
# Open .env and set your GEMINI_API_KEY

# 4. Start the server (SQLite auto-created on first run)
uvicorn app.main:app --reload --port 8000
```

**Frontend** (in a separate terminal)
```bash
cd frontend
npm install
npm run dev -- -p 3001
```

Open: **http://localhost:3001** | API Docs: **http://localhost:8000/docs**

---

### Option B — Docker Compose (PostgreSQL)

```bash
# 1. Set your Gemini API key
echo "GEMINI_API_KEY=your_key_here" > .env

# 2. Launch everything
docker compose up --build

# 3. Open in browser
#    Frontend: http://localhost:3001
#    API Docs: http://localhost:8000/docs
```

---

## 🔑 Get a Free Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **Create API Key**
3. Paste it into `backend/.env` as `GEMINI_API_KEY=...`

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/journal` | Create a journal entry (auto-analyzes emotion) |
| `GET`  | `/api/journal/:userId` | Get all entries for a user |
| `POST` | `/api/journal/analyze` | Analyze emotion of text (with cache) |
| `POST` | `/api/journal/analyze/stream` | **Streaming** LLM response (SSE) |
| `GET`  | `/api/journal/insights/:userId` | Get aggregated insights |
| `GET`  | `/health` | Health check |
| `GET`  | `/docs` | Interactive Swagger UI |

### Example — Create Entry

```bash
curl -X POST http://localhost:8000/api/journal \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "demo-user",
    "ambience": "forest",
    "text": "I felt calm today after listening to the rain."
  }'
```

**Response:**
```json
{
  "id": "uuid-here",
  "userId": "demo-user",
  "ambience": "forest",
  "text": "I felt calm today after listening to the rain.",
  "emotion": "calm",
  "keywords": ["rain", "nature", "peace"],
  "summary": "User experienced relaxation during the forest session",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

## 🗄️ Database

**Default**: SQLite (zero setup, file: `backend/arvyax.db`)

**Production**: PostgreSQL via Docker Compose

Switch by changing `DATABASE_URL` in `backend/.env`:
```env
# SQLite (default, no setup)
DATABASE_URL=sqlite+aiosqlite:///./arvyax.db

# PostgreSQL (with Docker)
DATABASE_URL=postgresql+asyncpg://arvyax:secret@localhost:5432/arvyax
```

---

## 🧠 Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Backend | Python + FastAPI | Async, type-safe, auto-docs |
| ORM | SQLAlchemy 2.0 (async) | Clean models, pg+sqlite support |
| LLM | Google Gemini 2.5 Pro | Most advanced reasoning model, streaming support |
| Frontend | Next.js 14 (App Router) | SSR, TypeScript, great DX |
| Database | PostgreSQL / SQLite | Production / Development |
| Rate Limiting | SlowAPI | Per-IP limits, FastAPI native |
| Containerization | Docker + Compose | Reproducible prod deployment |

---

## 📁 Project Structure

```
arvyax_journal_web/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI entry point
│   │   ├── config.py        # Settings
│   │   ├── database.py      # Async SQLAlchemy
│   │   ├── models/          # ORM models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── routers/         # API routes
│   │   └── services/        # LLM + insights logic
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Main page
│   │   └── globals.css      # Design system
│   ├── components/          # React components
│   ├── lib/                 # API client + types
│   └── Dockerfile
│
├── docker-compose.yml
├── README.md
└── ARCHITECTURE.md
```

---

## 📋 Bonus Features Implemented

- [x] **Streaming LLM** — Server-Sent Events via `POST /api/journal/analyze/stream`
- [x] **LLM Caching** — SHA-256 text hash stored in DB; identical text skips LLM call
- [x] **Rate Limiting** — 60 req/min per IP via SlowAPI
- [x] **Docker Compose** — PostgreSQL + FastAPI + Next.js
- [ ] Deployed demo — *add link after deploying to Railway/Vercel*
