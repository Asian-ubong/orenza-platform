export type RealtimeRole = 'USER' | 'OWNER' | 'ADMIN' | 'WORKER';

export type RealtimeChannel =
  | { kind: 'user'; userId: string }
  | { kind: 'admin' }
  | { kind: 'provider'; provider: string; connectionId: string }
  | { kind: 'system' };

export type RealtimePrincipal = {
  userId?: string;
  role: RealtimeRole;
  privateAccessActive: boolean;
};

/**
 * Pure authorization policy for the realtime gateway. Authentication and
 * database lookups happen in the gateway; this module only decides whether
 * an already-authenticated principal may access a channel.
 */
export function canSubscribe(principal: RealtimePrincipal, channel: RealtimeChannel): boolean {
  if (!principal.privateAccessActive) return false;

  if (channel.kind === 'user') {
    return principal.role !== 'WORKER' && principal.userId === channel.userId;
  }

  if (channel.kind === 'admin') {
    return principal.role === 'OWNER' || principal.role === 'ADMIN';
  }

  if (channel.kind === 'provider' || channel.kind === 'system') {
    return principal.role === 'WORKER';
  }

  return false;
}

export function canPublishClientCommand(
  principal: RealtimePrincipal,
  channel: RealtimeChannel,
): boolean {
  if (!principal.privateAccessActive) return false;
  if (channel.kind === 'user') return principal.role !== 'WORKER' && principal.userId === channel.userId;
  if (channel.kind === 'admin') return principal.role === 'OWNER' || principal.role === 'ADMIN';
  return false;
}
