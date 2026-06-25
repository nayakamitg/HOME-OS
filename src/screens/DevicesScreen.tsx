import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, TextInput } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { Toggle } from '../components/Toggle';
import { Colors } from '../theme/colors';
import { useTheme, ThemeColors } from '../theme/ThemeContext';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { toggleDevice } from '../store/slices/devicesSlice';
import { DeviceType } from '../store/slices/devicesSlice';

function DeviceIcon({ type, color }: { type: DeviceType; color: string }) {
  switch (type) {
    case 'light':
      return <Svg width={20} height={20} viewBox="0 0 24 24"><Path d="M9 18h6M10 22h4M15 14c.2-1 .7-1.7 1.4-2.5A4.6 4.6 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5C8.3 12.3 8.8 13 9 14" stroke={color} strokeWidth={1.9} strokeLinecap="round" fill="none" /></Svg>;
    case 'ac':
      return <Svg width={20} height={20} viewBox="0 0 24 24"><Path d="M14 4v10.5a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" stroke={color} strokeWidth={1.9} fill="none" /></Svg>;
    case 'tv':
      return <Svg width={20} height={20} viewBox="0 0 24 24"><Rect x={2} y={7} width={20} height={13} rx={2} stroke={color} strokeWidth={1.9} fill="none" /><Path d="m7 2 5 5 5-5" stroke={color} strokeWidth={1.9} strokeLinecap="round" fill="none" /></Svg>;
    case 'strip':
      return <Svg width={20} height={20} viewBox="0 0 24 24"><Circle cx={13.5} cy={6.5} r={2.5} stroke={color} strokeWidth={1.9} fill="none" /><Circle cx={8.5} cy={7.5} r={2.5} stroke={color} strokeWidth={1.9} fill="none" /></Svg>;
    case 'fan':
      return <Svg width={20} height={20} viewBox="0 0 24 24"><Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.9} fill="none" /><Path d="M12 9c1.5-3 4-4 6-3-1 2-1 4-3 5" stroke={color} strokeWidth={1.9} strokeLinecap="round" fill="none" /></Svg>;
    case 'projector':
      return <Svg width={20} height={20} viewBox="0 0 24 24"><Path d="M5 7h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" stroke={color} strokeWidth={1.9} fill="none" /><Circle cx={9} cy={12} r={2.5} stroke={color} strokeWidth={1.9} fill="none" /></Svg>;
    case 'plug':
      return <Svg width={20} height={20} viewBox="0 0 24 24"><Rect x={6} y={2} width={12} height={20} rx={2} stroke={color} strokeWidth={1.9} fill="none" /><Path d="M10 6h4M12 18h.01" stroke={color} strokeWidth={1.9} strokeLinecap="round" /></Svg>;
    default:
      return <Svg width={20} height={20} viewBox="0 0 24 24"><Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.9} fill="none" /></Svg>;
  }
}

function getAccent(type: DeviceType): { accent: string; softBg: string } {
  switch (type) {
    case 'light': return { accent: Colors.warning, softBg: 'rgba(240,194,103,0.16)' };
    case 'strip': return { accent: Colors.purple, softBg: 'rgba(200,162,255,0.16)' };
    case 'projector': return { accent: Colors.purple, softBg: 'rgba(200,162,255,0.16)' };
    default: return { accent: Colors.accent, softBg: 'rgba(91,140,255,0.16)' };
  }
}

