// lib/db.ts
import { Redis } from "@upstash/redis";

// Ensure your .env.local contains the following:
// UPSTASH_REDIS_REST_URL=your-upstash-url
// UPSTASH_REDIS_REST_TOKEN=your-upstash-token

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error("Upstash Redis credentials are missing in .env.local");
}

export const db = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});