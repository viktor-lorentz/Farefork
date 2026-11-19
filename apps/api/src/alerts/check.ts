import {
  formatUsd,
  type PriceAlertRow,
  priceAlertRowSchema,
  providers,
  type RideQuotesRequest,
  type RideQuotesResponse,
} from '@repo/shared';

export const RECHECK_AFTER_MS = 10 * 60 * 1000;
export const DELETE_EXPIRED_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

export type AlertUpdate = {
  last_checked_at: string;
  last_price_cents: number | null;
  last_provider_id: string | null;
  active?: boolean;
  triggered_at?: string;
  triggered_price_cents?: number;
  triggered_provider_id?: string;
};

export type DueAlert = PriceAlertRow & { user_id: string };

export type AlertStore = {
  dueAlerts(now: Date): Promise<DueAlert[]>;
  update(id: string, update: AlertUpdate): Promise<void>;
  deactivateExpired(now: Date): Promise<void>;
  deleteStale(before: Date): Promise<void>;
  pushTokens(userIds: readonly string[]): Promise<{ token: string; userId: string }[]>;
  removePushTokens(tokens: readonly string[]): Promise<void>;
};

export type PushMessage = {
  to: string;
  title: string;
  body: string;
  data: Record<string, string>;
};

export type PushSender = {
  send(messages: readonly PushMessage[]): Promise<{ invalidTokens: string[] }>;
};

export type QuoteFn = (request: RideQuotesRequest) => Promise<RideQuotesResponse>;

export type CheckSummary = { checked: number; triggered: number; failed: number; pushed: number };

export function cheapestQuote(response: RideQuotesResponse) {
  return response.quotes.reduce<RideQuotesResponse['quotes'][number] | null>(
    (best, quote) => (best === null || quote.priceCents < best.priceCents ? quote : best),
    null,
  );
}

export function alertMessage(
  alert: PriceAlertRow,
  priceCents: number,
  providerId: string,
): Pick<PushMessage, 'title' | 'body'> {
  const name = providers[providerId as keyof typeof providers].name;
  return {
    title: `${formatUsd(priceCents)} on ${name}`,
    body: `${alert.title} dropped to your ${formatUsd(alert.target_cents)} target. Prices change fast, so check before you book.`,
  };
}

export function parseDueAlert(raw: unknown): DueAlert | null {
  const parsed = priceAlertRowSchema.safeParse(raw);
  if (!parsed.success || typeof raw !== 'object' || raw === null || !('user_id' in raw)) {
    return null;
  }
  const userId = raw.user_id;
  return typeof userId === 'string' ? { ...parsed.data, user_id: userId } : null;
}

export async function runAlertCheck(deps: {
  store: AlertStore;
  quote: QuoteFn;
  push: PushSender;
  now: () => Date;
}): Promise<CheckSummary> {
  const started = deps.now();
  await deps.store.deactivateExpired(started);
  await deps.store.deleteStale(new Date(started.getTime() - DELETE_EXPIRED_AFTER_MS));
  const alerts = await deps.store.dueAlerts(started);
  const summary: CheckSummary = { checked: 0, triggered: 0, failed: 0, pushed: 0 };
  const hits: { alert: DueAlert; priceCents: number; providerId: string }[] = [];

  for (const alert of alerts) {
    const checkedAt = deps.now().toISOString();
    try {
      const response = await deps.quote({
        pickup: { latitude: alert.pickup.latitude, longitude: alert.pickup.longitude },
        dropoff: { latitude: alert.dropoff.latitude, longitude: alert.dropoff.longitude },
        pickupName: alert.pickup.name,
        dropoffName: alert.dropoff.name,
        membershipIds: alert.membership_ids,
      });
      const best = cheapestQuote(response);
      summary.checked += 1;
      if (best !== null && best.priceCents <= alert.target_cents) {
        summary.triggered += 1;
        hits.push({ alert, priceCents: best.priceCents, providerId: best.providerId });
        await deps.store.update(alert.id, {
          last_checked_at: checkedAt,
          last_price_cents: best.priceCents,
          last_provider_id: best.providerId,
          active: false,
          triggered_at: checkedAt,
          triggered_price_cents: best.priceCents,
          triggered_provider_id: best.providerId,
        });
      } else {
        await deps.store.update(alert.id, {
          last_checked_at: checkedAt,
          last_price_cents: best?.priceCents ?? null,
          last_provider_id: best?.providerId ?? null,
        });
      }
    } catch {
      summary.failed += 1;
      await deps.store
        .update(alert.id, {
          last_checked_at: checkedAt,
          last_price_cents: alert.last_price_cents,
          last_provider_id: alert.last_provider_id,
        })
        .catch(() => undefined);
    }
  }

  if (hits.length === 0) {
    return summary;
  }
  const tokens = await deps.store.pushTokens([...new Set(hits.map((hit) => hit.alert.user_id))]);
  const messages = hits.flatMap((hit) =>
    tokens
      .filter((token) => token.userId === hit.alert.user_id)
      .map((token) => ({
        to: token.token,
        ...alertMessage(hit.alert, hit.priceCents, hit.providerId),
        data: { alertId: hit.alert.id, url: `/alerts?open=${hit.alert.id}` },
      })),
  );
  if (messages.length > 0) {
    const { invalidTokens } = await deps.push.send(messages);
    summary.pushed = messages.length - invalidTokens.length;
    if (invalidTokens.length > 0) {
      await deps.store.removePushTokens(invalidTokens);
    }
  }
  return summary;
}