export function DevicesScreen({ navigation }: any) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const dispatch = useAppDispatch();
  const devices = useAppSelector(s => s.devices.devices);
  const [search, setSearch] = useState('');
  const [filterRoom, setFilterRoom] = useState<string | null>(null);

  const rooms = [...new Set(devices.map(d => d.room))];
  const filtered = devices.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.room.toLowerCase().includes(search.toLowerCase());
    const matchRoom = !filterRoom || d.room === filterRoom;
    return matchSearch && matchRoom;
  });

  const onCount = devices.filter(d => d.isOn).length;
  const onlineCount = devices.filter(d => d.isOnline).length;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Devices</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('AddDevice')}>
            <Svg width={19} height={19} viewBox="0 0 24 24"><Path d="M12 5v14M5 12h14" stroke={Colors.textSecondary} strokeWidth={2.2} strokeLinecap="round" /></Svg>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.onlineDot} />
            <Text style={styles.statLabel}>Online</Text>
            <Text style={styles.statValue}>{onlineCount}/{devices.length}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Active</Text>
            <Text style={styles.statValue}>{onCount} on</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Rooms</Text>
            <Text style={styles.statValue}>{rooms.length}</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Svg width={16} height={16} viewBox="0 0 24 24"><Path d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" stroke={Colors.textMuted} strokeWidth={2} strokeLinecap="round" fill="none" /></Svg>
          <TextInput
            style={styles.searchInput}
            placeholder="Search devices..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Svg width={16} height={16} viewBox="0 0 24 24"><Path d="M18 6 6 18M6 6l12 12" stroke={Colors.textMuted} strokeWidth={2} strokeLinecap="round" /></Svg>
            </TouchableOpacity>
          )}
        </View>

        {/* Room Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, !filterRoom && styles.filterChipActive]}
            onPress={() => setFilterRoom(null)}
          >
            <Text style={[styles.filterChipText, !filterRoom && styles.filterChipTextActive]}>All</Text>
          </TouchableOpacity>
          {rooms.map(room => (
            <TouchableOpacity
              key={room}
              style={[styles.filterChip, filterRoom === room && styles.filterChipActive]}
              onPress={() => setFilterRoom(filterRoom === room ? null : room)}
            >
              <Text style={[styles.filterChipText, filterRoom === room && styles.filterChipTextActive]}>{room}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionLabel}>{filtered.length} DEVICES</Text>

        {filtered.map(dev => {
          const { accent, softBg } = getAccent(dev.type);
          const iconColor = dev.isOn ? accent : '#85858e';
          return (
            <TouchableOpacity
              key={dev.id}
              style={[styles.deviceRow, dev.isOn && { borderColor: `${accent}66`, backgroundColor: `${accent}1A` }]}
              onPress={() => navigation.navigate('DeviceDetail', { deviceId: dev.id })}
              activeOpacity={0.85}
            >
              <View style={[styles.devIcon, { backgroundColor: dev.isOn ? softBg : 'rgba(255,255,255,0.05)' }]}>
                <DeviceIcon type={dev.type} color={iconColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.devName}>{dev.name}</Text>
                <Text style={styles.devSub}>
                  {dev.room} · {dev.isOnline ? (dev.isOn ? 'On' : 'Off') : 'Offline'}
                  {dev.isOn && dev.type === 'light' ? ` · ${dev.brightness}%` : ''}
                  {dev.isOn && dev.type === 'ac' ? ` · ${dev.temperature}°C` : ''}
                </Text>
              </View>
              <Toggle value={dev.isOn} onToggle={() => dispatch(toggleDevice(dev.id))} activeColor={accent} />
            </TouchableOpacity>
          );
        })}

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No devices found</Text>
            <Text style={styles.emptySubText}>Try a different search or add a new device</Text>
          </View>
        )}

        {/* Discover CTA */}
        <TouchableOpacity style={styles.discoverBtn} onPress={() => navigation.navigate('AddDevice')}>
          <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" stroke={Colors.accent} strokeWidth={1.8} strokeLinecap="round" fill="none" /></Svg>
          <Text style={styles.discoverBtnText}>Discover & Add New Devices</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 22, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  title: { fontSize: 27, fontWeight: '600', color: Colors.textPrimary, letterSpacing: -0.5 },
  iconBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 18, padding: 14, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 8 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  statLabel: { fontSize: 12, color: Colors.textDim, flex: 1 },
  statValue: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary, padding: 0 },
  filterScroll: { marginBottom: 18 },
  filterChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  filterChipActive: { backgroundColor: Colors.accentSoft, borderColor: Colors.accent },
  filterChipText: { fontSize: 13, color: Colors.textDim, fontWeight: '500' },
  filterChipTextActive: { color: Colors.accent, fontWeight: '600' },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 12 },
  deviceRow: { flexDirection: 'row', alignItems: 'center', gap: 13, borderRadius: 18, padding: 13, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  devIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  devName: { fontSize: 14.5, fontWeight: '600', color: Colors.textPrimary },
  devSub: { fontSize: 12, color: Colors.textDim },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  emptySubText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  discoverBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 18, padding: 16, marginTop: 8, borderWidth: 1, borderColor: `${Colors.accent}66`, backgroundColor: Colors.accentSoft },
  discoverBtnText: { fontSize: 14, fontWeight: '600', color: Colors.accent },
});
