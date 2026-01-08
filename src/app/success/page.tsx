"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, Crown, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function SuccessPage() {
    const [activated, setActivated] = useState(false);

    useEffect(() => {
        // 1. Activate Pro Mode in Local Storage
        localStorage.setItem("racio_pro", "true");

        // 2. Clear any usage limits
        localStorage.removeItem("racio_usage");

        // Show activated after a brief delay
        setTimeout(() => setActivated(true), 1500);
    }, []);

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

            <div style={{ ...card, padding: 48, maxWidth: 480, width: "100%", textAlign: "center", position: "relative", zIndex: 10 }}>
                {/* Success Icon */}
                <div style={{
                    width: 80,
                    height: 80,
                    background: "linear-gradient(135deg, #4ade80, #22c55e)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 24px",
                    boxShadow: "0 20px 40px -10px rgba(74, 222, 128, 0.4)"
                }}>
                    <CheckCircle2 size={40} color="#fff" />
                </div>

                <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 8, letterSpacing: -1 }}>
                    Payment Successful!
                </h1>
                <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 32, fontSize: 18 }}>
                    {activated ? "Your Pro license is now active! ✨" : "Activating your Pro license..."}
                </p>

                {/* Features Card */}
                <div style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 16,
                    padding: 24,
                    marginBottom: 32,
                    textAlign: "left"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                        <Crown size={20} color="#fbbf24" />
                        <span style={{ fontWeight: 700, fontSize: 16 }}>Pro Features Unlocked</span>
                    </div>
                    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                        {[
                            "✓ Unlimited daily conversions",
                            "✓ Priority processing speed",
                            "✓ X (Twitter) URL downloading",
                            "✓ Zero watermarks"
                        ].map(feature => (
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

                {/* CTA Button */}
                <Link href="/" style={btn}>
                    <Sparkles size={18} />
                    Start Creating
                    <ArrowRight size={18} />
                </Link>

                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 24 }}>
                    A receipt has been sent to your email
                </p>
            </div>
        </main>
    );
}
