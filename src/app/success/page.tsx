"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import { Suspense } from "react";

function SuccessContent() {
    const searchParams = useSearchParams();
    const isDemo = searchParams.get("demo") === "true";
    const plan = searchParams.get("plan") || "pro";

    return (
        <main className="min-h-screen min-h-[100dvh] px-4 py-6 md:p-12 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#4ade80] opacity-[0.15] blur-[150px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#a855f7] opacity-[0.1] blur-[150px] rounded-full"></div>
            </div>

            <div className="text-center z-10 animate-fade-in-up max-w-xl">
                {/* Success Icon */}
                <div className="relative inline-block mb-8">
                    <div className="absolute inset-0 bg-[#4ade80] blur-3xl opacity-30 rounded-full scale-150"></div>
                    <div className="relative w-24 h-24 bg-gradient-to-br from-[#4ade80] to-[#22c55e] rounded-full flex items-center justify-center shadow-2xl shadow-[#4ade80]/30">
                        <CheckCircle2 size={48} className="text-white" />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-4xl md:text-5xl font-bold font-outfit mb-4">
                    Welcome to RACIO Pro! 🎉
                </h1>

                <p className="text-white/50 text-lg md:text-xl mb-8">
                    Your account has been upgraded. Enjoy unlimited conversions with no watermarks!
                </p>

                {/* Features unlocked */}
                <div className="glass-panel p-6 mb-8 text-left">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Sparkles size={18} className="text-[#fbbf24]" />
                        You now have access to:
                    </h3>
                    <ul className="space-y-3 text-white/70">
                        <li className="flex items-center gap-3">
                            <CheckCircle2 size={16} className="text-green-400" />
                            Unlimited video conversions
                        </li>
                        <li className="flex items-center gap-3">
                            <CheckCircle2 size={16} className="text-green-400" />
                            No watermarks on outputs
                        </li>
                        <li className="flex items-center gap-3">
                            <CheckCircle2 size={16} className="text-green-400" />
                            Priority processing (2x faster)
                        </li>
                        <li className="flex items-center gap-3">
                            <CheckCircle2 size={16} className="text-green-400" />
                            Early access to new features
                        </li>
                    </ul>
                </div>

                {isDemo && (
                    <div className="glass-panel bg-yellow-500/10 border-yellow-500/20 p-4 mb-8 text-sm text-yellow-300/80">
                        ⚠️ Demo mode: Stripe is not configured. Set STRIPE_SECRET_KEY to enable real payments.
                    </div>
                )}

                {/* CTA */}
                <Link
                    href="/"
                    className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-lg"
                >
                    Start Converting
                    <ArrowRight size={20} />
                </Link>

                <p className="mt-6 text-white/30 text-sm">
                    A confirmation email has been sent to your inbox.
                </p>
            </div>
        </main>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full"></div>
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
