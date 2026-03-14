"use client";
import type { Ambience } from "@/lib/types";

interface AmbiencePickerProps {
  value: Ambience;
  onChange: (a: Ambience) => void;
}

const OPTIONS: { value: Ambience; icon: string; label: string }[] = [
  { value: "forest",   icon: "🌿", label: "Forest" },
  { value: "ocean",    icon: "🌊", label: "Ocean" },
  { value: "mountain", icon: "🏔️", label: "Mountain" },
];

export default function AmbiencePicker({ value, onChange }: AmbiencePickerProps) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.8px",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          marginBottom: 10,
        }}
      >
        Choose Your Ambience
      </div>
      <div className="ambience-picker">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`ambience-pill ${opt.value} ${
              value === opt.value ? "selected" : ""
            }`}
            onClick={() => onChange(opt.value)}
            type="button"
            aria-pressed={value === opt.value}
          >
            <span className="ambience-pill-icon">{opt.icon}</span>
            <span className="ambience-pill-label">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
