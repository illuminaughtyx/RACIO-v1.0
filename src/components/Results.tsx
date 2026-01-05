"use client";
import { Download, RefreshCcw, CheckCircle2, Film } from "lucide-react";

interface ResultsProps {
    data: {
        zip: string;
        files: { name: string; url: string }[];
    };
    onReset: () => void;
}

export default function Results({ data, onReset }: ResultsProps) {
    const formats = {
        "reel_9-16": { label: "9:16 Vertical", desc: "Shorts & Reels" },
        "feed_1-1": { label: "1:1 Square", desc: "Instagram Feed" },
        "landscape_16-9": { label: "16:9 Landscape", desc: "YouTube" },
    };

    return (
        <div className="w-full max-w-5xl mx-auto animate-fade-in-up pb-20">
            <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-[#4ade80]/10 text-[#4ade80] px-4 py-1.5 rounded-full mb-6 border border-[#4ade80]/20">
                    <CheckCircle2 size={16} />
                    <span className="font-semibold text-sm tracking-wide uppercase">Success</span>
                </div>
                <h2 className="text-5xl font-bold font-outfit mb-4">Your Videos Are Ready</h2>
                <p className="text-white/50 text-lg mb-10">Optimized without quality loss.</p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href={data.zip} className="btn-primary flex items-center justify-center gap-3 px-8 text-lg hover:scale-105 transition-all" download>
                        <Download size={22} />
                        Download ZIP
                    </a>
                    <button onClick={onReset} className="btn-secondary flex items-center justify-center gap-2 hover:bg-white/5 text-white/70 hover:text-white">
                        <RefreshCcw size={18} />
                        New Project
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {data.files.map(file => {
                    const key = file.name as keyof typeof formats;
                    const info = formats[key] || { label: file.name, desc: "MP4 Video" };

                    // Aspect ratio class
                    let aspectClass = "aspect-video";
                    if (key === "reel_9-16") aspectClass = "aspect-[9/16]";
                    if (key === "feed_1-1") aspectClass = "aspect-square";

                    return (
                        <div key={file.name} className="glass-panel p-6 flex flex-col group hover:-translate-y-1 transition-transform duration-300">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h4 className="text-2xl font-bold">{info.label}</h4>
                                    <p className="text-white/40 text-sm font-medium">{info.desc}</p>
                                </div>
                                <Film className="text-white/10 group-hover:text-white/20 transition-colors" />
                            </div>

                            {/* Simple Aspect Ratio Visual */}
                            <div className={`w-full bg-black/40 rounded-xl mb-6 relative overflow-hidden border border-white/5 ${aspectClass} max-h-48 md:max-h-full mx-auto`}>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-white/10 font-black text-4xl select-none">{info.label.split(" ")[0]}</span>
                                </div>
                            </div>

                            <div className="mt-auto">
                                <a href={file.url} className="w-full btn-secondary block text-center py-3 hover:bg-white/10 flex items-center justify-center gap-2" download>
                                    <Download size={16} />
                                    Download MP4
                                </a>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
