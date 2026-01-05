"use client";
import { Loader2 } from "lucide-react";

interface ProcessingProps {
    message?: string;
    progress?: number; // 0-100
    stage?: string;
}

export default function Processing({
    message = "Processing Video",
    progress,
    stage
}: ProcessingProps) {
    return (
        <div className="w-full max-w-xl mx-auto text-center py-20 animate-fade-in relative z-10">
            <div className="relative inline-block mb-8">
                <div className="absolute inset-0 bg-[#a855f7] blur-3xl opacity-30 animate-pulse rounded-full"></div>
                <Loader2 className="w-20 h-20 animate-spin text-[#d8b4fe] relative z-10" />
            </div>

            <h3 className="text-3xl font-bold mb-4 font-outfit text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
                {message}
            </h3>

            {stage && (
                <p className="text-[#a855f7] font-medium mb-4 text-lg">{stage}</p>
            )}

            {progress !== undefined && (
                <div className="w-full max-w-md mx-auto mt-6">
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[#6366f1] via-[#a855f7] to-[#ec4899] transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-white/40 text-sm mt-3">{Math.round(progress)}% complete</p>
                </div>
            )}

            {!progress && (
                <p className="text-white/40 text-lg">
                    Please wait while we generate your optimized formats.
                </p>
            )}
        </div>
    );
}
