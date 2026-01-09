import Stripe from "stripe";

// Lazy-load Stripe to avoid initialization errors during build
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
    if (!stripeInstance) {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error("STRIPE_SECRET_KEY is not configured");
        }
        stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
    return stripeInstance;
}

// Legacy export for backward compatibility
export const stripe = {
    checkout: {
        sessions: {
            create: async (params: Stripe.Checkout.SessionCreateParams) => getStripe().checkout.sessions.create(params),
            retrieve: async (id: string, options?: Stripe.Checkout.SessionRetrieveParams) => getStripe().checkout.sessions.retrieve(id, options),
        }
    },
    webhooks: {
        constructEvent: (payload: string, header: string, secret: string) => getStripe().webhooks.constructEvent(payload, header, secret),
    }
};

// Product configuration
export const STRIPE_PRODUCTS = {
    pro_monthly: {
        name: "RACIO Pro Monthly",
        priceId: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
        mode: "subscription" as const,
    },
    pro_yearly: {
        name: "RACIO Pro Yearly",
        priceId: process.env.STRIPE_PRICE_PRO_YEARLY || "",
        mode: "subscription" as const,
    },
    lifetime: {
        name: "RACIO Lifetime",
        priceId: process.env.STRIPE_PRICE_LIFETIME || "",
        mode: "payment" as const,
    },
};

export type PlanType = keyof typeof STRIPE_PRODUCTS;

// Generate a secure license key
export function generateLicenseKey(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoiding confusing chars like 0/O, 1/I
    const segments = 4;
    const segmentLength = 5;

    const key: string[] = [];
    for (let s = 0; s < segments; s++) {
        let segment = "";
        for (let c = 0; c < segmentLength; c++) {
            segment += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        key.push(segment);
    }

    return key.join("-"); // e.g., "RACIO-AB3CD-EF5GH-JK7LM"
}

// Simple in-memory license store (replace with database in production)
// Format: { [licenseKey]: { email, plan, createdAt, activated } }
interface LicenseData {
    email: string;
    plan: PlanType;
    createdAt: string;
    activated: boolean;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
}

// This would be a database in production
// For now, we'll use a JSON file approach
const LICENSE_STORE_KEY = "racio_licenses";

export async function saveLicense(key: string, data: LicenseData): Promise<void> {
    // In production, save to database
    // For now, we'll store in a simple file-based approach
    const fs = await import("fs/promises");
    const path = await import("path");

    const storePath = path.join(process.cwd(), ".licenses.json");

    let store: Record<string, LicenseData> = {};
    try {
        const content = await fs.readFile(storePath, "utf-8");
        store = JSON.parse(content);
    } catch {
        // File doesn't exist yet
    }

    store[key] = data;
    await fs.writeFile(storePath, JSON.stringify(store, null, 2));
}

export async function getLicense(key: string): Promise<LicenseData | null> {
    const fs = await import("fs/promises");
    const path = await import("path");

    const storePath = path.join(process.cwd(), ".licenses.json");

    try {
        const content = await fs.readFile(storePath, "utf-8");
        const store: Record<string, LicenseData> = JSON.parse(content);
        return store[key] || null;
    } catch {
        return null;
    }
}

export async function activateLicense(key: string): Promise<boolean> {
    const fs = await import("fs/promises");
    const path = await import("path");

    const storePath = path.join(process.cwd(), ".licenses.json");

    try {
        const content = await fs.readFile(storePath, "utf-8");
        const store: Record<string, LicenseData> = JSON.parse(content);

        if (store[key]) {
            store[key].activated = true;
            await fs.writeFile(storePath, JSON.stringify(store, null, 2));
            return true;
        }
        return false;
    } catch {
        return false;
    }
}
