import { AppThunk } from '../store/store';
import {
  HomesApi, RoomsApi, DevicesApi, ScenesApi, AutomationsApi, ActivityApi,
} from '../api/resources';
import {
  mapDevice, mapRooms, mapScene, mapAutomation, mapActivity, roomNameMap,
  sceneActionsToConfig, automationToBackend, toBackendDeviceType,
} from './mappers';
import {
  hydrateDevices, addDevice as addDeviceLocal, removeDevice as removeDeviceLocal,
} from '../store/slices/devicesSlice';
import { hydrateScenes, replaceSceneId } from '../store/slices/scenesSlice';
import { hydrateRooms } from '../store/slices/roomsSlice';
import { hydrateAutomations, replaceAutomationId } from '../store/slices/automationsSlice';
import { hydrateActivity } from '../store/slices/activitySlice';
import { setActiveHome, setServerReachable } from '../store/slices/authSlice';
import { Scene } from '../store/slices/scenesSlice';
import { Automation } from '../store/slices/automationsSlice';
import { Device, DeviceType } from '../store/slices/devicesSlice';

/** Full hydrate of all slices from the backend for the active home. */
export function bootstrapSync(): AppThunk<Promise<void>> {
  return async (dispatch, getState) => {
    const { auth } = getState();
    if (!auth.token) return;

    try {
      let homes = await HomesApi.list();
      if (homes.length === 0) {
        homes = [await HomesApi.create('My Home')];
      }
      const homeId =
        auth.activeHomeId && homes.some((h) => h.id === auth.activeHomeId)
          ? auth.activeHomeId
          : homes[0].id;
      dispatch(setActiveHome(homeId));

      const [rooms, devices, scenes, automations, activity] = await Promise.all([
        RoomsApi.list(homeId),
        DevicesApi.list(homeId),
        ScenesApi.list(homeId),
        AutomationsApi.list(homeId),
        ActivityApi.list(homeId),
      ]);

      const nameMap = roomNameMap(rooms);
      dispatch(hydrateRooms(mapRooms(rooms, devices)));
      dispatch(hydrateDevices(devices.map((d) => mapDevice(d, nameMap))));
      dispatch(hydrateScenes(scenes.map((s, i) => mapScene(s, i))));
      dispatch(hydrateAutomations(automations.map(mapAutomation)));
      dispatch(hydrateActivity(activity.map(mapActivity)));
      dispatch(setServerReachable(true));
    } catch (e) {
      // Backend unreachable — stay on locally-persisted data (offline-first).
      dispatch(setServerReachable(false));
      console.warn('[sync] bootstrap failed:', (e as Error).message);
    }
  };
}

function activeHomeId(getState: () => any): string | null {
  return getState().auth.activeHomeId;
}
function isSynced(getState: () => any): boolean {
  const s = getState().auth;
  return s.status === 'authenticated' && !!s.token;
}

// ─── Automations ───────────────────────────────────────────────────────────────
export function pushCreateAutomation(local: Automation): AppThunk<Promise<void>> {
  return async (dispatch, getState) => {
    const homeId = activeHomeId(getState);
    if (!isSynced(getState) || !homeId) return;
    try {
      const body = automationToBackend(local);
      const created = await AutomationsApi.create({ homeId, ...body });
      dispatch(replaceAutomationId({ tempId: local.id, serverId: created.id }));
    } catch (e) {
      console.warn('[sync] create automation failed:', (e as Error).message);
    }
  };
}

export function pushUpdateAutomation(local: Automation): AppThunk<Promise<void>> {
  return async (_dispatch, getState) => {
    if (!isSynced(getState)) return;
    try {
      await AutomationsApi.update(local.id, automationToBackend(local));
    } catch (e) {
      console.warn('[sync] update automation failed:', (e as Error).message);
    }
  };
}

export function pushToggleAutomation(id: string): AppThunk<Promise<void>> {
  return async (_dispatch, getState) => {
    if (!isSynced(getState)) return;
    try {
      await AutomationsApi.toggle(id);
    } catch (e) {
      console.warn('[sync] toggle automation failed:', (e as Error).message);
    }
  };
}

export function pushDeleteAutomation(id: string): AppThunk<Promise<void>> {
  return async (_dispatch, getState) => {
    if (!isSynced(getState)) return;
    try {
      await AutomationsApi.remove(id);
    } catch (e) {
      console.warn('[sync] delete automation failed:', (e as Error).message);
    }
  };
}

// ─── Scenes ────────────────────────────────────────────────────────────────────
export function pushCreateScene(local: Scene): AppThunk<Promise<void>> {
  return async (dispatch, getState) => {
    const homeId = activeHomeId(getState);
    if (!isSynced(getState) || !homeId) return;
    try {
      const created = await ScenesApi.create({
        homeId,
        name: local.name,
        configuration: sceneActionsToConfig(local.actions),
      });
      dispatch(replaceSceneId({ tempId: local.id, serverId: created.id }));
    } catch (e) {
      console.warn('[sync] create scene failed:', (e as Error).message);
    }
  };
}

// ─── Devices ───────────────────────────────────────────────────────────────────
export function pushCreateDevice(
  local: Omit<Device, 'addedAt'>,
  roomId: string,
): AppThunk<Promise<void>> {
  return async (dispatch, getState) => {
    if (!isSynced(getState)) return;
    try {
      const created = await DevicesApi.create({
        name: local.name,
        roomId,
        deviceType: toBackendDeviceType(local.type as DeviceType),
      });
      // Swap the optimistic local id for the server id so future commands route.
      dispatch(removeDeviceLocal(local.id));
      dispatch(addDeviceLocal({ ...local, id: created.id }));
    } catch (e) {
      console.warn('[sync] create device failed:', (e as Error).message);
    }
  };
}

export function pushDeleteDevice(id: string): AppThunk<Promise<void>> {
  return async (_dispatch, getState) => {
    if (!isSynced(getState)) return;
    try {
      await DevicesApi.remove(id);
    } catch (e) {
      console.warn('[sync] delete device failed:', (e as Error).message);
    }
  };
}

// ─── Activity refresh ──────────────────────────────────────────────────────────
export function refreshActivity(): AppThunk<Promise<void>> {
  return async (dispatch, getState) => {
    const homeId = activeHomeId(getState);
    if (!isSynced(getState) || !homeId) return;
    try {
      const activity = await ActivityApi.list(homeId);
      dispatch(hydrateActivity(activity.map(mapActivity)));
    } catch {
      /* ignore */
    }
  };
}
