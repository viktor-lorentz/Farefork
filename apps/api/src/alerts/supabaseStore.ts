import {
  type AlertStore,
  type AlertUpdate,
  type DueAlert,
  parseDueAlert,
  RECHECK_AFTER_MS,
} from './check';

export function createSupabaseAlertStore(options: {
  url: string;
  serviceKey: string;
  fetch?: typeof fetch;
}): AlertStore {
  const doFetch = options.fetch ?? fetch;
  const base = `${options.url.replace(/\/+$/, '')}/rest/v1`;

  async function request(
    path: string,
    init: { method?: string; body?: string } = {},
  ): Promise<unknown> {
    const response = await doFetch(`${base}${path}`, {
      ...init,
      headers: {
        apikey: options.serviceKey,
        Authorization: `Bearer ${options.serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      throw new Error(
        `Supabase ${init.method ?? 'GET'} ${path.split('?')[0] ?? ''} failed: ${response.status}`,
      );
    }
    const text = await response.text();
    return text.length > 0 ? JSON.parse(text) : null;
  }

  return {
    async dueAlerts(now) {
      const cutoff = new Date(now.getTime() - RECHECK_AFTER_MS).toISOString();
      const params = new URLSearchParams({
        select: '*',
        active: 'eq.true',
        expires_at: `gt.${now.toISOString()}`,
        or: `(last_checked_at.is.null,last_checked_at.lt.${cutoff})`,
        order: 'last_checked_at.asc.nullsfirst',
        limit: '200',
      });
      const rows = await request(`/price_alerts?${params.toString()}`);
      return Array.isArray(rows)
        ? rows.map(parseDueAlert).filter((row): row is DueAlert => row !== null)
        : [];
    },
    async update(id: string, update: AlertUpdate) {
      await request(`/price_alerts?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(update),
      });
    },
    async deactivateExpired(now) {
      await request(`/price_alerts?active=eq.true&expires_at=lte.${now.toISOString()}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: false }),
      });
    },
    async deleteStale(before) {
      await request(`/price_alerts?active=eq.false&expires_at=lt.${before.toISOString()}`, {
        method: 'DELETE',
      });
    },
    async pushTokens(userIds) {
      if (userIds.length === 0) {
        return [];
      }
      const rows = await request(
        `/push_tokens?select=token,user_id&user_id=in.(${userIds.map(encodeURIComponent).join(',')})`,
      );
      if (!Array.isArray(rows)) {
        return [];
      }
      return rows.flatMap((row: unknown) => {
        if (typeof row !== 'object' || row === null || !('token' in row) || !('user_id' in row)) {
          return [];
        }
        const { token, user_id: userId } = row;
        return typeof token === 'string' && typeof userId === 'string' ? [{ token, userId }] : [];
      });
    },
    async removePushTokens(tokens) {
      await request(
        `/push_tokens?token=in.(${tokens.map((token) => `"${encodeURIComponent(token)}"`).join(',')})`,
        { method: 'DELETE' },
      );
    },
  };
}
