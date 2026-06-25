import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AssistantAction {
  label: string;
  color: string;
}

export interface AutomationSuggestion {
  when: string;
  then: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actions?: AssistantAction[];
  automation?: AutomationSuggestion;
  canUndo?: boolean;
  undoPayload?: any;
}

interface AssistantState {
  messages: Message[];
  isTyping: boolean;
  isListening: boolean;
}

const initialState: AssistantState = {
  messages: [
    {
      id: '1',
      role: 'assistant',
      text: "Hi! I'm Aria, your home assistant. I can control your devices, run scenes, and create automations. What would you like to do?",
      timestamp: new Date().toISOString(),
    },
  ],
  isTyping: false,
  isListening: false,
};

const assistantSlice = createSlice({
  name: 'assistant',
  initialState,
  reducers: {
    addMessage(state, action: PayloadAction<Omit<Message, 'id' | 'timestamp'>>) {
      state.messages.push({
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
      });
    },
    setTyping(state, action: PayloadAction<boolean>) {
      state.isTyping = action.payload;
    },
    setListening(state, action: PayloadAction<boolean>) {
      state.isListening = action.payload;
    },
    clearMessages(state) {
      state.messages = [];
    },
  },
});

export const { addMessage, setTyping, setListening, clearMessages } = assistantSlice.actions;
export default assistantSlice.reducer;
