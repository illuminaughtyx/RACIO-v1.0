"use client";
import { Download, RefreshCcw, CheckCircle2, Film, Sparkles, Package } from "lucide-react";

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
        <div className="w-full max-w-5xl mx-auto pb-16 md:pb-24">
            {/* Success Header */}
            <div className="text-center mb-12 md:mb-16 animate-fade-in-up">
                <div className="inline-flex items-center gap-2 bg-[#4ade80]/10 text-[#4ade80] px-5 py-2 rounded-full mb-6 border border-[#4ade80]/20 animate-pulse-glow">
                    <CheckCircle2 size={18} />
                    <span className="font-semibold text-sm tracking-wide uppercase">Ready to Download</span>
                </div>

                <h2 className="text-4xl md:text-6xl font-bold font-outfit mb-4">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80">
                        Your Videos Are Ready
                    </span>
                </h2>
                <p className="text-white/40 text-lg md:text-xl mb-10">
                    3 formats optimized for every platform
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                        href={data.zip}
                        className="btn-primary flex items-center justify-center gap-3 px-10 py-4 text-lg group"
                        download
                    >
                        <Package size={22} className="group-hover:animate-bounce" />
                        Download All (ZIP)
                    </a>
                    <button
                        onClick={onReset}
                        className="btn-secondary flex items-center justify-center gap-2 text-white/60 hover:text-white"
                    >
                        <RefreshCcw size={18} />
                        Process Another
                    </button>
                </div>
            </div>

            {/* Format Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
                {data.files.map((file, index) => {
                    const key = file.name as keyof typeof formats;
                    const info = formats[key] || { label: file.name, desc: "Video", icon: "🎥" };

                    // Aspect ratio preview
                    let aspectClass = "aspect-video";
                    if (key === "reel_9-16") aspectClass = "aspect-[9/16]";
                    if (key === "feed_1-1") aspectClass = "aspect-square";

                    return (
                        <div
                            key={file.name}
                            className="glass-panel p-6 flex flex-col group hover:-translate-y-2 transition-all duration-500 animate-fade-in-up"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-5">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-2xl">{info.icon}</span>
                                        <h4 className="text-2xl font-bold font-outfit">{info.label}</h4>
                                    </div>
                                    <p className="text-white/40 text-sm font-medium">{info.desc}</p>
                                </div>
                                <Sparkles className="text-white/10 group-hover:text-[#a855f7]/50 transition-colors" size={20} />
                            </div>

                            {/* Aspect Ratio Preview */}
                            <div className={`w-full bg-gradient-to-br from-white/5 to-transparent rounded-xl mb-6 relative overflow-hidden border border-white/5 ${aspectClass} max-h-40 md:max-h-48 mx-auto group-hover:border-white/10 transition-colors`}>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Film className="text-white/10 w-10 h-10" />
                                </div>
                                <div className="absolute bottom-2 right-2 text-[10px] text-white/20 font-mono bg-black/30 px-2 py-1 rounded">
                                    MP4
                                </div>
                            </div>

                            {/* Download Button */}
                            <a
                                href={file.url}
                                className="w-full btn-secondary text-center py-3.5 flex items-center justify-center gap-2 group-hover:bg-[#a855f7]/10 group-hover:border-[#a855f7]/30 transition-all mt-auto"
                                download
                            >
                                <Download size={16} />
                                Download
                            </a>
                        </div>
                    );
                })}
            </div>

            {/* Footer note */}
            <p className="text-center text-white/20 text-xs mt-10">
                Files will be automatically deleted after 1 hour
            </p>
        </div>
    );
}
