import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type DeviceType = 'light' | 'ac' | 'tv' | 'strip' | 'fan' | 'projector' | 'plug' | 'sensor' | 'lock' | 'camera';

export interface Device {
  id: string;
  name: string;
  room: string;
  type: DeviceType;
  isOn: boolean;
  brightness: number;
  temperature: number;
  color: string;
  powerWatts: number;
  isOnline: boolean;
  isFavorite: boolean;
  addedAt: string;
}

interface DevicesState {
  devices: Device[];
  discoveredDevices: DiscoveredDevice[];
  isScanning: boolean;
}

export interface DiscoveredDevice {
  id: string;
  name: string;
  type: DeviceType;
  protocol: string;
  signal: number;
}

const initialDevices: Device[] = [
  { id: 'livingLamp', name: 'Floor Lamp', room: 'Living Room', type: 'light', isOn: true, brightness: 80, temperature: 3000, color: '#f0c267', powerWatts: 8, isOnline: true, isFavorite: true, addedAt: new Date().toISOString() },
  { id: 'ac', name: 'Air Conditioner', room: 'Living Room', type: 'ac', isOn: true, brightness: 100, temperature: 24, color: '#5b8cff', powerWatts: 1200, isOnline: true, isFavorite: true, addedAt: new Date().toISOString() },
  { id: 'tv', name: 'Smart TV', room: 'Living Room', type: 'tv', isOn: false, brightness: 70, temperature: 6500, color: '#5b8cff', powerWatts: 150, isOnline: true, isFavorite: true, addedAt: new Date().toISOString() },
  { id: 'rgb', name: 'RGB Strip', room: 'Living Room', type: 'strip', isOn: true, brightness: 60, temperature: 4000, color: '#c8a2ff', powerWatts: 18, isOnline: true, isFavorite: true, addedAt: new Date().toISOString() },
  { id: 'ceiling', name: 'Ceiling Lights', room: 'Living Room', type: 'light', isOn: true, brightness: 100, temperature: 4000, color: '#f0c267', powerWatts: 24, isOnline: true, isFavorite: false, addedAt: new Date().toISOString() },
  { id: 'fan', name: 'Ceiling Fan', room: 'Living Room', type: 'fan', isOn: false, brightness: 50, temperature: 25, color: '#5b8cff', powerWatts: 75, isOnline: true, isFavorite: false, addedAt: new Date().toISOString() },
  { id: 'projector', name: 'Projector', room: 'Living Room', type: 'projector', isOn: false, brightness: 100, temperature: 6500, color: '#c8a2ff', powerWatts: 300, isOnline: false, isFavorite: false, addedAt: new Date().toISOString() },
  { id: 'kitchen-light', name: 'Kitchen Light', room: 'Kitchen', type: 'light', isOn: true, brightness: 90, temperature: 4500, color: '#f0c267', powerWatts: 20, isOnline: true, isFavorite: false, addedAt: new Date().toISOString() },
  { id: 'bedroom-lamp', name: 'Bedside Lamp', room: 'Bedroom', type: 'light', isOn: false, brightness: 30, temperature: 2700, color: '#f0c267', powerWatts: 6, isOnline: true, isFavorite: false, addedAt: new Date().toISOString() },
];

const initialState: DevicesState = {
  devices: initialDevices,
  discoveredDevices: [],
  isScanning: false,
};

const devicesSlice = createSlice({
  name: 'devices',
  initialState,
  reducers: {
    toggleDevice(state, action: PayloadAction<string>) {
      const d = state.devices.find(d => d.id === action.payload);
      if (d) d.isOn = !d.isOn;
    },
    setDeviceOn(state, action: PayloadAction<{ id: string; isOn: boolean }>) {
      const d = state.devices.find(d => d.id === action.payload.id);
      if (d) d.isOn = action.payload.isOn;
    },
    setDeviceBrightness(state, action: PayloadAction<{ id: string; brightness: number }>) {
      const d = state.devices.find(d => d.id === action.payload.id);
      if (d) d.brightness = action.payload.brightness;
    },
    setDeviceTemperature(state, action: PayloadAction<{ id: string; temperature: number }>) {
      const d = state.devices.find(d => d.id === action.payload.id);
      if (d) d.temperature = action.payload.temperature;
    },
    addDevice(state, action: PayloadAction<Omit<Device, 'addedAt'>>) {
      state.devices.push({ ...action.payload, addedAt: new Date().toISOString() });
    },
    removeDevice(state, action: PayloadAction<string>) {
      state.devices = state.devices.filter(d => d.id !== action.payload);
    },
    toggleFavorite(state, action: PayloadAction<string>) {
      const d = state.devices.find(d => d.id === action.payload);
      if (d) d.isFavorite = !d.isFavorite;
    },
    setScanning(state, action: PayloadAction<boolean>) {
      state.isScanning = action.payload;
      if (action.payload) state.discoveredDevices = [];
    },
    hydrateDevices(state, action: PayloadAction<Device[]>) {
      // Preserve user favorites (a client-only concern) across a server sync.
      const favs = new Set(state.devices.filter(d => d.isFavorite).map(d => d.id));
      state.devices = action.payload.map(d => ({ ...d, isFavorite: favs.has(d.id) || d.isFavorite }));
    },
    applyReportedState(state, action: PayloadAction<{ id: string; state: Record<string, any> }>) {
      const d = state.devices.find(d => d.id === action.payload.id);
      if (!d) return;
      const s = action.payload.state;
      if (s.power !== undefined) d.isOn = Boolean(s.power);
      if (s.brightness !== undefined) d.brightness = Number(s.brightness);
      if (s.temperature !== undefined) d.temperature = Number(s.temperature);
      if (s.colorTemp !== undefined) d.temperature = Number(s.colorTemp);
      if (s.energyWatts !== undefined) d.powerWatts = Number(s.energyWatts);
    },
    setDeviceOnlineStatus(state, action: PayloadAction<{ id: string; online: boolean }>) {
      const d = state.devices.find(d => d.id === action.payload.id);
      if (d) d.isOnline = action.payload.online;
    },
    addDiscoveredDevice(state, action: PayloadAction<DiscoveredDevice>) {
      const exists = state.discoveredDevices.find(d => d.id === action.payload.id);
      if (!exists) state.discoveredDevices.push(action.payload);
    },
    clearDiscovered(state) {
      state.discoveredDevices = [];
    },
  },
});

export const {
  toggleDevice, setDeviceOn, setDeviceBrightness, setDeviceTemperature,
  addDevice, removeDevice, toggleFavorite, setScanning, addDiscoveredDevice, clearDiscovered,
  hydrateDevices, applyReportedState, setDeviceOnlineStatus,
} = devicesSlice.actions;

export default devicesSlice.reducer;
