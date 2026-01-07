"use client";
import { Loader2 } from "lucide-react";

interface ProcessingProps {
    message?: string;
    progress?: number;
    stage?: string;
}

export default function Processing({ message = "Processing", progress = 0, stage = "" }: ProcessingProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center animate-fade-in-up">
            {/* Animated Loader */}
            <div className="relative mb-10">
                {/* Outer glow ring */}
                <div className="absolute inset-0 w-24 h-24 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 blur-xl opacity-50 animate-pulse" />

                {/* Main circle */}
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 border border-purple-500/30 flex items-center justify-center">
                    <Loader2 size={40} className="text-purple-400 animate-spin" />
                </div>
            </div>

            {/* Message */}
            <h2 className="text-2xl md:text-3xl font-bold font-outfit mb-3">{message}</h2>

            {/* Stage */}
            {stage && (
                <p className="text-white/50 mb-8">{stage}</p>
            )}

            {/* Progress Bar */}
            {progress > 0 && (
                <div className="w-full max-w-md">
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                        <div
                            className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-white/30 text-sm mt-3">{progress}% complete</p>
                </div>
            )}

            {/* Tips */}
            <p className="text-white/20 text-xs mt-12 max-w-sm">
                Tip: Your video is being resized to 9:16, 1:1, and 16:9 with smart cropping.
            </p>
        </div>
    );
}
