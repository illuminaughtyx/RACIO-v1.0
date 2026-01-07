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
        <div className="w-full space-y-6">
            {/* Upload Card */}
            <div
                className={`glass-card relative p-8 md:p-12 text-center cursor-pointer transition-all duration-300 group
          ${isDragOver
                        ? "border-purple-500 bg-purple-500/10 scale-[1.02]"
                        : "hover:border-purple-500/40"
                    }
        `}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-upload")?.click()}
            >
                {/* Decorative gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 rounded-[24px] pointer-events-none" />

                <div className="relative flex flex-col items-center gap-5">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${isDragOver
                            ? "bg-purple-500/30 scale-110"
                            : "bg-purple-500/10 group-hover:bg-purple-500/20 group-hover:scale-105"
                        }`}>
                        <Upload className={`w-7 h-7 transition-colors ${isDragOver ? "text-purple-300" : "text-purple-400 group-hover:text-purple-300"
                            }`} />
                    </div>

                    <div>
                        <h3 className="text-xl md:text-2xl font-bold font-outfit mb-2">
                            {selectedFile ? selectedFile.name : "Drop your video here"}
                        </h3>
                        <p className="text-white/40 text-sm md:text-base">
                            {selectedFile
                                ? `${formatFileSize(selectedFile.size)} • Click to change`
                                : <>
                                    <span className="hidden md:inline">or click to browse • </span>
                                    <span className="md:hidden">Tap to select • </span>
                                    MP4, MOV, MKV up to 500MB
                                </>
                            }
                        </p>
                    </div>

                    <input
                        type="file"
                        accept="video/*"
                        onChange={handleChange}
                        className="hidden"
                        style={{ display: "none" }}
                        id="file-upload"
                    />
                </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <span className="text-white/30 text-xs uppercase tracking-widest flex items-center gap-2">
                    <Sparkles size={12} className="text-purple-400" />
                    or paste URL
                </span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent via-white/10 to-transparent" />
            </div>

            {/* URL Input */}
            <form onSubmit={handleUrlSubmit} className="glass-card p-3 flex flex-col sm:flex-row items-stretch gap-3">
                <div className="flex items-center gap-3 flex-1 px-3">
                    <LinkIcon className="text-purple-400/50 flex-shrink-0" size={20} />
                    <input
                        type="text"
                        placeholder="https://x.com/username/status/..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="bg-transparent border-none outline-none flex-1 text-white placeholder:text-white/25 text-base py-2"
                        disabled={isUrlLoading}
                    />
                </div>
                <button
                    type="submit"
                    className="btn-primary py-3 px-8 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!url.trim() || isUrlLoading}
                >
                    {isUrlLoading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>Fetching...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles size={16} />
                            <span>Go</span>
                        </>
                    )}
                </button>
            </form>

            {/* Trusted by badge */}
            <p className="text-center text-white/20 text-xs">
                Trusted by 500+ creators worldwide
            </p>
        </div>
    );
}
