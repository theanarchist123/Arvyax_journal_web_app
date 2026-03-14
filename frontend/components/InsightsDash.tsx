"use client";
import { useEffect, useRef } from "react";
import type { InsightsData } from "@/lib/types";

interface InsightsDashProps {
  insights: InsightsData | null;
  loading: boolean;
}

const AMBIENCE_ICONS: Record<string, string> = {
  forest: "🌿",
  ocean: "🌊",
  mountain: "🏔️",
};

const EMOTION_ICONS: Record<string, string> = {
  calm: "😌",
  joyful: "😄",
  anxious: "😰",
  sad: "😔",
  reflective: "🌙",
  energized: "⚡",
  peaceful: "🕊️",
  grateful: "🙏",
  melancholic: "☁️",
  hopeful: "🌅",
};

function AnimatedCounter({ target }: { target: number }) {
  const elRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let start = 0;
    const duration = 800;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (target - start) * eased);
      if (elRef.current) elRef.current.textContent = String(current);
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [target]);

  return <span ref={elRef}>0</span>;
}

export default function InsightsDash({ insights, loading }: InsightsDashProps) {
  if (loading) {
    return (
      <div className="insights-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card">
            <div
              style={{
                width: "60%",
                height: 10,
                background: "var(--bg-elevated)",
                borderRadius: 4,
                marginBottom: 16,
              }}
            />
            <div
              style={{
                width: "40%",
                height: 36,
                background: "var(--bg-elevated)",
                borderRadius: 4,
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (!insights || insights.totalEntries === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📊</div>
        <div className="empty-state-title">No insights yet</div>
        <div className="empty-state-sub">
          Write a few journal entries to see your emotional patterns emerge
        </div>
      </div>
    );
  }

  const emotionEntries = Object.entries(insights.emotionDistribution).sort(
    (a, b) => b[1] - a[1]
  );
  const maxEmotion = emotionEntries[0]?.[1] ?? 1;

  const ambienceEntries = Object.entries(insights.ambienceDistribution).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Stat cards row */}
      <div className="insights-grid">
        <div className="stat-card">
          <div className="stat-label">Total Entries</div>
          <div className="stat-value">
            <AnimatedCounter target={insights.totalEntries} />
          </div>
          <div className="stat-sub">sessions logged</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Top Emotion</div>
          <div className="stat-value text-accent" style={{ fontSize: 24, marginTop: 4 }}>
            {insights.topEmotion
              ? `${EMOTION_ICONS[insights.topEmotion] ?? "💚"} ${insights.topEmotion}`
              : "—"}
          </div>
          <div className="stat-sub">most frequent feeling</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Favourite Ambience</div>
          <div className="stat-value text-accent" style={{ fontSize: 24, marginTop: 4 }}>
            {insights.mostUsedAmbience
              ? `${AMBIENCE_ICONS[insights.mostUsedAmbience] ?? "🌿"} ${insights.mostUsedAmbience}`
              : "—"}
          </div>
          <div className="stat-sub">where you find peace</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Keywords Tracked</div>
          <div className="stat-value">
            <AnimatedCounter target={insights.recentKeywords.length} />
          </div>
          <div className="stat-sub">recurring themes</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Emotion distribution bar chart */}
        {emotionEntries.length > 0 && (
          <div className="stat-card" style={{ gridColumn: "1 / 2" }}>
            <div className="stat-label" style={{ marginBottom: 16 }}>
              Emotion Distribution
            </div>
            <div className="emotion-chart">
              {emotionEntries.map(([emotion, count]) => (
                <div className="emotion-bar-row" key={emotion}>
                  <div className="emotion-bar-label">
                    {EMOTION_ICONS[emotion] ?? "💚"} {emotion}
                  </div>
                  <div className="emotion-bar-track">
                    <div
                      className="emotion-bar-fill"
                      style={{ width: `${(count / maxEmotion) * 100}%` }}
                    />
                  </div>
                  <div className="emotion-bar-count">{count}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ambience distribution */}
        {ambienceEntries.length > 0 && (
          <div className="stat-card">
            <div className="stat-label" style={{ marginBottom: 16 }}>
              Ambience Sessions
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {ambienceEntries.map(([amb, count]) => (
                <div
                  key={amb}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      color: "var(--text-secondary)",
                      textTransform: "capitalize",
                    }}
                  >
                    {AMBIENCE_ICONS[amb] ?? "🌿"} {amb}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 18,
                      fontWeight: 600,
                      color: "var(--ambience-text)",
                    }}
                  >
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Keywords cloud */}
      {insights.recentKeywords.length > 0 && (
        <div>
          <div className="stat-label" style={{ marginBottom: 14 }}>
            Recent Keywords
          </div>
          <div className="keywords-cloud">
            {insights.recentKeywords.map((kw) => (
              <span className="cloud-tag" key={kw}>
                #{kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI Insight message */}
      {insights.topEmotion && (
        <div
          style={{
            padding: "20px 24px",
            background: "var(--ambience-subtle)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderLeft: "3px solid var(--ambience-primary)",
            borderRadius: "0 12px 12px 0",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 20 }}>🌿</span>
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--ambience-text)",
                marginBottom: 4,
              }}
            >
              Nature's Insight
            </div>
            <p
              style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}
            >
              Your sessions frequently evoke a sense of{" "}
              <strong style={{ color: "var(--ambience-text)" }}>
                {insights.topEmotion}
              </strong>
              . The{" "}
              <strong style={{ color: "var(--ambience-text)" }}>
                {insights.mostUsedAmbience}
              </strong>{" "}
              seems to be your sanctuary. Keep returning — nature remembers.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
