import { AppDispatch, RootState } from '../store/store';
import { toggleDevice, setDeviceOn, setDeviceTemperature, setDeviceBrightness } from '../store/slices/devicesSlice';
import { runScene, stopScene } from '../store/slices/scenesSlice';
import { addEvent } from '../store/slices/activitySlice';
import { addMessage, setTyping } from '../store/slices/assistantSlice';
import { AssistantAction, AutomationSuggestion } from '../store/slices/assistantSlice';

interface AssistantResponse {
  text: string;
  actions?: AssistantAction[];
  automation?: AutomationSuggestion;
  canUndo?: boolean;
  executeActions?: () => void;
}

const SCENE_NAMES: Record<string, string> = {
  'movie': 'movie', 'movie mode': 'movie', 'movies': 'movie',
  'sleep': 'sleep', 'bedtime': 'sleep', 'night': 'sleep',
  'work': 'work', 'working': 'work', 'office': 'work',
  'gaming': 'gaming', 'game': 'gaming', 'gamer': 'gaming',
  'vacation': 'vacation', 'away': 'vacation',
  'evening': 'evening',
};

const DEVICE_KEYWORDS: Record<string, string[]> = {
  'livingLamp': ['floor lamp', 'lamp', 'floor light'],
  'ac': ['ac', 'air conditioner', 'air conditioning', 'air con', 'a/c'],
  'tv': ['tv', 'television', 'smart tv'],
  'rgb': ['rgb', 'rgb strip', 'led strip', 'strip'],
  'ceiling': ['ceiling light', 'ceiling lamp', 'ceiling', 'main light'],
  'fan': ['fan', 'ceiling fan'],
  'projector': ['projector'],
  'kitchen-light': ['kitchen light', 'kitchen'],
  'bedroom-lamp': ['bedroom lamp', 'bedroom light', 'bedside lamp'],
};

function findDeviceId(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [id, keywords] of Object.entries(DEVICE_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return id;
  }
  return null;
}

function findSceneId(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [keyword, id] of Object.entries(SCENE_NAMES)) {
    if (lower.includes(keyword)) return id;
  }
  return null;
}

function extractTemperature(text: string): number | null {
  const match = text.match(/(\d+)\s*(?:degrees?|°|c|celsius)?/i);
  if (match) {
    const temp = parseInt(match[1]);
    if (temp >= 16 && temp <= 30) return temp;
  }
  return null;
}

function extractBrightness(text: string): number | null {
  const percentMatch = text.match(/(\d+)\s*%/);
  if (percentMatch) return Math.min(100, Math.max(0, parseInt(percentMatch[1])));
  const wordMap: Record<string, number> = { 'full': 100, 'max': 100, 'bright': 100, 'half': 50, 'dim': 20, 'low': 20, 'minimum': 5 };
  for (const [word, val] of Object.entries(wordMap)) {
    if (text.toLowerCase().includes(word)) return val;
  }
  return null;
}

