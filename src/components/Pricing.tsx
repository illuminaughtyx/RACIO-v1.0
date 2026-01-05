"use client";
import React, { useEffect, useState } from "react";
import { Check, Zap, Star, Shield } from "lucide-react";

// --------------------------------------------------------
// 1. REPLACE THESE WITH YOUR STRIPE PAYMENT LINKS
// --------------------------------------------------------
const STRIPE_LINKS = {
    // e.g. "https://buy.stripe.com/test_..."
    PRO_MONTHLY: "https://buy.stripe.com/PLACEHOLDER_PRO",
    LIFETIME: "https://buy.stripe.com/PLACEHOLDER_LIFETIME",
};

export default function Pricing() {
    const [isPro, setIsPro] = useState(false);

    useEffect(() => {
        // Check if user is already Pro
        if (typeof window !== "undefined") {
            setIsPro(localStorage.getItem("racio_pro") === "true");
        }
    }, []);

    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-16 md:py-24">
            <div className="text-center mb-16 animate-fade-in-up">
                {isPro ? (
                    <div className="inline-block px-4 py-2 rounded-full bg-[#fbbf24]/10 border border-[#fbbf24]/30 text-[#fbbf24] mb-6 animate-pulse-glow">
                        👑 You are a Pro Member
                    </div>
                ) : null}
                <h2 className="text-4xl md:text-5xl font-bold font-outfit mb-6">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70">
                        Simple, Transparent Pricing
                    </span>
                </h2>
                <p className="text-white/40 text-xl max-w-2xl mx-auto">
                    Start for free, upgrade for power. join 100+ creators saving hours every week.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Free Plan */}
                <div className="glass-panel p-8 flex flex-col items-start animate-fade-in-up delay-100 hover:border-white/20">
                    <div className="bg-white/5 rounded-xl p-3 mb-6">
                        <Zap size={24} className="text-white/80" />
                    </div>
                    <h3 className="text-2xl font-bold font-outfit mb-2">Starter</h3>
                    <div className="mb-6">
                        <span className="text-4xl font-bold">$0</span>
                        <span className="text-white/40 ml-2">/mo</span>
                    </div>
                    <p className="text-white/40 mb-8 border-b border-white/5 pb-8 w-full">
                        Perfect for trying out the engine.
                    </p>
                    <ul className="flex-1 space-y-4 mb-8 w-full">
                        {[
                            "3 videos per day",
                            "Standard processing speed",
                            "Max 50MB file size",
                            "Web access only",
                        ].map((feature) => (
                            <li key={feature} className="flex items-center gap-3 text-white/70 text-sm">
                                <Check size={16} className="text-white/30" />
                                {feature}
                            </li>
                        ))}
                    </ul>
                    <button className="w-full btn-secondary" disabled>Current Plan</button>
                </div>

                {/* Pro Plan (Best Value) */}
                <div className={`glass-panel p-8 flex flex-col items-start border-[#a855f7]/50 relative overflow-hidden group animate-fade-in-up delay-200 bg-[#a855f7]/5 ${isPro ? "opacity-50 grayscale" : ""}`}>
                    <div className="absolute top-0 right-0 bg-gradient-to-bl from-[#a855f7] to-[#ec4899] text-white text-xs font-bold px-4 py-1 rounded-bl-xl">
                        MOST POPULAR
                    </div>
                    <div className="bg-gradient-to-br from-[#6366f1] to-[#a855f7] rounded-xl p-3 mb-6 shadow-lg shadow-[#a855f7]/20">
                        <Star size={24} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-bold font-outfit mb-2">Pro Creator</h3>
                    <div className="mb-6 flex items-end">
                        <span className="text-4xl font-bold">$9</span>
                        <span className="text-white/40 ml-2 mb-1">/mo</span>
                    </div>
                    <p className="text-white/40 mb-8 border-b border-white/5 pb-8 w-full">
                        For serious creators who need speed.
                    </p>
                    <ul className="flex-1 space-y-4 mb-8 w-full">
                        {[
                            "Unlimited videos",
                            "Priority processing (5x faster)",
                            "Max 2GB file size",
                            "No watermarks",
                            "X/Twitter Downloader",
                            "Bulk processing (Coming soon)",
                        ].map((feature) => (
                            <li key={feature} className="flex items-center gap-3 text-white">
                                <Check size={16} className="text-[#4ade80]" />
                                {feature}
                            </li>
                        ))}
                    </ul>
                    {isPro ? (
                        <button className="w-full btn-secondary border-[#4ade80]/50 text-[#4ade80]" disabled>Active</button>
                    ) : (
                        <a
                            href={STRIPE_LINKS.PRO_MONTHLY}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full btn-primary text-center group-hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]"
                        >
                            Get Pro Access
                        </a>
                    )}
                </div>

                {/* Lifetime Plan */}
                <div className={`glass-panel p-8 flex flex-col items-start animate-fade-in-up delay-300 hover:border-white/20 ${isPro ? "opacity-50 grayscale" : ""}`}>
                    <div className="bg-gradient-to-br from-[#ec4899] to-[#ef4444] rounded-xl p-3 mb-6 shadow-lg shadow-[#ec4899]/20">
                        <Shield size={24} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-bold font-outfit mb-2">Lifetime</h3>
                    <div className="mb-6 flex items-end">
                        <span className="text-4xl font-bold">$49</span>
                        <span className="text-white/40 ml-2 mb-1">/one-time</span>
                    </div>
                    <p className="text-white/40 mb-8 border-b border-white/5 pb-8 w-full">
                        Pay once, own it forever. Limited spots.
                    </p>
                    <ul className="flex-1 space-y-4 mb-8 w-full">
                        {[
                            "All Pro features included",
                            "Lifetime access",
                            "Future updates included",
                            "Priority support",
                            "Founder's community access",
                        ].map((feature) => (
                            <li key={feature} className="flex items-center gap-3 text-white/90 text-sm">
                                <Check size={16} className="text-[#ec4899]" />
                                {feature}
                            </li>
                        ))}
                    </ul>
                    {isPro ? (
                        <button className="w-full btn-secondary" disabled>Active</button>
                    ) : (
                        <a
                            href={STRIPE_LINKS.LIFETIME}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full btn-secondary hover:bg-[#ec4899]/10 hover:border-[#ec4899]/30 hover:text-[#ec4899] transition-colors flex items-center justify-center"
                        >
                            Buy Lifetime Deal
                        </a>
                    )}
                </div>
            </div>

            <div className="mt-20 text-center">
                <p className="text-white/30 text-sm">
                    Secured by Stripe. 30-day money-back guarantee.
                </p>
            </div>
        </div>
    );
}
