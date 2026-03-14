import type { JournalEntry, InsightsData, EmotionAnalysis } from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/journal`
    : "/api/journal";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || "API error");
  }
  return res.json();
}

// ── Journal CRUD ──────────────────────────────────────────────

export async function createEntry(payload: {
  userId: string;
  ambience: string;
  text: string;
}): Promise<JournalEntry> {
  return request<JournalEntry>("", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchEntries(userId: string): Promise<JournalEntry[]> {
  return request<JournalEntry[]>(`/${userId}`);
}

// ── LLM Analysis ──────────────────────────────────────────────

export async function analyzeText(text: string): Promise<EmotionAnalysis> {
  return request<EmotionAnalysis>("/analyze", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

// ── Streaming Analysis (SSE) ──────────────────────────────────

export async function* analyzeTextStream(
  text: string
): AsyncGenerator<string> {
  const res = await fetch(`${API_BASE}/analyze/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.body) throw new Error("No stream body");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    // Parse SSE lines
    for (const line of chunk.split("\n")) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") return;
        if (!data.startsWith("[ERROR]")) yield data;
      }
    }
  }
}

// ── Insights ──────────────────────────────────────────────────

export async function fetchInsights(userId: string): Promise<InsightsData> {
  return request<InsightsData>(`/insights/${userId}`);
}
