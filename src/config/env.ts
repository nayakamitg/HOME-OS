/**
 * Backend connection config.
 *
 * The React Native app talks to the backend over REST (API_BASE_URL) and
 * socket.io/WebSocket (WS_URL). It does NOT use MQTT — that is between the
 * ESP32 firmware and the backend broker.
 *
 * Flip USE_PRODUCTION to switch between the deployed server and local dev.
 */
const USE_PRODUCTION = true;

// --- Local development (physical device on same Wi-Fi uses the PC LAN IP) ---
const LOCAL_HOST = '192.168.31.41';
const LOCAL_PORT = 3005;

export const API_BASE_URL = USE_PRODUCTION
  ? 'https://automation.missingfound.online/api/v1'
  : `http://${LOCAL_HOST}:${LOCAL_PORT}/api/v1`;

// socket.io reads the `/realtime` segment as the namespace.
export const WS_URL = USE_PRODUCTION
  ? 'wss://automation.missingfound.online/realtime'
  : `ws://${LOCAL_HOST}:${LOCAL_PORT}/realtime`;

/** How long to wait for the backend before assuming offline. */
export const API_TIMEOUT_MS = 12000;
