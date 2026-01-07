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
    const formats: Record<string, { label: string; desc: string; icon: string; color: string }> = {
        "reel_9-16": { label: "9:16", desc: "Reels & Shorts", icon: "📱", color: "from-violet-500/20 to-purple-500/10" },
        "feed_1-1": { label: "1:1", desc: "Instagram Feed", icon: "📷", color: "from-blue-500/20 to-cyan-500/10" },
        "landscape_16-9": { label: "16:9", desc: "YouTube", icon: "🎬", color: "from-fuchsia-500/20 to-pink-500/10" },
    };

    return (
        <div className="w-full max-w-5xl mx-auto">
            {/* Success Header */}
            <div className="text-center mb-12 animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
                    <CheckCircle2 size={18} className="text-green-400" />
                    <span className="text-green-400 font-medium text-sm">Processing Complete</span>
                </div>

                <h2 className="text-4xl md:text-5xl font-bold font-outfit mb-4">
                    Your Videos Are <span className="text-gradient">Ready</span>
                </h2>
                <p className="text-white/40 text-lg mb-10">
                    3 formats optimized for every platform
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                    <a
                        href={data.zip}
                        className="btn-primary flex items-center justify-center gap-3 group"
                        download
                    >
                        <Package size={20} className="group-hover:animate-bounce" />
                        Download All (ZIP)
                    </a>
                    <button
                        onClick={onReset}
                        className="btn-secondary flex items-center justify-center gap-2"
                    >
                        <RefreshCcw size={18} />
                        Process Another
                    </button>
                </div>
            </div>

            {/* Format Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {data.files.map((file, index) => {
                    const key = file.name as keyof typeof formats;
                    const info = formats[key] || { label: file.name, desc: "Video", icon: "🎥", color: "from-white/10 to-white/5" };

                    let aspectClass = "aspect-video";
                    if (key === "reel_9-16") aspectClass = "aspect-[9/16] max-h-48";
                    if (key === "feed_1-1") aspectClass = "aspect-square";

                    return (
                        <div
                            key={file.name}
                            className="glass-card p-6 flex flex-col group animate-fade-in-up"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{info.icon}</span>
                                    <div>
                                        <h4 className="text-xl font-bold font-outfit">{info.label}</h4>
                                        <p className="text-white/40 text-sm">{info.desc}</p>
                                    </div>
                                </div>
                                <Sparkles className="text-purple-500/30 group-hover:text-purple-400 transition-colors" size={18} />
                            </div>

                            {/* Preview */}
                            <div className={`w-full bg-gradient-to-br ${info.color} rounded-xl mb-5 relative overflow-hidden border border-white/5 ${aspectClass} flex items-center justify-center`}>
                                <div className="text-4xl opacity-30">{info.icon}</div>
                                <div className="absolute bottom-2 right-2 text-[10px] text-white/30 font-mono bg-black/30 px-2 py-1 rounded">
                                    MP4
                                </div>
                            </div>

                            {/* Download Button */}
                            <a
                                href={file.url}
                                className="w-full btn-secondary text-center py-3 flex items-center justify-center gap-2 group-hover:bg-purple-500/10 group-hover:border-purple-500/30 transition-all mt-auto"
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
                Files will be automatically deleted after 1 hour for your privacy
            </p>
        </div>
    );
}
