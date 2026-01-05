"use client";

const STORAGE_KEY = "racio_usage";
const DAILY_LIMIT = 3;

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

export const incrementUsage = () => {
    if (typeof window === "undefined") return;

    // Optional: Don't count usage for Pro users? 
    // Or still count it but don't limit it. Let's still count for stats if we had them.

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

const resetUsage = () => {
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ count: 0, date: today }));
};
