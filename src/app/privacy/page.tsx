"use client";

import Link from "next/link";

export default function PrivacyPage() {
    return (
        <main style={{ minHeight: "100vh", background: "#0a0a0f", color: "#fff", padding: "40px 24px" }}>
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
                {/* Header */}
                <div style={{ marginBottom: 48 }}>
                    <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#9ca3af", textDecoration: "none", fontSize: 14, marginBottom: 24 }}>
                        ← Back to RACIO
                    </Link>
                    <h1 style={{ fontSize: 40, fontWeight: 700, marginBottom: 8 }}>Privacy Policy</h1>
                    <p style={{ color: "#9ca3af" }}>Last updated: January 12, 2026</p>
                </div>

                {/* Content */}
                <div style={{ lineHeight: 1.8, color: "#d1d5db" }}>
                    <section style={{ marginBottom: 32 }}>
                        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16, color: "#fff" }}>1. Introduction</h2>
                        <p>
                            RACIO ("we", "our", or "us") respects your privacy and is committed to protecting your personal data.
                            This privacy policy explains how we handle your information when you use our video conversion service at racio.app.
                        </p>
                    </section>

                    <section style={{ marginBottom: 32 }}>
                        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16, color: "#fff" }}>2. Information We Collect</h2>
                        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: "#e5e7eb" }}>2.1 Video Files</h3>
                        <p style={{ marginBottom: 16 }}>
                            When you upload a video or provide a URL, we temporarily process that video on our servers.
                            <strong style={{ color: "#4ade80" }}> All video files are automatically deleted within 1 hour</strong> of processing.
                        </p>

                        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: "#e5e7eb" }}>2.2 Usage Data</h3>
                        <p style={{ marginBottom: 16 }}>
                            We collect anonymous usage statistics to improve our service, including:
                        </p>
                        <ul style={{ marginLeft: 24, marginBottom: 16 }}>
                            <li>Number of videos processed</li>
                            <li>Output formats selected</li>
                            <li>General usage patterns (no personal identifiers)</li>
                        </ul>

                        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: "#e5e7eb" }}>2.3 Payment Information</h3>
                        <p>
                            If you purchase a Pro or Lifetime subscription, payment processing is handled by our third-party payment provider.
                            We do not store your credit card details on our servers.
                        </p>
                    </section>

                    <section style={{ marginBottom: 32 }}>
                        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16, color: "#fff" }}>3. How We Use Your Information</h2>
                        <ul style={{ marginLeft: 24 }}>
                            <li style={{ marginBottom: 8 }}>To provide and maintain our video conversion service</li>
                            <li style={{ marginBottom: 8 }}>To process your transactions</li>
                            <li style={{ marginBottom: 8 }}>To send you important updates about the service</li>
                            <li style={{ marginBottom: 8 }}>To improve our service based on usage patterns</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: 32 }}>
                        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16, color: "#fff" }}>4. Data Retention</h2>
                        <p>
                            <strong style={{ color: "#4ade80" }}>Video files: Deleted automatically within 1 hour</strong>
                        </p>
                        <p>
                            We do not retain your video content. Once processed and downloaded, files are removed from our servers.
                            This ensures your content remains private and secure.
                        </p>
                    </section>

                    <section style={{ marginBottom: 32 }}>
                        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16, color: "#fff" }}>5. Third-Party Services</h2>
                        <p style={{ marginBottom: 16 }}>We use the following third-party services:</p>
                        <ul style={{ marginLeft: 24 }}>
                            <li style={{ marginBottom: 8 }}><strong>Railway</strong> - Hosting and infrastructure</li>
                            <li style={{ marginBottom: 8 }}><strong>Payment Provider</strong> - Secure payment processing</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: 32 }}>
                        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16, color: "#fff" }}>6. Your Rights</h2>
                        <p>You have the right to:</p>
                        <ul style={{ marginLeft: 24 }}>
                            <li style={{ marginBottom: 8 }}>Know what data we collect about you</li>
                            <li style={{ marginBottom: 8 }}>Request deletion of your data</li>
                            <li style={{ marginBottom: 8 }}>Opt out of marketing communications</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: 32 }}>
                        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16, color: "#fff" }}>7. Cookies</h2>
                        <p>
                            We use minimal cookies to store your preferences (like dark mode) and subscription status locally in your browser.
                            We do not use tracking cookies or share data with advertisers.
                        </p>
                    </section>

                    <section style={{ marginBottom: 32 }}>
                        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16, color: "#fff" }}>8. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us at:
                        </p>
                        <p style={{ marginTop: 8 }}>
                            <a href="mailto:racioapp@gmail.com" style={{ color: "#a855f7" }}>racioapp@gmail.com</a>
                        </p>
                    </section>

                    <section style={{ marginBottom: 32 }}>
                        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16, color: "#fff" }}>9. Changes to This Policy</h2>
                        <p>
                            We may update this privacy policy from time to time. We will notify you of any changes by posting the new
                            Privacy Policy on this page and updating the "Last updated" date.
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
