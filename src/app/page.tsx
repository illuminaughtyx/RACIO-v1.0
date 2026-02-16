"use client";
import React, { useState, useRef, useEffect, CSSProperties } from "react";
import Link from "next/link";
import { Upload, Link as LinkIcon, Loader2, Sparkles, Zap, Shield, Clock, Download, RefreshCcw, CheckCircle2, Check, Star, Crown, Sun, Moon, X, Key, Package, Smartphone, Grid, Monitor, Film, Image as ImageIcon } from "lucide-react";
import { checkUsage, incrementUsage, isProUser, checkUrlUsage, incrementUrlUsage } from "@/lib/usage";
import LicenseActivation from "@/components/LicenseActivation";
import { analytics } from "@/components/GoogleAnalytics";

// Payment Links - Using Lemon Squeezy (works in India!)
const PAYMENT_LINKS = {
  PRO_MONTHLY: "https://racioapp.lemonsqueezy.com/checkout/buy/1b322848-8f95-455f-9570-7deb748c4358",
  PRO_YEARLY: "https://racioapp.lemonsqueezy.com/checkout/buy/ba4dc072-1dfb-4ce4-b238-36a3f3914d09",
  LIFETIME: "https://racioapp.lemonsqueezy.com/checkout/buy/8832208c-763f-4448-8f76-edc23be51534",
};

// Style helpers
const styles = {
  dark: {
    bg: "#0a0a0f",
    cardBg: "rgba(255,255,255,0.05)",
    border: "rgba(255,255,255,0.1)",
    text: "#ffffff",
    textSecondary: "rgba(255,255,255,0.6)",
    textMuted: "rgba(255,255,255,0.55)",
  },
  light: {
    bg: "#fafafa",
    cardBg: "#ffffff",
    border: "#e5e5e5",
    text: "#1a1a2e",
    textSecondary: "#4a4a6a",
    textMuted: "#9ca3af",
  },
};

