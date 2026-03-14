"use client";
import type { JournalEntry } from "@/lib/types";
import EntryCard from "./EntryCard";

interface EntryFeedProps {
  entries: JournalEntry[];
  loading: boolean;
}

function SkeletonCard() {
  return (
    <div
      className="entry-card"
      style={{ animation: "shimmer 1.4s infinite ease-in-out" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 80,
            height: 20,
            background: "var(--bg-elevated)",
            borderRadius: 999,
          }}
        />
        <div
          style={{
            width: 100,
            height: 14,
            background: "var(--bg-elevated)",
            borderRadius: 4,
          }}
        />
      </div>
      {[100, 90, 70].map((w, i) => (
        <div
          key={i}
          style={{
            width: `${w}%`,
            height: 12,
            background: "var(--bg-elevated)",
            borderRadius: 4,
            marginBottom: 8,
          }}
        />
      ))}
    </div>
  );
}

export default function EntryFeed({ entries, loading }: EntryFeedProps) {
  if (loading) {
    return (
      <div className="entries-grid">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🌱</div>
        <div className="empty-state-title">Your journey begins here</div>
        <div className="empty-state-sub">
          Write your first nature session entry above
        </div>
      </div>
    );
  }

  return (
    <div className="entries-grid">
      {entries.map((entry) => (
        <EntryCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
