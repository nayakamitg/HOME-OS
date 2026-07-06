import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';

import devicesReducer from './slices/devicesSlice';
import scenesReducer from './slices/scenesSlice';
import activityReducer from './slices/activitySlice';
import assistantReducer from './slices/assistantSlice';
import roomsReducer from './slices/roomsSlice';
import automationsReducer from './slices/automationsSlice';
import authReducer from './slices/authSlice';
import notificationsReducer from './slices/notificationsSlice';
import smartDevicesReducer from './slices/smartDevicesSlice';
import { controlSyncMiddleware } from './controlSyncMiddleware';

const rootReducer = combineReducers({
  devices: devicesReducer,
  scenes: scenesReducer,
  activity: activityReducer,
  assistant: assistantReducer,
  rooms: roomsReducer,
  automations: automationsReducer,
  auth: authReducer,
  notifications: notificationsReducer,
  smartDevices: smartDevicesReducer,
});

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  // auth is intentionally NOT persisted — the session is restored from the
  // securely stored token on launch via restoreSession().
  whitelist: ['devices', 'scenes', 'activity', 'rooms', 'automations', 'smartDevices'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(controlSyncMiddleware),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<R = void> = ThunkAction<R, RootState, unknown, Action<string>>;
