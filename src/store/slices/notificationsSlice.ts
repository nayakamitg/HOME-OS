import { createSlice, PayloadAction, nanoid } from '@reduxjs/toolkit';

export type NotificationKind = 'device' | 'scene' | 'automation' | 'info';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  kind: NotificationKind;
  createdAt: string;
  read: boolean;
}

interface NotificationsState {
  items: AppNotification[];
  /** The most recently pushed notification — drives the transient toast. */
  toast: AppNotification | null;
}

const initialState: NotificationsState = {
  items: [],
  toast: null,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    notify: {
      reducer(state, action: PayloadAction<AppNotification>) {
        state.items.unshift(action.payload);
        if (state.items.length > 50) state.items.length = 50;
        state.toast = action.payload;
      },
      prepare(payload: { title: string; body: string; kind?: NotificationKind }) {
        return {
          payload: {
            id: nanoid(),
            title: payload.title,
            body: payload.body,
            kind: payload.kind ?? 'info',
            createdAt: new Date().toISOString(),
            read: false,
          } as AppNotification,
        };
      },
    },
    dismissToast(state) {
      state.toast = null;
    },
    markAllRead(state) {
      state.items.forEach((n) => { n.read = true; });
    },
    clearNotifications(state) {
      state.items = [];
      state.toast = null;
    },
  },
});

export const { notify, dismissToast, markAllRead, clearNotifications } = notificationsSlice.actions;
export default notificationsSlice.reducer;
