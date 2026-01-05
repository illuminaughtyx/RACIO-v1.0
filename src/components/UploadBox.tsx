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
        <div className="w-full max-w-2xl mx-auto">
            {/* File Upload Box */}
            <div
                className={`glass-panel p-10 md:p-14 text-center transition-all duration-300 border-2 border-dashed cursor-pointer group
          ${isDragOver
                        ? "border-[#a855f7] bg-[#a855f7]/10 scale-[1.02]"
                        : "border-white/10 hover:border-white/30 hover:bg-white/[0.02]"
                    }
        `}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-upload")?.click()}
            >
                <div className="flex flex-col items-center justify-center gap-5">
                    <div className={`p-5 rounded-2xl transition-all duration-300 ${isDragOver
                            ? "bg-[#a855f7]/20 scale-110"
                            : "bg-white/5 group-hover:bg-white/10 group-hover:scale-105"
                        }`}>
                        <Upload className={`w-10 h-10 transition-colors ${isDragOver ? "text-[#a855f7]" : "text-white/60 group-hover:text-white/80"
                            }`} />
                    </div>
                    <div>
                        <h3 className="text-2xl md:text-3xl font-bold mb-2 font-outfit">
                            {selectedFile ? selectedFile.name : "Drop your video here"}
                        </h3>
                        <p className="text-white/40 text-base md:text-lg">
                            {selectedFile
                                ? `${formatFileSize(selectedFile.size)} • Click to change`
                                : "or click to browse"
                            }
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
            <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                <span className="text-white/30 font-medium text-xs uppercase tracking-widest flex items-center gap-2">
                    <Sparkles size={12} className="text-[#a855f7]" />
                    or paste URL
                </span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent via-white/10 to-transparent"></div>
            </div>

            {/* URL Input */}
            <form onSubmit={handleUrlSubmit} className="glass-panel flex items-center gap-3 p-2 pl-5">
                <LinkIcon className="text-white/30 flex-shrink-0" size={18} />
                <input
                    type="text"
                    placeholder="Paste X (Twitter) video URL..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="bg-transparent border-none outline-none flex-1 text-white placeholder:text-white/25 text-base md:text-lg py-2"
                    disabled={isUrlLoading}
                />
                <button
                    type="submit"
                    className="btn-primary py-3 px-6 md:px-8 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                    disabled={!url.trim() || isUrlLoading}
                >
                    {isUrlLoading ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            <span className="hidden md:inline">Fetching...</span>
                        </>
                    ) : (
                        "Go"
                    )}
                </button>
            </form>

            <p className="mt-6 text-center text-white/25 text-xs md:text-sm">
                Supports MP4, MOV, MKV up to 500MB • X/Twitter video URLs
            </p>
        </div>
    );
}
