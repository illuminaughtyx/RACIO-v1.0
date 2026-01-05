// Simple usage tracking for free tier
// In production, use a proper database like Redis or Postgres

const FREE_TIER_LIMIT = 3; // 3 conversions per day

interface UsageRecord {
    count: number;
    date: string;
}

// In-memory storage (resets on server restart - use Redis in production)
const usageStore = new Map<string, UsageRecord>();

export function getUsageKey(ip: string): string {
    return `usage:${ip}`;
}

export function getTodayString(): string {
    return new Date().toISOString().split("T")[0];
}

export function checkUsageLimit(ip: string): { allowed: boolean; remaining: number } {
    const key = getUsageKey(ip);
    const today = getTodayString();
    const record = usageStore.get(key);

    if (!record || record.date !== today) {
        // Reset for new day
        return { allowed: true, remaining: FREE_TIER_LIMIT };
    }

    const remaining = Math.max(0, FREE_TIER_LIMIT - record.count);
    return {
        allowed: record.count < FREE_TIER_LIMIT,
        remaining
    };
}

export function incrementUsage(ip: string): void {
    const key = getUsageKey(ip);
    const today = getTodayString();
    const record = usageStore.get(key);

    if (!record || record.date !== today) {
        usageStore.set(key, { count: 1, date: today });
    } else {
        usageStore.set(key, { count: record.count + 1, date: today });
    }
}

export function getUsageCount(ip: string): number {
    const key = getUsageKey(ip);
    const today = getTodayString();
    const record = usageStore.get(key);

    if (!record || record.date !== today) {
        return 0;
    }
    return record.count;
}

export const FREE_LIMIT = FREE_TIER_LIMIT;
