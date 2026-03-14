"use client";
import { useEffect, useState } from "react";
import type { Ambience } from "@/lib/types";

const AMBIENCE_DATA: Record<
  Ambience,
  { label: string; icon: string; subtitle: string }
> = {
  forest: {
    label: "Forest",
    icon: "🌿",
    subtitle: "Let the rain speak, and the trees listen.",
  },
  ocean: {
    label: "Ocean",
    icon: "🌊",
    subtitle: "Where waves wash away what ought to be released.",
  },
  mountain: {
    label: "Mountain",
    icon: "🏔️",
    subtitle: "Silence above the clouds opens the mind.",
  },
};

interface HeroBannerProps {
  ambience: Ambience;
  entryCount: number;
}

export default function HeroBanner({ ambience, entryCount }: HeroBannerProps) {
  const [now, setNow] = useState("");
  const data = AMBIENCE_DATA[ambience];

  useEffect(() => {
    function fmt() {
      const d = new Date();
      setNow(
        d.toLocaleDateString("en-IN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    }
    fmt();
    const id = setInterval(fmt, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hero-banner">
      <div className="hero-bg" />
      <div className="hero-overlay" />
      <div className="hero-content">
        <div className="hero-ambience-badge">
          {data.icon}&nbsp; {data.label} Session
        </div>

        <h1 className="hero-title">
          How did the {data.label.toLowerCase()} make
          <br />
          you feel today?
        </h1>

        <p className="hero-subtitle">{data.subtitle}</p>

        <div className="hero-date" style={{ marginTop: 20 }}>
          {now}
          {entryCount > 0 && (
            <span style={{ marginLeft: 20, opacity: 0.6 }}>
              · {entryCount} {entryCount === 1 ? "entry" : "entries"} this
              journey
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
