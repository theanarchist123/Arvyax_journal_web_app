"use client";

import { motion, AnimatePresence } from "framer-motion";
import AuthPanel from "@/components/AuthPanel";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const IMAGES = [
  "https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=1920&fit=crop", // Forest (original)
  "https://images.unsplash.com/photo-1542401886-65d6c61db217?q=80&w=1920&fit=crop", // Desert dunes
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1920&fit=crop", // Mountains
  "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=80&w=1920&fit=crop", // Ocean waves
];

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [currentImage, setCurrentImage] = useState(0);

  // Slideshow interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % IMAGES.length);
    }, 8000); // Change image every 8 seconds
    return () => clearInterval(timer);
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading || user) return null; // Avoid flicker

  return (
    <div className="flex min-h-screen bg-bg-base overflow-hidden">
      
      {/* LEFT PANEL: Branding & Visuals (Hidden on small screens) */}
      <div className="relative hidden w-1/2 lg:flex flex-col justify-between p-12 bg-bg-base border-r border-border overflow-hidden">
        {/* Animated Background Slideshow */}
        <AnimatePresence mode="popLayout">
          <motion.div 
            key={currentImage}
            className="absolute inset-0 z-0 opacity-50 origin-center"
            initial={{ scale: 1.15, opacity: 0 }}
            animate={{ scale: 1.05, opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ 
              scale: { duration: 15, ease: "linear" },
              opacity: { duration: 2, ease: "easeInOut" }
            }}
            style={{
              backgroundImage: `url('${IMAGES[currentImage]}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        </AnimatePresence>
        
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-bg-base via-bg-base/40 to-transparent pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-20 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-forest-primary shadow-[0_0_15px_rgba(34,197,94,0.4)]" />
          <span className="font-display text-2xl font-bold text-white tracking-tight">ArvyaX.</span>
        </div>

        {/* Hero Copy */}
        <div className="relative z-20 max-w-md">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="font-display text-4xl md:text-5xl font-semibold text-white leading-tight mb-6"
          >
            Your private sanctuary for reflection.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-lg text-white/70"
          >
            Connect with nature, analyze your emotions with AI, and find clarity in the chaos of everyday life.
          </motion.p>
        </div>
      </div>

      {/* RIGHT PANEL: Auth Form */}
      <div className="flex flex-col justify-center w-full lg:w-1/2 p-8 sm:p-12 xl:p-24 relative">
        <div className="absolute top-8 left-8 lg:hidden flex items-center gap-3">
           <div className="w-6 h-6 rounded-full bg-forest-primary" />
           <span className="font-display text-xl font-bold text-text-primary">ArvyaX.</span>
        </div>
        
        <AuthPanel />
        
      </div>

    </div>
  );
}
