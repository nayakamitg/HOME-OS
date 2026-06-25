import { Middleware } from 'redux';
import type { RootState } from './store';
import { DevicesApi, ScenesApi } from '../api/resources';
import { controlToCommand } from '../services/mappers';
import { notify } from './slices/notificationsSlice';

/**
 * Builds a user-facing notification for control actions (device on/off,
 * scene/mode change, automation setup). Runs on the post-reducer state so
 * it reflects the new values. Returns null when the action shouldn't notify.
 */
function buildNotification(action: any, state: RootState):
  | { title: string; body: string; kind: 'device' | 'scene' | 'automation' } | null {
  const devices = state.devices.devices;
  const find = (id: string) => devices.find((d) => d.id === id);

  switch (action.type) {
    case 'devices/toggleDevice': {
      const d = find(action.payload);
      if (!d) return null;
      return { title: d.name, body: `Turned ${d.isOn ? 'on' : 'off'} · ${d.room}`, kind: 'device' };
    }
    case 'devices/setDeviceOn': {
      const d = find(action.payload.id);
      if (!d) return null;
      return { title: d.name, body: `Turned ${action.payload.isOn ? 'on' : 'off'} · ${d.room}`, kind: 'device' };
    }
    case 'scenes/runScene': {
      const scene = state.scenes.scenes.find((s) => s.id === action.payload);
      if (!scene) return null;
      return { title: `${scene.name} activated`, body: scene.description || 'Scene applied', kind: 'scene' };
    }
    case 'automations/addAutomation': {
      return { title: 'Automation created', body: `${action.payload.name} is now active`, kind: 'automation' };
    }
    case 'automations/toggleAutomation': {
      const a = state.automations.automations.find((x) => x.id === action.payload);
      if (!a) return null;
      return { title: a.name, body: `Automation ${a.isEnabled ? 'enabled' : 'disabled'}`, kind: 'automation' };
    }
    default:
      return null;
  }
}

/**
 * Bridges optimistic local Redux mutations to the backend. The UI updates
 * instantly (slice reducers already ran); this fires the matching API call
 * in the background. Only active when authenticated — in offline mode the
 * app stays fully local.
 */

const debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};

function debounce(key: string, ms: number, fn: () => void) {
  if (debounceTimers[key]) clearTimeout(debounceTimers[key]);
  debounceTimers[key] = setTimeout(fn, ms);
}

function sendCommand(deviceId: string, command: Record<string, unknown>) {
  DevicesApi.command(deviceId, command).catch((e) => {
    console.warn(`[sync] device command failed (${deviceId}):`, e?.message ?? e);
  });
}

export const controlSyncMiddleware: Middleware = (store) => (next) => (action: any) => {
  const result = next(action);

  const state = store.getState() as RootState;

  // In-app notifications fire in every mode (online or offline demo).
  const note = buildNotification(action, state);
  if (note) store.dispatch(notify(note));

  if (state.auth.status !== 'authenticated' || !state.auth.token) {
    return result;
  }

  const devices = state.devices.devices;
  const findDevice = (id: string) => devices.find((d) => d.id === id);

  switch (action.type) {
    case 'devices/toggleDevice': {
      const dev = findDevice(action.payload);
      if (dev) sendCommand(dev.id, { power: dev.isOn });
      break;
    }
    case 'devices/setDeviceOn': {
      const { id, isOn } = action.payload;
      sendCommand(id, { power: isOn });
      break;
    }
    case 'devices/setDeviceBrightness': {
      const { id } = action.payload;
      debounce(`bri:${id}`, 400, () => {
        const dev = findDevice(id);
        if (dev) sendCommand(id, { power: true, brightness: dev.brightness });
      });
      break;
    }
    case 'devices/setDeviceTemperature': {
      const { id } = action.payload;
      debounce(`temp:${id}`, 400, () => {
        const dev = findDevice(id);
        if (dev) sendCommand(id, controlToCommand(dev.type, { power: true, temperature: dev.temperature }));
      });
      break;
    }
    case 'scenes/runScene': {
      const sceneId = action.payload as string;
      // Only execute server-side if this is a synced (server) scene.
      if (state.scenes.scenes.some((s) => s.id === sceneId)) {
        ScenesApi.execute(sceneId).catch((e) =>
          console.warn(`[sync] scene execute failed (${sceneId}):`, e?.message ?? e),
        );
      }
      break;
    }
    default:
      break;
  }

  return result;
};
