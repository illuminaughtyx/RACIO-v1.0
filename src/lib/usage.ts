"use client";

const STORAGE_KEY = "racio_usage";
const URL_STORAGE_KEY = "racio_url_usage";
const DAILY_LIMIT = 3;
const DAILY_URL_LIMIT = 1; // Free users get 1 URL download per day

interface UsageData {
    count: number;
    date: string; // YYYY-MM-DD
}

export const isProUser = (): boolean => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("racio_pro") === "true";
};

export const checkUsage = (): boolean => {
    if (typeof window === "undefined") return true;

    // Pro users have no limits
    if (isProUser()) return true;

    const today = new Date().toISOString().split("T")[0];
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) return true;

    const data: UsageData = JSON.parse(stored);

    if (data.date !== today) {
        resetUsage();
        return true;
    }

    return data.count < DAILY_LIMIT;
};

// Check if free user can use URL download (1/day limit)
export const checkUrlUsage = (): boolean => {
    if (typeof window === "undefined") return true;

    // Pro users have no limits
    if (isProUser()) return true;

    const today = new Date().toISOString().split("T")[0];
    const stored = localStorage.getItem(URL_STORAGE_KEY);

    if (!stored) return true;

    const data: UsageData = JSON.parse(stored);

    if (data.date !== today) {
        return true; // New day, reset
    }

    return data.count < DAILY_URL_LIMIT;
};

// Increment URL usage for free users
export const incrementUrlUsage = () => {
    if (typeof window === "undefined") return;
    if (isProUser()) return; // Don't track for Pro users

    const today = new Date().toISOString().split("T")[0];
    const stored = localStorage.getItem(URL_STORAGE_KEY);

    let count = 1;

    if (stored) {
        const data: UsageData = JSON.parse(stored);
        if (data.date === today) {
            count = data.count + 1;
        }
    }

    localStorage.setItem(URL_STORAGE_KEY, JSON.stringify({ count, date: today }));
};

export const incrementUsage = () => {
    if (typeof window === "undefined") return;

    const today = new Date().toISOString().split("T")[0];
    const stored = localStorage.getItem(STORAGE_KEY);

    let count = 1;

    if (stored) {
        const data: UsageData = JSON.parse(stored);
        if (data.date === today) {
            count = data.count + 1;
        }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ count, date: today }));
};

export const getRemainingUses = (): number => {
    if (typeof window === "undefined") return DAILY_LIMIT;
    if (isProUser()) return 999; // Infinite

    const today = new Date().toISOString().split("T")[0];
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) return DAILY_LIMIT;

    const data: UsageData = JSON.parse(stored);
    if (data.date !== today) return DAILY_LIMIT;

    return Math.max(0, DAILY_LIMIT - data.count);
};

export const getRemainingUrlUses = (): number => {
    if (typeof window === "undefined") return DAILY_URL_LIMIT;
    if (isProUser()) return 999; // Infinite

    const today = new Date().toISOString().split("T")[0];
    const stored = localStorage.getItem(URL_STORAGE_KEY);

    if (!stored) return DAILY_URL_LIMIT;

    const data: UsageData = JSON.parse(stored);
    if (data.date !== today) return DAILY_URL_LIMIT;

    return Math.max(0, DAILY_URL_LIMIT - data.count);
};

const resetUsage = () => {
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ count: 0, date: today }));
};
