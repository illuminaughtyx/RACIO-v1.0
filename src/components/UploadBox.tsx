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
        <div className="w-full space-y-5">
            {/* Upload Card */}
            <div
                className={`glass-card p-8 md:p-10 text-center cursor-pointer transition-all duration-300 group border-dashed border-2
          ${isDragOver
                        ? "border-[var(--accent)] bg-[var(--accent)]/10"
                        : "border-[var(--border-color)] hover:border-[var(--border-color-hover)]"
                    }
        `}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-upload")?.click()}
            >
                <div className="flex flex-col items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${isDragOver
                        ? "bg-[var(--accent)]/20 scale-110"
                        : "bg-[var(--bg-card)] group-hover:bg-[var(--bg-card-hover)] group-hover:scale-105"
                        }`}>
                        <Upload className={`w-6 h-6 transition-colors ${isDragOver ? "text-[var(--accent)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"
                            }`} />
                    </div>

                    <div>
                        <h3 className="text-lg md:text-xl font-semibold font-outfit mb-1">
                            {selectedFile ? selectedFile.name : "Drop your video here"}
                        </h3>
                        <p className="text-[var(--text-muted)] text-sm">
                            {selectedFile
                                ? `${formatFileSize(selectedFile.size)} • Click to change`
                                : <>
                                    <span className="hidden md:inline">or click to browse • </span>
                                    <span className="md:hidden">Tap to select • </span>
                                    MP4, MOV up to 500MB
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
                <div className="flex-1 h-px bg-[var(--border-color)]" />
                <span className="text-[var(--text-subtle)] text-xs uppercase tracking-widest flex items-center gap-2">
                    <Sparkles size={10} className="text-[var(--accent)]" />
                    or paste URL
                </span>
                <div className="flex-1 h-px bg-[var(--border-color)]" />
            </div>

            {/* URL Input */}
            <form onSubmit={handleUrlSubmit} className="glass-card p-2 flex flex-col sm:flex-row items-stretch gap-2">
                <div className="flex items-center gap-3 flex-1 px-3">
                    <LinkIcon className="text-[var(--text-muted)] flex-shrink-0" size={18} />
                    <input
                        type="text"
                        placeholder="https://x.com/username/status/..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="bg-transparent border-none outline-none flex-1 text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] text-sm py-2"
                        disabled={isUrlLoading}
                    />
                </div>
                <button
                    type="submit"
                    className="btn-primary py-3 px-6 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    disabled={!url.trim() || isUrlLoading}
                >
                    {isUrlLoading ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Fetching...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles size={14} />
                            <span>Go</span>
                        </>
                    )}
                </button>
            </form>



        </div>
    );
}
