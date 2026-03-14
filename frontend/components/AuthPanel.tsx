"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { Feather, ArrowRight, Loader2 } from "lucide-react";

export default function AuthPanel() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      router.push("/");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/invalid-credential") {
         setError("Invalid email or password.");
      } else if (err.code === "auth/email-already-in-use") {
         setError("An account with this email already exists.");
      } else {
         setError(err.message || "An authentication error occurred.");
      }
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/");
    } catch (err: any) {
      console.error(err);
      if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
        setError(err.message || "Failed to sign in with Google.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Tab Switcher */}
      <div className="flex p-1 space-x-1 bg-surface rounded-xl mb-8 border border-border">
        <button
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
            isLogin ? "bg-bg-base text-text-primary shadow" : "text-text-muted hover:text-text-secondary"
          }`}
          onClick={() => { setIsLogin(true); setError(""); }}
        >
          Sign In
        </button>
        <button
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
            !isLogin ? "bg-bg-base text-text-primary shadow" : "text-text-muted hover:text-text-secondary"
          }`}
          onClick={() => { setIsLogin(false); setError(""); }}
        >
          Create Account
        </button>
      </div>

      {/* Form Area */}
      <motion.div
        key={isLogin ? "login" : "signup"}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-forest-subtle text-forest-primary mb-4">
            <Feather size={20} />
          </div>
          <h2 className="text-2xl font-display font-semibold text-text-primary">
            {isLogin ? "Welcome Back" : "Begin Your Journey"}
          </h2>
          <p className="text-sm text-text-secondary mt-2">
            {isLogin 
              ? "Enter your details to access your sanctuary." 
              : "Create an account to save your reflections."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider text-text-muted uppercase">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full bg-bg-base border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-forest-primary focus:ring-1 focus:ring-forest-primary transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
             <label className="text-xs font-semibold tracking-wider text-text-muted uppercase">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full bg-bg-base border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-forest-primary focus:ring-1 focus:ring-forest-primary transition-all"
              placeholder="••••••••"
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 p-3 rounded-lg"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-text-primary text-bg-base py-3 px-4 rounded-lg font-medium text-sm hover:bg-white transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                {isLogin ? "Sign In" : "Create Account"}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between">
          <span className="w-1/5 border-b border-border"></span>
           <span className="text-xs text-center text-text-muted uppercase tracking-widest px-2">Or continue with</span>
          <span className="w-1/5 border-b border-border"></span>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-bg-surface border border-border text-text-primary py-3 px-4 rounded-lg font-medium text-sm hover:bg-bg-hover transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true" fill="currentColor">
              <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
            </svg>
            {isLogin ? "Sign in with Google" : "Sign up with Google"}
          </button>
        </div>

      </motion.div>
    </div>
  );
}
