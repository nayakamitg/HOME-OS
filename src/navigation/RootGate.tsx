import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { restoreSession } from '../store/slices/authSlice';
import { bootstrapSync } from '../services/sync';
import { connectRealtime, disconnectRealtime } from '../services/realtime';
import { AuthScreen } from '../screens/AuthScreen';
import { AppNavigator } from './AppNavigator';

export function RootGate() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.auth.status);
  const token = useAppSelector((s) => s.auth.token);
  const activeHomeId = useAppSelector((s) => s.auth.activeHomeId);

  // Restore any stored session on launch.
  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  // Once authenticated, hydrate all slices from the backend.
  useEffect(() => {
    if (status === 'authenticated' && token) {
      dispatch(bootstrapSync());
    }
  }, [status, token, dispatch]);

  // Open the realtime channel for live device updates.
  useEffect(() => {
    if (status === 'authenticated' && token && activeHomeId) {
      connectRealtime(token, activeHomeId, dispatch);
    }
  }, [status, token, activeHomeId, dispatch]);

  useEffect(() => () => disconnectRealtime(), []);

  if (status === 'unknown') {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  // While unauthenticated OR mid-login keep the AuthScreen mounted, so its
  // form state, selected tab and error stay intact and the app never flashes
  // before authentication actually completes.
  if (status === 'unauthenticated' || status === 'authenticating') {
    return <AuthScreen />;
  }

  // authenticated or offline → full app
  return <AppNavigator />;
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
});
