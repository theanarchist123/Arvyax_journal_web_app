// Shared TypeScript types for the frontend

export interface JournalEntry {
  id: string;
  userId: string;
  ambience: "forest" | "ocean" | "mountain";
  text: string;
  emotion?: string;
  keywords?: string[];
  summary?: string;
  createdAt: string;
}

export interface InsightsData {
  totalEntries: number;
  topEmotion?: string;
  mostUsedAmbience?: string;
  recentKeywords: string[];
  emotionDistribution: Record<string, number>;
  ambienceDistribution: Record<string, number>;
}

export interface EmotionAnalysis {
  emotion: string;
  keywords: string[];
  summary: string;
}

export type Ambience = "forest" | "ocean" | "mountain";
