"use client";
import { Check, Zap, Crown, ArrowRight, Sparkles } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

const plans = [
    {
        name: "Free",
        price: "$0",
        period: "forever",
        description: "Perfect for trying out RACIO",
        features: [
            "3 conversions per day",
            "All 3 format outputs",
            "Standard processing speed",
            "X/Twitter URL support",
        ],
        limitations: [
            "Small watermark on outputs",
        ],
        cta: "Start Free",
        href: "/",
        popular: false,
        icon: Zap,
    },
    {
        name: "Pro",
        price: "$7",
        period: "/month",
        yearlyPrice: "$49/year",
        description: "For content creators who post everywhere",
        features: [
            "Unlimited conversions",
            "All 3 format outputs",
            "Priority processing (2x faster)",
            "X/Twitter URL support",
            "No watermarks",
            "Early access to new features",
            "Email support",
        ],
        limitations: [],
        cta: "Upgrade to Pro",
        href: "https://racioapp.lemonsqueezy.com/checkout/buy/1b322848-8f95-455f-9570-7deb748c4358",
        popular: true,
        icon: Crown,
    },
];

export default function PricingPage() {
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

    return (
        <main className="min-h-screen min-h-[100dvh] px-4 py-6 md:p-12 flex flex-col items-center relative overflow-hidden">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] md:w-[700px] md:h-[700px] bg-[#6366f1] opacity-[0.12] blur-[100px] md:blur-[150px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-[#ec4899] opacity-[0.08] blur-[100px] md:blur-[150px] rounded-full"></div>
            </div>

            {/* Header */}
            <header className="w-full max-w-7xl flex justify-between items-center mb-8 md:mb-16 z-10">
                <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                    <div className="w-9 h-9 md:w-11 md:h-11 bg-gradient-to-br from-[#6366f1] via-[#a855f7] to-[#ec4899] rounded-xl flex items-center justify-center font-black text-lg md:text-xl shadow-lg shadow-[#a855f7]/20">
                        R
                    </div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight font-outfit">RACIO</h1>
                </Link>
                <Link href="/" className="text-white/50 hover:text-white text-sm transition-colors">
                    ← Back to app
                </Link>
            </header>

            {/* Pricing Header */}
            <div className="text-center mb-12 md:mb-16 z-10 animate-fade-in-up max-w-3xl">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-xs md:text-sm font-medium text-white/80 mb-6">
                    <Sparkles size={14} className="text-[#a855f7]" />
                    Simple pricing
                </div>
                <h1 className="text-4xl md:text-6xl font-bold font-outfit mb-4">
                    Start free, upgrade when ready
                </h1>
                <p className="text-white/45 text-lg md:text-xl">
                    No credit card required. Cancel anytime.
                </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center gap-3 mb-10 z-10">
                <button
                    onClick={() => setBillingCycle("monthly")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${billingCycle === "monthly"
                        ? "bg-white/10 text-white"
                        : "text-white/40 hover:text-white/60"
                        }`}
                >
                    Monthly
                </button>
                <button
                    onClick={() => setBillingCycle("yearly")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${billingCycle === "yearly"
                        ? "bg-white/10 text-white"
                        : "text-white/40 hover:text-white/60"
                        }`}
                >
                    Yearly
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                        Save 42%
                    </span>
                </button>
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl w-full z-10">
                {plans.map((plan, index) => {
                    const Icon = plan.icon;
                    const displayPrice = billingCycle === "yearly" && plan.yearlyPrice
                        ? "$49"
                        : plan.price;
                    const displayPeriod = billingCycle === "yearly" && plan.yearlyPrice
                        ? "/year"
                        : plan.period;
                    const checkoutUrl = billingCycle === "yearly" && plan.name === "Pro"
                        ? "https://racioapp.lemonsqueezy.com/checkout/buy/ba4dc072-1dfb-4ce4-b238-36a3f3914d09"
                        : plan.href;

                    return (
                        <div
                            key={plan.name}
                            className={`glass-panel p-8 relative animate-fade-in-up ${plan.popular
                                ? "border-[#a855f7]/30 shadow-lg shadow-[#a855f7]/10"
                                : ""
                                }`}
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="bg-gradient-to-r from-[#6366f1] via-[#a855f7] to-[#ec4899] text-white text-xs font-bold px-4 py-1 rounded-full">
                                        MOST POPULAR
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded-lg ${plan.popular ? "bg-[#a855f7]/20" : "bg-white/5"}`}>
                                    <Icon size={20} className={plan.popular ? "text-[#a855f7]" : "text-white/60"} />
                                </div>
                                <h3 className="text-2xl font-bold font-outfit">{plan.name}</h3>
                            </div>

                            <div className="mb-4">
                                <span className="text-5xl font-bold font-outfit">{displayPrice}</span>
                                <span className="text-white/40 ml-1">{displayPeriod}</span>
                            </div>

                            <p className="text-white/50 mb-6">{plan.description}</p>

                            <a
                                href={checkoutUrl}
                                className={`w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all mb-8 ${plan.popular
                                    ? "btn-primary"
                                    : "bg-white/5 hover:bg-white/10 border border-white/10"
                                    }`}
                            >
                                {plan.cta}
                                <ArrowRight size={16} />
                            </a>

                            <div className="space-y-3">
                                {plan.features.map((feature) => (
                                    <div key={feature} className="flex items-center gap-3 text-sm">
                                        <Check size={16} className="text-green-400 flex-shrink-0" />
                                        <span className="text-white/80">{feature}</span>
                                    </div>
                                ))}
                                {plan.limitations.map((limitation) => (
                                    <div key={limitation} className="flex items-center gap-3 text-sm">
                                        <span className="w-4 h-4 flex items-center justify-center text-white/30 flex-shrink-0">—</span>
                                        <span className="text-white/40">{limitation}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* FAQ or trust badges */}
            <div className="mt-16 text-center z-10">
                <p className="text-white/30 text-sm">
                    🔒 Secure payments via Stripe • Cancel anytime • No hidden fees
                </p>
            </div>

            {/* Footer */}
            <footer className="mt-auto pt-16 text-white/15 text-sm pb-4 z-10">
                <p>RACIO — The Ratio Engine</p>
            </footer>
        </main>
    );
}
