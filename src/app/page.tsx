"use client";
import React, { useState, useRef, useEffect } from "react";
import UploadBox from "@/components/UploadBox";
import Processing from "@/components/Processing";
import Results from "@/components/Results";
import Pricing from "@/components/Pricing";
import { checkUsage, incrementUsage, isProUser } from "@/lib/usage";
import { Sparkles, Zap, Shield, Clock, Sun, Moon } from "lucide-react";

export default function Home() {
  const [step, setStep] = useState<"upload" | "processing" | "results">("upload");
  const [resultsData, setResultsData] = useState<any>(null);
  const [isUrlLoading, setIsUrlLoading] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("Processing Video");
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitMessage, setLimitMessage] = useState({
    title: "Daily Limit Reached",
    desc: "You've hit the limit of 3 free videos today. Upgrade to Pro for unlimited conversions."
  });
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Theme handling
  useEffect(() => {
    const savedTheme = localStorage.getItem("racio-theme") as "dark" | "light" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else if (!prefersDark) {
      setTheme("light");
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("racio-theme", newTheme);
  };

  const checkLimit = () => {
    const allowed = checkUsage();
    if (!allowed) {
      setLimitMessage({
        title: "Daily Limit Reached",
        desc: "You've hit the limit of 3 free videos today. Upgrade to Pro for unlimited conversions."
      });
      setShowLimitModal(true);
      return false;
    }
    return true;
  };

  const simulateProgress = () => {
    const stages = [
      { progress: 10, stage: "Analyzing video..." },
      { progress: 30, stage: "Creating 9:16 (Reels)..." },
      { progress: 55, stage: "Creating 1:1 (Feed)..." },
      { progress: 80, stage: "Creating 16:9 (YouTube)..." },
      { progress: 95, stage: "Bundling files..." },
    ];

    let currentIndex = 0;
    setProgress(stages[0].progress);
    setStage(stages[0].stage);

    progressInterval.current = setInterval(() => {
      currentIndex++;
      if (currentIndex < stages.length) {
        setProgress(stages[currentIndex].progress);
        setStage(stages[currentIndex].stage);
      }
    }, 1500);
  };

  const stopProgress = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    setProgress(100);
    setStage("Complete!");
  };

  const handleUpload = async (file: File) => {
    if (!checkLimit()) return;

    setError(null);
    setStep("processing");
    setProcessingMessage("Processing Video");
    simulateProgress();

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/process", {
        method: "POST",
        body: formData,
      });

      stopProgress();

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      const data = await res.json();
      setResultsData(data);
      setStep("results");
      incrementUsage();
    } catch (e: any) {
      stopProgress();
      console.error(e);
      setError(e.message || "Something went wrong");
      setStep("upload");
    }
  };

  const handleUrlSubmit = async (url: string) => {
    if (!isProUser()) {
      setLimitMessage({
        title: "Pro Feature Locked",
        desc: "Downloading from X (Twitter) is a Pro feature. Upgrade to unlock."
      });
      setShowLimitModal(true);
      return;
    }

    if (!checkLimit()) return;

    setError(null);
    setIsUrlLoading(true);

    try {
      setProcessingMessage("Downloading from X...");

      const fetchRes = await fetch("/api/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!fetchRes.ok) {
        const err = await fetchRes.json();
        throw new Error(err.error || "Failed to download video");
      }

      const fetchData = await fetchRes.json();
      setIsUrlLoading(false);
      setStep("processing");
      setProcessingMessage("Processing Video");
      simulateProgress();

      const processRes = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tempPath: fetchData.tempPath,
          sessionId: fetchData.sessionId,
        }),
      });

      stopProgress();

      if (!processRes.ok) {
        const err = await processRes.json();
        throw new Error(err.error || "Processing failed");
      }

      const processData = await processRes.json();
      setResultsData(processData);
      setStep("results");
      incrementUsage();
    } catch (e: any) {
      stopProgress();
      console.error(e);
      setError(e.message || "Something went wrong");
      setIsUrlLoading(false);
      setStep("upload");
    }
  };

  const handleReset = () => {
    stopProgress();
    setStep("upload");
    setResultsData(null);
    setIsUrlLoading(false);
    setProgress(0);
    setStage("");
    setError(null);
  };

  const scrollToPricing = () => {
    setShowLimitModal(false);
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background Orbs (Dark mode only) */}
      {theme === "dark" && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[30%] -left-[15%] w-[700px] h-[700px] bg-gradient-to-br from-purple-600/25 to-blue-600/15 rounded-full blur-[120px] animate-pulse-glow" />
          <div className="absolute top-[50%] -right-[10%] w-[500px] h-[500px] bg-gradient-to-br from-blue-500/15 to-cyan-500/10 rounded-full blur-[100px]" />
        </div>
      )}

      {/* Header */}
      <header className="relative z-20 w-full max-w-6xl mx-auto px-6 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={handleReset}>
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-shadow">
              R
            </div>
            <span className="text-xl font-bold tracking-tight font-outfit">RACIO</span>
          </div>

          <div className="flex items-center gap-3">
            <a href="#features" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm transition-colors hidden md:block px-3 py-2">
              Features
            </a>
            <a href="#pricing" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm transition-colors hidden md:block px-3 py-2">
              Pricing
            </a>
            <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Limit Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="glass-card p-10 max-w-md w-full text-center animate-fade-in-up">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/30">
              <Sparkles size={32} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 font-outfit">{limitMessage.title}</h3>
            <p className="text-[var(--text-muted)] mb-8">{limitMessage.desc}</p>
            <div className="flex flex-col gap-3">
              <button onClick={scrollToPricing} className="btn-primary">View Plans</button>
              <button onClick={() => setShowLimitModal(false)} className="text-[var(--text-muted)] text-sm hover:text-[var(--text-primary)] transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed top-20 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-fade-in-up">
          <div className="glass-card bg-red-500/10 border-red-500/30 px-5 py-4 flex items-center gap-3">
            <span className="text-red-400 text-sm flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-red-400/60 hover:text-red-400 text-lg">×</button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-16 md:pt-24 pb-20">
        {step === "upload" && (
          <div className="flex flex-col items-center">
            {/* Badge */}
            <div className="badge mb-8 animate-fade-in-up">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              The Ratio Engine
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-center mb-6 tracking-tight font-outfit animate-fade-in-up delay-100">
              Paste Once.
              <br />
              <span className="text-gradient">Post Everywhere.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-[var(--text-muted)] text-center max-w-xl mb-14 animate-fade-in-up delay-200">
              Convert any video to <span className="text-[var(--text-primary)]">Reels, Shorts & Feed</span> formats in seconds.
            </p>

            {/* Upload Box */}
            <div className="w-full max-w-xl animate-fade-in-up delay-300">
              <UploadBox
                onFileSelect={handleUpload}
                onUrlSubmit={handleUrlSubmit}
                isUrlLoading={isUrlLoading}
              />
            </div>
          </div>
        )}

        {step === "processing" && (
          <Processing message={processingMessage} progress={progress} stage={stage} />
        )}

        {step === "results" && resultsData && (
          <Results data={resultsData} onReset={handleReset} />
        )}
      </section>

      {/* Features Section */}
      {step === "upload" && (
        <section id="features" className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold font-outfit mb-4">
              Why creators love <span className="text-gradient">RACIO</span>
            </h2>
            <p className="text-[var(--text-muted)] max-w-lg mx-auto">
              One video in, three optimized formats out. Ready for every platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="feature-card group">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500/20 to-purple-500/10 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Zap size={24} className="text-violet-400" />
              </div>
              <h3 className="text-xl font-bold font-outfit mb-2">Lightning Fast</h3>
              <p className="text-[var(--text-muted)] text-sm">
                Process videos in seconds, not minutes. Optimized for speed.
              </p>
            </div>

            <div className="feature-card group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Shield size={24} className="text-blue-400" />
              </div>
              <h3 className="text-xl font-bold font-outfit mb-2">Privacy First</h3>
              <p className="text-[var(--text-muted)] text-sm">
                Your videos are deleted after 1 hour. We never store or share.
              </p>
            </div>

            <div className="feature-card group">
              <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-500/20 to-pink-500/10 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Clock size={24} className="text-fuchsia-400" />
              </div>
              <h3 className="text-xl font-bold font-outfit mb-2">Save Hours</h3>
              <p className="text-[var(--text-muted)] text-sm">
                Stop manually resizing. Get all formats in one click.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 border-t border-[var(--border-color)]">
        <Pricing />
      </section>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 py-10 border-t border-[var(--border-color)]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center font-bold text-sm text-white">
              R
            </div>
            <span className="text-[var(--text-subtle)] text-sm">RACIO — The Ratio Engine</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-[var(--text-subtle)]">
            <a href="#" className="hover:text-[var(--text-primary)] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[var(--text-primary)] transition-colors">Terms</a>
            <a href="mailto:racioapp@gmail.com" className="hover:text-[var(--text-primary)] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
