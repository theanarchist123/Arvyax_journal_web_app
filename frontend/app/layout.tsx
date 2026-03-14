import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from '@/lib/AuthContext';

export const metadata: Metadata = {
  title: "ArvyaX Journal — AI-Assisted Nature Journal",
  description:
    "Reflect on your nature sessions with AI-powered emotion insights. Forest, ocean, and mountain ambiences.",
  keywords: ["journal", "nature therapy", "emotion analysis", "wellness", "AI"],
  openGraph: {
    title: "ArvyaX Journal",
    description: "AI-Assisted Nature Journal with Emotion Insights",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
