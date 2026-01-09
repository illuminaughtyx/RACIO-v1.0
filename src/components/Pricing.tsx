"use client";
import React, { useEffect, useState } from "react";
import { Check, Zap, Star, Crown, Sparkles } from "lucide-react";

const PAYMENT_LINKS = {
    PRO_MONTHLY: "https://racioapp.lemonsqueezy.com/checkout/buy/1b322848-8f95-455f-9570-7deb748c4358",
    LIFETIME: "https://racioapp.lemonsqueezy.com/checkout/buy/8832208c-763f-4448-8f76-edc23be51534",
};

export default function Pricing() {
    const [isPro, setIsPro] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setIsPro(localStorage.getItem("racio_pro") === "true");
        }
    }, []);

    return (
        <div className="w-full max-w-5xl mx-auto px-6 py-20">
            <div className="text-center mb-14 animate-fade-in-up">
                {isPro && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 mb-5">
                        <Crown size={14} className="text-yellow-400" />
                        <span className="text-yellow-400 font-medium text-sm">Pro Member</span>
                    </div>
                )}

                <h2 className="text-3xl md:text-4xl font-bold font-outfit mb-4">
                    Simple <span className="text-gradient">Pricing</span>
                </h2>
                <p className="text-[var(--text-muted)] max-w-md mx-auto">
                    Start free. Upgrade when you need more.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Starter */}
                <div className="glass-card p-6 flex flex-col animate-fade-in-up delay-100">
                    <div className="w-10 h-10 bg-[var(--bg-card)] rounded-xl flex items-center justify-center mb-5">
                        <Zap size={20} className="text-[var(--text-muted)]" />
                    </div>

                    <h3 className="text-xl font-bold font-outfit mb-1">Starter</h3>
                    <div className="flex items-baseline gap-1 mb-5">
                        <span className="text-3xl font-bold">$0</span>
                        <span className="text-[var(--text-muted)] text-sm">/forever</span>
                    </div>

                    <ul className="flex-1 space-y-3 mb-6 text-sm">
                        {["3 videos/day", "Standard speed", "50MB max"].map((f) => (
                            <li key={f} className="flex items-center gap-2 text-[var(--text-secondary)]">
                                <Check size={14} className="text-[var(--text-muted)]" />
                                {f}
                            </li>
                        ))}
                    </ul>

                    <button className="w-full btn-secondary text-sm py-3 opacity-60" disabled>Current Plan</button>
                </div>

                {/* Pro */}
                <div className={`glass-card p-6 flex flex-col relative border-[var(--accent)]/40 animate-fade-in-up delay-200 ${isPro ? "opacity-60" : ""}`}>
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full text-[10px] font-bold text-white uppercase">
                        Popular
                    </div>

                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500/20 to-purple-500/10 rounded-xl flex items-center justify-center mb-5">
                        <Star size={20} className="text-[var(--accent)]" />
                    </div>

                    <h3 className="text-xl font-bold font-outfit mb-1">Pro</h3>
                    <div className="flex items-baseline gap-1 mb-5">
                        <span className="text-3xl font-bold">$7</span>
                        <span className="text-[var(--text-muted)] text-sm">/mo</span>
                    </div>

                    <ul className="flex-1 space-y-3 mb-6 text-sm">
                        {["Unlimited videos", "5x faster", "2GB max", "X/Twitter downloader"].map((f) => (
                            <li key={f} className="flex items-center gap-2">
                                <Check size={14} className="text-green-400" />
                                {f}
                            </li>
                        ))}
                    </ul>

                    {isPro ? (
                        <button className="w-full btn-secondary text-sm py-3 border-green-500/30 text-green-400" disabled>Active</button>
                    ) : (
                        <a href={PAYMENT_LINKS.PRO_MONTHLY} target="_blank" rel="noreferrer" className="w-full btn-primary text-sm py-3 text-center flex items-center justify-center gap-2">
                            <Sparkles size={14} />
                            Get Pro
                        </a>
                    )}
                </div>

                {/* Lifetime */}
                <div className={`glass-card p-6 flex flex-col animate-fade-in-up delay-300 relative ${isPro ? "opacity-60" : ""}`}>
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-[10px] font-bold text-white uppercase">
                        🔥 First 50 Only
                    </div>

                    <div className="w-10 h-10 bg-gradient-to-br from-fuchsia-500/20 to-pink-500/10 rounded-xl flex items-center justify-center mb-5 mt-2">
                        <Crown size={20} className="text-fuchsia-400" />
                    </div>

                    <h3 className="text-xl font-bold font-outfit mb-1">Lifetime</h3>
                    <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-3xl font-bold">$79</span>
                        <span className="text-[var(--text-muted)] text-sm">/once</span>
                    </div>
                    <p className="text-xs text-amber-400/80 mb-4">Early bird price • Then $149</p>

                    <ul className="flex-1 space-y-3 mb-6 text-sm">
                        {["Everything in Pro", "Forever access", "Future updates"].map((f) => (
                            <li key={f} className="flex items-center gap-2 text-[var(--text-secondary)]">
                                <Check size={14} className="text-fuchsia-400" />
                                {f}
                            </li>
                        ))}
                    </ul>

                    {isPro ? (
                        <button className="w-full btn-secondary text-sm py-3" disabled>Active</button>
                    ) : (
                        <a href={PAYMENT_LINKS.LIFETIME} target="_blank" rel="noreferrer" className="w-full btn-secondary text-sm py-3 hover:border-fuchsia-500/40 transition-colors text-center">
                            Buy Lifetime
                        </a>
                    )}
                </div>
            </div>

            <p className="text-center text-[var(--text-subtle)] text-xs mt-12">
                30-day money-back guarantee
            </p>
        </div>
    );
}
