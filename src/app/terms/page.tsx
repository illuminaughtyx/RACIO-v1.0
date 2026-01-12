"use client";

import Link from "next/link";

export default function TermsPage() {
    return (
        <main style={{ minHeight: "100vh", background: "#0a0a0f", color: "#fff", padding: "40px 24px" }}>
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
                {/* Header */}
                <div style={{ marginBottom: 48 }}>
                    <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#9ca3af", textDecoration: "none", fontSize: 14, marginBottom: 24 }}>
                        ← Back to RACIO
                    </Link>
                    <h1 style={{ fontSize: 40, fontWeight: 700, marginBottom: 8 }}>Terms of Service</h1>
                    <p style={{ color: "#9ca3af" }}>Last updated: January 12, 2026</p>
                </div>

                {/* Content */}
                <div style={{ lineHeight: 1.8, color: "#d1d5db" }}>
                    <section style={{ marginBottom: 32 }}>
                        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16, color: "#fff" }}>1. Agreement to Terms</h2>
                        <p>
                            By accessing or using RACIO (racio.app), you agree to be bound by these Terms of Service.
                            If you disagree with any part of these terms, you may not access the service.
                        </p>
                    </section>

                    <section style={{ marginBottom: 32 }}>
                        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16, color: "#fff" }}>2. Description of Service</h2>
                        <p>
                            RACIO is a video conversion tool that allows users to convert videos into multiple aspect ratios
                            (9:16, 1:1, 16:9, and more) suitable for various social media platforms. The service includes:
                        </p>
                        <ul style={{ marginLeft: 24, marginTop: 16 }}>
                            <li style={{ marginBottom: 8 }}>Free tier with limited daily conversions and watermarked output</li>
                            <li style={{ marginBottom: 8 }}>Pro subscription with unlimited conversions and watermark-free output</li>
                            <li style={{ marginBottom: 8 }}>Lifetime access option with one-time payment</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: 32 }}>
                        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16, color: "#fff" }}>3. User Content</h2>
                        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: "#e5e7eb" }}>3.1 Your Content</h3>
                        <p style={{ marginBottom: 16 }}>
                            You retain ownership of any videos you upload to RACIO. By using our service, you grant us a
                            temporary license to process your content solely for the purpose of providing the conversion service.
                        </p>

                        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: "#e5e7eb" }}>3.2 Content Restrictions</h3>
                        <p style={{ marginBottom: 16 }}>You agree NOT to upload content that:</p>
                        <ul style={{ marginLeft: 24 }}>
                            <li style={{ marginBottom: 8 }}>Violates copyright or intellectual property rights</li>
                            <li style={{ marginBottom: 8 }}>Contains illegal, harmful, or offensive material</li>
                            <li style={{ marginBottom: 8 }}>Violates any applicable laws or regulations</li>
                            <li style={{ marginBottom: 8 }}>Contains malware or harmful code</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: 32 }}>
                        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16, color: "#fff" }}>4. Subscriptions and Payments</h2>
                        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: "#e5e7eb" }}>4.1 Pricing</h3>
                        <p style={{ marginBottom: 16 }}>
                            Pro subscriptions are billed monthly at the rate displayed at time of purchase.
                            Lifetime access is a one-time payment that grants permanent access to Pro features.
                        </p>

                        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: "#e5e7eb" }}>4.2 Refunds</h3>
                        <p>
                            We offer refunds within 7 days of purchase if you are not satisfied with the service.
                            Contact us at racioapp@gmail.com to request a refund.
                        </p>
                    </section>

                    <section style={{ marginBottom: 32 }}>
                        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16, color: "#fff" }}>5. Free Tier Limitations</h2>
                        <p>The free tier includes:</p>
                        <ul style={{ marginLeft: 24, marginTop: 8 }}>
                            <li style={{ marginBottom: 8 }}>3 video conversions per day</li>
                            <li style={{ marginBottom: 8 }}>720p output quality</li>
                            <li style={{ marginBottom: 8 }}>RACIO watermark on all output videos</li>
                            <li style={{ marginBottom: 8 }}>50MB file size limit</li>
                            <li style={{ marginBottom: 8 }}>1 URL download per day</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: 32 }}>
                        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16, color: "#fff" }}>6. Intellectual Property</h2>
                        <p>
                            The RACIO service, including its original content, features, and functionality, is owned by
                            RACIO and is protected by international copyright, trademark, and other intellectual property laws.
                        </p>
                    </section>

                    <section style={{ marginBottom: 32 }}>
                        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16, color: "#fff" }}>7. Disclaimer</h2>
                        <p>
                            The service is provided "as is" and "as available" without any warranties of any kind.
                            We do not guarantee that the service will be uninterrupted, secure, or error-free.
                        </p>
                    </section>

                    <section style={{ marginBottom: 32 }}>
                        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16, color: "#fff" }}>8. Limitation of Liability</h2>
                        <p>
                            To the maximum extent permitted by law, RACIO shall not be liable for any indirect, incidental,
                            special, consequential, or punitive damages, or any loss of profits or revenues.
                        </p>
                    </section>

                    <section style={{ marginBottom: 32 }}>
                        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16, color: "#fff" }}>9. Termination</h2>
                        <p>
                            We may terminate or suspend your access to the service immediately, without prior notice,
                            for any reason, including breach of these Terms.
                        </p>
                    </section>

                    <section style={{ marginBottom: 32 }}>
                        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16, color: "#fff" }}>10. Changes to Terms</h2>
                        <p>
                            We reserve the right to modify or replace these Terms at any time. We will provide notice of
                            any changes by updating the "Last updated" date.
                        </p>
                    </section>

                    <section style={{ marginBottom: 32 }}>
                        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16, color: "#fff" }}>11. Contact Us</h2>
                        <p>
                            If you have any questions about these Terms, please contact us at:
                        </p>
                        <p style={{ marginTop: 8 }}>
                            <a href="mailto:racioapp@gmail.com" style={{ color: "#a855f7" }}>racioapp@gmail.com</a>
                        </p>
                    </section>
                </div>

                {/* Footer */}
                <div style={{ borderTop: "1px solid #1f2937", paddingTop: 32, marginTop: 48, textAlign: "center" }}>
                    <Link href="/" style={{ color: "#a855f7", textDecoration: "none" }}>
                        ← Back to RACIO
                    </Link>
                </div>
            </div>
        </main>
    );
}
