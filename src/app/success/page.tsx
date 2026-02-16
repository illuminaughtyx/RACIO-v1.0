"use client";
import { useEffect, useState, Suspense } from "react";
import { CheckCircle2, Crown, ArrowRight, Sparkles, Star, Loader2, Copy, Check } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function SuccessContent() {
    const searchParams = useSearchParams();
    const plan = searchParams.get("plan") || "pro"; // "pro" or "lifetime"
    const license = searchParams.get("license") || null;
    const isLifetime = plan === "lifetime";

    const [activated, setActivated] = useState(false);
    const [copied, setCopied] = useState(false);

    const copyLicenseKey = async () => {
        if (!license) return;
        await navigator.clipboard.writeText(license);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    useEffect(() => {
        // Activate Pro Mode in Local Storage (both Pro and Lifetime get this)
        localStorage.setItem("racio_pro", "true");

        // Store the license key
        if (license) {
            localStorage.setItem("racio_license_key", license);
        }

        // For Lifetime, also set a lifetime flag
        if (isLifetime) {
            localStorage.setItem("racio_lifetime", "true");
        }

        // Clear any usage limits
        localStorage.removeItem("racio_usage");
        localStorage.removeItem("racio_url_usage");

        // Show activated after a brief delay
        setTimeout(() => setActivated(true), 1500);
    }, [isLifetime, license]);

    const card = {
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 24,
    };

    const btn = {
        background: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #d946ef 100%)",
        color: "#fff",
        border: "none",
        borderRadius: 14,
        padding: "16px 32px",
        fontWeight: 600,
        fontSize: 16,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        textDecoration: "none",
        width: "100%",
    };

    const proFeatures = [
        "✓ Unlimited daily conversions",
        "✓ 2K image quality",
        "✓ 1080p HD video quality",
        "✓ X (Twitter) URL downloading",
        "✓ Zero watermarks"
    ];

    const lifetimeFeatures = [
        "✓ Everything in Pro, forever",
        "✓ 4K image quality",
        "✓ 1080p HD video quality",
        "✓ Unlimited daily conversions",
        "✓ All future updates included"
    ];

    const features = isLifetime ? lifetimeFeatures : proFeatures;
    const title = isLifetime ? "Lifetime Access Unlocked" : "Pro Features Unlocked";
    const IconComponent = isLifetime ? Crown : Star;
    const iconColor = isLifetime ? "#fbbf24" : "#a855f7";

    return (
        <div style={{ ...card, padding: 48, maxWidth: 480, width: "100%", textAlign: "center", position: "relative", zIndex: 10 }}>
            {/* Success Icon */}
            <div style={{
                width: 80,
                height: 80,
                background: isLifetime
                    ? "linear-gradient(135deg, #fbbf24, #f59e0b)"
                    : "linear-gradient(135deg, #4ade80, #22c55e)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
                boxShadow: isLifetime
                    ? "0 20px 40px -10px rgba(251, 191, 36, 0.4)"
                    : "0 20px 40px -10px rgba(74, 222, 128, 0.4)"
            }}>
                <CheckCircle2 size={40} color="#fff" />
            </div>

            <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 8, letterSpacing: -1 }}>
                Payment Successful!
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 32, fontSize: 18 }}>
                {activated
                    ? (isLifetime ? "Lifetime access is now active! 🎉" : "Your Pro license is now active! ✨")
                    : (isLifetime ? "Activating lifetime access..." : "Activating your Pro license...")
                }
            </p>

            {/* Features Card */}
            <div style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: 24,
                marginBottom: license ? 16 : 32,
                textAlign: "left"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <IconComponent size={20} color={iconColor} />
                    <span style={{ fontWeight: 700, fontSize: 16 }}>{title}</span>
                </div>
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                    {features.map(feature => (
                        <li key={feature} style={{
                            color: "rgba(255,255,255,0.6)",
                            fontSize: 14,
                            marginBottom: 8,
                            display: "flex",
                            alignItems: "center",
                            gap: 8
                        }}>
                            {feature}
                        </li>
                    ))}
                </ul>
            </div>

            {/* License Key Info */}
            {license ? (
                <div style={{
                    background: "rgba(139, 92, 246, 0.1)",
                    border: "1px solid rgba(139, 92, 246, 0.2)",
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 32,
                    textAlign: "center"
                }}>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
                        Your License Key
                    </p>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 12,
                        background: "rgba(0,0,0,0.3)",
                        padding: "12px 16px",
                        borderRadius: 10,
                        fontFamily: "monospace"
                    }}>
                        <code style={{ fontSize: 16, fontWeight: 600, letterSpacing: 2 }}>
                            {license}
                        </code>
                        <button
                            onClick={copyLicenseKey}
                            style={{
                                background: "rgba(255,255,255,0.1)",
                                border: "none",
                                borderRadius: 6,
                                padding: 8,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.2s"
                            }}
                            title="Copy license key"
                        >
                            {copied ? (
                                <Check size={16} color="#4ade80" />
                            ) : (
                                <Copy size={16} color="rgba(255,255,255,0.6)" />
                            )}
                        </button>
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 10 }}>
                        Save this key! Use it to restore Pro access on any device.
                    </p>
                </div>
            ) : (
                <div style={{
                    background: "rgba(139, 92, 246, 0.1)",
                    border: "1px solid rgba(139, 92, 246, 0.2)",
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 32,
                    textAlign: "center"
                }}>
                    <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, marginBottom: 6 }}>
                        🔑 Your license key has been sent to your email
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
                        Use it to activate RACIO Pro on any device via &quot;Activate License&quot; in the footer.
                    </p>
                </div>
            )}

            {/* CTA Button */}
            <Link href="/" style={btn}>
                <Sparkles size={18} />
                Start Creating
                <ArrowRight size={18} />
            </Link>

            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 24 }}>
                A receipt and license key have been sent to your email
            </p>
        </div>
    );
}

function LoadingFallback() {
    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50vh" }}>
            <Loader2 size={40} color="#8b5cf6" style={{ animation: "spin 1s linear infinite" }} />
        </div>
    );
}

export default function SuccessPage() {
    return (
        <main style={{
            minHeight: "100vh",
            background: "#0a0a0f",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            position: "relative",
            overflow: "hidden"
        }}>
            {/* Background Effects */}
            <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
                <div style={{
                    position: "absolute",
                    top: "20%",
                    left: "30%",
                    width: 500,
                    height: 500,
                    background: "rgba(74, 222, 128, 0.15)",
                    borderRadius: "50%",
                    filter: "blur(120px)"
                }} />
                <div style={{
                    position: "absolute",
                    bottom: "20%",
                    right: "30%",
                    width: 400,
                    height: 400,
                    background: "rgba(139, 92, 246, 0.15)",
                    borderRadius: "50%",
                    filter: "blur(100px)"
                }} />
            </div>

            <Suspense fallback={<LoadingFallback />}>
                <SuccessContent />
            </Suspense>
        </main>
    );
}
