import { useCallback, useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
  SpeechVolumeChangeEvent,
} from '@react-native-voice/voice';

/** How long to wait for the user to start speaking before giving up. */
const INITIAL_WAIT_MS = 10000;
/** How long of a pause after speech before we auto-send. */
const SILENCE_MS = 2000;
/** Delay between recogniser re-arms while waiting for speech. */
const RESTART_DELAY_MS = 500;
const LOCALE = 'en-US';

// Android SpeechRecognizer error codes (sent as strings by the native module).
const ERR_PERMISSIONS = '9';
const ERR_NO_MATCH = '7';
const ERR_SPEECH_TIMEOUT = '6';
const ERR_CLIENT = '5';
const ERR_BUSY = '8';

const START_OPTIONS = {
  EXTRA_PARTIAL_RESULTS: true,
  EXTRA_LANGUAGE_MODEL: 'LANGUAGE_MODEL_FREE_FORM',
  EXTRA_MAX_RESULTS: 1,
  // Keep the mic open ~10s even through initial silence (honoured on many devices).
  EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: INITIAL_WAIT_MS,
  EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: SILENCE_MS,
  EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: SILENCE_MS,
  REQUEST_PERMISSIONS_AUTO: true,
};

function errorLabel(code: string): string {
  switch (code) {
    case '1': return 'Network timeout';
    case '2': return 'Network error';
    case '3': return 'Audio recording error';
    case ERR_CLIENT: return 'Client error (5)';
    case ERR_SPEECH_TIMEOUT: return 'No speech heard (6)';
    case ERR_NO_MATCH: return "Didn't catch that (7)";
    case ERR_BUSY: return 'Recognizer busy (8)';
    case ERR_PERMISSIONS: return 'Mic permission denied (9)';
    case '11': return 'Recognizer not ready (11)';
    case '12': return 'Language unavailable (12)';
    default: return `Error ${code || '?'}`;
  }
}

export type VoiceStatus = 'idle' | 'waiting' | 'speaking' | 'error';

interface UseVoiceInputOptions {
  /** Called with the final transcript when the user finishes speaking. */
  onResult: (text: string) => void;
  /** Called when listening stops without a usable result. */
  onCancel?: (reason?: string) => void;
}

interface UseVoiceInput {
  status: VoiceStatus;
  /** Normalised loudness 0..1, driven by mic volume. */
  level: number;
  /** Live (partial) transcript while speaking. */
  partial: string;
  /** Human-readable diagnostic of the last error/state (for on-screen hints). */
  info: string;
  start: () => Promise<void>;
  /** Cancel listening without sending. */
  stop: () => void;
  /** Stop listening and send whatever was captured so far. */
  submit: () => void;
}

async function ensureMicPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const already = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
  );
  if (already) return true;
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    {
      title: 'Microphone access',
      message: 'Aria needs your microphone to listen to voice commands.',
      buttonPositive: 'Allow',
      buttonNegative: 'Not now',
    },
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

/**
 * Drives @react-native-voice for a single hands-free utterance:
 *  - waits up to 10s for speech to begin (restarting the recogniser as Android
 *    keeps timing out, instead of closing on the first "no match"),
 *  - once speaking, sends after 2s of silence,
 *  - exposes a normalised loudness level for animation and an `info` string for
 *    on-screen diagnostics.
 *
 * Note: Android's module emits `onSpeechStart` on *readiness*, before any real
 * speech, so we detect actual speech from partial results — never from
 * onSpeechStart — to avoid sending an empty transcript immediately.
 */
