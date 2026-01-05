"use client";
import { useState, DragEvent, ChangeEvent, FormEvent } from "react";
import { Upload, Link as LinkIcon, Loader2 } from "lucide-react";

interface UploadBoxProps {
    onFileSelect: (file: File) => void;
    onUrlSubmit: (url: string) => void;
    isUrlLoading?: boolean;
}

export default function UploadBox({ onFileSelect, onUrlSubmit, isUrlLoading }: UploadBoxProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [url, setUrl] = useState("");

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            if (e.dataTransfer.files[0].type.startsWith("video/")) {
                onFileSelect(e.dataTransfer.files[0]);
            } else {
                alert("Please upload a video file.");
            }
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
        }
    };

    const handleUrlSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (url.trim()) {
            onUrlSubmit(url.trim());
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto animate-fade-in-up">
            {/* File Upload Box */}
            <div
                className={`glass-panel p-12 text-center transition-all duration-300 border-2 border-dashed cursor-pointer
          ${isDragOver ? "border-[#a855f7] bg-white/10 scale-[1.02]" : "border-white/10 hover:border-white/30"}
        `}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-upload")?.click()}
            >
                <div className="flex flex-col items-center justify-center gap-6">
                    <div className={`p-6 rounded-full transition-colors ${isDragOver ? "bg-[#a855f7]/20" : "bg-white/5"}`}>
                        <Upload className="w-12 h-12 text-white/80" />
                    </div>
                    <div>
                        <h3 className="text-3xl font-bold mb-2 font-outfit">Upload Video</h3>
                        <p className="text-white/50 text-lg">Drag & drop or click to browse</p>
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
                <div className="flex-1 h-px bg-white/10"></div>
                <span className="text-white/30 font-medium text-sm uppercase tracking-wider">or paste URL</span>
                <div className="flex-1 h-px bg-white/10"></div>
            </div>

            {/* URL Input */}
            <form onSubmit={handleUrlSubmit} className="glass-panel flex items-center gap-4 p-2 pl-6">
                <LinkIcon className="text-white/40 flex-shrink-0" size={20} />
                <input
                    type="text"
                    placeholder="Paste X (Twitter) video URL..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="bg-transparent border-none outline-none flex-1 text-white placeholder:text-white/30 text-lg"
                    disabled={isUrlLoading}
                />
                <button
                    type="submit"
                    className="btn-primary py-3 px-8 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!url.trim() || isUrlLoading}
                >
                    {isUrlLoading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Fetching...
                        </>
                    ) : (
                        "Go"
                    )}
                </button>
            </form>

            <p className="mt-6 text-center text-white/30 text-sm">
                Supports video uploads (MP4, MOV, MKV) and X/Twitter URLs. Max 500MB.
            </p>
        </div>
    );
}
