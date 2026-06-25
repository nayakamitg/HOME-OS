import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AppStatusBar } from '../components/StatusBar';
import { Toggle } from '../components/Toggle';
import { useTheme, ThemeColors, useThemeMode } from '../theme/ThemeContext';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import { disconnectRealtime } from '../services/realtime';

export function SettingsScreen() {
  const dispatch = useAppDispatch();
  const Colors = useTheme();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const { mode, toggleTheme } = useThemeMode();

  const user = useAppSelector((s) => s.auth.user);
  const status = useAppSelector((s) => s.auth.status);
  const serverReachable = useAppSelector((s) => s.auth.serverReachable);
  const homes = useAppSelector((s) => s.rooms.rooms.length);
  const unread = useAppSelector((s) => s.notifications.items.filter((n) => !n.read).length);

  const [twoFactor, setTwoFactor] = useState(true);

  const displayName = user?.name?.trim() || 'Guest user';
  const displayEmail = user?.email ?? 'Offline · demo mode';
  const connection = status === 'authenticated'
    ? (serverReachable ? 'Connected' : 'Reconnecting…')
    : 'Offline';

  function handleSignOut() {
    Alert.alert('Sign out', 'Sign out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out', style: 'destructive',
        onPress: () => { disconnectRealtime(); dispatch(logout()); },
      },
    ]);
  }

  const sections = [
    {
      title: 'Account',
      items: [
        { key: 'profile', label: 'Profile', sub: displayName, chevron: true },
        { key: 'homes', label: 'Homes & members', sub: `${homes} rooms`, chevron: true },
        { key: 'notifications', label: 'Notifications', sub: unread > 0 ? `${unread} unread` : 'All caught up', chevron: true },
      ],
    },
    {
      title: 'App',
      items: [
        { key: 'dark', label: 'Dark mode', toggle: true, value: mode === 'dark', onToggle: toggleTheme },
        { key: 'language', label: 'Language', sub: 'English', chevron: true },
        { key: 'units', label: 'Units', sub: '°C · kW', chevron: true },
      ],
    },
    {
      title: 'Privacy & Security',
      items: [
        { key: '2fa', label: 'Two-factor auth', toggle: true, value: twoFactor, onToggle: () => setTwoFactor((v) => !v) },
        { key: 'privacy', label: 'Data & privacy', chevron: true },
        { key: 'about', label: 'About HomeOS', sub: 'v3.0.0', chevron: true },
      ],
    },
  ] as const;

  return (
    <View style={styles.screen}>
      <AppStatusBar />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>{displayEmail} · {connection}</Text>
          </View>
          <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="m9 18 6-6-6-6" stroke={Colors.textMuted} strokeWidth={2.2} strokeLinecap="round" fill="none"/></Svg>
        </View>

        {sections.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item: any, i, arr) => (
                <View key={item.key} style={[styles.row, i < arr.length - 1 && styles.rowBorder]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowLabel}>{item.label}</Text>
                    {item.sub && <Text style={styles.rowSub}>{item.sub}</Text>}
                  </View>
                  {item.toggle ? (
                    <Toggle value={item.value} onToggle={item.onToggle} />
                  ) : (
                    <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="m9 18 6-6-6-6" stroke={Colors.textMuted} strokeWidth={2.2} strokeLinecap="round" fill="none"/></Svg>
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 22, paddingBottom: 80 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 20, padding: 16, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, marginBottom: 24 },
  avatar: { width: 52, height: 52, borderRadius: 16, backgroundColor: Colors.elevated, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  profileName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  profileEmail: { fontSize: 12.5, color: Colors.textDim, marginTop: 2 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 11.5, fontWeight: '700', letterSpacing: 0.5, color: Colors.textMuted, marginBottom: 10 },
  sectionCard: { borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  row: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: Colors.surface },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.bg },
  rowLabel: { fontSize: 14.5, fontWeight: '500', color: Colors.textPrimary },
  rowSub: { fontSize: 12, color: Colors.textDim, marginTop: 2 },
  signOutBtn: { borderRadius: 16, padding: 16, backgroundColor: Colors.dangerSoft, borderWidth: 1, borderColor: 'rgba(255,107,107,0.3)', alignItems: 'center', marginTop: 8 },
  signOutText: { fontSize: 15, fontWeight: '600', color: Colors.danger },
});
