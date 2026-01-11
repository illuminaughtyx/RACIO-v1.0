"use client";
import React, { useState, useRef, CSSProperties } from "react";
import { Upload, Link as LinkIcon, Loader2, Sparkles, Zap, Shield, Clock, Download, RefreshCcw, CheckCircle2, Package, Check, Star, Crown, Sun, Moon, X, Key } from "lucide-react";
import { checkUsage, incrementUsage, isProUser, checkUrlUsage, incrementUrlUsage } from "@/lib/usage";
import LicenseActivation from "@/components/LicenseActivation";

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
    textMuted: "rgba(255,255,255,0.4)",
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
  const [processingMessage, setProcessingMessage] = useState("Processing Video");
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
  const exitPopupShown = useRef(false);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Available aspect ratios
  const BASIC_RATIOS = ["9:16", "1:1", "16:9"];
  const PRO_RATIOS = ["4:5", "2:3", "21:9"];

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
  };

  const stopProgress = () => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    setProgress(100);
    setStage("Complete!");
  };

  const handleFileSelect = async (file: File) => {
    if (!checkLimit()) return;
    setSelectedFile(file);
    setError(null);
    setStep("processing");
    simulateProgress();

    const formData = new FormData();
    formData.append("file", file);
    formData.append("isPro", String(isPro || isLifetime));
    formData.append("ratios", JSON.stringify(selectedRatios));

    try {
      const res = await fetch("/api/process", { method: "POST", body: formData });
      stopProgress();
      if (!res.ok) throw new Error((await res.json()).error || "Upload failed");
      setResultsData(await res.json());
      setStep("results");
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
      simulateProgress();

      const processRes = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempPath: fetchData.tempPath, sessionId: fetchData.sessionId, isPro: isPro || isLifetime, ratios: selectedRatios }),
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

  const formats: Record<string, { label: string; desc: string; icon: string }> = {
    "reel_9-16": { label: "9:16", desc: "Reels & Shorts", icon: "📱" },
    "feed_1-1": { label: "1:1", desc: "Instagram Feed", icon: "📷" },
    "landscape_16-9": { label: "16:9", desc: "YouTube", icon: "🎬" },
    "portrait_4-5": { label: "4:5", desc: "Instagram Portrait", icon: "📸" },
    "portrait_2-3": { label: "2:3", desc: "Pinterest", icon: "📌" },
    "ultrawide_21-9": { label: "21:9", desc: "Ultrawide/Cinema", icon: "🎥" },
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
              <span style={{ fontSize: 14, color: theme.textSecondary }}>The Ratio Engine</span>
            </div>

            <h1 style={{ fontSize: "clamp(40px, 8vw, 72px)", fontWeight: 700, letterSpacing: -2, marginBottom: 24, lineHeight: 1 }} className="animate-fade-in-up delay-100">
              Paste Once.<br />
              <span className="text-gradient">Post Everywhere.</span>
            </h1>

            <p style={{ fontSize: 18, color: theme.textSecondary, maxWidth: 480, margin: "0 auto 24px" }} className="animate-fade-in-up delay-200">
              Convert any video to Reels, Shorts & Feed formats in 5 seconds.
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
                <Check size={14} color="#4ade80" /> Works with X, TikTok, YouTube
              </span>
            </div>

            {/* Upload */}
            <div className="animate-fade-in-up delay-300">
              <div
                style={{
                  ...card,
                  padding: 48,
                  borderStyle: "dashed",
                  borderWidth: 2,
                  borderColor: isDragOver ? "#8b5cf6" : theme.border,
                  cursor: "pointer",
                  marginBottom: 24,
                  transition: "all 0.3s ease",
                  transform: isDragOver ? "scale(1.02)" : "scale(1)",
                  boxShadow: isDragOver ? "0 0 40px rgba(139,92,246,0.2)" : "none"
                }}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files[0]?.type.startsWith("video/")) handleFileSelect(e.dataTransfer.files[0]); }}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <Upload size={40} color={isDragOver ? "#8b5cf6" : theme.textMuted} style={{ margin: "0 auto 16px", transition: "color 0.3s" }} />
                <p style={{ fontWeight: 600, marginBottom: 4 }}>{selectedFile ? selectedFile.name : "Drop your video here"}</p>
                <p style={{ fontSize: 14, color: theme.textMuted }}>{selectedFile ? formatSize(selectedFile.size) : "or click to browse • MP4, MOV up to 500MB"}</p>
                <input type="file" id="file-input" accept="video/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
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

              {/* Aspect Ratio Selector */}
              <div style={{ marginTop: 24 }}>
                <p style={{ fontSize: 12, color: theme.textMuted, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Output Formats</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                  {/* Basic Ratios - Always available */}
                  {BASIC_RATIOS.map(ratio => (
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
                        padding: "8px 16px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        background: selectedRatios.includes(ratio) ? "rgba(139,92,246,0.2)" : theme.cardBg,
                        borderColor: selectedRatios.includes(ratio) ? "#8b5cf6" : theme.border,
                        color: selectedRatios.includes(ratio) ? "#a855f7" : theme.textSecondary,
                      }}
                    >
                      {ratio}
                    </button>
                  ))}

                  {/* Pro Ratios - Locked for free users */}
                  {PRO_RATIOS.map(ratio => (
                    <button
                      key={ratio}
                      onClick={() => {
                        if (isPro || isLifetime) {
                          if (selectedRatios.includes(ratio)) {
                            setSelectedRatios(selectedRatios.filter(r => r !== ratio));
                          } else {
                            setSelectedRatios([...selectedRatios, ratio]);
                          }
                        } else {
                          setShowModal(true);
                          setModalContent({
                            title: "Pro Feature",
                            desc: `Custom aspect ratios like ${ratio} are available with Pro. Upgrade to unlock!`
                          });
                        }
                      }}
                      style={{
                        ...card,
                        padding: "8px 16px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        background: selectedRatios.includes(ratio) ? "rgba(251,191,36,0.2)" : theme.cardBg,
                        borderColor: selectedRatios.includes(ratio) ? "#fbbf24" : theme.border,
                        color: selectedRatios.includes(ratio) ? "#fbbf24" : theme.textMuted,
                        opacity: (isPro || isLifetime) ? 1 : 0.6,
                        position: "relative",
                      }}
                    >
                      {ratio}
                      {!(isPro || isLifetime) && <Crown size={10} style={{ marginLeft: 4 }} color="#fbbf24" />}
                    </button>
                  ))}
                </div>
                {!(isPro || isLifetime) && (
                  <p style={{ fontSize: 11, color: "#fbbf24", marginTop: 8 }}>
                    <Crown size={10} style={{ marginRight: 4, verticalAlign: "middle" }} />
                    Pro users get 4:5, 2:3, 21:9 + more
                  </p>
                )}
              </div>

              <p style={{ marginTop: 24, fontSize: 12, color: theme.textMuted }}>Trusted by 500+ creators</p>
            </div>
          </>
        )}

        {step === "processing" && (
          <div style={{ padding: "80px 0" }}>
            <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 32px" }}>
              <div style={{ position: "absolute", inset: 0, background: "rgba(139,92,246,0.3)", borderRadius: "50%", filter: "blur(20px)" }} className="animate-pulse" />
              <div style={{ ...card, width: 80, height: 80, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <Loader2 size={36} color="#a855f7" className="animate-spin" />
              </div>
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{processingMessage}</h2>
            <p style={{ color: theme.textMuted }}>{stage}</p>
            {progress > 0 && (
              <div style={{ maxWidth: 300, margin: "32px auto 0" }}>
                <div style={{ height: 8, background: theme.border, borderRadius: 100, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #8b5cf6, #d946ef)", borderRadius: 100, transition: "width 0.5s" }} />
                </div>
                <p style={{ fontSize: 14, color: theme.textMuted, marginTop: 12 }}>{progress}%</p>
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
            <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Your Videos Are <span className="text-gradient">Ready</span></h2>
            <p style={{ color: theme.textMuted, marginBottom: 16 }}>3 formats optimized for every platform</p>

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
              {downloadedAll ? (
                <button disabled style={{ ...btn, opacity: 0.5, cursor: "default", background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)" }}><CheckCircle2 size={18} /> Downloaded</button>
              ) : (
                <a href={resultsData.zip} download onClick={() => setDownloadedAll(true)} style={{ ...btn, textDecoration: "none" }}><Package size={18} /> Download All</a>
              )}
              <button onClick={handleReset} style={btnSecondary}><RefreshCcw size={18} /> Process Another</button>
            </div>

            {downloadedAll && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 100, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", marginBottom: 24 }}>
                <CheckCircle2 size={16} color="#4ade80" />
                <span style={{ fontSize: 14, color: "#4ade80", fontWeight: 500 }}>All formats downloaded!</span>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, textAlign: "left" }}>
              {resultsData.files.map((file: any) => {
                const info = formats[file.name] || { label: file.name, desc: "Video", icon: "🎥" };
                const isFileDownloaded = downloadedFiles.has(file.name);
                return (
                  <div key={file.name} style={{ ...card, padding: 20, opacity: downloadedAll || isFileDownloaded ? 0.7 : 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                      <span style={{ fontSize: 24 }}>{info.icon}</span>
                      <div>
                        <p style={{ fontWeight: 700 }}>{info.label}</p>
                        <p style={{ fontSize: 12, color: theme.textMuted }}>{info.desc}</p>
                      </div>
                    </div>
                    {downloadedAll ? (
                      <button disabled style={{ ...btnSecondary, width: "100%", fontSize: 14, padding: "10px 16px", opacity: 0.5, cursor: "default" }}><CheckCircle2 size={14} color="#4ade80" /> Included in ZIP</button>
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
          <h2 style={{ fontSize: 32, fontWeight: 700, textAlign: "center", marginBottom: 16 }}>Why creators love <span className="text-gradient">RACIO</span></h2>
          <p style={{ textAlign: "center", color: theme.textMuted, marginBottom: 48 }}>One video in, three formats out.</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {[
              { icon: Zap, title: "Lightning Fast", desc: "Process in seconds, not minutes.", color: "#a78bfa" },
              { icon: Shield, title: "Privacy First", desc: "Files deleted after 1 hour.", color: "#60a5fa" },
              { icon: Clock, title: "Save Hours", desc: "All formats in one click.", color: "#f472b6" },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} style={{ ...card, padding: 28 }}>
                <div style={{ width: 48, height: 48, background: `${color}20`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <Icon size={24} color={color} />
                </div>
                <h3 style={{ fontWeight: 700, marginBottom: 4 }}>{title}</h3>
                <p style={{ fontSize: 14, color: theme.textMuted }}>{desc}</p>
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
              {["3 videos/day", "720p quality", "Watermarked videos", "50MB max"].map(f => (
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
              {["✨ No watermark", "🎬 1080p HD quality", "Custom ratios (4:5, 2:3...)", "Unlimited videos", "X/Twitter downloader"].map(f => (
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
              <a href={PAYMENT_LINKS.PRO_MONTHLY} style={{ ...btn, width: "100%", textDecoration: "none" }}>Get Pro</a>
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
              {["✨ No watermark ever", "🎬 1080p HD quality", "All custom ratios", "Everything in Pro", "Future updates"].map(f => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 14, color: theme.textSecondary }}>
                  <Check size={14} color={isLifetime ? "#fbbf24" : "#f472b6"} /> {f}
                </li>
              ))}
            </ul>
            {isLifetime ? (
              <button disabled style={{ ...btnSecondary, width: "100%", borderColor: "#fbbf24", color: "#fbbf24", cursor: "default" }}>✓ Active Forever</button>
            ) : (
              <a href={PAYMENT_LINKS.LIFETIME} style={{ ...btnSecondary, width: "100%", textDecoration: "none" }}>Buy Lifetime</a>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ position: "relative", zIndex: 10, maxWidth: 1100, margin: "0 auto", padding: "32px 24px", borderTop: `1px solid ${theme.border}`, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: theme.text, letterSpacing: 2 }}>[RACIO]</span>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          <a href="#" style={{ fontSize: 14, color: theme.textMuted, textDecoration: "none" }}>Privacy</a>
          <a href="#" style={{ fontSize: 14, color: theme.textMuted, textDecoration: "none" }}>Terms</a>
          <a href="mailto:racioapp@gmail.com" style={{ fontSize: 14, color: theme.textMuted, textDecoration: "none" }}>Contact</a>
        </div>
      </footer>
    </main>
  );
}
