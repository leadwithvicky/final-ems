const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || '';
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';

type RedisResponse<T> = { result: T };

async function redisFetch<T>(body: any): Promise<T | null> {
  if (!REDIS_URL || !REDIS_TOKEN) return null;
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) return null;
  const json = (await res.json()) as RedisResponse<T>;
  return (json as any)?.result ?? null;
}

export async function redisGetJson<T>(key: string): Promise<T | null> {
  const result = await redisFetch<string>(["get", key]);
  if (!result) return null;
  try { return JSON.parse(result as unknown as string) as T; } catch { return null; }
}

export async function redisSetJson(key: string, value: unknown, ttlSeconds?: number): Promise<boolean> {
  const args: any[] = ["set", key, JSON.stringify(value)];
  if (ttlSeconds && ttlSeconds > 0) {
    args.push("EX", ttlSeconds);
  }
  const result = await redisFetch<'OK'>(args);
  return result === 'OK';
}

export async function redisDel(key: string): Promise<number | null> {
  const result = await redisFetch<number>(["del", key]);
  return result;
}

export function isRedisConfigured(): boolean {
  return Boolean(REDIS_URL && REDIS_TOKEN);
}


