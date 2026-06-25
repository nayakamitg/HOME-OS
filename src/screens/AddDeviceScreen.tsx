import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Animated, Easing } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { useTheme, ThemeColors } from '../theme/ThemeContext';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { addDevice, setScanning, addDiscoveredDevice, DiscoveredDevice } from '../store/slices/devicesSlice';
import { addDeviceToRoom } from '../store/slices/roomsSlice';
import { addEvent } from '../store/slices/activitySlice';
import { pushCreateDevice } from '../services/sync';
import { DeviceType } from '../store/slices/devicesSlice';

const DISCOVERABLE_DEVICES: DiscoveredDevice[] = [
  { id: 'disc-bulb-1', name: 'Lumio Smart Bulb', type: 'light', protocol: 'Wi-Fi · RGBW', signal: 92 },
  { id: 'disc-plug-1', name: 'Smart Plug Mini', type: 'plug', protocol: 'Wi-Fi · 2.4GHz', signal: 87 },
  { id: 'disc-strip-1', name: 'LED Strip Pro', type: 'strip', protocol: 'Bluetooth', signal: 75 },
  { id: 'disc-cam-1', name: 'Security Camera', type: 'camera', protocol: 'Wi-Fi · 5GHz', signal: 95 },
  { id: 'disc-fan-1', name: 'Smart Fan Controller', type: 'fan', protocol: 'Zigbee', signal: 80 },
];

const DEVICE_TYPES: { type: DeviceType; label: string; icon: React.ReactNode }[] = [
  { type: 'light', label: 'Light', icon: <Svg width={22} height={22} viewBox="0 0 24 24"><Path d="M9 18h6M10 22h4M15 14c.2-1 .7-1.7 1.4-2.5A4.6 4.6 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5C8.3 12.3 8.8 13 9 14" stroke={Colors.warning} strokeWidth={1.9} strokeLinecap="round" fill="none" /></Svg> },
  { type: 'ac', label: 'AC', icon: <Svg width={22} height={22} viewBox="0 0 24 24"><Path d="M14 4v10.5a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" stroke={Colors.accent} strokeWidth={1.9} fill="none" /></Svg> },
  { type: 'tv', label: 'TV', icon: <Svg width={22} height={22} viewBox="0 0 24 24"><Rect x={2} y={7} width={20} height={13} rx={2} stroke={Colors.accent} strokeWidth={1.9} fill="none" /></Svg> },
  { type: 'strip', label: 'LED Strip', icon: <Svg width={22} height={22} viewBox="0 0 24 24"><Circle cx={8} cy={12} r={3} stroke={Colors.purple} strokeWidth={1.9} fill="none" /><Circle cx={16} cy={12} r={3} stroke={Colors.purple} strokeWidth={1.9} fill="none" /></Svg> },
  { type: 'fan', label: 'Fan', icon: <Svg width={22} height={22} viewBox="0 0 24 24"><Circle cx={12} cy={12} r={3} stroke={Colors.accent} strokeWidth={1.9} fill="none" /><Path d="M12 9c1.5-3 4-4 6-3" stroke={Colors.accent} strokeWidth={1.9} strokeLinecap="round" fill="none" /></Svg> },
  { type: 'plug', label: 'Smart Plug', icon: <Svg width={22} height={22} viewBox="0 0 24 24"><Rect x={6} y={2} width={12} height={20} rx={2} stroke={Colors.accent} strokeWidth={1.9} fill="none" /></Svg> },
  { type: 'projector', label: 'Projector', icon: <Svg width={22} height={22} viewBox="0 0 24 24"><Path d="M5 7h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" stroke={Colors.purple} strokeWidth={1.9} fill="none" /></Svg> },
  { type: 'sensor', label: 'Sensor', icon: <Svg width={22} height={22} viewBox="0 0 24 24"><Circle cx={12} cy={12} r={9} stroke={Colors.success} strokeWidth={1.9} fill="none" /><Circle cx={12} cy={12} r={3} stroke={Colors.success} strokeWidth={1.9} fill="none" /></Svg> },
];

type Mode = 'choose' | 'discover' | 'manual';

