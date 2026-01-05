"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, Crown, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function SuccessPage() {
    const [dots, setDots] = useState("");

    useEffect(() => {
        // 1. Activate Pro Mode in Local Storage
        localStorage.setItem("racio_pro", "true");

        // 2. Clear any usage limits
        localStorage.removeItem("racio_usage");

        // Animation
        const interval = setInterval(() => {
            setDots(d => d.length < 3 ? d + "." : "");
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
            {/* Confetti / Background effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#4ade80] opacity-20 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#a855f7] opacity-20 blur-[120px] rounded-full"></div>
            </div>

            <div className="glass-panel p-12 max-w-lg w-full relative z-10 animate-fade-in-up">
                <div className="w-20 h-20 bg-gradient-to-br from-[#4ade80] to-[#22c55e] rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-green-500/30">
                    <CheckCircle2 size={40} className="text-white" />
                </div>

                <h1 className="text-4xl md:text-5xl font-bold font-outfit mb-4">
                    Payment Successful!
                </h1>
                <p className="text-xl text-white/50 mb-8">
                    Activating your Pro license{dots}
                </p>

                <div className="bg-white/5 rounded-xl p-6 mb-8 border border-white/10 text-left">
                    <div className="flex items-center gap-3 mb-2">
                        <Crown size={20} className="text-[#fbbf24]" />
                        <span className="font-bold text-lg">Pro Features Unlocked</span>
                    </div>
                    <ul className="space-y-2 text-white/60 text-sm ml-8 list-disc">
                        <li>Unlimited daily conversions</li>
                        <li>Priority processing speed</li>
                        <li>X (Twitter) URL downloading</li>
                        <li>Zero watermarks</li>
                    </ul>
                </div>

                <Link
                    href="/"
                    className="btn-primary w-full flex items-center justify-center gap-2 group"
                >
                    Start Creating <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </main>
    );
}
