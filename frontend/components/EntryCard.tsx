"use client";
import type { JournalEntry } from "@/lib/types";

interface EntryCardProps {
  entry: JournalEntry;
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

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EntryCard({ entry }: EntryCardProps) {
  const icon = AMBIENCE_ICONS[entry.ambience] ?? "🌿";
  const emotionIcon = entry.emotion ? (EMOTION_ICONS[entry.emotion] ?? "💚") : null;

  return (
    <div className="entry-card">
      <div className="entry-card-header">
        <span className={`entry-ambience-tag ${entry.ambience}`}>
          {icon} {entry.ambience}
        </span>
        <span className="entry-date">{formatDate(entry.createdAt)}</span>
      </div>

      <p className="entry-excerpt">{entry.text}</p>

      {entry.emotion && (
        <div className={`emotion-chip emotion-${entry.emotion}`}>
          {emotionIcon}&nbsp;{entry.emotion}
        </div>
      )}

      {entry.keywords && entry.keywords.length > 0 && (
        <div className="entry-keywords">
          {entry.keywords.slice(0, 4).map((kw) => (
            <span className="keyword-tag" key={kw}>
              #{kw}
            </span>
          ))}
        </div>
      )}

      {entry.summary && (
        <p
          style={{
            marginTop: 12,
            fontSize: 12,
            color: "var(--text-muted)",
            fontStyle: "italic",
            lineHeight: 1.5,
            borderTop: "1px solid var(--border)",
            paddingTop: 10,
          }}
        >
          {entry.summary}
        </p>
      )}
    </div>
  );
}
