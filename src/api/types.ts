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
  nodeId: string | null;
  gpioPin: number | null;
  activeHigh: boolean;
  createdAt: string;
  updatedAt: string;
  state?: BackendDeviceState | null;
}

// ─── Nodes (ESP32 boards) + pin allocation ──────────────────────────────────────
export interface BackendNode {
  id: string;            // MAC-based nodeId
  homeId: string | null; // null = unclaimed
  name: string;
  board: string;
  firmware: string | null;
  ip: string | null;
  online: boolean;
  configVersion: number;
  lastSeen: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { devices: number };
  // Relationship of the CURRENT user to this node (computed server-side).
  ownerId?: string | null;
  ownerName?: string | null;
  ownedByMe?: boolean;
  sharedWithMe?: boolean;
}

export interface BackendNodeDevice {
  id: string;
  name: string;
  deviceType: BackendDeviceType;
  gpioPin: number | null;
  activeHigh: boolean;
  roomId: string;
  online: boolean;
  // Live reported state + who owns the device (a shared node can carry
  // devices from several users; you only control your own).
  on?: boolean;
  ownerId?: string;
  ownerName?: string;
  mine?: boolean;
}

export interface BackendNodeShare {
  userId: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface BackendNodeDetail extends BackendNode {
  devices: BackendNodeDevice[];
}

export interface GpioCapability {
  gpio: number;
  output: boolean;
  inputOnly: boolean;
  adc: boolean;
  strapping: boolean;
  reserved: boolean;
  note?: string;
}

export interface PinMapEntry {
  gpio: number;
  capability: GpioCapability;
  selectable: boolean;
  allocated: boolean;
  role: 'device' | null;
  deviceId: string | null;
  deviceName: string | null;
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
