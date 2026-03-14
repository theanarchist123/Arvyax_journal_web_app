"use client";
import {
  BookHeart,
  BarChart2,
  User,
  LogOut
} from "lucide-react";
import type { Ambience } from "@/lib/types";
import { useAuth } from "@/lib/AuthContext";

interface SidebarProps {
  activeTab: "journal" | "insights";
  onTabChange: (tab: "journal" | "insights") => void;
  userId: string;
  ambience: Ambience;
}

const AMBIENCE_ICONS: Record<Ambience, string> = {
  forest: "🌿",
  ocean: "🌊",
  mountain: "🏔️",
};

export default function Sidebar({
  activeTab,
  onTabChange,
  userId,
  ambience,
}: SidebarProps) {
  const { signOut, user } = useAuth();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="ambience-dot" />
          <span className="brand-name">ArvyaX</span>
        </div>
        <div className="brand-tagline">Nature Journal</div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-label">Workspace</div>

        <button
          className={`nav-item ${activeTab === "journal" ? "active" : ""}`}
          onClick={() => onTabChange("journal")}
        >
          <span className="nav-icon" style={{ fontSize: 16 }}>📔</span>
          My Journal
        </button>

        <button
          className={`nav-item ${activeTab === "insights" ? "active" : ""}`}
          onClick={() => onTabChange("insights")}
        >
          <span className="nav-icon" style={{ fontSize: 16 }}>✨</span>
          Insights
        </button>

        <div className="nav-label" style={{ marginTop: 28 }}>Current Session</div>

        <div
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            background: "var(--ambience-subtle)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
            AMBIENCE
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 14,
              fontWeight: 500,
              color: "var(--ambience-text)",
              textTransform: "capitalize",
            }}
          >
            {AMBIENCE_ICONS[ambience]} {ambience}
          </div>
        </div>

        {/* API docs link */}
        <div className="nav-label" style={{ marginTop: 28 }}>Developer</div>
        <a
          className="nav-item"
          href="http://localhost:8000/docs"
          target="_blank"
          rel="noreferrer"
        >
          <span style={{ fontSize: 16 }}>⚡</span>
          API Docs
        </a>
      </nav>

      {/* Bottom Profile / Settings */}
      <div className="sidebar-footer">
        <button className="user-pill w-full border-none text-left" onClick={signOut}>
          <div className="user-avatar overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User size={16} />
            )}
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div className="user-name truncate">{user?.displayName || user?.email || "User"}</div>
            <div className="user-id">Sign Out</div>
          </div>
          <LogOut size={14} className="text-text-muted" />
        </button>
      </div>
    </aside>
  );
}
