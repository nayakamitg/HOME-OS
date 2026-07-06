import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SceneAction {
  deviceId: string;
  action: 'turnOn' | 'turnOff' | 'setBrightness' | 'setTemperature';
  value?: number;
}

export interface Scene {
  id: string;
  name: string;
  description: string;
  colorKey: string;
  isActive: boolean;
  actions: SceneAction[];
  deviceCount: number;
  createdAt: string;
}

export interface ScenesState {
  scenes: Scene[];
  activeSceneId: string | null;
}

const initialScenes: Scene[] = [
  {
    id: 'evening',
    name: 'Evening',
    description: 'Warm lights · low brightness',
    colorKey: 'warning',
    isActive: true,
    actions: [
      { deviceId: 'livingLamp', action: 'turnOn' },
      { deviceId: 'ceiling', action: 'setBrightness', value: 40 },
      { deviceId: 'rgb', action: 'turnOn' },
    ],
    deviceCount: 3,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'movie',
    name: 'Movie Mode',
    description: 'Dim lights · projector on',
    colorKey: 'purple',
    isActive: false,
    actions: [
      { deviceId: 'livingLamp', action: 'turnOff' },
      { deviceId: 'ceiling', action: 'setBrightness', value: 10 },
      { deviceId: 'tv', action: 'turnOn' },
      { deviceId: 'projector', action: 'turnOn' },
      { deviceId: 'rgb', action: 'turnOn' },
    ],
    deviceCount: 5,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sleep',
    name: 'Sleep',
    description: 'All lights off · AC 22°',
    colorKey: 'accent',
    isActive: false,
    actions: [
      { deviceId: 'livingLamp', action: 'turnOff' },
      { deviceId: 'ceiling', action: 'turnOff' },
      { deviceId: 'tv', action: 'turnOff' },
      { deviceId: 'rgb', action: 'turnOff' },
      { deviceId: 'ac', action: 'setTemperature', value: 22 },
      { deviceId: 'bedroom-lamp', action: 'turnOff' },
    ],
    deviceCount: 6,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'work',
    name: 'Work',
    description: 'Bright lights · AC 24°',
    colorKey: 'warning',
    isActive: false,
    actions: [
      { deviceId: 'ceiling', action: 'setBrightness', value: 100 },
      { deviceId: 'kitchen-light', action: 'turnOn' },
      { deviceId: 'ac', action: 'setTemperature', value: 24 },
    ],
    deviceCount: 3,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'gaming',
    name: 'Gaming',
    description: 'RGB · TV on',
    colorKey: 'success',
    isActive: false,
    actions: [
      { deviceId: 'rgb', action: 'turnOn' },
      { deviceId: 'tv', action: 'turnOn' },
      { deviceId: 'ceiling', action: 'setBrightness', value: 20 },
    ],
    deviceCount: 3,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vacation',
    name: 'Vacation',
    description: 'Away mode · all off',
    colorKey: 'danger',
    isActive: false,
    actions: [
      { deviceId: 'livingLamp', action: 'turnOff' },
      { deviceId: 'ceiling', action: 'turnOff' },
      { deviceId: 'tv', action: 'turnOff' },
      { deviceId: 'rgb', action: 'turnOff' },
      { deviceId: 'ac', action: 'turnOff' },
      { deviceId: 'fan', action: 'turnOff' },
    ],
    deviceCount: 6,
    createdAt: new Date().toISOString(),
  },
];

const initialState: ScenesState = {
  scenes: initialScenes,
  activeSceneId: 'evening',
};

const scenesSlice = createSlice({
  name: 'scenes',
  initialState,
  reducers: {
    runScene(state, action: PayloadAction<string>) {
      state.scenes.forEach(s => { s.isActive = s.id === action.payload; });
      state.activeSceneId = action.payload;
    },
    stopScene(state) {
      state.scenes.forEach(s => { s.isActive = false; });
      state.activeSceneId = null;
    },
    addScene(state, action: PayloadAction<Omit<Scene, 'createdAt' | 'isActive'>>) {
      state.scenes.push({ ...action.payload, isActive: false, createdAt: new Date().toISOString() });
    },
    updateScene(state, action: PayloadAction<Partial<Scene> & { id: string }>) {
      const s = state.scenes.find(s => s.id === action.payload.id);
      if (s) Object.assign(s, action.payload);
    },
    deleteScene(state, action: PayloadAction<string>) {
      state.scenes = state.scenes.filter(s => s.id !== action.payload);
      if (state.activeSceneId === action.payload) state.activeSceneId = null;
    },
    hydrateScenes(state, action: PayloadAction<Scene[]>) {
      state.scenes = action.payload;
      state.activeSceneId = null;
    },
    replaceSceneId(state, action: PayloadAction<{ tempId: string; serverId: string }>) {
      const s = state.scenes.find(s => s.id === action.payload.tempId);
      if (s) s.id = action.payload.serverId;
      if (state.activeSceneId === action.payload.tempId) state.activeSceneId = action.payload.serverId;
    },
  },
});

export const {
  runScene, stopScene, addScene, updateScene, deleteScene, hydrateScenes, replaceSceneId,
} = scenesSlice.actions;
export default scenesSlice.reducer;
