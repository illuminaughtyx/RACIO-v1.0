"use client";
import React, { useState, useEffect, useRef } from "react";
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
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Simulate progress stages
  const simulateProgress = () => {
    const stages = [
      { progress: 10, stage: "Analyzing video dimensions..." },
      { progress: 25, stage: "Generating 9:16 (Reels/Shorts)..." },
      { progress: 50, stage: "Generating 1:1 (Instagram Feed)..." },
      { progress: 75, stage: "Generating 16:9 (YouTube)..." },
      { progress: 90, stage: "Creating ZIP bundle..." },
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
    }, 2000);
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
      alert(e.message || "Something went wrong. Please try again.");
      setStep("upload");
    }
  };

  const handleUrlSubmit = async (url: string) => {
    setIsUrlLoading(true);

    try {
      // Step 1: Fetch video from URL
      const fetchRes = await fetch("/api/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!fetchRes.ok) {
        const err = await fetchRes.json();
        throw new Error(err.error || "Failed to fetch video");
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
      alert(e.message || "Something went wrong. Please try again.");
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
  };

  return (
    <main className="min-h-screen p-6 md:p-12 flex flex-col items-center relative overflow-hidden">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#6366f1] opacity-15 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-[#ec4899] opacity-10 blur-[150px] rounded-full animate-pulse delay-1000"></div>
      </div>

      <header className="w-full max-w-7xl flex justify-between items-center mb-10 md:mb-20 z-10">
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={handleReset}>
          <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center font-black text-xl shadow-[0_0_30px_rgba(255,255,255,0.2)]">
            R
          </div>
          <h1 className="text-2xl font-bold tracking-tight font-outfit">RACIO</h1>
        </div>
        <div className="hidden md:block">
          <span className="text-white/30 text-sm font-medium border border-white/10 px-4 py-2 rounded-full">v1.0 Beta</span>
        </div>
      </header>

      <section className="flex-1 w-full flex flex-col items-center justify-center z-10 transition-all duration-500">
        {step === "upload" && (
          <>
            <div className="text-center mb-16 animate-fade-in-up max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-sm font-medium text-white/90 mb-8 hover:bg-white/10 transition-colors cursor-default">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                The Ultimate Ratio Engine
              </div>
              <h1 className="text-5xl md:text-8xl font-bold mb-8 tracking-tighter leading-[0.9] font-outfit">
                Paste Once. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#818cf8] via-[#c084fc] to-[#f472b6]">
                  Post Everywhere.
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-white/50 max-w-2xl mx-auto leading-relaxed">
                Instantly convert your videos into{" "}
                <span className="text-white/90 font-medium">Reels, Shorts, and Feed</span> formats.
                Smart cropping. No watermarks.
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

      <footer className="mt-20 text-white/20 text-sm pb-4 z-10">
        <p>RACIO — Ratio Engine</p>
      </footer>
    </main>
  );
}
