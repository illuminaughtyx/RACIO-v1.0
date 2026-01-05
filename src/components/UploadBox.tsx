"use client";
import { useState, DragEvent, ChangeEvent, FormEvent } from "react";
import { Upload, Link as LinkIcon, Loader2, Sparkles } from "lucide-react";

interface UploadBoxProps {
    onFileSelect: (file: File) => void;
    onUrlSubmit: (url: string) => void;
    isUrlLoading?: boolean;
}

export default function UploadBox({ onFileSelect, onUrlSubmit, isUrlLoading }: UploadBoxProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [url, setUrl] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith("video/")) {
                setSelectedFile(file);
                onFileSelect(file);
            } else {
                alert("Please upload a video file.");
            }
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            onFileSelect(file);
        }
    };

    const handleUrlSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (url.trim()) {
            onUrlSubmit(url.trim());
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="w-full max-w-2xl mx-auto px-1">
            {/* File Upload Box - Tappable Card */}
            <div
                className={`glass-panel relative overflow-hidden p-8 md:p-14 text-center transition-all duration-300 border-2 border-dashed cursor-pointer active:scale-[0.98] md:active:scale-100
          ${isDragOver
                        ? "border-[#a855f7] bg-[#a855f7]/10 scale-[1.02]"
                        : "border-white/10 hover:border-white/30 hover:bg-white/[0.04]"
                    }
        `}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-upload")?.click()}
            >
                <div className="flex flex-col items-center justify-center gap-4 md:gap-5 relative z-10">
                    <div className={`p-4 md:p-5 rounded-2xl transition-all duration-300 ${isDragOver
                            ? "bg-[#a855f7]/20 scale-110"
                            : "bg-white/5 active:bg-white/10 md:group-hover:bg-white/10 md:group-hover:scale-105"
                        }`}>
                        <Upload className={`w-8 h-8 md:w-10 md:h-10 transition-colors ${isDragOver ? "text-[#a855f7]" : "text-white/60 group-hover:text-white/80"
                            }`} />
                    </div>
                    <div>
                        <h3 className="text-xl md:text-3xl font-bold mb-2 font-outfit">
                            {selectedFile ? selectedFile.name : "Tap to Upload Video"}
                        </h3>
                        <p className="text-white/40 text-sm md:text-lg">
                            {selectedFile
                                ? `${formatFileSize(selectedFile.size)} • Tap to change`
                                : <span className="hidden md:inline">or drag & drop here</span>
                            }
                            {!selectedFile && <span className="md:hidden">Select from gallery</span>}
                        </p>
                    </div>

                    <input
                        type="file"
                        accept="video/*"
                        onChange={handleChange}
                        className="hidden"
                        id="file-upload"
                    />
                </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6 md:my-8 px-2">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                <span className="text-white/30 font-medium text-[10px] md:text-xs uppercase tracking-widest flex items-center gap-2">
                    <Sparkles size={10} className="text-[#a855f7]" />
                    or paste link
                </span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent via-white/10 to-transparent"></div>
            </div>

            {/* URL Input - Mobile Optimized */}
            <form onSubmit={handleUrlSubmit} className="glass-panel flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 sm:pl-5">
                <div className="flex items-center gap-3 flex-1 px-2 sm:px-0 pt-2 sm:pt-0">
                    <LinkIcon className="text-white/30 flex-shrink-0" size={18} />
                    <input
                        type="text"
                        placeholder="Paste X (Twitter) video link"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="bg-transparent border-none outline-none flex-1 text-white placeholder:text-white/25 text-base py-2 w-full min-w-0"
                        disabled={isUrlLoading}
                    />
                </div>
                <button
                    type="submit"
                    className="btn-primary py-3 px-6 md:px-8 mt-2 sm:mt-0 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base w-full sm:w-auto"
                    disabled={!url.trim() || isUrlLoading}
                >
                    {isUrlLoading ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Fetching...</span>
                        </>
                    ) : (
                        "Process"
                    )}
                </button>
            </form>

            <p className="mt-6 text-center text-white/25 text-[10px] md:text-sm px-4">
                Max 500MB • MP4, MOV, MKV • Works with X/Twitter
            </p>
        </div>
    );
}
