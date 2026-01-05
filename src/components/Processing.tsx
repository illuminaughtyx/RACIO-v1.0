"use client";
import { Loader2, Zap } from "lucide-react";

interface ProcessingProps {
    message?: string;
    progress?: number;
    stage?: string;
}

export default function Processing({
    message = "Processing Video",
    progress,
    stage
}: ProcessingProps) {
    return (
        <div className="w-full max-w-xl mx-auto text-center py-16 md:py-24 animate-fade-in relative z-10">
            {/* Glow background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 bg-[#a855f7] blur-[100px] opacity-20 animate-pulse rounded-full"></div>
            </div>

            {/* Spinner */}
            <div className="relative inline-block mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-[#6366f1] to-[#ec4899] blur-2xl opacity-40 animate-pulse rounded-full scale-150"></div>
                <div className="relative w-24 h-24 flex items-center justify-center">
                    <Loader2 className="w-20 h-20 animate-spin text-white/90" strokeWidth={1.5} />
                    <Zap className="absolute w-8 h-8 text-[#fbbf24]" fill="currentColor" />
                </div>
            </div>

            {/* Title */}
            <h3 className="text-3xl md:text-4xl font-bold mb-3 font-outfit">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70">
                    {message}
                </span>
            </h3>

            {/* Stage indicator */}
            {stage && (
                <p className="text-[#c084fc] font-medium mb-6 text-base md:text-lg animate-pulse">{stage}</p>
            )}

            {/* Progress bar */}
            {progress !== undefined && progress > 0 && (
                <div className="w-full max-w-sm mx-auto mt-8">
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden backdrop-blur-sm">
                        <div
                            className="h-full bg-gradient-to-r from-[#6366f1] via-[#a855f7] to-[#ec4899] transition-all duration-700 ease-out relative"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                    </div>
                    <div className="flex justify-between mt-3 text-xs md:text-sm">
                        <span className="text-white/30">Processing...</span>
                        <span className="text-white/50 font-mono">{Math.round(progress)}%</span>
                    </div>
                </div>
            )}

            {!progress && (
                <p className="text-white/35 text-base md:text-lg mt-4">
                    This usually takes 10-30 seconds
                </p>
            )}
        </div>
    );
}
