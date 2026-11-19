import { apiErrorBodySchema } from '@repo/shared';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { z } from 'zod';

const API_PORT = 8787;

function resolveBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) {
    return configured.replace(/\/$/, '');
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:${API_PORT}`;
  }
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) {
    return `http://${host}:${API_PORT}`;
  }
  return `http://${Platform.OS === 'android' ? '10.0.2.2' : 'localhost'}:${API_PORT}`;
}

export const apiBaseUrl = resolveBaseUrl();

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly code: string | null = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = {
  method: 'GET' | 'POST';
  body?: unknown;
  signal?: AbortSignal;
};

async function request<T>(path: string, schema: z.ZodType<T>, options: RequestOptions): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method: options.method,
      headers: {
        Accept: 'application/json',
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch (error) {
    if (options.signal?.aborted === true) {
      throw error;
    }
    throw new ApiError(`Could not reach the server at ${apiBaseUrl}`, null);
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const parsedError = apiErrorBodySchema.safeParse(body);
    throw new ApiError(
      parsedError.success && parsedError.data.message !== undefined
        ? parsedError.data.message
        : `Request failed with status ${response.status}`,
      response.status,
      parsedError.success ? parsedError.data.error : null,
    );
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError('The server sent an unexpected response', response.status);
  }
  return parsed.data;
}

export function apiGet<T>(path: string, schema: z.ZodType<T>, signal?: AbortSignal): Promise<T> {
  return request(path, schema, { method: 'GET', signal });
}

export function apiPost<T>(
  path: string,
  body: unknown,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<T> {
  return request(path, schema, { method: 'POST', body, signal });
}
