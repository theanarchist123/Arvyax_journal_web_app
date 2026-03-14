"use client";
import { useState, useRef } from "react";
import AmbiencePicker from "./AmbiencePicker";
import type { Ambience, JournalEntry } from "@/lib/types";
import { createEntry, analyzeTextStream } from "@/lib/api";

interface WriteEntryProps {
  userId: string;
  ambience: Ambience;
  onAmbienceChange: (a: Ambience) => void;
  onEntrySaved: (entry: JournalEntry) => void;
}

const PROMPTS: Record<Ambience, string> = {
  forest:   "Tell me what the trees revealed to you today...",
  ocean:    "What did the waves carry away, or bring in?",
  mountain: "What clarity did the altitude offer you?",
};

export default function WriteEntry({
  userId,
  ambience,
  onAmbienceChange,
  onEntrySaved,
}: WriteEntryProps) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "streaming" | "done">("idle");
  const [streamText, setStreamText] = useState("");
  const [savedEntry, setSavedEntry] = useState<JournalEntry | null>(null);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isLoading = status === "loading" || status === "streaming";

  async function handleSubmit() {
    if (!text.trim()) return;
    setStatus("loading");
    setStreamText("");
    setError("");
    setSavedEntry(null);

    try {
      // 1. Save entry (this also triggers LLM analysis in the backend)
      const entry = await createEntry({ userId, ambience, text });
      setSavedEntry(entry);
      onEntrySaved(entry);

      // 2. Stream the analysis for visual effect (re-analyze same text with stream)
      setStatus("streaming");
      let accumulated = "";
      for await (const chunk of analyzeTextStream(text)) {
        accumulated += chunk;
        setStreamText(accumulated);
      }

      setStatus("done");
      setText("");
      textareaRef.current?.focus();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Is the backend running?");
      setStatus("idle");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div>
      <div className="write-panel">
        <h2 className="write-panel-title">New Entry</h2>
        <p className="write-panel-prompt">{PROMPTS[ambience]}</p>

        {/* Ambience selector */}
        <div style={{ marginBottom: 20 }}>
          <AmbiencePicker value={ambience} onChange={onAmbienceChange} />
        </div>

        {/* Text area */}
        <textarea
          ref={textareaRef}
          className="journal-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={PROMPTS[ambience]}
          disabled={isLoading}
          rows={6}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 14,
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {text.length} chars · ⌘↵ to save
          </span>

          <button
            className={`btn-primary ${isLoading ? "loading" : ""}`}
            onClick={handleSubmit}
            disabled={isLoading || !text.trim()}
          >
            {status === "idle" && "✨ Analyze & Save"}
            {status === "loading" && "Saving…"}
            {status === "streaming" && "Analyzing…"}
            {status === "done" && "✅ Saved!"}
          </button>
        </div>

        {error && (
          <div
            style={{
              marginTop: 14,
              padding: "12px 16px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 8,
              fontSize: 13,
              color: "#fca5a5",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Streaming Analysis Card */}
        {(status === "streaming" || status === "done") && (
          <div className="analysis-card">
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                color: "var(--ambience-text)",
                marginBottom: 10,
              }}
            >
              🤖 AI Emotion Analysis
            </div>

            {/* Show streaming text OR result, but not both at once to avoid "JSON clutter" */}
            {status === "streaming" ? (
              <div className="analysis-stream-text">
                {streamText.replace(/```json|```/g, "").trim()}
                <span className="cursor" />
              </div>
            ) : (
              savedEntry && (
                <>
                  <div
                    className="analysis-result"
                    style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}
                  >
                    {savedEntry.emotion && (
                      <div
                        className={`emotion-chip emotion-${savedEntry.emotion}`}
                        style={{ display: "inline-flex" }}
                      >
                        💚 {savedEntry.emotion}
                      </div>
                    )}
                    {savedEntry.keywords?.map((kw) => (
                      <span className="keyword-tag" key={kw}>
                        {kw}
                      </span>
                    ))}
                  </div>

                  {savedEntry.summary && (
                    <p
                      style={{
                        marginTop: 12,
                        fontSize: 14,
                        color: "var(--text-secondary)",
                        fontStyle: "italic",
                        lineHeight: 1.6,
                        borderLeft: "2px solid var(--ambience-primary)",
                        paddingLeft: 12,
                      }}
                    >
                      "{savedEntry.summary}"
                    </p>
                  )}
                </>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
