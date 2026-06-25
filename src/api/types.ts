// ─── Backend DTO shapes (mirror the NestJS API contracts) ──────────────────────

export type BackendDeviceType =
  | 'LIGHT' | 'FAN' | 'AC' | 'PROJECTOR' | 'TV'
  | 'RGB_LIGHT' | 'SENSOR' | 'SMART_PLUG' | 'GENERIC';

export type BackendAutomationType = 'SCHEDULE' | 'SENSOR' | 'MODE';

export interface BackendUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: BackendUser;
}

export interface BackendHome {
  id: string;
  ownerId: string;
  name: string;
  createdAt: string;
}

export interface BackendRoom {
  id: string;
  homeId: string;
  name: string;
  createdAt: string;
}

export interface BackendDeviceState {
  desiredState: Record<string, any>;
  reportedState: Record<string, any>;
  updatedAt: string;
}

export interface BackendDevice {
  id: string;
  roomId: string;
  name: string;
  deviceType: BackendDeviceType;
  mqttTopic: string | null;
  firmwareVersion: string | null;
  online: boolean;
  createdAt: string;
  updatedAt: string;
  state?: BackendDeviceState | null;
}

export interface BackendShadow {
  deviceId: string;
  desiredState: Record<string, any>;
  reportedState: Record<string, any>;
  delta: Record<string, any>;
  updatedAt: string;
}

export interface BackendScene {
  id: string;
  homeId: string;
  name: string;
  configuration: { devices: { deviceId: string; command: Record<string, any> }[] };
  createdAt: string;
  updatedAt: string;
}

export interface BackendAutomation {
  id: string;
  homeId: string;
  name: string;
  type: BackendAutomationType;
  enabled: boolean;
  config: Record<string, any>;
  actions: Record<string, any>[];
  triggerCount: number;
  lastTriggered: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackendActivity {
  id: string;
  homeId: string;
  title: string;
  subtitle: string;
  category: string;
  createdAt: string;
}
