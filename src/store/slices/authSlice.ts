import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthApi } from '../../api/resources';
import { setAuthToken, loadStoredToken, ApiError } from '../../api/client';
import { BackendUser } from '../../api/types';

export type AuthStatus = 'unknown' | 'authenticating' | 'authenticated' | 'offline' | 'unauthenticated';

interface AuthState {
  token: string | null;
  user: BackendUser | null;
  status: AuthStatus;
  error: string | null;
  activeHomeId: string | null;
  serverReachable: boolean;
}

const initialState: AuthState = {
  token: null,
  user: null,
  status: 'unknown',
  error: null,
  activeHomeId: null,
  serverReachable: false,
};

export const login = createAsyncThunk<
  { token: string; user: BackendUser },
  { email: string; password: string },
  { rejectValue: string }
>('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const res = await AuthApi.login(email, password);
    await setAuthToken(res.accessToken);
    return { token: res.accessToken, user: res.user };
  } catch (e) {
    return rejectWithValue((e as ApiError).message);
  }
});

export const register = createAsyncThunk<
  { token: string; user: BackendUser },
  { name: string; email: string; password: string },
  { rejectValue: string }
>('auth/register', async ({ name, email, password }, { rejectWithValue }) => {
  try {
    const res = await AuthApi.register(name, email, password);
    await setAuthToken(res.accessToken);
    return { token: res.accessToken, user: res.user };
  } catch (e) {
    return rejectWithValue((e as ApiError).message);
  }
});

/** On app start: restore a stored token and validate it against the server. */
export const restoreSession = createAsyncThunk<
  { token: string; user: BackendUser } | null
>('auth/restore', async () => {
  const token = await loadStoredToken();
  if (!token) return null;
  try {
    const user = await AuthApi.me();
    return { token, user };
  } catch {
    // Token invalid/expired OR server unreachable — keep token, caller decides.
    return null;
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  await setAuthToken(null);
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    continueOffline(state) {
      state.status = 'offline';
    },
    setActiveHome(state, action: PayloadAction<string | null>) {
      state.activeHomeId = action.payload;
    },
    setServerReachable(state, action: PayloadAction<boolean>) {
      state.serverReachable = action.payload;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (s) => { s.status = 'authenticating'; s.error = null; })
      .addCase(login.fulfilled, (s, a) => {
        s.status = 'authenticated'; s.token = a.payload.token; s.user = a.payload.user; s.serverReachable = true;
      })
      .addCase(login.rejected, (s, a) => { s.status = 'unauthenticated'; s.error = a.payload ?? 'Login failed'; })
      .addCase(register.pending, (s) => { s.status = 'authenticating'; s.error = null; })
      .addCase(register.fulfilled, (s, a) => {
        s.status = 'authenticated'; s.token = a.payload.token; s.user = a.payload.user; s.serverReachable = true;
      })
      .addCase(register.rejected, (s, a) => { s.status = 'unauthenticated'; s.error = a.payload ?? 'Registration failed'; })
      .addCase(restoreSession.fulfilled, (s, a) => {
        if (a.payload) {
          s.status = 'authenticated'; s.token = a.payload.token; s.user = a.payload.user; s.serverReachable = true;
        } else {
          s.status = 'unauthenticated';
        }
      })
      .addCase(restoreSession.rejected, (s) => { s.status = 'unauthenticated'; })
      .addCase(logout.fulfilled, (s) => {
        s.token = null; s.user = null; s.status = 'unauthenticated'; s.activeHomeId = null; s.serverReachable = false;
      });
  },
});

export const { continueOffline, setActiveHome, setServerReachable, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
