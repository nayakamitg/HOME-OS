import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ActivityCategory = 'all' | 'security' | 'automation' | 'devices';

export interface ActivityEvent {
  id: string;
  title: string;
  subtitle: string;
  category: Exclude<ActivityCategory, 'all'>;
  time: string;
  read: boolean;
}

interface ActivityState {
  events: ActivityEvent[];
  filter: ActivityCategory;
}

const initialEvents: ActivityEvent[] = [
  { id: '1', title: 'Movie Mode activated', subtitle: 'Scene applied to 5 devices', category: 'automation', time: '9:41 PM', read: true },
  { id: '2', title: 'Motion detected', subtitle: 'Front door camera · 2 min ago', category: 'security', time: '9:39 PM', read: false },
  { id: '3', title: 'AC temperature changed', subtitle: 'Set to 24°C · Living Room', category: 'devices', time: '9:22 PM', read: true },
  { id: '4', title: 'Sleep automation triggered', subtitle: 'Turned off 6 devices at 11:00 PM', category: 'automation', time: '11:00 PM', read: true },
  { id: '5', title: 'Front door locked', subtitle: 'Auto-lock activated', category: 'security', time: '8:14 PM', read: true },
];

const initialState: ActivityState = {
  events: initialEvents,
  filter: 'all',
};

const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    addEvent(state, action: PayloadAction<Omit<ActivityEvent, 'id' | 'read' | 'time'>>) {
      const now = new Date();
      const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      state.events.unshift({
        ...action.payload,
        id: Date.now().toString(),
        time,
        read: false,
      });
    },
    markRead(state, action: PayloadAction<string>) {
      const e = state.events.find(e => e.id === action.payload);
      if (e) e.read = true;
    },
    markAllRead(state) {
      state.events.forEach(e => { e.read = true; });
    },
    setFilter(state, action: PayloadAction<ActivityCategory>) {
      state.filter = action.payload;
    },
    hydrateActivity(state, action: PayloadAction<ActivityEvent[]>) {
      state.events = action.payload;
    },
  },
});

export const { addEvent, markRead, markAllRead, setFilter, hydrateActivity } = activitySlice.actions;
export default activitySlice.reducer;
