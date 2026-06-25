import { io, Socket } from 'socket.io-client';
import { WS_URL } from '../config/env';
import type { AppDispatch } from '../store/store';
import { applyReportedState, setDeviceOnlineStatus } from '../store/slices/devicesSlice';

let socket: Socket | null = null;
let currentHomeId: string | null = null;

export function connectRealtime(token: string, homeId: string, dispatch: AppDispatch): void {
  // Reuse the connection if already on the right home.
  if (socket?.connected && currentHomeId === homeId) return;
  disconnectRealtime();

  currentHomeId = homeId;
  socket = io(WS_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1500,
    reconnectionDelayMax: 10000,
  });

  socket.on('connect', () => {
    socket?.emit('join-home', { homeId });
  });

  socket.on('device:state', (payload: { deviceId: string; state: Record<string, any> }) => {
    dispatch(applyReportedState({ id: payload.deviceId, state: payload.state }));
  });

  socket.on('device:online', (payload: { deviceId: string; online: boolean }) => {
    dispatch(setDeviceOnlineStatus({ id: payload.deviceId, online: payload.online }));
  });

  socket.on('connect_error', (err: Error) => {
    console.warn('[realtime] connect_error:', err.message);
  });
}

export function disconnectRealtime(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  currentHomeId = null;
}