export function AddDeviceScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const Colors = useTheme();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const rooms = useAppSelector(s => s.rooms.rooms);
  const discoveredDevices = useAppSelector(s => s.devices.discoveredDevices);
  const isScanning = useAppSelector(s => s.devices.isScanning);
  const existingDevices = useAppSelector(s => s.devices.devices);

  const [mode, setMode] = useState<Mode>('choose');
  const [selectedDiscovered, setSelectedDiscovered] = useState<string[]>([]);
  const [showManual, setShowManual] = useState(false);

  // Manual form
  const [devName, setDevName] = useState('');
  const [selectedType, setSelectedType] = useState<DeviceType>('light');
  const [selectedRoomId, setSelectedRoomId] = useState(rooms[0]?.id || '');

  // Radar animation
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isScanning) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isScanning]);

  function startScan() {
    setMode('discover');
    dispatch(setScanning(true));
    const addWithDelay = (device: DiscoveredDevice, delay: number) => {
      setTimeout(() => {
        if (!existingDevices.find(d => d.name === device.name)) {
          dispatch(addDiscoveredDevice(device));
        }
      }, delay);
    };
    addWithDelay(DISCOVERABLE_DEVICES[0], 1200);
    addWithDelay(DISCOVERABLE_DEVICES[1], 2400);
    addWithDelay(DISCOVERABLE_DEVICES[2], 3600);
    addWithDelay(DISCOVERABLE_DEVICES[3], 5000);
    addWithDelay(DISCOVERABLE_DEVICES[4], 6500);
    setTimeout(() => dispatch(setScanning(false)), 8000);
  }

  function toggleSelect(id: string) {
    setSelectedDiscovered(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }

  function addSelectedDevices() {
    const room = rooms.find(r => r.id === selectedRoomId) || rooms[0];
    selectedDiscovered.forEach(id => {
      const disc = discoveredDevices.find(d => d.id === id);
      if (!disc) return;
      const newId = disc.id + '-' + Date.now();
      const device = {
        id: newId, name: disc.name, room: room?.name || 'Living Room', type: disc.type,
        isOn: false, brightness: 100, temperature: 24, color: '#5b8cff',
        powerWatts: disc.type === 'ac' ? 1200 : disc.type === 'tv' ? 150 : 20,
        isOnline: true, isFavorite: false,
      };
      dispatch(addDevice(device));
      if (room) {
        dispatch(addDeviceToRoom({ roomId: room.id, deviceId: newId }));
        dispatch(pushCreateDevice(device, room.id));
      }
      dispatch(addEvent({ title: `${disc.name} added`, subtitle: `${room?.name || ''} · ${disc.protocol}`, category: 'devices' }));
    });
    navigation.goBack();
  }

  function addManualDevice() {
    if (!devName.trim()) return;
    const room = rooms.find(r => r.id === selectedRoomId) || rooms[0];
    const id = devName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    const device = {
      id, name: devName.trim(), room: room?.name || 'Living Room', type: selectedType,
      isOn: false, brightness: 100, temperature: 24, color: '#5b8cff',
      powerWatts: selectedType === 'ac' ? 1200 : selectedType === 'tv' ? 150 : 20,
      isOnline: true, isFavorite: false,
    };
    dispatch(addDevice(device));
    if (room) {
      dispatch(addDeviceToRoom({ roomId: room.id, deviceId: id }));
      dispatch(pushCreateDevice(device, room.id));
    }
    dispatch(addEvent({ title: `${devName.trim()} added`, subtitle: room?.name || '', category: 'devices' }));
    navigation.goBack();
  }

  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Svg width={19} height={19} viewBox="0 0 24 24"><Path d="m15 18-6-6 6-6" stroke={Colors.textSecondary} strokeWidth={2.2} strokeLinecap="round" fill="none" /></Svg>
        </TouchableOpacity>
        <Text style={styles.title}>Add Device</Text>
        <View style={{ width: 36 }} />
      </View>

      {mode === 'choose' && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionLabel}>HOW TO ADD</Text>
          <TouchableOpacity style={styles.optionCard} onPress={startScan} activeOpacity={0.85}>
            <View style={styles.optionIcon}>
              <Svg width={24} height={24} viewBox="0 0 24 24"><Path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" stroke={Colors.accent} strokeWidth={1.8} strokeLinecap="round" fill="none" /></Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitle}>Discover Nearby Devices</Text>
              <Text style={styles.optionSub}>Scan for smart devices on your network</Text>
            </View>
            <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="m9 18 6-6-6-6" stroke={Colors.textMuted} strokeWidth={2} strokeLinecap="round" fill="none" /></Svg>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionCard} onPress={() => setMode('manual')} activeOpacity={0.85}>
            <View style={styles.optionIcon}>
              <Svg width={24} height={24} viewBox="0 0 24 24"><Path d="M12 5v14M5 12h14" stroke={Colors.warning} strokeWidth={2.2} strokeLinecap="round" /></Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitle}>Add Manually</Text>
              <Text style={styles.optionSub}>Enter device name and type manually</Text>
            </View>
            <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="m9 18 6-6-6-6" stroke={Colors.textMuted} strokeWidth={2} strokeLinecap="round" fill="none" /></Svg>
          </TouchableOpacity>
        </ScrollView>
      )}

      {mode === 'discover' && (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Radar */}
          <View style={styles.radarContainer}>
            <Animated.View style={[styles.radarRing, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
            <View style={styles.radarCore}>
              <Svg width={34} height={34} viewBox="0 0 24 24"><Path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" stroke={Colors.accent} strokeWidth={1.8} strokeLinecap="round" fill="none" /></Svg>
            </View>
          </View>

          <View style={styles.scanStatus}>
            {isScanning ? (
              <Text style={styles.scanningText}>Scanning for devices…</Text>
            ) : (
              <Text style={styles.scanningText}>Scan complete · {discoveredDevices.length} new · {existingDevices.length} in home</Text>
            )}
          </View>

          {/* Actual devices already registered in this home */}
          {existingDevices.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>IN YOUR HOME</Text>
              {existingDevices.map(dev => (
                <View key={dev.id} style={styles.discoveredRow}>
                  <View style={styles.devIcon}>
                    <Svg width={20} height={20} viewBox="0 0 24 24"><Circle cx={12} cy={12} r={9} stroke={dev.isOnline ? Colors.success : Colors.textMuted} strokeWidth={1.9} fill="none" /></Svg>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.devName}>{dev.name}</Text>
                    <Text style={styles.devSub}>{dev.room} · {dev.isOnline ? 'Online' : 'Offline'}</Text>
                  </View>
                  <Text style={styles.addedTag}>Added</Text>
                </View>
              ))}
              <View style={{ height: 16 }} />
            </>
          )}

          {discoveredDevices.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>FOUND NEARBY</Text>
              {discoveredDevices.map(dev => {
                const isSelected = selectedDiscovered.includes(dev.id);
                const alreadyAdded = existingDevices.some(d => d.name === dev.name);
                return (
                  <TouchableOpacity
                    key={dev.id}
                    style={[styles.discoveredRow, isSelected && styles.discoveredRowSelected, alreadyAdded && { opacity: 0.5 }]}
                    onPress={() => !alreadyAdded && toggleSelect(dev.id)}
                    activeOpacity={0.85}
                    disabled={alreadyAdded}
                  >
                    <View style={styles.devIcon}>
                      <Svg width={20} height={20} viewBox="0 0 24 24"><Circle cx={12} cy={12} r={9} stroke={isSelected ? Colors.accent : Colors.textMuted} strokeWidth={1.9} fill="none" /></Svg>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.devName}>{dev.name}</Text>
                      <Text style={styles.devSub}>{dev.protocol} · Signal {dev.signal}%</Text>
                    </View>
                    {alreadyAdded ? (
                      <Text style={styles.addedTag}>Added</Text>
                    ) : (
                      <View style={[styles.checkCircle, isSelected && styles.checkCircleActive]}>
                        {isSelected && <Svg width={13} height={13} viewBox="0 0 24 24"><Path d="M20 6 9 17l-5-5" stroke="#fff" strokeWidth={3} strokeLinecap="round" fill="none" /></Svg>}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* Room selection */}
              <Text style={[styles.sectionLabel, { marginTop: 20 }]}>ADD TO ROOM</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {rooms.map(r => (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.roomChip, selectedRoomId === r.id && styles.roomChipActive]}
                    onPress={() => setSelectedRoomId(r.id)}
                  >
                    <Text style={[styles.roomChipText, selectedRoomId === r.id && styles.roomChipTextActive]}>{r.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {!isScanning && discoveredDevices.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No devices found</Text>
              <Text style={styles.emptySubText}>Make sure your devices are in pairing mode and on the same network</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={startScan}>
                <Text style={styles.retryBtnText}>Scan Again</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {mode === 'manual' && (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionLabel}>DEVICE NAME</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="e.g. Bedroom Lamp"
            placeholderTextColor={Colors.textMuted}
            value={devName}
            onChangeText={setDevName}
          />

          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>DEVICE TYPE</Text>
          <View style={styles.typeGrid}>
            {DEVICE_TYPES.map(dt => (
              <TouchableOpacity
                key={dt.type}
                style={[styles.typeCard, selectedType === dt.type && styles.typeCardActive]}
                onPress={() => setSelectedType(dt.type)}
                activeOpacity={0.85}
              >
                {dt.icon}
                <Text style={[styles.typeLabel, selectedType === dt.type && styles.typeLabelActive]}>{dt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>ROOM</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
            {rooms.map(r => (
              <TouchableOpacity
                key={r.id}
                style={[styles.roomChip, selectedRoomId === r.id && styles.roomChipActive]}
                onPress={() => setSelectedRoomId(r.id)}
              >
                <Text style={[styles.roomChipText, selectedRoomId === r.id && styles.roomChipTextActive]}>{r.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ScrollView>
      )}

      {/* Footer */}
      {mode === 'discover' && selectedDiscovered.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.primaryBtn} onPress={addSelectedDevices}>
            <Text style={styles.primaryBtnText}>Add {selectedDiscovered.length} Device{selectedDiscovered.length > 1 ? 's' : ''}</Text>
          </TouchableOpacity>
        </View>
      )}
      {mode === 'manual' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryBtn, !devName.trim() && { opacity: 0.5 }]}
            onPress={addManualDevice}
            disabled={!devName.trim()}
          >
            <Text style={styles.primaryBtnText}>Add Device</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  content: { padding: 20, paddingBottom: 120 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 12 },
  optionCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.surface, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  optionIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: Colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  optionTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: 3 },
  optionSub: { fontSize: 12.5, color: Colors.textDim },
  radarContainer: { alignItems: 'center', justifyContent: 'center', height: 160, marginBottom: 16 },
  radarRing: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(91,140,255,0.25)' },
  radarCore: { width: 90, height: 90, borderRadius: 45, backgroundColor: Colors.surface, borderWidth: 1, borderColor: 'rgba(91,140,255,0.4)', alignItems: 'center', justifyContent: 'center' },
  scanStatus: { alignItems: 'center', marginBottom: 20 },
  scanningText: { fontSize: 13.5, color: Colors.textDim },
  discoveredRow: { flexDirection: 'row', alignItems: 'center', gap: 13, borderRadius: 18, padding: 14, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  discoveredRowSelected: { backgroundColor: 'rgba(91,140,255,0.08)', borderColor: 'rgba(91,140,255,0.4)' },
  devIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  devName: { fontSize: 14.5, fontWeight: '600', color: Colors.textPrimary },
  devSub: { fontSize: 12, color: Colors.textDim },
  checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  checkCircleActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  addedTag: { fontSize: 11, fontWeight: '600', color: Colors.success, backgroundColor: Colors.successSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  emptyState: { alignItems: 'center', padding: 40, gap: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },
  emptySubText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  retryBtn: { backgroundColor: Colors.surface, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border, marginTop: 8 },
  retryBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  nameInput: { backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.textPrimary },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeCard: { width: '22%', aspectRatio: 1, borderRadius: 16, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', gap: 6 },
  typeCardActive: { backgroundColor: Colors.accentSoft, borderColor: Colors.accent },
  typeLabel: { fontSize: 10, color: Colors.textDim, fontWeight: '500', textAlign: 'center' },
  typeLabelActive: { color: Colors.accent },
  roomChip: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 9, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  roomChipActive: { backgroundColor: Colors.accentSoft, borderColor: Colors.accent },
  roomChipText: { fontSize: 13, color: Colors.textDim, fontWeight: '500' },
  roomChipTextActive: { color: Colors.accent, fontWeight: '600' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 34, backgroundColor: Colors.bg, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  primaryBtn: { borderRadius: 16, padding: 16, backgroundColor: Colors.accent, alignItems: 'center' },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
