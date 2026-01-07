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
                <div className="absolute inset-0 w-20 h-20 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 blur-xl opacity-40 animate-pulse" />
                <div className="relative w-20 h-20 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center">
                    <Loader2 size={36} className="text-[var(--accent)] animate-spin" />
                </div>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold font-outfit mb-2">{message}</h2>

            {stage && (
                <p className="text-[var(--text-muted)] mb-8">{stage}</p>
            )}

            {progress > 0 && (
                <div className="w-full max-w-sm">
                    <div className="h-2 bg-[var(--bg-card)] rounded-full overflow-hidden border border-[var(--border-color)]">
                        <div
                            className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-[var(--text-subtle)] text-sm mt-3">{progress}% complete</p>
                </div>
            )}

            <p className="text-[var(--text-subtle)] text-xs mt-12 max-w-xs">
                Creating 9:16, 1:1, and 16:9 versions with smart cropping
            </p>
        </div>
    );
}
