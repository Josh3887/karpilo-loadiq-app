import "server-only";

import { Redis } from "@upstash/redis";

let redisClient: Redis | null | undefined;

export function getRedisClient() {
  if (redisClient !== undefined) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  redisClient = url && token ? new Redis({ url, token }) : null;
  return redisClient;
}

export async function getRedisValue<T>(key: string) {
  const redis = getRedisClient();
  if (!redis) return null;

  return redis.get<T>(key);
}

export async function setRedisValue<T>(
  key: string,
  value: T,
  options?: { exSeconds?: number },
) {
  const redis = getRedisClient();
  if (!redis) return false;

  if (options?.exSeconds) {
    await redis.set(key, value, { ex: options.exSeconds });
  } else {
    await redis.set(key, value);
  }

  return true;
}

export async function deleteRedisValue(key: string) {
  const redis = getRedisClient();
  if (!redis) return false;

  await redis.del(key);
  return true;
}
