import axios, { AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_TIMEOUT_MS } from '../config/env';

const TOKEN_KEY = 'homeos_auth_token';

let authToken: string | null = null;

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
});

// ─── Token management ──────────────────────────────────────────────────────────
export async function loadStoredToken(): Promise<string | null> {
  authToken = await AsyncStorage.getItem(TOKEN_KEY);
  return authToken;
}

export async function setAuthToken(token: string | null): Promise<void> {
  authToken = token;
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

export function getAuthToken(): string | null {
  return authToken;
}

// ─── Interceptors ──────────────────────────────────────────────────────────────
http.interceptors.request.use((config) => {
  if (authToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

export interface ApiError {
  message: string;
  status?: number;
}

http.interceptors.response.use(
  // The backend TransformInterceptor wraps payloads as { success, data, timestamp }.
  // Unwrap here so callers receive the raw data.
  (response) => {
    const body = response.data;
    if (body && typeof body === 'object' && 'data' in body && 'success' in body) {
      return body.data;
    }
    return body;
  },
  (error) => {
    const payload = error?.response?.data;
    let message: string =
      payload?.message || error?.message || 'Network error';
    if (Array.isArray(message)) message = message.join(', ');
    const apiError: ApiError = { message, status: error?.response?.status };
    return Promise.reject(apiError);
  },
);

// ─── Typed helpers (responses are already unwrapped by the interceptor) ─────────
export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return (await http.get(url, config)) as unknown as T;
}
export async function apiPost<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return (await http.post(url, body, config)) as unknown as T;
}
export async function apiPatch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return (await http.patch(url, body, config)) as unknown as T;
}
export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return (await http.delete(url, config)) as unknown as T;
}
