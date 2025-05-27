const upstashRedisRestUrl = process.env.UPSTASH_REDIS_REST_URL;
const authToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!upstashRedisRestUrl || !authToken) {
  throw new Error('Missing Upstash Redis environment variables');
}

// ✅ Include 'sadd' in the allowed commands
type Command = 'zrange' | 'sismember' | 'get' | 'smembers' | 'sadd';

export async function fetchRedis(
  command: Command,
  ...args: (string | number)[]
): Promise<any> {
  const url = `${upstashRedisRestUrl}/${command}/${args.join('/')}`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Redis command failed: ${res.status} - ${errText}`);
      throw new Error(`Redis command failed: ${res.statusText}`);
    }

    const data = await res.json();

    if (!('result' in data)) {
      console.error('Invalid Redis response format:', data);
      throw new Error('Invalid Redis response format');
    }

    return data.result;
  } catch (err) {
    console.error('Error fetching from Redis:', err);
    throw err;
  }
}
