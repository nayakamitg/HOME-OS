import { Platform } from 'react-native';

/**
 * Backend connection config.
 *
 * - Android emulator reaches the host machine via 10.0.2.2
 * - iOS simulator can use localhost
 * - A physical device must use your dev machine's LAN IP — set API_HOST_OVERRIDE.
 */
//const API_HOST_OVERRIDE: string | null = null; // e.g. '192.168.1.20'
//const API_PORT = 3005;

//const host = API_HOST_OVERRIDE ?? (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');

export const API_BASE_URL = `https://automation.missingfound.online/api/v1`;
export const WS_URL = `wss://automation.missingfound.online/realtime`;

/** How long to wait for the backend before assuming offline. */
export const API_TIMEOUT_MS = 12000;
