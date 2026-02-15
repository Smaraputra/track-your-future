// Takes the rightmost entry from x-forwarded-for. The rightmost IP is set by
// the closest trusted reverse proxy, while leftmost entries are attacker-controlled.
// This assumes deployment behind a single reverse proxy (Vercel, nginx, etc.).
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',');
    return parts[parts.length - 1].trim();
  }
  return request.headers.get('x-real-ip') ?? '127.0.0.1';
}
