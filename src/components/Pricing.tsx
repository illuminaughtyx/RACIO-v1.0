"use client";
import React, { useEffect, useState } from "react";
import { Check, Zap, Star, Crown, Sparkles } from "lucide-react";

const STRIPE_LINKS = {
    PRO_MONTHLY: "https://buy.stripe.com/PLACEHOLDER_PRO",
    LIFETIME: "https://buy.stripe.com/PLACEHOLDER_LIFETIME",
};

export default function Pricing() {
    const [isPro, setIsPro] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setIsPro(localStorage.getItem("racio_pro") === "true");
        }
    }, []);

    return (
        <div className="w-full max-w-6xl mx-auto px-6 py-24">
            <div className="text-center mb-16 animate-fade-in-up">
                {isPro && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 mb-6">
                        <Crown size={16} className="text-yellow-400" />
                        <span className="text-yellow-400 font-medium text-sm">You're a Pro Member</span>
                    </div>
                )}

                <h2 className="text-4xl md:text-5xl font-bold font-outfit mb-5">
                    Simple, <span className="text-gradient">Transparent</span> Pricing
                </h2>
                <p className="text-white/40 text-lg max-w-xl mx-auto">
                    Start for free. Upgrade when you need more power.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Starter */}
                <div className="glass-card p-8 flex flex-col animate-fade-in-up delay-100">
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-6">
                        <Zap size={24} className="text-white/60" />
                    </div>

                    <h3 className="text-2xl font-bold font-outfit mb-2">Starter</h3>
                    <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-4xl font-bold">$0</span>
                        <span className="text-white/40">/forever</span>
                    </div>

                    <p className="text-white/40 text-sm mb-8 pb-6 border-b border-white/5">
                        Perfect for trying out RACIO.
                    </p>

                    <ul className="flex-1 space-y-4 mb-8">
                        {["3 videos per day", "Standard speed", "Max 50MB files", "Web access"].map((f) => (
                            <li key={f} className="flex items-center gap-3 text-white/60 text-sm">
                                <Check size={16} className="text-white/30" />
                                {f}
                            </li>
                        ))}
                    </ul>

                    <button className="w-full btn-secondary opacity-50 cursor-default" disabled>
                        Current Plan
                    </button>
                </div>

                {/* Pro - Featured */}
                <div className={`glass-card p-8 flex flex-col relative border-purple-500/40 bg-purple-500/5 animate-fade-in-up delay-200 ${isPro ? "opacity-60" : ""}`}>
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full text-xs font-bold">
                        MOST POPULAR
                    </div>

                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500/30 to-purple-500/20 rounded-xl flex items-center justify-center mb-6">
                        <Star size={24} className="text-purple-300" />
                    </div>

                    <h3 className="text-2xl font-bold font-outfit mb-2">Pro Creator</h3>
                    <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-4xl font-bold">$9</span>
                        <span className="text-white/40">/month</span>
                    </div>

                    <p className="text-white/40 text-sm mb-8 pb-6 border-b border-white/5">
                        For creators who need speed and power.
                    </p>

                    <ul className="flex-1 space-y-4 mb-8">
                        {[
                            "Unlimited videos",
                            "5x faster processing",
                            "Max 2GB files",
                            "No watermarks",
                            "X/Twitter downloader",
                            "Priority support"
                        ].map((f) => (
                            <li key={f} className="flex items-center gap-3 text-white text-sm">
                                <Check size={16} className="text-green-400" />
                                {f}
                            </li>
                        ))}
                    </ul>

                    {isPro ? (
                        <button className="w-full btn-secondary border-green-500/30 text-green-400" disabled>
                            ✓ Active
                        </button>
                    ) : (
                        <a href={STRIPE_LINKS.PRO_MONTHLY} target="_blank" rel="noreferrer" className="w-full btn-primary text-center flex items-center justify-center gap-2">
                            <Sparkles size={16} />
                            Get Pro Access
                        </a>
                    )}
                </div>

                {/* Lifetime */}
                <div className={`glass-card p-8 flex flex-col animate-fade-in-up delay-300 ${isPro ? "opacity-60" : ""}`}>
                    <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-500/30 to-pink-500/20 rounded-xl flex items-center justify-center mb-6">
                        <Crown size={24} className="text-fuchsia-300" />
                    </div>

                    <h3 className="text-2xl font-bold font-outfit mb-2">Lifetime</h3>
                    <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-4xl font-bold">$49</span>
                        <span className="text-white/40">/one-time</span>
                    </div>

                    <p className="text-white/40 text-sm mb-8 pb-6 border-b border-white/5">
                        Pay once, own forever. Limited spots.
                    </p>

                    <ul className="flex-1 space-y-4 mb-8">
                        {[
                            "Everything in Pro",
                            "Lifetime access",
                            "All future updates",
                            "Founder's badge",
                            "Priority support"
                        ].map((f) => (
                            <li key={f} className="flex items-center gap-3 text-white/80 text-sm">
                                <Check size={16} className="text-fuchsia-400" />
                                {f}
                            </li>
                        ))}
                    </ul>

                    {isPro ? (
                        <button className="w-full btn-secondary" disabled>Active</button>
                    ) : (
                        <a href={STRIPE_LINKS.LIFETIME} target="_blank" rel="noreferrer" className="w-full btn-secondary hover:bg-fuchsia-500/10 hover:border-fuchsia-500/40 transition-colors text-center">
                            Buy Lifetime Deal
                        </a>
                    )}
                </div>
            </div>

            <p className="text-center text-white/20 text-sm mt-16">
                Secured by Stripe • 30-day money-back guarantee
            </p>
        </div>
    );
}
