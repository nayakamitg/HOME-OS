import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { Toggle } from '../components/Toggle';
import { Colors } from '../theme/colors';
import { useTheme, ThemeColors } from '../theme/ThemeContext';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { toggleDevice } from '../store/slices/devicesSlice';
import { DeviceType } from '../store/slices/devicesSlice';

function getAccent(type: DeviceType): { accent: string; softBg: string } {
  switch (type) {
    case 'light': return { accent: Colors.warning, softBg: 'rgba(240,194,103,0.16)' };
    case 'strip': return { accent: Colors.purple, softBg: 'rgba(200,162,255,0.16)' };
    case 'projector': return { accent: Colors.purple, softBg: 'rgba(200,162,255,0.16)' };
    default: return { accent: Colors.accent, softBg: 'rgba(91,140,255,0.16)' };
  }
}

export function RoomScreen({ navigation, route }: any) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const dispatch = useAppDispatch();
  const roomId = route?.params?.roomId;
  const rooms = useAppSelector(s => s.rooms.rooms);
  const allDevices = useAppSelector(s => s.devices.devices);

  const room = roomId ? rooms.find(r => r.id === roomId) : rooms[0];
  const roomDevices = allDevices.filter(d => room?.deviceIds.includes(d.id));
  const onCount = roomDevices.filter(d => d.isOn).length;

  if (!room) {
    return (
      <View style={styles.screen}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Svg width={19} height={19} viewBox="0 0 24 24"><Path d="m15 18-6-6 6-6" stroke={Colors.textSecondary} strokeWidth={2.2} strokeLinecap="round" fill="none" /></Svg>
        </TouchableOpacity>
        <Text style={{ color: Colors.textSecondary, textAlign: 'center', marginTop: 40 }}>Room not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Nav row */}
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Svg width={19} height={19} viewBox="0 0 24 24"><Path d="m15 18-6-6 6-6" stroke={Colors.textSecondary} strokeWidth={2.2} strokeLinecap="round" fill="none" /></Svg>
          </TouchableOpacity>
          <View style={styles.iconBtn}>
            <Svg width={19} height={19} viewBox="0 0 24 24"><Circle cx={12} cy={12} r={1.5} fill={Colors.textSecondary} /><Circle cx={19} cy={12} r={1.5} fill={Colors.textSecondary} /><Circle cx={5} cy={12} r={1.5} fill={Colors.textSecondary} /></Svg>
          </View>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{room.name}</Text>
          <View style={styles.heroStats}>
            <Text style={styles.heroStat}>{room.temperature}°C</Text>
            <Text style={styles.heroDot}>·</Text>
            <Text style={styles.heroStat}>{room.humidity}% RH</Text>
            <Text style={styles.heroDot}>·</Text>
            <Text style={styles.heroStat}>{onCount} active</Text>
          </View>
          <View style={styles.deviceBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.deviceBadgeText}>{roomDevices.length} devices</Text>
          </View>
        </View>

        {/* Climate strip */}
        <View style={styles.climateRow}>
          <View style={styles.climateCard}>
            <Svg width={20} height={20} viewBox="0 0 24 24"><Path d="M14 4v10.5a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" stroke={Colors.accent} strokeWidth={1.9} strokeLinecap="round" fill="none" /></Svg>
            <View>
              <Text style={styles.climateSub}>Temperature</Text>
              <Text style={styles.climateVal}>{room.temperature}°C</Text>
            </View>
          </View>
          <View style={styles.climateCard}>
            <Svg width={20} height={20} viewBox="0 0 24 24"><Circle cx={12} cy={12} r={4} stroke={Colors.warning} strokeWidth={1.9} fill="none" /><Path d="M12 2v2M12 20v2M4 12H2M22 12h-2" stroke={Colors.warning} strokeWidth={1.9} strokeLinecap="round" /></Svg>
            <View>
              <Text style={styles.climateSub}>Lights on</Text>
              <Text style={styles.climateVal}>{roomDevices.filter(d => (d.type === 'light' || d.type === 'strip') && d.isOn).length} of {roomDevices.filter(d => d.type === 'light' || d.type === 'strip').length}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>DEVICES ({roomDevices.length})</Text>
        {roomDevices.map(dev => {
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
                <Svg width={20} height={20} viewBox="0 0 24 24">
                  <Circle cx={12} cy={12} r={9} stroke={iconColor} strokeWidth={1.9} fill="none" />
                </Svg>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.devName}>{dev.name}</Text>
                <Text style={styles.devSub}>{dev.isOnline ? (dev.isOn ? 'On' : 'Off') : 'Offline'}</Text>
              </View>
              <Toggle value={dev.isOn} onToggle={() => dispatch(toggleDevice(dev.id))} activeColor={accent} />
            </TouchableOpacity>
          );
        })}

        {roomDevices.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No devices in this room</Text>
            <TouchableOpacity style={styles.addDeviceBtn} onPress={() => navigation.navigate('AddDevice')}>
              <Text style={styles.addDeviceBtnText}>Add Device</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: 22, paddingBottom: 60 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  iconBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  hero: { borderRadius: 26, height: 158, backgroundColor: '#2a2238', marginBottom: 16, padding: 22, justifyContent: 'flex-end' },
  heroTitle: { fontSize: 28, fontWeight: '600', color: Colors.textPrimary, letterSpacing: -0.5 },
  heroStats: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  heroStat: { fontFamily: 'monospace', fontSize: 12.5, color: '#c8c8d0' },
  heroDot: { color: 'rgba(200,200,200,0.4)', fontSize: 12 },
  deviceBadge: { position: 'absolute', top: 20, right: 20, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(10,10,11,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  deviceBadgeText: { fontSize: 11.5, fontWeight: '600', color: Colors.textPrimary },
  climateRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  climateCard: { flex: 1, borderRadius: 18, padding: 13, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 10 },
  climateSub: { fontSize: 11, color: Colors.textDim },
  climateVal: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.4, color: '#c8c8d0', textTransform: 'uppercase', marginBottom: 12 },
  deviceRow: { flexDirection: 'row', alignItems: 'center', gap: 13, borderRadius: 18, padding: 13, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  devIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  devName: { fontSize: 14.5, fontWeight: '600', color: Colors.textPrimary },
  devSub: { fontSize: 12, color: Colors.textDim },
  emptyState: { alignItems: 'center', padding: 40, gap: 16 },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
  addDeviceBtn: { backgroundColor: Colors.accentSoft, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12, borderWidth: 1, borderColor: Colors.accent },
  addDeviceBtnText: { fontSize: 14, fontWeight: '600', color: Colors.accent },
});
