import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Smart devices: multi-switch boards shown in the Dashboard's horizontal
 * "Smart Devices" rail. Each carries its own bank of switches (local state,
 * persisted) — e.g. the 10-gang "Office Board".
 */
export interface SmartDevice {
  id: string;
  name: string;
  room: string;
  switches: boolean[];
}

export interface SmartDevicesState {
  items: SmartDevice[];
}

const initialState: SmartDevicesState = {
  items: [
    {
      id: 'office-board',
      name: 'Office Board',
      room: 'Office',
      switches: Array(10).fill(false),
    },
  ],
};

const smartDevicesSlice = createSlice({
  name: 'smartDevices',
  initialState,
  reducers: {
    toggleSwitch(state, action: PayloadAction<{ deviceId: string; index: number }>) {
      const dev = state.items.find((d) => d.id === action.payload.deviceId);
      if (dev && action.payload.index >= 0 && action.payload.index < dev.switches.length) {
        dev.switches[action.payload.index] = !dev.switches[action.payload.index];
      }
    },
    setAllSwitches(state, action: PayloadAction<{ deviceId: string; value: boolean }>) {
      const dev = state.items.find((d) => d.id === action.payload.deviceId);
      if (dev) dev.switches = dev.switches.map(() => action.payload.value);
    },
  },
});

export const { toggleSwitch, setAllSwitches } = smartDevicesSlice.actions;
export default smartDevicesSlice.reducer;