export function processCommand(
  input: string,
  getState: () => RootState,
  dispatch: AppDispatch,
): AssistantResponse {
  const text = input.toLowerCase().trim();
  const state = getState();
  const devices = state.devices.devices;

  // ── Turn ON a device ─────────────────────────────────────────
  if (/turn\s+on|switch\s+on|enable|power\s+on/.test(text)) {
    // Turn on ALL lights / devices
    if (/all\s+lights?|every\s+light/.test(text)) {
      const lights = devices.filter(d => d.type === 'light' || d.type === 'strip');
      lights.forEach(d => dispatch(setDeviceOn({ id: d.id, isOn: true })));
      dispatch(addEvent({ title: 'All lights turned on', subtitle: `${lights.length} lights activated`, category: 'devices' }));
      return {
        text: `Done! I turned on all ${lights.length} lights.`,
        actions: [{ label: `${lights.length} lights on`, color: '#f0c267' }],
        canUndo: true,
      };
    }
    const deviceId = findDeviceId(text);
    if (deviceId) {
      const device = devices.find(d => d.id === deviceId);
      dispatch(setDeviceOn({ id: deviceId, isOn: true }));
      dispatch(addEvent({ title: `${device?.name} turned on`, subtitle: device?.room || '', category: 'devices' }));
      return {
        text: `Done! I turned on the ${device?.name}.`,
        actions: [{ label: `${device?.name} is on`, color: '#3ddc97' }],
        canUndo: true,
      };
    }
  }

  // ── Turn OFF a device ────────────────────────────────────────
  if (/turn\s+off|switch\s+off|disable|power\s+off/.test(text)) {
    if (/all\s+(?:lights?|device|everything)|everything/.test(text)) {
      dispatch(setTyping(false));
      const onDevices = devices.filter(d => d.isOn);
      onDevices.forEach(d => dispatch(setDeviceOn({ id: d.id, isOn: false })));
      dispatch(addEvent({ title: 'All devices turned off', subtitle: `${onDevices.length} devices off`, category: 'devices' }));
      return {
        text: `Done! I turned off all ${onDevices.length} active devices.`,
        actions: [{ label: `${onDevices.length} devices off`, color: '#ff6b6b' }],
        canUndo: true,
      };
    }
    if (/all\s+lights?|every\s+light/.test(text)) {
      const lights = devices.filter(d => d.type === 'light' || d.type === 'strip');
      lights.forEach(d => dispatch(setDeviceOn({ id: d.id, isOn: false })));
      dispatch(addEvent({ title: 'All lights turned off', subtitle: `${lights.length} lights off`, category: 'devices' }));
      return {
        text: `Done! I turned off all ${lights.length} lights.`,
        actions: [{ label: `${lights.length} lights off`, color: '#ff6b6b' }],
        canUndo: true,
      };
    }
    const deviceId = findDeviceId(text);
    if (deviceId) {
      const device = devices.find(d => d.id === deviceId);
      dispatch(setDeviceOn({ id: deviceId, isOn: false }));
      dispatch(addEvent({ title: `${device?.name} turned off`, subtitle: device?.room || '', category: 'devices' }));
      return {
        text: `Done! I turned off the ${device?.name}.`,
        actions: [{ label: `${device?.name} is off`, color: '#ff6b6b' }],
        canUndo: true,
      };
    }
  }

  // ── Toggle a device ──────────────────────────────────────────
  if (/toggle|switch/.test(text)) {
    const deviceId = findDeviceId(text);
    if (deviceId) {
      const device = devices.find(d => d.id === deviceId);
      dispatch(toggleDevice(deviceId));
      const newState = !device?.isOn;
      return {
        text: `Toggled ${device?.name} — now ${newState ? 'on' : 'off'}.`,
        actions: [{ label: `${device?.name} ${newState ? 'on' : 'off'}`, color: newState ? '#3ddc97' : '#ff6b6b' }],
        canUndo: true,
      };
    }
  }

  // ── Set AC temperature ───────────────────────────────────────
  if (/set\s+(?:the\s+)?(?:ac|air)/i.test(input) || (/ac|air\s*con/i.test(input) && /\d+/.test(input))) {
    const temp = extractTemperature(input);
    if (temp) {
      dispatch(setDeviceTemperature({ id: 'ac', temperature: temp }));
      dispatch(setDeviceOn({ id: 'ac', isOn: true }));
      dispatch(addEvent({ title: `AC set to ${temp}°C`, subtitle: 'Living Room', category: 'devices' }));
      return {
        text: `Done! I set the AC to ${temp}°C and turned it on.`,
        actions: [{ label: `AC → ${temp}°C`, color: '#5b8cff' }],
        canUndo: true,
      };
    }
  }

  // ── Set brightness ───────────────────────────────────────────
  if (/brightness|dim|bright/.test(text)) {
    const brightness = extractBrightness(input);
    const deviceId = findDeviceId(text) || 'ceiling';
    if (brightness !== null) {
      const device = devices.find(d => d.id === deviceId);
      dispatch(setDeviceBrightness({ id: deviceId, brightness }));
      return {
        text: `Set ${device?.name || 'lights'} brightness to ${brightness}%.`,
        actions: [{ label: `Brightness ${brightness}%`, color: '#f0c267' }],
        canUndo: true,
      };
    }
  }

  // ── Run scene ────────────────────────────────────────────────
  if (/run|start|activate|set|enable|switch\s+to/.test(text) && (findSceneId(text) || /scene|mode/.test(text))) {
    const sceneId = findSceneId(text);
    if (sceneId) {
      const scene = state.scenes.scenes.find(s => s.id === sceneId);
      dispatch(runScene(sceneId));
      dispatch(addEvent({ title: `${scene?.name} scene activated`, subtitle: `Adjusting ${scene?.deviceCount} devices`, category: 'automation' }));
      return {
        text: `${scene?.name} mode activated! Adjusting ${scene?.deviceCount} devices.`,
        actions: [
          { label: `${scene?.name} active`, color: '#c8a2ff' },
          { label: `${scene?.deviceCount} devices adjusted`, color: '#3ddc97' },
        ],
        canUndo: true,
      };
    }
  }

  // ── Stop scene ───────────────────────────────────────────────
  if (/stop|deactivate|cancel/.test(text) && /scene|mode/.test(text)) {
    dispatch(stopScene());
    return { text: 'Scene stopped. All devices are now in manual mode.' };
  }

  // ── Status queries ───────────────────────────────────────────
  if (/how many|count|status|what.*on|which.*on/.test(text)) {
    const onDevices = devices.filter(d => d.isOn);
    const offDevices = devices.filter(d => !d.isOn);
    const activeScene = state.scenes.scenes.find(s => s.isActive);
    return {
      text: `Here's your home status:\n• ${onDevices.length} devices are ON\n• ${offDevices.length} devices are OFF\n• Active scene: ${activeScene?.name || 'None'}\n\nDevices on: ${onDevices.map(d => d.name).join(', ')}`,
    };
  }

  if (/what.*temperature|how.*hot|how.*cold|temp/.test(text)) {
    const ac = devices.find(d => d.id === 'ac');
    return {
      text: `Your AC is set to ${ac?.temperature}°C and is currently ${ac?.isOn ? 'ON' : 'OFF'}. Indoor temperature is around 22.5°C.`,
    };
  }

  // ── Automation creation ──────────────────────────────────────
  if (/every\s+night|every\s+day|every\s+morning|schedule|automate|automation|daily|at\s+\d/.test(text)) {
    const timeMatch = input.match(/at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
    const timeStr = timeMatch ? timeMatch[1] : '11:00 PM';
    const deviceId = findDeviceId(text);
    const temp = extractTemperature(input);
    const sceneName = findSceneId(text);

    let whenStr = `Time is ${timeStr}, daily`;
    let thenStr = 'Unknown action';

    if (deviceId && temp) {
      const device = devices.find(d => d.id === deviceId);
      thenStr = `Set ${device?.name} to ${temp}°C`;
    } else if (deviceId) {
      const device = devices.find(d => d.id === deviceId);
      const action = /off|turn off/.test(text) ? 'off' : 'on';
      thenStr = `Turn ${device?.name} ${action}`;
    } else if (sceneName) {
      const scene = state.scenes.scenes.find(s => s.id === sceneName);
      thenStr = `Run ${scene?.name} scene`;
    }

    return {
      text: "I can create this automation for you:",
      automation: { when: whenStr, then: thenStr },
    };
  }

  // ── Greeting ─────────────────────────────────────────────────
  if (/^(hi|hello|hey|good morning|good evening|good night)/.test(text)) {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    return { text: `${greeting}! How can I help you with your home today?` };
  }

  // ── Help ─────────────────────────────────────────────────────
  if (/help|what can you|commands/.test(text)) {
    return {
      text: "Here's what I can do:\n\n• Turn on/off devices: \"Turn on the AC\"\n• Run scenes: \"Start Movie Mode\"\n• Set temperature: \"Set AC to 22 degrees\"\n• Set brightness: \"Dim the ceiling lights to 30%\"\n• Check status: \"What devices are on?\"\n• Create automations: \"Turn off lights every night at 11pm\"",
    };
  }

  // ── Default ──────────────────────────────────────────────────
  return {
    text: "I'm not sure how to handle that. Try saying things like \"Turn on the lights\", \"Start Movie Mode\", or \"Set AC to 22 degrees\". Type 'help' for all commands.",
  };
}

export function sendMessage(userText: string) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(addMessage({ role: 'user', text: userText }));
    dispatch(setTyping(true));

    setTimeout(() => {
      const response = processCommand(userText, getState, dispatch);
      dispatch(setTyping(false));
      dispatch(addMessage({
        role: 'assistant',
        text: response.text,
        actions: response.actions,
        automation: response.automation,
        canUndo: response.canUndo,
      }));
    }, 700);
  };
}
