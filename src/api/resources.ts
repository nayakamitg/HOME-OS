import { apiGet, apiPost, apiPatch, apiDelete } from './client';
import {
  AuthResponse, BackendUser, BackendHome, BackendRoom, BackendDevice,
  BackendShadow, BackendScene, BackendAutomation, BackendActivity,
  BackendDeviceType, BackendAutomationType,
  BackendNode, BackendNodeDetail, PinMapEntry, BackendNodeShare,
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
    nodeId?: string; gpioPin?: number; activeHigh?: boolean;
  }) => apiPost<BackendDevice>('/devices', body),
  update: (id: string, body: Partial<{
    name: string; deviceType: BackendDeviceType;
    nodeId: string | null; gpioPin: number | null; activeHigh: boolean; roomId: string;
  }>) => apiPatch<BackendDevice>(`/devices/${id}`, body),
  remove: (id: string) => apiDelete<void>(`/devices/${id}`),
  command: (id: string, command: Record<string, unknown>) =>
    apiPost<{ status: string; shadow: BackendShadow }>(`/devices/${id}/command`, { command }),
  state: (id: string) => apiGet<BackendShadow>(`/devices/${id}/state`),
};

// ─── Nodes (ESP32 boards) + pin allocation ──────────────────────────────────────
export const NodesApi = {
  list: () => apiGet<BackendNode[]>('/nodes'),
  get: (id: string) => apiGet<BackendNodeDetail>(`/nodes/${id}`),
  pins: (id: string) => apiGet<PinMapEntry[]>(`/nodes/${id}/pins`),
  freePins: (id: string) => apiGet<number[]>(`/nodes/${id}/pins/free`),
  update: (id: string, body: Partial<{ name: string }>) =>
    apiPatch<BackendNode>(`/nodes/${id}`, body),
  remove: (id: string) => apiDelete<void>(`/nodes/${id}`),
  // Secure pairing (proof-of-possession via the node's physical BOOT button)
  pairStart: (id: string, homeId: string) =>
    apiPost<{ ttl: number }>(`/nodes/${id}/pair/start`, { homeId }),
  pairStatus: (id: string) =>
    apiGet<{ state: 'paired' | 'pending' | 'idle' }>(`/nodes/${id}/pair/status`),
  // Shared access (owner assigns/unassigns other users)
  shares: (id: string) => apiGet<BackendNodeShare[]>(`/nodes/${id}/shares`),
  addShare: (id: string, email: string) =>
    apiPost<BackendNodeShare[]>(`/nodes/${id}/shares`, { email }),
  removeShare: (id: string, userId: string) =>
    apiDelete<BackendNodeShare[]>(`/nodes/${id}/shares/${userId}`),
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
