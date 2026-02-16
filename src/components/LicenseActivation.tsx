"use client";
import { useState } from "react";
import { Key, CheckCircle2, AlertCircle, Loader2, X, Sparkles } from "lucide-react";

interface LicenseActivationProps {
    isOpen: boolean;
    onClose: () => void;
    onActivated: (isLifetime: boolean) => void;
}

export default function LicenseActivation({ isOpen, onClose, onActivated }: LicenseActivationProps) {
    const [licenseKey, setLicenseKey] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    const handleActivate = async () => {
        if (!licenseKey.trim()) {
            setStatus("error");
            setErrorMessage("Please enter a license key");
            return;
        }

        setStatus("loading");
        setErrorMessage("");

        try {
            const response = await fetch("/api/license/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ licenseKey: licenseKey.trim() }),
            });

            const data = await response.json();

            if (data.valid) {
                // Activate Pro mode
                localStorage.setItem("racio_pro", "true");
                localStorage.setItem("racio_license_key", licenseKey.trim().toUpperCase());

                if (data.isLifetime) {
                    localStorage.setItem("racio_lifetime", "true");
                }

                // Clear usage limits
                localStorage.removeItem("racio_usage");
                localStorage.removeItem("racio_url_usage");

                setStatus("success");

                // Call callback after delay — pass isLifetime flag
                setTimeout(() => {
                    onActivated(!!data.isLifetime);
                    onClose();
                }, 2000);
            } else {
                setStatus("error");
                setErrorMessage(data.error || "Invalid license key");
            }
        } catch {
            setStatus("error");
            setErrorMessage("Failed to validate license. Please try again.");
        }
    };

    // Format license key as user types (add dashes)
    const handleKeyChange = (value: string) => {
        // Remove all non-alphanumeric characters
        const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, "");

        // Add dashes every 5 characters
        const parts = clean.match(/.{1,5}/g) || [];
        setLicenseKey(parts.join("-").substring(0, 23)); // Max: XXXXX-XXXXX-XXXXX-XXXXX
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0, 0, 0, 0.8)", backdropFilter: "blur(8px)" }}
        >
            <div
                className="glass-panel w-full max-w-md p-8 relative animate-fade-in-up"
                style={{ animationDuration: "0.3s" }}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                        <Key size={24} className="text-violet-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold font-outfit">Activate License</h2>
                        <p className="text-white/50 text-sm">Enter your RACIO license key</p>
                    </div>
                </div>

                {/* Input */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
                        value={licenseKey}
                        onChange={(e) => handleKeyChange(e.target.value)}
                        disabled={status === "loading" || status === "success"}
                        className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-center font-mono text-lg tracking-wider placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-colors disabled:opacity-50"
                        autoFocus
                    />
                </div>

                {/* Status Messages */}
                {status === "error" && (
                    <div className="flex items-center gap-2 text-red-400 text-sm mb-4 p-3 bg-red-500/10 rounded-lg">
                        <AlertCircle size={16} />
                        {errorMessage}
                    </div>
                )}

                {status === "success" && (
                    <div className="flex items-center gap-2 text-green-400 text-sm mb-4 p-3 bg-green-500/10 rounded-lg">
                        <CheckCircle2 size={16} />
                        License activated! Unlocking Pro features...
                    </div>
                )}

                {/* Activate Button */}
                <button
                    onClick={handleActivate}
                    disabled={status === "loading" || status === "success" || !licenseKey.trim()}
                    className="w-full btn-primary py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {status === "loading" ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Validating...
                        </>
                    ) : status === "success" ? (
                        <>
                            <CheckCircle2 size={18} />
                            Activated!
                        </>
                    ) : (
                        <>
                            <Sparkles size={18} />
                            Activate License
                        </>
                    )}
                </button>

                {/* Help Text */}
                <p className="text-center text-white/30 text-xs mt-4">
                    Don&apos;t have a license?{" "}
                    <a href="/pricing" className="text-violet-400 hover:underline">
                        Get one here
                    </a>
                </p>
            </div>
        </div>
    );
}
