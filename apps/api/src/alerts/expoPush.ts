import { z } from 'zod';
import type { PushMessage, PushSender } from './check';

const CHUNK = 100;

const ticketSchema = z.object({
  data: z.array(
    z.object({
      status: z.enum(['ok', 'error']),
      details: z.object({ error: z.string().optional() }).optional(),
    }),
  ),
});

export function createExpoPushSender(
  options: { accessToken?: string; fetch?: typeof fetch } = {},
): PushSender {
  const doFetch = options.fetch ?? fetch;
  return {
    async send(messages: readonly PushMessage[]) {
      const invalidTokens: string[] = [];
      for (let start = 0; start < messages.length; start += CHUNK) {
        const chunk = messages.slice(start, start + CHUNK);
        const response = await doFetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
          },
          body: JSON.stringify(chunk.map((message) => ({ ...message, sound: 'default' }))),
          signal: AbortSignal.timeout(15_000),
        });
        if (!response.ok) {
          throw new Error(`Expo push failed: ${response.status}`);
        }
        const parsed = ticketSchema.safeParse(await response.json());
        if (!parsed.success) {
          continue;
        }
        parsed.data.data.forEach((ticket, index) => {
          const message = chunk[index];
          if (
            message &&
            ticket.status === 'error' &&
            ticket.details?.error === 'DeviceNotRegistered'
          ) {
            invalidTokens.push(message.to);
          }
        });
      }
      return { invalidTokens };
    },
  };
}
