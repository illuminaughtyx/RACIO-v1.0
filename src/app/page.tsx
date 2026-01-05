"use client";
import React, { useState, useRef } from "react";
import UploadBox from "@/components/UploadBox";
import Processing from "@/components/Processing";
import Results from "@/components/Results";

export default function Home() {
  const [step, setStep] = useState<"upload" | "processing" | "results">("upload");
  const [resultsData, setResultsData] = useState<any>(null);
  const [isUrlLoading, setIsUrlLoading] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("Processing Video");
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Simulate progress stages
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
    } catch (e: any) {
      stopProgress();
      console.error(e);
      setError(e.message || "Something went wrong");
      setStep("upload");
    }
  };

  const handleUrlSubmit = async (url: string) => {
    setError(null);
    setIsUrlLoading(true);

    try {
      // Step 1: Fetch video from X/Twitter
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

      // Step 2: Process the downloaded video
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

  return (
    <main className="min-h-screen min-h-[100dvh] px-4 py-6 md:p-12 flex flex-col items-center relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] md:w-[700px] md:h-[700px] bg-[#6366f1] opacity-[0.12] blur-[100px] md:blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-[#ec4899] opacity-[0.08] blur-[100px] md:blur-[150px] rounded-full"></div>
      </div>

      {/* Header */}
      <header className="w-full max-w-7xl flex justify-between items-center mb-8 md:mb-16 z-10">
        <div
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity active:scale-95"
          onClick={handleReset}
        >
          <div className="w-9 h-9 md:w-11 md:h-11 bg-gradient-to-br from-[#6366f1] via-[#a855f7] to-[#ec4899] rounded-xl flex items-center justify-center font-black text-lg md:text-xl shadow-lg shadow-[#a855f7]/20">
            R
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight font-outfit">RACIO</h1>
        </div>
        <div className="hidden sm:block">
          <span className="text-white/25 text-xs md:text-sm font-medium border border-white/10 px-3 py-1.5 md:px-4 md:py-2 rounded-full">
            v1.0
          </span>
        </div>
      </header>

      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50 animate-fade-in-up">
          <div className="glass-panel bg-red-500/10 border-red-500/20 px-4 py-3 md:px-6 md:py-4 flex items-center gap-3">
            <span className="text-red-400 text-sm md:text-base">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400/60 hover:text-red-400 ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <section className="flex-1 w-full flex flex-col items-center justify-center z-10 transition-all duration-500">
        {step === "upload" && (
          <>
            <div className="text-center mb-10 md:mb-16 animate-fade-in-up max-w-4xl mx-auto px-2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 md:px-5 md:py-2 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-md text-xs md:text-sm font-medium text-white/80 mb-6 md:mb-8">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-400 animate-pulse"></span>
                The Ratio Engine
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-6 md:mb-8 tracking-tighter leading-[0.95] font-outfit">
                Paste Once. <br className="md:hidden" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#818cf8] via-[#c084fc] to-[#f472b6]">
                  Post Everywhere.
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/45 max-w-xl mx-auto leading-relaxed">
                Convert any video to{" "}
                <span className="text-white/80">Reels, Shorts & Feed</span> formats instantly.
              </p>
            </div>
            <UploadBox
              onFileSelect={handleUpload}
              onUrlSubmit={handleUrlSubmit}
              isUrlLoading={isUrlLoading}
            />
          </>
        )}

        {step === "processing" && (
          <Processing
            message={processingMessage}
            progress={progress}
            stage={stage}
          />
        )}

        {step === "results" && resultsData && (
          <Results data={resultsData} onReset={handleReset} />
        )}
      </section>

      {/* Footer */}
      <footer className="mt-auto pt-8 md:pt-16 text-white/15 text-xs md:text-sm pb-4 z-10 text-center">
        <p>RACIO — The Ratio Engine</p>
      </footer>
    </main>
  );
}
