import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Room {
  id: string;
  name: string;
  temperature: number;
  humidity: number;
  deviceIds: string[];
  colorKey: string;
}

export interface RoomsState {
  rooms: Room[];
}

const initialState: RoomsState = {
  rooms: [
    { id: 'living', name: 'Living Room', temperature: 22, humidity: 45, deviceIds: ['livingLamp', 'ac', 'tv', 'rgb', 'ceiling', 'fan', 'projector'], colorKey: 'accent' },
    { id: 'kitchen', name: 'Kitchen', temperature: 24, humidity: 50, deviceIds: ['kitchen-light'], colorKey: 'warning' },
    { id: 'bedroom', name: 'Bedroom', temperature: 21, humidity: 42, deviceIds: ['bedroom-lamp'], colorKey: 'purple' },
  ],
};

const roomsSlice = createSlice({
  name: 'rooms',
  initialState,
  reducers: {
    addRoom(state, action: PayloadAction<Room>) {
      state.rooms.push(action.payload);
    },
    updateRoom(state, action: PayloadAction<Partial<Room> & { id: string }>) {
      const r = state.rooms.find(r => r.id === action.payload.id);
      if (r) Object.assign(r, action.payload);
    },
    addDeviceToRoom(state, action: PayloadAction<{ roomId: string; deviceId: string }>) {
      const r = state.rooms.find(r => r.id === action.payload.roomId);
      if (r && !r.deviceIds.includes(action.payload.deviceId)) {
        r.deviceIds.push(action.payload.deviceId);
      }
    },
    hydrateRooms(state, action: PayloadAction<Room[]>) {
      state.rooms = action.payload;
    },
  },
});

export const { addRoom, updateRoom, addDeviceToRoom, hydrateRooms } = roomsSlice.actions;
export default roomsSlice.reducer;
