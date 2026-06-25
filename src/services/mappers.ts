import {
  BackendDevice, BackendDeviceType, BackendScene, BackendAutomation,
  BackendRoom, BackendActivity,
} from '../api/types';
import { Device, DeviceType } from '../store/slices/devicesSlice';
import { Scene, SceneAction } from '../store/slices/scenesSlice';
import { Room } from '../store/slices/roomsSlice';
import { Automation, AutomationAction } from '../store/slices/automationsSlice';
import { ActivityEvent } from '../store/slices/activitySlice';

const COLOR_KEYS = ['accent', 'warning', 'purple', 'success', 'danger'];

// ─── Device type mapping ───────────────────────────────────────────────────────
const TYPE_TO_FRONT: Record<BackendDeviceType, DeviceType> = {
  LIGHT: 'light', FAN: 'fan', AC: 'ac', PROJECTOR: 'projector', TV: 'tv',
  RGB_LIGHT: 'strip', SENSOR: 'sensor', SMART_PLUG: 'plug', GENERIC: 'light',
};

const TYPE_TO_BACK: Record<DeviceType, BackendDeviceType> = {
  light: 'LIGHT', fan: 'FAN', ac: 'AC', projector: 'PROJECTOR', tv: 'TV',
  strip: 'RGB_LIGHT', sensor: 'SENSOR', plug: 'SMART_PLUG', lock: 'GENERIC', camera: 'GENERIC',
};

export function toBackendDeviceType(t: DeviceType): BackendDeviceType {
  return TYPE_TO_BACK[t] ?? 'GENERIC';
}

function defaultWatts(type: DeviceType): number {
  switch (type) {
    case 'ac': return 1200;
    case 'projector': return 300;
    case 'tv': return 150;
    case 'fan': return 75;
    case 'light': return 20;
    case 'strip': return 18;
    default: return 10;
  }
}

// ─── Devices ───────────────────────────────────────────────────────────────────
export function mapDevice(bd: BackendDevice, roomNameById: Record<string, string>): Device {
  const reported = bd.state?.reportedState ?? {};
  const desired = bd.state?.desiredState ?? {};
  const get = (k: string) => (reported[k] !== undefined ? reported[k] : desired[k]);
  const type = TYPE_TO_FRONT[bd.deviceType] ?? 'light';

  return {
    id: bd.id,
    name: bd.name,
    room: roomNameById[bd.roomId] ?? 'Home',
    type,
    isOn: Boolean(get('power') ?? false),
    brightness: Number(get('brightness') ?? 100),
    temperature: Number(get('temperature') ?? get('colorTemp') ?? (type === 'ac' ? 24 : 4000)),
    color: String(get('color') ?? '#5b8cff'),
    powerWatts: Number(get('energyWatts') ?? defaultWatts(type)),
    isOnline: bd.online,
    isFavorite: false,
    addedAt: bd.createdAt,
  };
}

/** Frontend device-control intent → backend shadow command. */
export function controlToCommand(
  type: DeviceType,
  intent: { power?: boolean; brightness?: number; temperature?: number },
): Record<string, unknown> {
  const cmd: Record<string, unknown> = {};
  if (intent.power !== undefined) cmd.power = intent.power;
  if (intent.brightness !== undefined) cmd.brightness = intent.brightness;
  if (intent.temperature !== undefined) {
    // Lights/strips express "temperature" as color temperature (Kelvin);
    // climate devices use it literally.
    if (type === 'light' || type === 'strip') cmd.colorTemp = intent.temperature;
    else cmd.temperature = intent.temperature;
  }
  return cmd;
}

// ─── Rooms ─────────────────────────────────────────────────────────────────────
export function mapRooms(rooms: BackendRoom[], devices: BackendDevice[]): Room[] {
  return rooms.map((r, i) => ({
    id: r.id,
    name: r.name,
    temperature: 22,
    humidity: 45,
    deviceIds: devices.filter((d) => d.roomId === r.id).map((d) => d.id),
    colorKey: COLOR_KEYS[i % COLOR_KEYS.length],
  }));
}

