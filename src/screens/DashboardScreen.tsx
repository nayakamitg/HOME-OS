import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { Toggle } from '../components/Toggle';
import { Colors } from '../theme/colors';
import { useTheme, ThemeColors } from '../theme/ThemeContext';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { toggleDevice } from '../store/slices/devicesSlice';
import { runScene } from '../store/slices/scenesSlice';

function greetingFor(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const SCENE_IDS = ['movie', 'sleep', 'work'] as const;
const SCENE_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  movie: {
    label: 'Movie', color: Colors.purple,
    icon: <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="m22 8-6 4 6 4V8Z" stroke="#c8a2ff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" /><Rect x={2} y={6} width={14} height={12} rx={2} stroke="#c8a2ff" strokeWidth={2} fill="none" /></Svg>,
  },
  sleep: {
    label: 'Sleep', color: Colors.accent,
    icon: <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" stroke="#5b8cff" strokeWidth={2} strokeLinecap="round" fill="none" /></Svg>,
  },
  work: {
    label: 'Work', color: Colors.success,
    icon: <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" stroke="#3ddc97" strokeWidth={2} strokeLinecap="round" fill="none" /></Svg>,
  },
};

const FAV_IDS = ['livingLamp', 'ac', 'tv', 'rgb'];
const DEVICE_META: Record<string, { accent: string; softBg: string; icon: (on: boolean) => React.ReactNode }> = {
  livingLamp: { accent: Colors.warning, softBg: 'rgba(240,194,103,0.16)', icon: (on) => <Svg width={21} height={21} viewBox="0 0 24 24"><Path d="M9 18h6M10 22h4M15 14c.2-1 .7-1.7 1.4-2.5A4.6 4.6 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5C8.3 12.3 8.8 13 9 14" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" fill="none" stroke={on ? '#f0c267' : '#555'} /></Svg> },
  ac: { accent: Colors.accent, softBg: 'rgba(91,140,255,0.16)', icon: (on) => <Svg width={21} height={21} viewBox="0 0 24 24"><Path d="M14 4v10.5a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" strokeWidth={1.9} strokeLinecap="round" fill="none" stroke={on ? '#5b8cff' : '#555'} /></Svg> },
  tv: { accent: Colors.accent, softBg: 'rgba(91,140,255,0.16)', icon: (on) => <Svg width={21} height={21} viewBox="0 0 24 24"><Rect x={2} y={7} width={20} height={13} rx={2} strokeWidth={1.9} fill="none" stroke={on ? '#5b8cff' : '#555'} /><Path d="m7 2 5 5 5-5" strokeWidth={1.9} strokeLinecap="round" fill="none" stroke={on ? '#5b8cff' : '#555'} /></Svg> },
  rgb: { accent: Colors.purple, softBg: 'rgba(200,162,255,0.16)', icon: (on) => <Svg width={21} height={21} viewBox="0 0 24 24"><Circle cx={13.5} cy={6.5} r={2.5} stroke={on ? '#c8a2ff' : '#555'} strokeWidth={1.9} fill="none" /><Circle cx={8.5} cy={7.5} r={2.5} stroke={on ? '#c8a2ff' : '#555'} strokeWidth={1.9} fill="none" /><Circle cx={6.5} cy={12.5} r={2.5} stroke={on ? '#c8a2ff' : '#555'} strokeWidth={1.9} fill="none" /></Svg> },
};

export function DashboardScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const Colors = useTheme();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const devices = useAppSelector(s => s.devices.devices);
  const scenes = useAppSelector(s => s.scenes.scenes);
  const activeSceneId = useAppSelector(s => s.scenes.activeSceneId);
  const rooms = useAppSelector(s => s.rooms.rooms);
  const user = useAppSelector(s => s.auth.user);
  const unreadCount = useAppSelector(s => s.notifications.items.filter(n => !n.read).length);

  const displayName = user?.name?.trim() || 'there';
  const firstName = displayName.split(' ')[0];
  const initial = firstName.charAt(0).toUpperCase() || 'U';

  const onlineCount = devices.filter(d => d.isOnline).length;
  const onCount = devices.filter(d => d.isOn).length;
  const totalPower = devices.filter(d => d.isOn).reduce((acc, d) => acc + d.powerWatts, 0);
  const activeScene = scenes.find(s => s.id === activeSceneId);

  const favoriteDevices = FAV_IDS.map(id => devices.find(d => d.id === id)).filter(Boolean) as typeof devices;
  const smartDevices = useAppSelector(s => s.smartDevices.items);

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greetingFor()}, {firstName}</Text>
            <TouchableOpacity style={styles.homeRow} onPress={() => navigation.navigate('HomeSwitcher')}>
              <Text style={styles.homeName}>Smith Residence</Text>
              <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="m6 9 6 6 6-6" stroke={Colors.textSecondary} strokeWidth={2.4} strokeLinecap="round" fill="none" /></Svg>
            </TouchableOpacity>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Activity')} activeOpacity={0.8}>
              <Svg width={19} height={19} viewBox="0 0 24 24"><Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" stroke={Colors.textSecondary} strokeWidth={1.8} strokeLinecap="round" fill="none" /></Svg>
              {unreadCount > 0 && <View style={styles.notifDot} />}
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Settings')} activeOpacity={0.8}>
              <Text style={styles.avatarText}>{initial}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Weather Hero */}
        <View style={styles.weatherCard}>
          <View style={styles.weatherRow}>
            <View>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>All systems normal</Text>
              </View>
              <Text style={styles.tempText}>22.5°</Text>
              <Text style={styles.weatherSub}>Indoor · Outdoor 18° · Clear night</Text>
            </View>
            <View style={styles.weatherRight}>
              <Svg width={46} height={46} viewBox="0 0 24 24"><Path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" stroke="#9db4ff" strokeWidth={1.4} strokeLinecap="round" fill="none" /></Svg>
              <Text style={styles.humidity}>42% RH</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}><View style={[styles.dot, { backgroundColor: Colors.success }]} /><Text style={styles.statLabel}>Online</Text></View>
            <Text style={styles.statValue}>{onlineCount}<Text style={styles.statTotal}>/{devices.length}</Text></Text>
            <Text style={styles.statSub}>devices</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Svg width={13} height={13} viewBox="0 0 24 24"><Path d="M13 2 3 14h9l-1 8 10-12h-9z" stroke={Colors.warning} strokeWidth={2.2} strokeLinecap="round" fill="none" /></Svg>
              <Text style={styles.statLabel}>Power</Text>
            </View>
            <Text style={styles.statValue}>{(totalPower / 1000).toFixed(1)}<Text style={styles.statTotal}>kW</Text></Text>
            <Text style={styles.statSub}>now</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Svg width={13} height={13} viewBox="0 0 24 24"><Path d="M9 18V5l12-2v13" stroke={Colors.purple} strokeWidth={2} strokeLinecap="round" fill="none" /><Circle cx={6} cy={18} r={3} stroke={Colors.purple} strokeWidth={2} fill="none" /></Svg>
              <Text style={styles.statLabel}>Scene</Text>
            </View>
            <Text style={[styles.statValue, { fontSize: 15 }]}>{activeScene?.name || 'None'}</Text>
            <Text style={styles.statSub}>active</Text>
          </View>
        </View>

        {/* Quick Scenes */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>QUICK SCENES</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Automate')}><Text style={styles.sectionLink}>All</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scenesScroll}>
          {SCENE_IDS.map(id => {
            const meta = SCENE_META[id];
            const active = activeSceneId === id;
            const scene = scenes.find(s => s.id === id);
            return (
              <TouchableOpacity
                key={id}
                style={[styles.sceneCard, active && styles.sceneCardActive]}
                onPress={() => dispatch(runScene(id))}
                activeOpacity={0.8}
              >
                <View style={[styles.sceneIcon, { backgroundColor: `${meta.color}29` }]}>{meta.icon}</View>
                <View style={{ flex: 1 }} />
                <Text style={styles.sceneLabel}>{meta.label}</Text>
                <Text style={styles.sceneState}>{active ? 'Running' : `${scene?.deviceCount || 0} devices`}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Smart Devices — multi-switch boards, horizontal rail */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SMART DEVICES</Text>
          <Text style={styles.sectionLink}>{smartDevices.length}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scenesScroll}>
          {smartDevices.map(sd => {
            const on = sd.switches.filter(Boolean).length;
            const active = on > 0;
            return (
              <TouchableOpacity
                key={sd.id}
                style={[styles.smartCard, active && styles.smartCardActive]}
                onPress={() => navigation.navigate('SmartDevice', { deviceId: sd.id })}
                activeOpacity={0.85}
              >
                <View style={[styles.smartIcon, { backgroundColor: active ? 'rgba(91,140,255,0.2)' : 'rgba(255,255,255,0.05)' }]}>
                  <Svg width={20} height={20} viewBox="0 0 24 24">
                    <Rect x={3} y={4} width={18} height={16} rx={3} stroke={active ? '#5b8cff' : '#62626a'} strokeWidth={1.9} fill="none" />
                    <Path d="M8 9v6M12 9v6M16 9v6" stroke={active ? '#5b8cff' : '#62626a'} strokeWidth={1.9} strokeLinecap="round" />
                  </Svg>
                </View>
                <View style={{ flex: 1 }} />
                <Text style={styles.smartName}>{sd.name}</Text>
                <Text style={styles.smartSub}>{sd.switches.length} switches · {on} on</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Favorites */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>FAVORITES</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Devices')}><Text style={styles.sectionLink}>Edit</Text></TouchableOpacity>
        </View>
        <View style={styles.favGrid}>
          {favoriteDevices.map(dev => {
            const meta = DEVICE_META[dev.id] || { accent: Colors.accent, softBg: Colors.accentSoft, icon: () => null };
            return (
              <TouchableOpacity
                key={dev.id}
                style={[styles.favCard, dev.isOn && { borderColor: `${meta.accent}66`, backgroundColor: `${meta.accent}1A` }]}
                onPress={() => dispatch(toggleDevice(dev.id))}
                activeOpacity={0.8}
              >
                <View style={styles.favCardTop}>
                  <View style={[styles.favIcon, { backgroundColor: dev.isOn ? meta.softBg : 'rgba(255,255,255,0.05)' }]}>
                    {meta.icon(dev.isOn)}
                  </View>
                  <Toggle value={dev.isOn} onToggle={() => dispatch(toggleDevice(dev.id))} activeColor={meta.accent} />
                </View>
                <Text style={styles.favName}>{dev.name}</Text>
                <Text style={styles.favSub}>{dev.room} · {dev.isOn ? 'On' : 'Off'}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Rooms */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ROOMS</Text>
          <Text style={styles.sectionLink}>{rooms.length} rooms</Text>
        </View>
        {rooms.map(room => {
          const roomDevices = devices.filter(d => room.deviceIds.includes(d.id));
          const onCount2 = roomDevices.filter(d => d.isOn).length;
          const colorMap: Record<string, string> = { accent: Colors.accent, warning: Colors.warning, purple: Colors.purple };
          const color = colorMap[room.colorKey] || Colors.accent;
          return (
            <TouchableOpacity
              key={room.id}
              style={styles.roomRow}
              onPress={() => navigation.navigate('Room', { roomId: room.id })}
              activeOpacity={0.8}
            >
              <View style={[styles.roomIcon, { backgroundColor: `${color}24` }]}>
                <Svg width={19} height={19} viewBox="0 0 24 24"><Path d="M3 10v11h18V10M2 10 12 3l10 7" stroke={color} strokeWidth={1.8} strokeLinecap="round" fill="none" /><Rect x={9} y={14} width={6} height={7} stroke={color} strokeWidth={1.8} fill="none" /></Svg>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.roomName}>{room.name}</Text>
                <Text style={styles.roomSub}>{roomDevices.length} devices · {onCount2} on</Text>
              </View>
              <Text style={styles.roomTemp}>{room.temperature}°</Text>
              <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="m9 18 6-6-6-6" stroke={Colors.textMuted} strokeWidth={2.2} strokeLinecap="round" fill="none" /></Svg>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* AI FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('Assistant')} activeOpacity={0.85}>
        <Svg width={26} height={26} viewBox="0 0 24 24"><Path d="M12 2 9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5Z" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: 22, paddingBottom: 120 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  greeting: { color: Colors.textSecondary, fontSize: 13.5, fontWeight: '500' },
  homeRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 3 },
  homeName: { fontSize: 23, fontWeight: '600', color: Colors.textPrimary, letterSpacing: -0.4 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  notifDot: { position: 'absolute', top: 9, right: 10, width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.danger, borderWidth: 1.5, borderColor: Colors.bg },
  avatar: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#2a2a32', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '700', fontSize: 15, color: Colors.textPrimary },
  weatherCard: { borderRadius: 26, padding: 20, backgroundColor: '#1b2440', borderWidth: 1, borderColor: Colors.surface, marginBottom: 14 },
  weatherRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  statusText: { color: '#9db4ff', fontSize: 12.5, fontWeight: '600' },
  tempText: { fontSize: 40, fontWeight: '600', color: Colors.textPrimary, letterSpacing: -1 },
  weatherSub: { color: '#9696a0', fontSize: 13, marginTop: 6 },
  weatherRight: { alignItems: 'flex-end' },
  humidity: { fontFamily: 'monospace', fontSize: 12, color: '#7d8aa8', marginTop: 8 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  statCard: { flex: 1, borderRadius: 18, padding: 14, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  statHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  statLabel: { fontSize: 11.5, fontWeight: '600', color: Colors.textSecondary },
  statValue: { fontSize: 22, fontWeight: '600', color: Colors.textPrimary },
  statTotal: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  statSub: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.4, color: '#c8c8d0' },
  sectionLink: { fontSize: 12.5, color: Colors.accent, fontWeight: '600' },
  scenesScroll: { marginHorizontal: -22, paddingHorizontal: 22, marginBottom: 24 },
  sceneCard: { width: 118, borderRadius: 20, padding: 14, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, marginRight: 10 },
  sceneCardActive: { borderColor: 'rgba(91,140,255,0.45)', backgroundColor: 'rgba(91,140,255,0.10)' },
  sceneIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 26 },
  sceneLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  sceneState: { fontSize: 11.5, color: Colors.textDim },
  smartCard: { width: 148, borderRadius: 20, padding: 14, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, marginRight: 10, minHeight: 118 },
  smartCardActive: { borderColor: 'rgba(91,140,255,0.45)', backgroundColor: 'rgba(91,140,255,0.10)' },
  smartIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  smartName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  smartSub: { fontSize: 11.5, color: Colors.textDim, marginTop: 2 },
  favGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 11, marginBottom: 24 },
  favCard: { width: '47.5%', borderRadius: 22, padding: 16, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  favCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 34 },
  favIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  favName: { fontSize: 14.5, fontWeight: '600', color: Colors.textPrimary },
  favSub: { fontSize: 12, color: Colors.textDim, marginTop: 2 },
  roomRow: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, padding: 13, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, marginBottom: 9 },
  roomIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  roomName: { fontSize: 14.5, fontWeight: '600', color: Colors.textPrimary },
  roomSub: { fontSize: 12, color: Colors.textDim },
  roomTemp: { fontFamily: 'monospace', fontSize: 12.5, color: '#9696a0' },
  fab: { position: 'absolute', right: 20, bottom: 10, width: 58, height: 58, borderRadius: 29, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.accent, shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 8 },
});
