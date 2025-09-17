type Record = { tokens: number; last: number };
const buckets = new Map<string, Record>();

export function rateLimit(limit: number, windowMs: number) {
  return (ip: string) => {
    const now = Date.now();
    const rec = buckets.get(ip) || { tokens: limit, last: now };
    const delta = (now - rec.last) / windowMs;
    rec.tokens = Math.min(limit, rec.tokens + delta * limit);
    rec.last = now;

    if (rec.tokens < 1) {
      buckets.set(ip, rec);
      return false; // blocked
    }
    rec.tokens -= 1;
    buckets.set(ip, rec);
    return true;
  };
}
