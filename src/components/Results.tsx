"use client";
import { Download, RefreshCcw, CheckCircle2, Package, Sparkles } from "lucide-react";

interface ResultsProps {
    data: {
        zip: string;
        files: { name: string; url: string }[];
    };
    onReset: () => void;
}

export default function Results({ data, onReset }: ResultsProps) {
    const formats: Record<string, { label: string; desc: string; icon: string }> = {
        "reel_9-16": { label: "9:16", desc: "Reels & Shorts", icon: "📱" },
        "feed_1-1": { label: "1:1", desc: "Instagram Feed", icon: "📷" },
        "landscape_16-9": { label: "16:9", desc: "YouTube", icon: "🎬" },
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Success Header */}
            <div className="text-center mb-12 animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
                    <CheckCircle2 size={16} className="text-green-400" />
                    <span className="text-green-400 font-medium text-sm">Processing Complete</span>
                </div>

                <h2 className="text-3xl md:text-4xl font-bold font-outfit mb-3">
                    Your Videos Are <span className="text-gradient">Ready</span>
                </h2>
                <p className="text-[var(--text-muted)] mb-10">
                    3 formats optimized for every platform
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
                    <a
                        href={data.zip}
                        className="btn-primary flex items-center justify-center gap-2 group"
                        download
                    >
                        <Package size={18} />
                        Download All
                    </a>
                    <button
                        onClick={onReset}
                        className="btn-secondary flex items-center justify-center gap-2"
                    >
                        <RefreshCcw size={16} />
                        Process Another
                    </button>
                </div>
            </div>

            {/* Format Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.files.map((file, index) => {
                    const key = file.name as keyof typeof formats;
                    const info = formats[key] || { label: file.name, desc: "Video", icon: "🎥" };

                    return (
                        <div
                            key={file.name}
                            className="glass-card p-5 flex flex-col group animate-fade-in-up"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{info.icon}</span>
                                    <div>
                                        <h4 className="text-lg font-bold font-outfit">{info.label}</h4>
                                        <p className="text-[var(--text-muted)] text-xs">{info.desc}</p>
                                    </div>
                                </div>
                                <Sparkles className="text-[var(--border-color)] group-hover:text-[var(--accent)] transition-colors" size={16} />
                            </div>

                            <a
                                href={file.url}
                                className="w-full btn-secondary text-center py-2.5 text-sm flex items-center justify-center gap-2 group-hover:border-[var(--accent)]/30 transition-all mt-auto"
                                download
                            >
                                <Download size={14} />
                                Download
                            </a>
                        </div>
                    );
                })}
            </div>

            <p className="text-center text-[var(--text-subtle)] text-xs mt-8">
                Files auto-delete after 1 hour for your privacy
            </p>
        </div>
    );
}
