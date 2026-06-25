import React, { createContext, useContext, useReducer } from 'react';

export type DeviceId = 'livingLamp' | 'ac' | 'tv' | 'rgb' | 'ceiling' | 'fan' | 'projector';
export type SceneId = 'evening' | 'movie' | 'sleep' | 'work' | 'gaming' | 'vacation';

interface AppState {
  devices: Record<DeviceId, boolean>;
  scene: SceneId;
  listening: boolean;
  detailTab: 'control' | 'schedule' | 'automation' | 'info';
}

type Action =
  | { type: 'TOGGLE_DEVICE'; id: DeviceId }
  | { type: 'RUN_SCENE'; id: SceneId }
  | { type: 'SET_LISTENING'; value: boolean }
  | { type: 'SET_TAB'; tab: AppState['detailTab'] };

const initial: AppState = {
  devices: { livingLamp: true, ac: true, tv: false, rgb: true, ceiling: true, fan: false, projector: false },
  scene: 'evening',
  listening: false,
  detailTab: 'control',
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'TOGGLE_DEVICE':
      return { ...state, devices: { ...state.devices, [action.id]: !state.devices[action.id] } };
    case 'RUN_SCENE':
      return { ...state, scene: action.id };
    case 'SET_LISTENING':
      return { ...state, listening: action.value };
    case 'SET_TAB':
      return { ...state, detailTab: action.tab };
    default:
      return state;
  }
}

const Ctx = createContext<{ state: AppState; dispatch: React.Dispatch<Action> }>(null!);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useApp() { return useContext(Ctx); }