export function roomNameMap(rooms: BackendRoom[]): Record<string, string> {
  return rooms.reduce<Record<string, string>>((acc, r) => { acc[r.id] = r.name; return acc; }, {});
}

// ─── Scenes ────────────────────────────────────────────────────────────────────
function commandToActions(deviceId: string, command: Record<string, any>): SceneAction[] {
  const actions: SceneAction[] = [];
  if ('brightness' in command) actions.push({ deviceId, action: 'setBrightness', value: command.brightness });
  if ('temperature' in command) actions.push({ deviceId, action: 'setTemperature', value: command.temperature });
  if ('colorTemp' in command) actions.push({ deviceId, action: 'setTemperature', value: command.colorTemp });
  if (actions.length === 0) {
    actions.push({ deviceId, action: command.power ? 'turnOn' : 'turnOff' });
  }
  return actions;
}

export function mapScene(bs: BackendScene, index: number): Scene {
  const devs = bs.configuration?.devices ?? [];
  const actions = devs.flatMap((d) => commandToActions(d.deviceId, d.command));
  return {
    id: bs.id,
    name: bs.name,
    description: `${devs.length} device${devs.length !== 1 ? 's' : ''}`,
    colorKey: COLOR_KEYS[index % COLOR_KEYS.length],
    isActive: false,
    actions,
    deviceCount: new Set(devs.map((d) => d.deviceId)).size,
    createdAt: bs.createdAt,
  };
}

export function sceneActionsToConfig(actions: SceneAction[]): BackendScene['configuration'] {
  const byDevice: Record<string, Record<string, unknown>> = {};
  for (const a of actions) {
    const cmd = byDevice[a.deviceId] ?? {};
    if (a.action === 'turnOn') cmd.power = true;
    else if (a.action === 'turnOff') cmd.power = false;
    else if (a.action === 'setBrightness') { cmd.power = true; cmd.brightness = a.value; }
    else if (a.action === 'setTemperature') { cmd.power = true; cmd.temperature = a.value; }
    byDevice[a.deviceId] = cmd;
  }
  return { devices: Object.entries(byDevice).map(([deviceId, command]) => ({ deviceId, command })) };
}

// ─── Automations ───────────────────────────────────────────────────────────────
export function mapAutomation(ba: BackendAutomation): Automation {
  const cfg = ba.config ?? {};
  return {
    id: ba.id,
    name: ba.name,
    type: ba.type.toLowerCase() as Automation['type'],
    isEnabled: ba.enabled,
    schedule: cfg.schedule,
    sensor: cfg.sensor,
    mode: cfg.mode,
    actions: (ba.actions ?? []) as AutomationAction[],
    createdAt: ba.createdAt,
    lastTriggered: ba.lastTriggered ?? undefined,
    triggerCount: ba.triggerCount,
  };
}

export function automationToBackend(a: Automation): {
  name: string; type: BackendAutomation['type'];
  enabled: boolean; config: Record<string, unknown>; actions: Record<string, unknown>[];
} {
  const config: Record<string, unknown> = {};
  if (a.schedule) config.schedule = a.schedule;
  if (a.sensor) config.sensor = a.sensor;
  if (a.mode) config.mode = a.mode;
  return {
    name: a.name,
    type: a.type.toUpperCase() as BackendAutomation['type'],
    enabled: a.isEnabled,
    config,
    actions: a.actions as unknown as Record<string, unknown>[],
  };
}

// ─── Activity ──────────────────────────────────────────────────────────────────
export function mapActivity(ba: BackendActivity): ActivityEvent {
  const allowed = ['security', 'automation', 'devices'];
  const category = (allowed.includes(ba.category) ? ba.category : 'devices') as ActivityEvent['category'];
  const date = new Date(ba.createdAt);
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return { id: ba.id, title: ba.title, subtitle: ba.subtitle, category, time, read: true };
}