export function useVoiceInput({ onResult, onCancel }: UseVoiceInputOptions): UseVoiceInput {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [level, setLevel] = useState(0);
  const [partial, setPartial] = useState('');
  const [info, setInfo] = useState('');

  const transcriptRef = useRef('');
  const startedRef = useRef(false);
  const activeRef = useRef(false);
  const deadlineRef = useRef(0);
  const initialTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the latest callbacks in a ref so the Voice listeners (bound once in
  // the effect below) never go stale and never need re-binding mid-session.
  const cbRef = useRef({ onResult, onCancel });
  cbRef.current = { onResult, onCancel };

  const clearTimers = useCallback(() => {
    [initialTimer, silenceTimer, restartTimer].forEach((t) => {
      if (t.current) clearTimeout(t.current);
      t.current = null;
    });
  }, []);

  const finish = useCallback(
    (send: boolean, reason?: string) => {
      if (!activeRef.current) return;
      activeRef.current = false;
      clearTimers();
      Voice.cancel().catch(() => {});
      Voice.stop().catch(() => {});
      const text = transcriptRef.current.trim();
      setStatus('idle');
      setLevel(0);
      setPartial('');
      if (send && text) cbRef.current.onResult(text);
      else cbRef.current.onCancel?.(reason);
    },
    [clearTimers],
  );

  // (Re)start the recogniser without re-requesting permission.
  const beginListening = useCallback(() => {
    if (!activeRef.current) return;
    Voice.start(LOCALE, START_OPTIONS).catch((e: any) => {
      const msg = e?.message ? String(e.message) : 'start failed';
      setInfo(`start error: ${msg}`);
      console.warn('[Voice] start rejected:', msg);
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      scheduleRestart();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Android keeps ending the session while waiting for speech; re-arm until the
  // 10s budget runs out, then give up quietly.
  const scheduleRestart = useCallback(() => {
    if (!activeRef.current || startedRef.current) return;
    if (restartTimer.current) clearTimeout(restartTimer.current);
    if (Date.now() >= deadlineRef.current) {
      finish(false, 'no-speech');
      return;
    }
    restartTimer.current = setTimeout(() => {
      if (activeRef.current && !startedRef.current) beginListening();
    }, RESTART_DELAY_MS);
  }, [finish, beginListening]);

  // Re-arm the 2s silence timer each time we detect ongoing speech.
  const bumpSilence = useCallback(() => {
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
    silenceTimer.current = setTimeout(() => finish(true), SILENCE_MS);
  }, [finish]);

  const markSpeaking = useCallback(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      setStatus('speaking');
      setInfo('');
    }
    bumpSilence();
  }, [bumpSilence]);

  useEffect(() => {
    // onSpeechStart fires on *readiness* too, so it is intentionally ignored
    // for speech detection.
    Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => {
      const text = e.value?.[0] ?? '';
      if (text) {
        transcriptRef.current = text;
        setPartial(text);
        markSpeaking();
      }
    };
    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      const text = e.value?.[0] ?? '';
      if (text) {
        transcriptRef.current = text;
        finish(true);
      } else if (transcriptRef.current.trim()) {
        finish(true);
      } else {
        // Engine ended with nothing — keep waiting if we still have time.
        scheduleRestart();
      }
    };
    Voice.onSpeechVolumeChanged = (e: SpeechVolumeChangeEvent) => {
      // Android reports loudness in dB (roughly -2..10). Normalise to 0..1.
      const db = typeof e.value === 'number' ? e.value : 0;
      setLevel(Math.max(0, Math.min(1, db / 10)));
    };
    Voice.onSpeechError = (e: SpeechErrorEvent) => {
      const code = e.error?.code ?? '';
      console.warn('[Voice] onSpeechError:', code, e.error?.message);
      if (code === ERR_PERMISSIONS) {
        setInfo(errorLabel(code));
        finish(false, 'permission');
        return;
      }
      // If we already captured speech, send it; otherwise the engine just timed
      // out waiting — restart within the 10s window.
      if (startedRef.current && transcriptRef.current.trim()) {
        finish(true);
        return;
      }
      setInfo(errorLabel(code));
      if (
        code === ERR_NO_MATCH ||
        code === ERR_SPEECH_TIMEOUT ||
        code === ERR_CLIENT ||
        code === ERR_BUSY ||
        !startedRef.current
      ) {
        scheduleRestart();
        return;
      }
      finish(false, code);
    };

    return () => {
      clearTimers();
      Voice.destroy().then(() => Voice.removeAllListeners()).catch(() => {});
    };
  }, [markSpeaking, finish, scheduleRestart, clearTimers]);

  const start = useCallback(async () => {
    if (activeRef.current) return;
    const granted = await ensureMicPermission();
    if (!granted) {
      cbRef.current.onCancel?.('permission');
      return;
    }

    // Surface device capability for diagnostics.
    try {
      const available = await Voice.isAvailable();
      if (!available) {
        setInfo('Speech recognition not available on this device');
        console.warn('[Voice] isAvailable() returned falsy');
      } else {
        setInfo('');
      }
    } catch (e: any) {
      setInfo(`isAvailable error: ${e?.message ?? e}`);
    }

    transcriptRef.current = '';
    startedRef.current = false;
    activeRef.current = true;
    deadlineRef.current = Date.now() + INITIAL_WAIT_MS;
    setPartial('');
    setLevel(0);
    setStatus('waiting');
    // Absolute backstop: if the user never speaks, close after the budget.
    initialTimer.current = setTimeout(() => {
      if (!startedRef.current) finish(false, 'no-speech');
    }, INITIAL_WAIT_MS);
    beginListening();
  }, [finish, beginListening]);

  const stop = useCallback(() => finish(false, 'cancelled'), [finish]);
  const submit = useCallback(() => finish(true), [finish]);

  return { status, level, partial, info, start, stop, submit };
}
