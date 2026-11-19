import { describe, expect, it } from 'vitest';
import { createEstimateRouter } from '../geo/router';
import { createMockRideProviders } from '../rides/providers/mock';
import { getRideQuotes } from '../rides/quoteService';
import { places } from '../testDeps';
import {
  type AlertStore,
  type AlertUpdate,
  type DueAlert,
  type PushMessage,
  runAlertCheck,
} from './check';
import { createExpoPushSender } from './expoPush';

const now = new Date('2026-11-19T18:00:00Z');

function alert(id: string, userId: string, targetCents: number): DueAlert {
  return {
    id,
    user_id: userId,
    pickup: { name: 'Dolores Park', ...places.doloresPark },
    dropoff: { name: 'Ferry Building', ...places.ferryBuilding },
    title: 'Dolores Park to Ferry Building',
    target_cents: targetCents,
    membership_ids: [],
    active: true,
    expires_at: '2026-11-25T00:00:00Z',
    last_checked_at: null,
    last_price_cents: null,
    last_provider_id: null,
    triggered_at: null,
    triggered_price_cents: null,
    triggered_provider_id: null,
    created_at: '2026-11-18T00:00:00Z',
  };
}

function memoryStore(alerts: DueAlert[]) {
  const updates = new Map<string, AlertUpdate>();
  const removed: string[] = [];
  const store: AlertStore = {
    dueAlerts: () => Promise.resolve(alerts),
    update: (id, update) => {
      updates.set(id, update);
      return Promise.resolve();
    },
    deactivateExpired: () => Promise.resolve(),
    deleteStale: () => Promise.resolve(),
    pushTokens: (userIds) =>
      Promise.resolve(
        userIds.flatMap((userId) => [
          { token: `ExponentPushToken[${userId}]`, userId },
          { token: `ExponentPushToken[${userId}-old]`, userId },
        ]),
      ),
    removePushTokens: (tokens) => {
      removed.push(...tokens);
      return Promise.resolve();
    },
  };
  return { store, updates, removed };
}

const quote = (request: Parameters<typeof getRideQuotes>[0]) =>
  getRideQuotes(request, {
    router: createEstimateRouter(),
    providers: createMockRideProviders(),
    now: () => now,
  });

describe('price alert check', () => {
  it('notifies when the cheapest price meets the target and pauses the alert', async () => {
    const { store, updates, removed } = memoryStore([
      alert('a', 'u1', 100_000),
      alert('b', 'u2', 100),
    ]);
    const sent: PushMessage[] = [];
    const summary = await runAlertCheck({
      store,
      quote,
      now: () => now,
      push: {
        send: (messages) => {
          sent.push(...messages);
          return Promise.resolve({
            invalidTokens: messages.filter((m) => m.to.includes('-old')).map((m) => m.to),
          });
        },
      },
    });
    expect(summary).toEqual({ checked: 2, triggered: 1, failed: 0, pushed: 1 });
    expect(updates.get('a')).toMatchObject({ active: false, triggered_at: now.toISOString() });
    expect(updates.get('b')?.active).toBeUndefined();
    expect(updates.get('b')?.last_price_cents).toBeGreaterThan(100);
    expect(sent.map((message) => message.to)).toEqual([
      'ExponentPushToken[u1]',
      'ExponentPushToken[u1-old]',
    ]);
    expect(sent[0]?.title).toMatch(/^\$\d+\.\d{2} on /);
    expect(sent[0]?.data).toEqual({ alertId: 'a', url: '/alerts?open=a' });
    expect(removed).toEqual(['ExponentPushToken[u1-old]']);
  });

  it('records failures without stopping other alerts', async () => {
    const { store, updates } = memoryStore([alert('a', 'u1', 100), alert('b', 'u1', 100)]);
    let calls = 0;
    const summary = await runAlertCheck({
      store,
      now: () => now,
      push: { send: () => Promise.resolve({ invalidTokens: [] }) },
      quote: (request) => {
        calls += 1;
        return calls === 1 ? Promise.reject(new Error('down')) : quote(request);
      },
    });
    expect(summary).toMatchObject({ checked: 1, failed: 1, triggered: 0 });
    expect(updates.size).toBe(2);
  });
});

describe('Expo push sender', () => {
  it('reports tokens Expo says are no longer registered', async () => {
    const sender = createExpoPushSender({
      fetch: (_input, init) => {
        const body: unknown = JSON.parse(typeof init?.body === 'string' ? init.body : '[]');
        expect(Array.isArray(body) && body.length).toBe(2);
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: [
                { status: 'ok', id: '1' },
                { status: 'error', details: { error: 'DeviceNotRegistered' } },
              ],
            }),
          ),
        );
      },
    });
    const result = await sender.send([
      { to: 'ExponentPushToken[a]', title: 't', body: 'b', data: {} },
      { to: 'ExponentPushToken[b]', title: 't', body: 'b', data: {} },
    ]);
    expect(result.invalidTokens).toEqual(['ExponentPushToken[b]']);
  });
});
