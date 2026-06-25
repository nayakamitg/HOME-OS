import { apiGet, apiPost, apiPatch, apiDelete } from './client';
import {
  AuthResponse, BackendUser, BackendHome, BackendRoom, BackendDevice,
  BackendShadow, BackendScene, BackendAutomation, BackendActivity,
  BackendDeviceType, BackendAutomationType,
} from './types';

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const AuthApi = {
  register: (name: string, email: string, password: string) =>
    apiPost<AuthResponse>('/auth/register', { name, email, password }),
  login: (email: string, password: string) =>
    apiPost<AuthResponse>('/auth/login', { email, password }),
  me: () => apiGet<BackendUser>('/auth/me'),
};

// ─── Homes ─────────────────────────────────────────────────────────────────────
export const HomesApi = {
  list: () => apiGet<BackendHome[]>('/homes'),
  create: (name: string) => apiPost<BackendHome>('/homes', { name }),
  update: (id: string, name: string) => apiPatch<BackendHome>(`/homes/${id}`, { name }),
  remove: (id: string) => apiDelete<void>(`/homes/${id}`),
};

// ─── Rooms ─────────────────────────────────────────────────────────────────────
export const RoomsApi = {
  list: (homeId: string) => apiGet<BackendRoom[]>('/rooms', { params: { homeId } }),
  create: (homeId: string, name: string) => apiPost<BackendRoom>('/rooms', { homeId, name }),
  update: (id: string, name: string) => apiPatch<BackendRoom>(`/rooms/${id}`, { name }),
  remove: (id: string) => apiDelete<void>(`/rooms/${id}`),
};

// ─── Devices ───────────────────────────────────────────────────────────────────
export const DevicesApi = {
  list: (homeId: string) => apiGet<BackendDevice[]>('/devices', { params: { homeId } }),
  create: (body: {
    name: string; roomId: string; deviceType: BackendDeviceType;
    mqttTopic?: string; firmwareVersion?: string;
  }) => apiPost<BackendDevice>('/devices', body),
  update: (id: string, body: Partial<{ name: string; deviceType: BackendDeviceType }>) =>
    apiPatch<BackendDevice>(`/devices/${id}`, body),
  remove: (id: string) => apiDelete<void>(`/devices/${id}`),
  command: (id: string, command: Record<string, unknown>) =>
    apiPost<{ status: string; shadow: BackendShadow }>(`/devices/${id}/command`, { command }),
  state: (id: string) => apiGet<BackendShadow>(`/devices/${id}/state`),
};

// ─── Scenes ────────────────────────────────────────────────────────────────────
export const ScenesApi = {
  list: (homeId: string) => apiGet<BackendScene[]>('/scenes', { params: { homeId } }),
  create: (body: { homeId: string; name: string; configuration: BackendScene['configuration'] }) =>
    apiPost<BackendScene>('/scenes', body),
  update: (id: string, body: Partial<{ name: string; configuration: BackendScene['configuration'] }>) =>
    apiPatch<BackendScene>(`/scenes/${id}`, body),
  remove: (id: string) => apiDelete<void>(`/scenes/${id}`),
  execute: (id: string) => apiPost<{ executed: number; results: unknown[] }>(`/scenes/${id}/execute`),
};

// ─── Automations ───────────────────────────────────────────────────────────────
export const AutomationsApi = {
  list: (homeId: string) => apiGet<BackendAutomation[]>('/automations', { params: { homeId } }),
  create: (body: {
    homeId: string; name: string; type: BackendAutomationType;
    enabled?: boolean; config: Record<string, unknown>; actions: Record<string, unknown>[];
  }) => apiPost<BackendAutomation>('/automations', body),
  update: (id: string, body: Partial<{
    name: string; enabled: boolean; config: Record<string, unknown>; actions: Record<string, unknown>[];
  }>) => apiPatch<BackendAutomation>(`/automations/${id}`, body),
  toggle: (id: string) => apiPatch<BackendAutomation>(`/automations/${id}/toggle`),
  remove: (id: string) => apiDelete<void>(`/automations/${id}`),
};

// ─── Activity ──────────────────────────────────────────────────────────────────
export const ActivityApi = {
  list: (homeId: string, limit = 100) =>
    apiGet<BackendActivity[]>('/activity', { params: { homeId, limit } }),
  clear: (homeId: string) => apiDelete<void>('/activity', { params: { homeId } }),
};
