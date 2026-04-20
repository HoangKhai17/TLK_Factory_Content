import crypto from "crypto";
import { logger } from "./logger.js";

const store = new Map<string, { value: unknown; expiresAt: number }>();

export function hashKey(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  logger.debug(`[cache] hit ${key.slice(0, 12)}...`);
  return entry.value as T;
}

export function cacheSet(key: string, value: unknown, ttlSeconds = 3600): void {
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  logger.debug(`[cache] set ${key.slice(0, 12)}... TTL=${ttlSeconds}s`);
}