export default function Home() {
  const [step, setStep] = useState<"upload" | "processing" | "results">("upload");
  const [resultsData, setResultsData] = useState<any>(null);
  const [isUrlLoading, setIsUrlLoading] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("Preparing...");
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", desc: "" });
  const [isDark, setIsDark] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [url, setUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [isLifetime, setIsLifetime] = useState(false);

  const [downloadedAll, setDownloadedAll] = useState(false);
  const [downloadedFiles, setDownloadedFiles] = useState<Set<string>>(new Set());
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [selectedRatios, setSelectedRatios] = useState<string[]>(["9:16", "1:1", "16:9"]);
  const [queueStatus, setQueueStatus] = useState<{ active: number; queued: number; position?: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowSticky(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const exitPopupShown = useRef(false);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const queuePollInterval = useRef<NodeJS.Timeout | null>(null);

  // Detect mobile on mount
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Available aspect ratios
  const BASIC_RATIOS = ["9:16", "1:1", "16:9"];
  const PRO_RATIOS = ["4:5", "2:3", "21:9"];

  const RATIO_CONFIG: Record<string, { Icon: any; label: string }> = {
    "9:16": { Icon: Smartphone, label: "Story / Reel" },
    "1:1": { Icon: Grid, label: "Post (Square)" },
    "16:9": { Icon: Monitor, label: "YouTube / TV" },
    "4:5": { Icon: ImageIcon, label: "Portrait" },
    "2:3": { Icon: ImageIcon, label: "Classic" },
    "21:9": { Icon: Film, label: "Cinema" },
  };

  // Check Pro/Lifetime status and dark mode preference on mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setIsPro(localStorage.getItem("racio_pro") === "true");
      setIsLifetime(localStorage.getItem("racio_lifetime") === "true");
      // Load dark mode preference (default to dark if not set)
      const savedDarkMode = localStorage.getItem("racio_dark_mode");
      if (savedDarkMode !== null) {
        setIsDark(savedDarkMode === "true");
      }
    }
  }, []);

  // Save dark mode preference when it changes
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("racio_dark_mode", String(isDark));
    }
  }, [isDark]);

  // Exit intent detection - show popup when user moves towards browser close
  React.useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger when mouse moves to top of page (exit intent)
      if (e.clientY <= 5 && !exitPopupShown.current && !isPro && !isLifetime) {
        exitPopupShown.current = true;
        // Check if user has seen this popup recently (1 hour cooldown)
        const lastShown = localStorage.getItem("racio_exit_popup_shown");
        if (!lastShown || Date.now() - parseInt(lastShown) > 3600000) {
          setShowExitPopup(true);
          localStorage.setItem("racio_exit_popup_shown", Date.now().toString());
        }
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [isPro, isLifetime]);

  const handleDownloadAll = async () => {
    if (!resultsData?.files) return;

    setDownloadedAll(true);
    analytics.downloadAll(resultsData.files.length);

    // Trigger sequential downloads to prevent browser blocking
    for (const file of resultsData.files) {
      const link = document.createElement("a");
      link.href = file.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Mark as downloaded visually
      setDownloadedFiles(prev => new Set([...prev, file.name]));

      // Small delay to ensure browser handles each download
      await new Promise(r => setTimeout(r, 500));
    }
  };

  const theme = isDark ? styles.dark : styles.light;

  const card: CSSProperties = {
    background: theme.cardBg,
    border: `1px solid ${theme.border}`,
    borderRadius: 16,
  };

  const btn: CSSProperties = {
    background: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #d946ef 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "14px 28px",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "all 0.2s ease",
    fontSize: 15,
  };

  const btnSecondary: CSSProperties = {
    ...card,
    padding: "14px 28px",
    fontWeight: 500,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    color: theme.textSecondary,
  };

  const showLimitModal = (title: string, desc: string) => {
    setModalContent({ title, desc });
    setShowModal(true);
  };

  const checkLimit = () => {
    if (!checkUsage()) {
      showLimitModal("Daily Limit Reached", "You've used your 3 free videos today. Upgrade for unlimited.");
      return false;
    }
    return true;
  };

  const simulateProgress = () => {
    const stages = [
      { progress: 15, stage: "Analyzing video..." },
      { progress: 40, stage: "Creating 9:16 (Reels)..." },
      { progress: 65, stage: "Creating 1:1 (Feed)..." },
      { progress: 85, stage: "Creating 16:9 (YouTube)..." },
      { progress: 95, stage: "Bundling files..." },
    ];
    let i = 0;
    setProgress(stages[0].progress);
    setStage(stages[0].stage);
    progressInterval.current = setInterval(() => {
      i++;
      if (i < stages.length) {
        setProgress(stages[i].progress);
        setStage(stages[i].stage);
      }
    }, 1200);

    // Start polling queue status
    const pollQueue = async () => {
      try {
        const res = await fetch("/api/queue-status");
        if (res.ok) {
          const data = await res.json();
          setQueueStatus(data);
        }
      } catch (e) {
        // Ignore errors
      }
    };
    pollQueue(); // Initial fetch
    queuePollInterval.current = setInterval(pollQueue, 3000); // Poll every 3s
  };

  const stopProgress = () => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    if (queuePollInterval.current) clearInterval(queuePollInterval.current);
    setProgress(100);
    setStage("Complete!");
    setQueueStatus(null);
  };

  const handleFileSelect = async (file: File) => {
    if (!checkLimit()) return;
    setSelectedFile(file);
    setError(null);
    setStep("processing");
    simulateProgress();
    analytics.fileUploaded(file.type, file.size);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("isPro", String(isPro || isLifetime));
    formData.append("isLifetime", String(isLifetime));
    formData.append("ratios", JSON.stringify(selectedRatios));

    try {
      const res = await fetch("/api/process", { method: "POST", body: formData });
      stopProgress();
      if (!res.ok) throw new Error((await res.json()).error || "Upload failed");
      const result = await res.json();
      setResultsData(result);
      setStep("results");
      analytics.processingComplete(result.type || "file", Date.now());
      incrementUsage();
    } catch (e: any) {
      stopProgress();
      setError(e.message);
      setStep("upload");
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    // Check URL usage limit (free users get 1/day, Pro unlimited)
    if (!checkUrlUsage()) {
      showLimitModal("Daily URL Limit Reached", "Free users get 1 X/Twitter download per day. Upgrade for unlimited!");
      return;
    }
    if (!checkLimit()) return;

    setError(null);
    setIsUrlLoading(true);

    try {
      const fetchRes = await fetch("/api/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      if (!fetchRes.ok) throw new Error((await fetchRes.json()).error || "Failed to download");

      const fetchData = await fetchRes.json();
      setIsUrlLoading(false);
      setStep("processing");
      analytics.urlSubmitted(url.includes("twitter") || url.includes("x.com") ? "twitter" : "other");
      simulateProgress();

      const processRes = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempPath: fetchData.tempPath, sessionId: fetchData.sessionId, isPro: isPro || isLifetime, isLifetime, ratios: selectedRatios }),
      });
      stopProgress();
      if (!processRes.ok) throw new Error((await processRes.json()).error || "Processing failed");

      setResultsData(await processRes.json());
      setStep("results");
      incrementUsage();
      incrementUrlUsage(); // Track URL usage for free users
    } catch (e: any) {
      stopProgress();
      setError(e.message);
      setIsUrlLoading(false);
      setStep("upload");
    }
  };

  const handleReset = () => {
    stopProgress();
    setStep("upload");
    setResultsData(null);
    setSelectedFile(null);
    setUrl("");
    setProgress(0);
    setStage("");
    setError(null);
    setDownloadedAll(false);
    setDownloadedFiles(new Set());
  };

  const formatSize = (bytes: number) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  const formats: Record<string, { label: string; desc: string; icon: string; ratio: [number, number] }> = {
    "reel_9-16": { label: "9:16", desc: "Reels & Shorts", icon: "📱", ratio: [9, 16] },
    "reel_9-16_1080p": { label: "9:16", desc: "Reels & Shorts", icon: "📱", ratio: [9, 16] },
    "reel_9-16_2K": { label: "9:16", desc: "Reels & Shorts • 2K", icon: "📱", ratio: [9, 16] },
    "reel_9-16_4K": { label: "9:16", desc: "Reels & Shorts • 4K", icon: "📱", ratio: [9, 16] },
    "feed_1-1": { label: "1:1", desc: "Instagram Feed", icon: "📷", ratio: [1, 1] },
    "feed_1-1_1080p": { label: "1:1", desc: "Instagram Feed", icon: "📷", ratio: [1, 1] },
    "feed_1-1_2K": { label: "1:1", desc: "Instagram Feed • 2K", icon: "📷", ratio: [1, 1] },
    "feed_1-1_4K": { label: "1:1", desc: "Instagram Feed • 4K", icon: "📷", ratio: [1, 1] },
    "landscape_16-9": { label: "16:9", desc: "YouTube", icon: "🎬", ratio: [16, 9] },
    "landscape_16-9_1080p": { label: "16:9", desc: "YouTube", icon: "🎬", ratio: [16, 9] },
    "landscape_16-9_2K": { label: "16:9", desc: "YouTube • 2K", icon: "🎬", ratio: [16, 9] },
    "landscape_16-9_4K": { label: "16:9", desc: "YouTube • 4K", icon: "🎬", ratio: [16, 9] },
    "portrait_4-5": { label: "4:5", desc: "Instagram Portrait", icon: "📸", ratio: [4, 5] },
    "portrait_4-5_1080p": { label: "4:5", desc: "Instagram Portrait", icon: "📸", ratio: [4, 5] },
    "portrait_4-5_2K": { label: "4:5", desc: "Instagram Portrait • 2K", icon: "📸", ratio: [4, 5] },
    "portrait_4-5_4K": { label: "4:5", desc: "Instagram Portrait • 4K", icon: "📸", ratio: [4, 5] },
    "portrait_2-3": { label: "2:3", desc: "Pinterest", icon: "📌", ratio: [2, 3] },
    "portrait_2-3_1080p": { label: "2:3", desc: "Pinterest", icon: "📌", ratio: [2, 3] },
    "portrait_2-3_2K": { label: "2:3", desc: "Pinterest • 2K", icon: "📌", ratio: [2, 3] },
    "portrait_2-3_4K": { label: "2:3", desc: "Pinterest • 4K", icon: "📌", ratio: [2, 3] },
    "ultrawide_21-9": { label: "21:9", desc: "Ultrawide/Cinema", icon: "🎥", ratio: [21, 9] },
    "ultrawide_21-9_1080p": { label: "21:9", desc: "Ultrawide/Cinema", icon: "🎥", ratio: [21, 9] },
    "ultrawide_21-9_2K": { label: "21:9", desc: "Ultrawide/Cinema • 2K", icon: "🎥", ratio: [21, 9] },
    "ultrawide_21-9_4K": { label: "21:9", desc: "Ultrawide/Cinema • 4K", icon: "🎥", ratio: [21, 9] },
  };

  return (
    <main style={{ minHeight: "100vh", background: theme.bg, color: theme.text, transition: "all 0.3s" }}>
      {/* Background - Cyan/Teal gradient */}
      {isDark && (
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-30%", left: "-10%", width: 800, height: 800, background: "rgba(6,182,212,0.08)", borderRadius: "50%", filter: "blur(150px)" }} />
          <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: 600, height: 600, background: "rgba(20,184,166,0.06)", borderRadius: "50%", filter: "blur(120px)" }} />
        </div>
      )}

      {/* Header */}
      <header style={{ position: "relative", zIndex: 10, maxWidth: 1100, margin: "0 auto", padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", flexShrink: 0 }} onClick={handleReset}>
          <span style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: theme.text, letterSpacing: 3 }}>[RACIO]</span>
          {(isPro || isLifetime) && (
            <span style={{
              padding: "3px 8px",
              borderRadius: 6,
              fontSize: 10,
              fontWeight: 600,
              background: isLifetime ? "linear-gradient(135deg, #fbbf24, #f59e0b)" : "linear-gradient(135deg, #8b5cf6, #a855f7)",
              color: "#fff",
              textTransform: "uppercase",
              letterSpacing: 0.5
            }}>
              {isLifetime ? "Lifetime" : "Pro"}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "nowrap" }}>
          <a href="#features" style={{ padding: "6px 10px", color: theme.textMuted, textDecoration: "none", fontSize: 13 }}>Features</a>
          <a href="#pricing" style={{ padding: "6px 10px", color: theme.textMuted, textDecoration: "none", fontSize: 13 }}>Pricing</a>

          <button onClick={() => setIsDark(!isDark)} style={{ ...card, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: theme.textSecondary, flexShrink: 0 }}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* License Activation Modal */}
      <LicenseActivation
        isOpen={showLicenseModal}
        onClose={() => setShowLicenseModal(false)}
        onActivated={() => {
          setIsPro(true);
          setShowLicenseModal(false);
        }}
      />

      {/* Limit Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div style={{ ...card, padding: 40, maxWidth: 400, width: "100%", textAlign: "center" }} className="animate-fade-in-up">
            <div style={{ width: 56, height: 56, background: "linear-gradient(135deg, #8b5cf6, #d946ef)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Sparkles size={28} color="#fff" />
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{modalContent.title}</h3>
            <p style={{ color: theme.textMuted, marginBottom: 24 }}>{modalContent.desc}</p>
            <button onClick={() => { setShowModal(false); document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" }); }} style={{ ...btn, width: "100%", marginBottom: 12 }}>View Plans</button>
            <button onClick={() => { setShowModal(false); setShowLicenseModal(true); }} style={{ background: "none", border: "none", color: "#a855f7", cursor: "pointer", marginBottom: 8 }}>Have a license key?</button>
            <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: theme.textMuted, cursor: "pointer" }}>Close</button>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div style={{ position: "fixed", top: 80, left: 16, right: 16, maxWidth: 400, marginLeft: "auto", zIndex: 50 }}>
          <div style={{ ...card, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, borderColor: "rgba(239,68,68,0.3)" }}>
            <span style={{ color: "#f87171", flex: 1, fontSize: 14 }}>{error}</span>
            <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}><X size={18} /></button>
          </div>
        </div>
      )}

      {/* Exit Intent Popup */}
      {showExitPopup && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}>
          <div style={{ ...card, padding: 40, maxWidth: 440, width: "100%", textAlign: "center", position: "relative", border: "2px solid rgba(251,191,36,0.3)" }} className="animate-fade-in-up">
            {/* Close button */}
            <button
              onClick={() => setShowExitPopup(false)}
              style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: theme.textMuted, cursor: "pointer" }}
            >
              <X size={20} />
            </button>

            {/* Icon */}
            <div style={{ width: 64, height: 64, background: "linear-gradient(135deg, #fbbf24, #f59e0b)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 20px 40px -10px rgba(251,191,36,0.4)" }}>
              <Crown size={32} color="#000" />
            </div>

            {/* Content */}
            <h3 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Wait! Don&apos;t leave yet 🎁</h3>
            <p style={{ color: theme.textMuted, marginBottom: 8, fontSize: 15 }}>Get lifetime access to watermark-free videos</p>

            {/* Price */}
            <div style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
              <p style={{ fontSize: 14, color: "#fbbf24", marginBottom: 4 }}>🔥 Special Exit Offer</p>
              <p style={{ fontSize: 32, fontWeight: 700 }}>$79 <span style={{ fontSize: 16, color: theme.textMuted, textDecoration: "line-through" }}>$149</span></p>
              <p style={{ fontSize: 12, color: theme.textMuted }}>One-time payment • Forever access</p>
            </div>

            {/* Features */}
            <ul style={{ listStyle: "none", textAlign: "left", marginBottom: 24, padding: "0 16px" }}>
              {["✨ No watermark on any video", "Unlimited conversions", "X/Twitter downloader", "All future updates"].map(f => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 14, color: theme.textSecondary }}>
                  <Check size={14} color="#4ade80" /> {f}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <a
              href={PAYMENT_LINKS.LIFETIME}
              style={{ ...btn, width: "100%", textDecoration: "none", fontSize: 16, padding: "16px 28px", background: "linear-gradient(135deg, #fbbf24, #f59e0b)", color: "#000" }}
            >
              Get Lifetime Access Now
            </a>

            <button
              onClick={() => setShowExitPopup(false)}
              style={{ background: "none", border: "none", color: theme.textMuted, cursor: "pointer", marginTop: 16, fontSize: 13 }}
            >
              No thanks, I&apos;ll keep the watermark
            </button>
          </div>
        </div>
      )}

      {/* Hero */}
      <section style={{ position: "relative", zIndex: 10, maxWidth: 700, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        {step === "upload" && (
          <>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, ...card, padding: "10px 18px", borderRadius: 100, marginBottom: 32 }} className="animate-fade-in-up">
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80" }} className="animate-pulse" />
              <span style={{ fontSize: 14, color: theme.textSecondary }}>Image-First Ratio Engine</span>
            </div>

            <h1 style={{ fontSize: "clamp(40px, 8vw, 72px)", fontWeight: 700, letterSpacing: -2, marginBottom: 24, lineHeight: 1 }} className="animate-fade-in-up delay-100">
              One File.<br />
              <span className="text-gradient">Every Ratio.</span>
            </h1>

            <p style={{ fontSize: 18, color: theme.textSecondary, maxWidth: 520, margin: "0 auto 12px" }} className="animate-fade-in-up delay-200">
              Drop an image or video. Get every social format back instantly.
            </p>
            <p style={{ fontSize: 14, color: theme.textMuted, maxWidth: 420, margin: "0 auto 24px" }} className="animate-fade-in-up delay-250">
              Instagram Reels • YouTube Shorts • TikTok • Feed Posts • Stories
            </p>

            {/* Trust Badges */}
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16, marginBottom: 48 }} className="animate-fade-in-up delay-250">
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: theme.textMuted }}>
                <Check size={14} color="#4ade80" /> No login required
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: theme.textMuted }}>
                <Check size={14} color="#4ade80" /> Free tier available
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: theme.textMuted }}>
                <Check size={14} color="#4ade80" /> Works with any image
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#a855f7" }}>
                <Sparkles size={14} color="#a855f7" /> 1080p for Pro
              </span>
            </div>

            {/* Upload */}
            <div className="animate-fade-in-up delay-300">
              <div
                style={{
                  ...card,
                  padding: 48,
                  border: "none",
                  position: "relative",
                  background: isDragOver ? "rgba(139,92,246,0.1)" : theme.cardBg,
                  cursor: "pointer",
                  marginBottom: 24,
                  transition: "all 0.3s ease",
                  transform: isDragOver ? "scale(1.02)" : "scale(1)",
                  boxShadow: isDragOver ? "0 0 40px rgba(139,92,246,0.3)" : "0 0 20px rgba(6,182,212,0.1)",
                  overflow: "hidden"
                }}
                className="gradient-border"
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const file = e.dataTransfer.files[0]; if (file && (file.type.startsWith("image/") || file.type.startsWith("video/"))) handleFileSelect(file); }}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                {selectedFile ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 16, textAlign: "left" }}>
                    <div style={{ width: 56, height: 56, borderRadius: 12, background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(217,70,239,0.2))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {selectedFile.type.startsWith("video/") ? <Film size={24} color="#a855f7" /> : <ImageIcon size={24} color="#a855f7" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedFile.name}</p>
                      <p style={{ fontSize: 13, color: theme.textMuted }}>{formatSize(selectedFile.size)} • {selectedFile.type.startsWith("video/") ? "Video" : "Image"} • Ready to convert</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} style={{ background: "none", border: "none", color: theme.textMuted, cursor: "pointer", padding: 4 }}><X size={18} /></button>
                  </div>
                ) : (
                  <>
                    <div style={{ width: 64, height: 64, borderRadius: 16, background: isDragOver ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", transition: "all 0.3s" }}>
                      <Upload size={28} color={isDragOver ? "#8b5cf6" : theme.textMuted} style={{ transition: "color 0.3s" }} />
                    </div>
                    <p style={{ fontWeight: 600, marginBottom: 4 }}>Drop your image or video here</p>
                    <p style={{ fontSize: 14, color: theme.textMuted }}>or click to browse • JPG, PNG, MP4 up to 50MB</p>
                  </>
                )}
                <input type="file" id="file-input" accept="image/*,video/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <div style={{ flex: 1, height: 1, background: theme.border }} />
                <span style={{ fontSize: 12, color: theme.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>or paste URL</span>
                <div style={{ flex: 1, height: 1, background: theme.border }} />
              </div>

              <form onSubmit={handleUrlSubmit} style={{ ...card, padding: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
                <div style={{ flex: 1, minWidth: 200, display: "flex", alignItems: "center", gap: 12, padding: "0 12px" }}>
                  <LinkIcon size={18} color={theme.textMuted} />
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://x.com/username/status/..."
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: theme.text, fontSize: 14, padding: "12px 0" }}
                    disabled={isUrlLoading}
                  />
                </div>
                <button type="submit" disabled={!url.trim() || isUrlLoading} style={{ ...btn, opacity: !url.trim() || isUrlLoading ? 0.5 : 1 }}>
                  {isUrlLoading ? <><Loader2 size={16} className="animate-spin" /> Fetching...</> : <><Sparkles size={16} /> Go</>}
                </button>
              </form>

              {/* Try Example Button - High conversion feature */}
              <div style={{ textAlign: "center", marginTop: 16 }}>
                <button
                  onClick={() => {
                    setUrl("https://x.com/interesting_aIl/status/2010389261195833746");
                    setTimeout(() => {
                      const form = document.querySelector("form");
                      if (form) form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
                    }, 100);
                  }}
                  disabled={isUrlLoading}
                  style={{
                    background: "transparent",
                    border: `1px solid ${theme.border}`,
                    borderRadius: 8,
                    padding: "8px 16px",
                    color: theme.textMuted,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#06b6d4";
                    e.currentTarget.style.color = "#06b6d4";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.border;
                    e.currentTarget.style.color = theme.textMuted;
                  }}
                >
                  <Zap size={14} /> Try with sample video
                </button>
              </div>

              {/* Aspect Ratio Selector */}
              {/* Aspect Ratio Selector - Visual Cards */}
              <div style={{ marginTop: 24 }}>
                <p style={{ fontSize: 12, color: theme.textMuted, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Output Formats</p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>

                  {/* Basic Ratios */}
                  {BASIC_RATIOS.map(ratio => {
                    const config = RATIO_CONFIG[ratio] || { Icon: ImageIcon, label: ratio };
                    const isSelected = selectedRatios.includes(ratio);

                    return (
                      <button
                        key={ratio}
                        onClick={() => {
                          if (selectedRatios.includes(ratio)) {
                            if (selectedRatios.length > 1) setSelectedRatios(selectedRatios.filter(r => r !== ratio));
                          } else {
                            setSelectedRatios([...selectedRatios, ratio]);
                          }
                        }}
                        style={{
                          ...card,
                          background: isSelected ? "rgba(139,92,246,0.15)" : theme.cardBg,
                          borderColor: isSelected ? "#8b5cf6" : theme.border,
                          color: isSelected ? "#a78bfa" : theme.textSecondary,
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                          padding: "16px 8px", borderRadius: 12,
                          cursor: "pointer", transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                          boxShadow: isSelected ? "0 4px 12px rgba(139,92,246,0.2)" : "none",
                          position: "relative", overflow: "hidden"
                        }}
                      >
                        <div style={{ marginBottom: 8, padding: 8, borderRadius: "50%", background: isSelected ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.03)" }}>
                          <config.Icon size={20} strokeWidth={2} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.9 }}>{config.label}</span>
                        <span style={{ fontSize: 9, opacity: 0.5, marginTop: 2, fontFamily: "monospace" }}>{ratio}</span>
                      </button>
                    );
                  })}

                  {/* Pro Ratios */}
                  {PRO_RATIOS.map(ratio => {
                    const config = RATIO_CONFIG[ratio] || { Icon: ImageIcon, label: ratio };
                    const isSelected = selectedRatios.includes(ratio);
                    const isLocked = !(isPro || isLifetime);

                    return (
                      <button
                        key={ratio}
                        onClick={() => {
                          if (!isLocked) {
                            if (selectedRatios.includes(ratio)) {
                              setSelectedRatios(selectedRatios.filter(r => r !== ratio));
                            } else {
                              setSelectedRatios([...selectedRatios, ratio]);
                            }
                          } else {
                            setShowModal(true);
                            setModalContent({
                              title: "Pro Feature",
                              desc: `Custom aspect ratios like ${ratio} (and 21:9 Cinema) are available with Pro.`
                            });
                          }
                        }}
                        style={{
                          ...card,
                          background: isSelected ? "rgba(251,191,36,0.15)" : theme.cardBg,
                          borderColor: isSelected ? "#fbbf24" : theme.border,
                          color: isSelected ? "#fbbf24" : theme.textMuted,
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                          padding: "16px 12px", borderRadius: 16,
                          minHeight: 110,
                          cursor: isLocked ? "default" : "pointer",
                          opacity: isLocked ? 0.7 : 1,
                          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                          position: "relative",
                          boxShadow: isSelected ? "0 4px 20px -4px rgba(251,191,36,0.4)" : "none",
                          transform: isSelected ? "translateY(-2px)" : "none"
                        }}
                        className={isSelected ? "" : "card-hover"}
                      >
                        {isLocked && (
                          <div style={{ position: "absolute", top: 6, right: 6, background: "rgba(251,191,36,0.1)", borderRadius: "50%", padding: 3 }}>
                            <Crown size={10} color="#fbbf24" />
                          </div>
                        )}
                        <div style={{ marginBottom: 8, padding: 8, borderRadius: "50%", background: isSelected ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.03)" }}>
                          <config.Icon size={20} strokeWidth={2} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.9 }}>{config.label}</span>
                        <span style={{ fontSize: 9, opacity: 0.5, marginTop: 2, fontFamily: "monospace" }}>{ratio}</span>
                      </button>
                    );
                  })}
                </div>

                {!(isPro || isLifetime) && (
                  <div style={{ marginTop: 16, padding: "10px 16px", background: "rgba(251,191,36,0.05)", borderRadius: 8, border: "1px dashed rgba(251,191,36,0.3)", display: "flex", alignItems: "center", gap: 10 }}>
                    <Crown size={14} color="#fbbf24" />
                    <p style={{ fontSize: 12, color: "#fbbf24", margin: 0 }}>
                      <span style={{ fontWeight: 600 }}>Pro Tip:</span> Unlock cinematic 21:9 & portrait 4:5 ratios.
                    </p>
                  </div>
                )}
              </div>


            </div>
          </>
        )}

        {step === "processing" && (
          <div style={{ padding: "80px 0" }} className="animate-fade-in-up">
            {/* Animated orb */}
            <div style={{ position: "relative", width: 96, height: 96, margin: "0 auto 36px" }}>
              <div style={{ position: "absolute", inset: -8, background: "linear-gradient(135deg, rgba(139,92,246,0.4), rgba(217,70,239,0.3))", borderRadius: "50%", filter: "blur(24px)" }} className="animate-pulse" />
              <div style={{ position: "absolute", inset: -16, background: "rgba(139,92,246,0.1)", borderRadius: "50%", filter: "blur(40px)" }} className="glow-pulse" />
              <div style={{ ...card, width: 96, height: 96, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", borderColor: "rgba(139,92,246,0.3)" }}>
                <Loader2 size={40} color="#a855f7" className="animate-spin" />
              </div>
            </div>

            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{processingMessage}</h2>
            <p style={{ color: theme.textMuted, fontSize: 15, marginBottom: 8 }}>{stage}</p>

            {/* Step indicator pills */}
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 16, marginBottom: 8 }}>
              {["Analyze", "Convert", "Optimize"].map((s, i) => {
                const stepProgress = progress < 30 ? 0 : progress < 65 ? 1 : 2;
                return (
                  <div key={s} style={{
                    padding: "5px 14px", borderRadius: 100, fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase",
                    background: i <= stepProgress ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.04)",
                    color: i <= stepProgress ? "#a78bfa" : theme.textMuted,
                    border: `1px solid ${i <= stepProgress ? "rgba(139,92,246,0.3)" : "transparent"}`,
                    transition: "all 0.4s ease"
                  }}>
                    {i < stepProgress ? <span>✓ </span> : null}{s}
                  </div>
                );
              })}
            </div>

            {/* Queue Status */}
            {queueStatus && queueStatus.queued > 0 && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 16, padding: "8px 16px", borderRadius: 100, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}>
                <span style={{ color: "#fbbf24", fontSize: 13 }}>⏳ {queueStatus.queued} {queueStatus.queued === 1 ? "user" : "users"} ahead</span>
              </div>
            )}

            {/* Progress bar */}
            {progress > 0 && (
              <div style={{ maxWidth: 340, margin: "28px auto 0" }}>
                <div style={{ height: 6, background: theme.border, borderRadius: 100, overflow: "hidden", position: "relative" }}>
                  <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #8b5cf6, #c084fc, #d946ef)", borderRadius: 100, transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)", animation: "shimmer 2s infinite" }} />
                  </div>
                </div>
                <p style={{ fontSize: 13, color: theme.textMuted, marginTop: 10 }}>{progress}% complete</p>
              </div>
            )}
          </div>
        )}

        {step === "results" && resultsData && (
          <div style={{ padding: "40px 0" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 100, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", marginBottom: 24 }}>
              <CheckCircle2 size={16} color="#4ade80" />
              <span style={{ fontSize: 14, color: "#4ade80", fontWeight: 500 }}>Ready!</span>
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Your {resultsData.type === "video" ? "Videos" : "Images"} Are <span className="text-gradient">Ready</span></h2>
            <p style={{ color: theme.textMuted, marginBottom: 16 }}>{resultsData.results?.length || 3} formats optimized for every platform</p>

            {/* Watermark Notice for Free Users */}
            {!isPro && !isLifetime && (
              <div style={{
                background: "linear-gradient(135deg, rgba(251,191,36,0.1), rgba(245,158,11,0.1))",
                border: "1px solid rgba(251,191,36,0.3)",
                borderRadius: 12,
                padding: "12px 20px",
                marginBottom: 24,
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "center",
                gap: 12
              }}>
                <span style={{ fontSize: 14, color: "#fbbf24" }}>⚠️ Videos include RACIO watermark</span>
                <a
                  href={PAYMENT_LINKS.LIFETIME}
                  style={{
                    background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                    color: "#000",
                    padding: "6px 14px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: "none"
                  }}
                >
                  Remove Watermark - $79 lifetime
                </a>
              </div>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginBottom: 24 }}>
              {/* Client-side Download All - DOMINANT CTA */}
              {downloadedAll ? (
                <button disabled style={{ ...btn, opacity: 0.6, cursor: "default", background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)", padding: "16px 36px", fontSize: 16 }}><CheckCircle2 size={20} /> All Saved!</button>
              ) : (
                <button onClick={handleDownloadAll} style={{ ...btn, padding: "16px 36px", fontSize: 16, boxShadow: "0 8px 32px -4px rgba(139,92,246,0.4)" }} className="shimmer glow-pulse"><Package size={20} /> Download All Formats</button>
              )}

              <button onClick={handleReset} style={{ ...btnSecondary, fontSize: 14 }}><RefreshCcw size={16} /> Process Another</button>
            </div>

            {downloadedAll && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 100, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", marginBottom: 24 }}>
                <CheckCircle2 size={16} color="#4ade80" />
                <span style={{ fontSize: 14, color: "#4ade80", fontWeight: 500 }}>All formats downloaded!</span>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, textAlign: "left" }}>
              {resultsData.files.map((file: any) => {
                const info = formats[file.name] || { label: file.name, desc: "Video", icon: "🎥", ratio: [16, 9] as [number, number] };
                const isFileDownloaded = downloadedFiles.has(file.name);
                const [rw, rh] = info.ratio;
                const shapeScale = 32;
                const shapeW = (rw / Math.max(rw, rh)) * shapeScale;
                const shapeH = (rh / Math.max(rw, rh)) * shapeScale;
                const resMatch = file.name.match(/(2K|4K|1080p)$/);
                const resBadge = resMatch ? resMatch[1] : null;
                return (
                  <div key={file.name} style={{ ...card, padding: 20, opacity: isFileDownloaded ? 0.7 : 1, transition: "all 0.2s" }} className="card-hover">
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                      {/* Visual ratio shape */}
                      <div style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, background: "rgba(139,92,246,0.1)" }}>
                        <div style={{
                          width: shapeW,
                          height: shapeH,
                          border: "2px solid #a78bfa",
                          borderRadius: 3,
                          position: "relative",
                        }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <p style={{ fontWeight: 700 }}>{info.label}</p>
                          {resBadge && (
                            <span style={{
                              fontSize: 9,
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: resBadge === "4K" ? "rgba(251,191,36,0.2)" : resBadge === "2K" ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.06)",
                              color: resBadge === "4K" ? "#fbbf24" : resBadge === "2K" ? "#a78bfa" : theme.textMuted,
                              letterSpacing: 0.5,
                            }}>{resBadge}</span>
                          )}
                        </div>
                        <p style={{ fontSize: 12, color: theme.textMuted }}>{info.desc}</p>
                      </div>
                    </div>
                    {downloadedAll ? (
                      <button disabled style={{ ...btnSecondary, width: "100%", fontSize: 14, padding: "10px 16px", opacity: 0.7, cursor: "default", borderColor: "#4ade80" }}><CheckCircle2 size={14} color="#4ade80" /> Saved</button>
                    ) : isFileDownloaded ? (
                      <button disabled style={{ ...btnSecondary, width: "100%", fontSize: 14, padding: "10px 16px", opacity: 0.7, cursor: "default", borderColor: "#4ade80" }}><CheckCircle2 size={14} color="#4ade80" /> Downloaded</button>
                    ) : (
                      <a
                        href={file.url}
                        download
                        onClick={() => setDownloadedFiles(new Set([...downloadedFiles, file.name]))}
                        style={{ ...btnSecondary, width: "100%", fontSize: 14, padding: "10px 16px", textDecoration: "none" }}
                      >
                        <Download size={14} /> Download
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Features */}
      {step === "upload" && (
        <section id="features" style={{ position: "relative", zIndex: 10, maxWidth: 1100, margin: "0 auto", padding: "80px 24px", borderTop: `1px solid ${theme.border}` }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, textAlign: "center", marginBottom: 12 }}>Why creators love <span className="text-gradient">RACIO</span></h2>
          <p style={{ textAlign: "center", color: theme.textMuted, marginBottom: 48, maxWidth: 500, margin: "0 auto 48px" }}>One file in, every platform-ready format out. No login, no hassle.</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
            {[
              { icon: Zap, title: "Lightning Fast", desc: "Images convert in under 1 second. Videos in under 30s. No waiting.", color: "#a78bfa" },
              { icon: Shield, title: "Privacy First", desc: "Your files are auto-deleted after 1 hour. We never store or share them.", color: "#60a5fa" },
              { icon: Clock, title: "Save Hours Weekly", desc: "Stop manually resizing for each platform. Get all formats in one click.", color: "#f472b6" },
              { icon: Smartphone, title: "Every Platform", desc: "TikTok, Reels, Shorts, Feed, Stories — all ratios covered automatically.", color: "#34d399" },
              { icon: Sparkles, title: "Pro Quality", desc: "2K images for Pro, 4K for Lifetime. 1080p HD video. No quality loss.", color: "#fbbf24" },
              { icon: Download, title: "Batch Download", desc: "Download all formats at once. No zipping, no waiting for email links.", color: "#f87171" },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} style={{ ...card, padding: 24 }} className="card-hover">
                <div style={{ width: 44, height: 44, background: `${color}15`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <Icon size={22} color={color} />
                </div>
                <h3 style={{ fontWeight: 700, marginBottom: 6, fontSize: 16 }}>{title}</h3>
                <p style={{ fontSize: 13, color: theme.textMuted, lineHeight: 1.5 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pricing */}
      <section id="pricing" style={{ position: "relative", zIndex: 10, maxWidth: 900, margin: "0 auto", padding: "80px 24px", borderTop: `1px solid ${theme.border}` }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, textAlign: "center", marginBottom: 16 }}>Simple <span className="text-gradient">Pricing</span></h2>
        <p style={{ textAlign: "center", color: theme.textMuted, marginBottom: 48 }}>Start free. Upgrade when you need more.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {/* Free */}
          <div style={{ ...card, padding: 28 }}>
            <Zap size={24} color={theme.textMuted} />
            <h3 style={{ fontSize: 20, fontWeight: 700, marginTop: 16, marginBottom: 4 }}>Starter</h3>
            <p style={{ fontSize: 28, fontWeight: 700, marginBottom: 20 }}>$0 <span style={{ fontSize: 14, fontWeight: 400, color: theme.textMuted }}>/forever</span></p>
            <ul style={{ listStyle: "none", marginBottom: 24 }}>
              {["5 conversions/day", "1080p quality", "Watermarked", "10MB max"].map(f => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 14, color: theme.textSecondary }}>
                  <Check size={14} color={theme.textMuted} /> {f}
                </li>
              ))}
            </ul>
            <button disabled style={{ ...btnSecondary, width: "100%", opacity: 0.5, cursor: "default" }}>Current Plan</button>
          </div>

          {/* Pro */}
          <div style={{ ...card, padding: 28, borderColor: isPro && !isLifetime ? "#4ade80" : "#8b5cf6", borderWidth: 2, position: "relative" }}>
            <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: isPro && !isLifetime ? "linear-gradient(90deg, #4ade80, #22c55e)" : "linear-gradient(90deg, #8b5cf6, #d946ef)", padding: "4px 12px", borderRadius: 100, fontSize: 10, fontWeight: 700, color: "#fff", textTransform: "uppercase" }}>{isPro && !isLifetime ? "Active" : "Popular"}</div>
            <Star size={24} color={isPro && !isLifetime ? "#4ade80" : "#a855f7"} />
            <h3 style={{ fontSize: 20, fontWeight: 700, marginTop: 16, marginBottom: 4 }}>Pro</h3>
            <p style={{ fontSize: 28, fontWeight: 700, marginBottom: 20 }}>$7 <span style={{ fontSize: 14, fontWeight: 400, color: theme.textMuted }}>/mo</span></p>
            <ul style={{ listStyle: "none", marginBottom: 24 }}>
              {["✨ No watermark", "📸 2K image quality", "🎬 1080p HD video", "Custom ratios (4:5, 2:3...)", "Unlimited conversions", "X/Twitter downloader"].map(f => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 14 }}>
                  <Check size={14} color="#4ade80" /> {f}
                </li>
              ))}
            </ul>
            {isPro && !isLifetime ? (
              <button disabled style={{ ...btnSecondary, width: "100%", borderColor: "#4ade80", color: "#4ade80", cursor: "default" }}>✓ Active</button>
            ) : isLifetime ? (
              <button disabled style={{ ...btnSecondary, width: "100%", opacity: 0.5, cursor: "default" }}>Included in Lifetime</button>
            ) : (
              <a href={PAYMENT_LINKS.PRO_MONTHLY} onClick={() => analytics.proClicked()} style={{ ...btn, width: "100%", textDecoration: "none" }}>Get Pro</a>
            )}
          </div>

          {/* Lifetime */}
          <div style={{ ...card, padding: 28, borderColor: isLifetime ? "#fbbf24" : theme.border, borderWidth: isLifetime ? 2 : 1, position: "relative" }}>
            {isLifetime ? (
              <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(90deg, #fbbf24, #f59e0b)", padding: "4px 12px", borderRadius: 100, fontSize: 10, fontWeight: 700, color: "#000", textTransform: "uppercase" }}>Active</div>
            ) : (
              <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(90deg, #f59e0b, #ea580c)", padding: "4px 12px", borderRadius: 100, fontSize: 10, fontWeight: 700, color: "#fff", textTransform: "uppercase" }}>🔥 First 50 Only</div>
            )}
            <Crown size={24} color={isLifetime ? "#fbbf24" : "#f472b6"} style={{ marginTop: 8 }} />
            <h3 style={{ fontSize: 20, fontWeight: 700, marginTop: 16, marginBottom: 4 }}>Lifetime</h3>
            <p style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>$79 <span style={{ fontSize: 14, fontWeight: 400, color: theme.textMuted }}>/once</span></p>
            <p style={{ fontSize: 12, color: "#f59e0b", marginBottom: 16 }}>Early bird • Then $149</p>
            <ul style={{ listStyle: "none", marginBottom: 24 }}>
              {["✨ No watermark ever", "📸 4K image quality", "🎬 1080p HD video", "All custom ratios", "Everything in Pro", "Future updates"].map(f => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 14, color: theme.textSecondary }}>
                  <Check size={14} color={isLifetime ? "#fbbf24" : "#f472b6"} /> {f}
                </li>
              ))}
            </ul>
            {isLifetime ? (
              <button disabled style={{ ...btnSecondary, width: "100%", borderColor: "#fbbf24", color: "#fbbf24", cursor: "default" }}>✓ Active Forever</button>
            ) : (
              <a href={PAYMENT_LINKS.LIFETIME} onClick={() => analytics.lifetimeClicked()} style={{ ...btn, width: "100%", textDecoration: "none", background: "linear-gradient(135deg, #f59e0b, #ea580c)", boxShadow: "0 8px 24px -4px rgba(245,158,11,0.3)" }} className="shimmer">🔥 Buy Lifetime</a>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ position: "relative", zIndex: 10, maxWidth: 1100, margin: "0 auto", padding: "40px 24px 32px", borderTop: `1px solid ${theme.border}` }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
          <div>
            <span style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: theme.text, letterSpacing: 3 }}>[RACIO]</span>
            <p style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>The ratio engine for creators.</p>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href="/privacy" style={{ fontSize: 13, color: theme.textMuted, textDecoration: "none" }}>Privacy</Link>
            <Link href="/terms" style={{ fontSize: 13, color: theme.textMuted, textDecoration: "none" }}>Terms</Link>
            <button onClick={() => setShowLicenseModal(true)} style={{ fontSize: 13, color: theme.textMuted, background: "none", border: "none", cursor: "pointer", padding: 0 }}>Activate License</button>
            <a href="mailto:racioapp@gmail.com" style={{ fontSize: 13, color: theme.textMuted, textDecoration: "none" }}>Contact</a>
          </div>
        </div>
        <div style={{ textAlign: "center", fontSize: 11, color: theme.textMuted, opacity: 0.7 }}>
          Made with precision • © {new Date().getFullYear()} RACIO
        </div>
      </footer>

      {/* Mobile Sticky Bar */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "16px 24px",
        background: theme.bg === "#09090b" ? "rgba(9,9,11,0.9)" : "rgba(250,250,250,0.9)",
        backdropFilter: "blur(12px)",
        borderTop: `1px solid ${theme.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 100,
        transform: showSticky && isMobile ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.1)"
      }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>
          <span className="text-gradient">RACIO</span>
          <p style={{ fontSize: 11, color: theme.textMuted }}>Free 1080p, 2K & 4K</p>
        </div>
        <button
          onClick={() => {
            if (step === "results") {
              handleDownloadAll();
            } else {
              window.scrollTo({ top: 0, behavior: "smooth" });
              document.getElementById("file-input")?.click();
            }
          }}
          style={{ ...btn, padding: "10px 20px", fontSize: 14 }}
          className="shimmer"
        >
          {step === "results" ? (downloadedAll ? "Saved ✓" : "Download All") : "Convert File"}
        </button>
      </div>
    </main>
  );
}
