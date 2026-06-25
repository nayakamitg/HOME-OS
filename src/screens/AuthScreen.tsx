import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme, ThemeColors } from '../theme/ThemeContext';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { login, register, continueOffline, clearAuthError } from '../store/slices/authSlice';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns an error string if the inputs are invalid, else null. */
function validate(mode: 'login' | 'register', name: string, email: string, password: string): string | null {
  if (mode === 'register' && !name.trim()) return 'Please enter your name.';
  if (!email.trim()) return 'Please enter your email.';
  if (!EMAIL_RE.test(email.trim())) return 'Enter a valid email address.';
  if (!password) return 'Please enter your password.';
  if (mode === 'register') {
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return 'Password must include at least one letter and one number.';
    }
  }
  return null;
}

export function AuthScreen() {
  const dispatch = useAppDispatch();
  const Colors = useTheme();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const status = useAppSelector((s) => s.auth.status);
  const serverError = useAppSelector((s) => s.auth.error);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('demo@smarthome.local');
  const [password, setPassword] = useState('Demo1234!');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const busy = status === 'authenticating';
  const error = localError ?? serverError;

  function switchMode(next: 'login' | 'register') {
    setMode(next);
    setLocalError(null);
    dispatch(clearAuthError());
  }

  function submit() {
    if (busy) return;
    // Validate locally first — on failure we show an inline error and never
    // dispatch, so a bad email/password can't bounce the user elsewhere.
    const validationError = validate(mode, name, email, password);
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    setLocalError(null);
    dispatch(clearAuthError());
    if (mode === 'login') {
      dispatch(login({ email: email.trim(), password }));
    } else {
      dispatch(register({ name: name.trim(), email: email.trim(), password }));
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logo}>
          <Svg width={34} height={34} viewBox="0 0 24 24">
            <Path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <Path d="M9 22V12h6v10" stroke="#fff" strokeWidth={2} fill="none" />
          </Svg>
        </View>
        <Text style={styles.title}>HomeOS</Text>
        <Text style={styles.subtitle}>
          {mode === 'login' ? 'Sign in to control your home' : 'Create your smart home account'}
        </Text>

        {/* Mode toggle */}
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'login' && styles.toggleBtnActive]}
            onPress={() => switchMode('login')}
            disabled={busy}
          >
            <Text style={[styles.toggleText, mode === 'login' && styles.toggleTextActive]}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'register' && styles.toggleBtnActive]}
            onPress={() => switchMode('register')}
            disabled={busy}
          >
            <Text style={[styles.toggleText, mode === 'register' && styles.toggleTextActive]}>Register</Text>
          </TouchableOpacity>
        </View>

        {mode === 'register' && (
          <>
            <Text style={styles.label}>NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={(t) => { setName(t); if (localError) setLocalError(null); }}
              autoCapitalize="words"
              editable={!busy}
            />
          </>
        )}

        <Text style={styles.label}>EMAIL</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor={Colors.textMuted}
          value={email}
          onChangeText={(t) => { setEmail(t); if (localError) setLocalError(null); }}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!busy}
        />

        <Text style={styles.label}>PASSWORD</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, { paddingRight: 50, marginBottom: 0 }]}
            placeholder="••••••••"
            placeholderTextColor={Colors.textMuted}
            value={password}
            onChangeText={(t) => { setPassword(t); if (localError) setLocalError(null); }}
            secureTextEntry={!showPassword}
            editable={!busy}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword((prev) => !prev)}
            activeOpacity={0.7}
          >
            {showPassword ? (
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={Colors.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <Circle cx="12" cy="12" r="3" />
              </Svg>
            ) : (
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={Colors.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <Path d="M1 1l22 22" />
              </Svg>
            )}
          </TouchableOpacity>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={[styles.submitBtn, busy && { opacity: 0.7 }]} onPress={submit} disabled={busy}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.offlineBtn} onPress={() => dispatch(continueOffline())} disabled={busy}>
          <Text style={styles.offlineText}>Continue offline (demo mode)</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          Demo account is pre-filled. Sign in to sync with the backend, or continue offline to explore with local data.
        </Text>
      </ScrollView>

      {/* Full-screen loading overlay while authenticating */}
      {busy && (
        <View style={styles.overlay} pointerEvents="auto">
          <ActivityIndicator color={Colors.accent} size="large" />
          <Text style={styles.overlayText}>
            {mode === 'login' ? 'Signing you in…' : 'Creating your account…'}
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 28, paddingTop: 80, paddingBottom: 40 },
  logo: { width: 64, height: 64, borderRadius: 20, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 18 },
  title: { fontSize: 30, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: Colors.textDim, textAlign: 'center', marginTop: 6, marginBottom: 28 },
  toggle: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: Colors.border, marginBottom: 24 },
  toggleBtn: { flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: Colors.accent },
  toggleText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  toggleTextActive: { color: '#fff' },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, color: Colors.textMuted, marginBottom: 8, marginTop: 4 },
  input: { backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.textPrimary, marginBottom: 16 },
  error: { fontSize: 13, color: Colors.danger, marginBottom: 12 },
  submitBtn: { backgroundColor: Colors.accent, borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 6 },
  submitText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  offlineBtn: { padding: 14, alignItems: 'center', marginTop: 8 },
  offlineText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  hint: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', lineHeight: 18, marginTop: 16 },
  passwordContainer: { position: 'relative', justifyContent: 'center', marginBottom: 16 },
  eyeButton: { position: 'absolute', right: 0, height: '100%', paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', gap: 16 },
  overlayText: { fontSize: 14.5, fontWeight: '600', color: Colors.textSecondary },
});
