import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AutomationType = 'schedule' | 'sensor' | 'mode';

export type RepeatMode = 'once' | 'everyday' | 'weekdays' | 'weekends' | 'custom';

export type SensorTriggerType =
  | 'motion_detected'
  | 'no_motion'
  | 'temp_above'
  | 'temp_below'
  | 'humidity_above'
  | 'humidity_below'
  | 'light_on'
  | 'light_off'
  | 'door_open'
  | 'door_closed';

export type ModeTrigger = 'on_activate' | 'on_deactivate';

export interface ScheduleConfig {
  time: string;           // "22:00"
  repeat: RepeatMode;
  days: string[];         // ['mon','tue','wed','thu','fri','sat','sun']
  specificDate?: string;  // ISO date string for 'once'
}

export interface SensorConfig {
  sensorDeviceId: string;
  triggerType: SensorTriggerType;
  thresholdValue?: number;   // for temp/humidity
  delaySeconds?: number;     // wait N seconds before firing
}

export interface ModeConfig {
  sceneId: string;
  trigger: ModeTrigger;
}

export interface AutomationAction {
  deviceId: string;
  action: 'turnOn' | 'turnOff' | 'setBrightness' | 'setTemperature' | 'toggle';
  value?: number;
  delaySeconds?: number;
}

export interface Automation {
  id: string;
  name: string;
  type: AutomationType;
  isEnabled: boolean;
  schedule?: ScheduleConfig;
  sensor?: SensorConfig;
  mode?: ModeConfig;
  actions: AutomationAction[];
  createdAt: string;
  lastTriggered?: string;
  triggerCount: number;
}

export interface AutomationsState {
  automations: Automation[];
}

const initialAutomations: Automation[] = [
  {
    id: 'auto-sleep-lights',
    name: 'Bedtime Lights Off',
    type: 'schedule',
    isEnabled: true,
    schedule: { time: '23:00', repeat: 'everyday', days: ['mon','tue','wed','thu','fri','sat','sun'] },
    actions: [
      { deviceId: 'livingLamp', action: 'turnOff' },
      { deviceId: 'ceiling', action: 'turnOff' },
      { deviceId: 'rgb', action: 'turnOff' },
    ],
    createdAt: new Date().toISOString(),
    triggerCount: 12,
  },
  {
    id: 'auto-morning',
    name: 'Good Morning',
    type: 'schedule',
    isEnabled: true,
    schedule: { time: '07:00', repeat: 'weekdays', days: ['mon','tue','wed','thu','fri'] },
    actions: [
      { deviceId: 'ceiling', action: 'setBrightness', value: 80 },
      { deviceId: 'ac', action: 'setTemperature', value: 24 },
      { deviceId: 'kitchen-light', action: 'turnOn' },
    ],
    createdAt: new Date().toISOString(),
    triggerCount: 8,
  },
  {
    id: 'auto-motion-hall',
    name: 'Motion → Hall Light',
    type: 'sensor',
    isEnabled: true,
    sensor: { sensorDeviceId: 'livingLamp', triggerType: 'motion_detected', delaySeconds: 0 },
    actions: [
      { deviceId: 'ceiling', action: 'turnOn' },
      { deviceId: 'livingLamp', action: 'setBrightness', value: 60 },
    ],
    createdAt: new Date().toISOString(),
    triggerCount: 34,
  },
  {
    id: 'auto-temp-ac',
    name: 'High Temp → Start AC',
    type: 'sensor',
    isEnabled: false,
    sensor: { sensorDeviceId: 'ac', triggerType: 'temp_above', thresholdValue: 28 },
    actions: [
      { deviceId: 'ac', action: 'turnOn' },
      { deviceId: 'fan', action: 'turnOn' },
    ],
    createdAt: new Date().toISOString(),
    triggerCount: 5,
  },
  {
    id: 'auto-movie-mode',
    name: 'Movie → Dim Everything',
    type: 'mode',
    isEnabled: true,
    mode: { sceneId: 'movie', trigger: 'on_activate' },
    actions: [
      { deviceId: 'ceiling', action: 'setBrightness', value: 8 },
      { deviceId: 'livingLamp', action: 'turnOff' },
      { deviceId: 'projector', action: 'turnOn', delaySeconds: 2 },
    ],
    createdAt: new Date().toISOString(),
    triggerCount: 7,
  },
  {
    id: 'auto-sleep-mode',
    name: 'Sleep Mode → All Off',
    type: 'mode',
    isEnabled: true,
    mode: { sceneId: 'sleep', trigger: 'on_activate' },
    actions: [
      { deviceId: 'tv', action: 'turnOff' },
      { deviceId: 'rgb', action: 'turnOff' },
      { deviceId: 'fan', action: 'turnOn' },
      { deviceId: 'ac', action: 'setTemperature', value: 22 },
    ],
    createdAt: new Date().toISOString(),
    triggerCount: 20,
  },
];

const initialState: AutomationsState = { automations: initialAutomations };

const automationsSlice = createSlice({
  name: 'automations',
  initialState,
  reducers: {
    addAutomation(state, action: PayloadAction<Omit<Automation, 'createdAt' | 'triggerCount'>>) {
      state.automations.push({ ...action.payload, createdAt: new Date().toISOString(), triggerCount: 0 });
    },
    updateAutomation(state, action: PayloadAction<Partial<Automation> & { id: string }>) {
      const a = state.automations.find(a => a.id === action.payload.id);
      if (a) Object.assign(a, action.payload);
    },
    toggleAutomation(state, action: PayloadAction<string>) {
      const a = state.automations.find(a => a.id === action.payload);
      if (a) a.isEnabled = !a.isEnabled;
    },
    deleteAutomation(state, action: PayloadAction<string>) {
      state.automations = state.automations.filter(a => a.id !== action.payload);
    },
    recordTrigger(state, action: PayloadAction<string>) {
      const a = state.automations.find(a => a.id === action.payload);
      if (a) {
        a.triggerCount += 1;
        a.lastTriggered = new Date().toISOString();
      }
    },
    hydrateAutomations(state, action: PayloadAction<Automation[]>) {
      state.automations = action.payload;
    },
    replaceAutomationId(state, action: PayloadAction<{ tempId: string; serverId: string }>) {
      const a = state.automations.find(a => a.id === action.payload.tempId);
      if (a) a.id = action.payload.serverId;
    },
  },
});

export const {
  addAutomation, updateAutomation, toggleAutomation, deleteAutomation, recordTrigger,
  hydrateAutomations, replaceAutomationId,
} = automationsSlice.actions;
export default automationsSlice.reducer;
