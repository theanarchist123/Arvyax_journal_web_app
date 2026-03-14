"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import HeroBanner from "@/components/HeroBanner";
import WriteEntry from "@/components/WriteEntry";
import EntryFeed from "@/components/EntryFeed";
import InsightsDash from "@/components/InsightsDash";
import ProtectedRoute from "@/components/ProtectedRoute";
import type { JournalEntry, InsightsData, Ambience } from "@/lib/types";
import { fetchEntries, fetchInsights } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

type Tab = "journal" | "insights";

export default function HomePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("journal");
  const [ambience, setAmbience] = useState<Ambience>("forest");
  const userId = user?.uid || "demo-user"; // Fallback, though ProtectedRoute prevents seeing this if null
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);


  // Sync body class to ambience for CSS variable cascading
  useEffect(() => {
    document.body.className = `ambience-${ambience}`;
  }, [ambience]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [userId, refreshTrigger]); // Added refreshTrigger to dependencies

  async function loadData() {
    setLoading(true);
    try {
      const [ents, ins] = await Promise.all([
        fetchEntries(userId),
        fetchInsights(userId),
      ]);
      setEntries(ents);
      setInsights(ins);
    } catch (_) {
      /* backend may not be running yet */
    } finally {
      setLoading(false);
    }
  }

  const handleEntrySaved = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <ProtectedRoute>
      <div className="app-shell">
        <Sidebar
          activeTab={tab}
          onTabChange={setTab}
          userId={userId}
          ambience={ambience}
        />
        <main className="main-content">
          <HeroBanner ambience={ambience} entryCount={entries.length} />

          <div className="page-pad">
            {tab === "journal" && (
              <>
                {/* Write new entry */}
                <section className="section-gap">
                  <WriteEntry
                    userId={userId}
                    ambience={ambience}
                    onAmbienceChange={setAmbience}
                    onEntrySaved={handleEntrySaved}
                  />
                </section>

                <div className="divider" />

                {/* Past entries */}
                <section className="section-gap">
                  <div className="section-header">
                    <h2 className="section-title">Past Entries</h2>
                    <span className="section-count">{entries.length} entries</span>
                  </div>
                  <EntryFeed entries={entries} loading={loading} />
                </section>
              </>
            )}

            {tab === "insights" && (
              <section>
                <div className="section-header" style={{ marginBottom: 28 }}>
                  <h2 className="section-title">Your Insights</h2>
                </div>
                <InsightsDash insights={insights} loading={loading} />
              </section>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
