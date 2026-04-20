import { db } from '@/db';
import { auditLog, type AuditAction } from '@/db/schema/audit';

interface LogAuditEventOptions {
  action: AuditAction;
  userId?: string | null;
  request?: Request;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

function pickIp(request: Request | undefined, explicit: string | null | undefined): string | null {
  if (explicit !== undefined) return explicit;
  if (!request) return null;
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',');
    return parts[parts.length - 1].trim();
  }
  return request.headers.get('x-real-ip') ?? null;
}

function pickUserAgent(request: Request | undefined, explicit: string | null | undefined): string | null {
  if (explicit !== undefined) return explicit;
  if (!request) return null;
  return request.headers.get('user-agent');
}

export async function logAuditEvent(options: LogAuditEventOptions): Promise<void> {
  try {
    await db.insert(auditLog).values({
      userId: options.userId ?? null,
      action: options.action,
      ipAddress: pickIp(options.request, options.ipAddress),
      userAgent: pickUserAgent(options.request, options.userAgent),
      metadata: options.metadata ?? null,
    });
  } catch (err) {
    console.error('Failed to write audit log event', options.action, err);
  }
}
