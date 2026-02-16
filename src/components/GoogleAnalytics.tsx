"use client";

import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

// Track custom events
export function trackEvent(action: string, category: string, label?: string, value?: number) {
    if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", action, {
            event_category: category,
            event_label: label,
            value: value,
        });
    }
}

// Pre-defined event helpers for RACIO
export const analytics = {
    // Conversion funnel
    fileUploaded: (fileType: string, fileSize: number) =>
        trackEvent("file_upload", "conversion", fileType, Math.round(fileSize / 1024)),
    urlSubmitted: (platform: string) =>
        trackEvent("url_submit", "conversion", platform),
    processingStarted: (ratioCount: number) =>
        trackEvent("processing_start", "conversion", `${ratioCount}_ratios`, ratioCount),
    processingComplete: (type: string, duration: number) =>
        trackEvent("processing_complete", "conversion", type, Math.round(duration / 1000)),
    downloadSingle: (format: string) =>
        trackEvent("download_single", "download", format),
    downloadAll: (formatCount: number) =>
        trackEvent("download_all", "download", `${formatCount}_formats`, formatCount),

    // Revenue
    pricingViewed: () =>
        trackEvent("pricing_viewed", "revenue"),
    proClicked: () =>
        trackEvent("pro_clicked", "revenue", "pro_monthly"),
    lifetimeClicked: () =>
        trackEvent("lifetime_clicked", "revenue", "lifetime"),
    licenseActivated: (plan: string) =>
        trackEvent("license_activated", "revenue", plan),

    // Engagement
    themeToggled: (theme: string) =>
        trackEvent("theme_toggle", "engagement", theme),
    ratioSelected: (ratio: string) =>
        trackEvent("ratio_selected", "engagement", ratio),
    scrolledToFeatures: () =>
        trackEvent("scroll_features", "engagement"),
    scrolledToPricing: () =>
        trackEvent("scroll_pricing", "engagement"),
    stickyBarClicked: () =>
        trackEvent("sticky_bar_click", "engagement"),
};

export default function GoogleAnalytics() {
    if (!GA_ID) return null;

    return (
        <>
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
                strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
                {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${GA_ID}', {
                        page_title: document.title,
                        send_page_view: true,
                    });
                `}
            </Script>
        </>
    );
}
