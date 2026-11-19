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
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiGet<T>(
  path: string,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      headers: { Accept: 'application/json' },
      signal,
    });
  } catch {
    throw new ApiError(`Could not reach the server at ${apiBaseUrl}`, null);
  }
  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}`, response.status);
  }
  const body: unknown = await response.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError('The server sent an unexpected response', response.status);
  }
  return parsed.data;
}
