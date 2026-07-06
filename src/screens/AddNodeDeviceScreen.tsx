import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme, ThemeColors } from '../theme/ThemeContext';
import { useAppSelector } from '../store/hooks';
import { Toggle } from '../components/Toggle';
import { NodesApi, RoomsApi, DevicesApi } from '../api/resources';
import { BackendDeviceType, BackendRoom } from '../api/types';

const TYPES: { type: BackendDeviceType; label: string }[] = [
  { type: 'LIGHT', label: 'Light' }, { type: 'FAN', label: 'Fan' },
  { type: 'AC', label: 'AC' }, { type: 'SMART_PLUG', label: 'Plug' },
  { type: 'TV', label: 'TV' }, { type: 'RGB_LIGHT', label: 'RGB' },
  { type: 'PROJECTOR', label: 'Projector' }, { type: 'GENERIC', label: 'Generic' },
];

export function AddNodeDeviceScreen({ navigation, route }: any) {
  const Colors = useTheme();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const { nodeId, gpio } = route.params as { nodeId: string; gpio?: number };
  const activeHomeId = useAppSelector((s) => s.auth.activeHomeId);

  const [freePins, setFreePins] = useState<number[]>([]);
  const [rooms, setRooms] = useState<BackendRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState<BackendDeviceType>('LIGHT');
  const [roomId, setRoomId] = useState('');
  const [pin, setPin] = useState<number | null>(gpio ?? null);
  const [activeHigh, setActiveHigh] = useState(true);

  const load = useCallback(async () => {
    try {
      const [pins, rms] = await Promise.all([
        NodesApi.freePins(nodeId),
        activeHomeId ? RoomsApi.list(activeHomeId) : Promise.resolve([] as BackendRoom[]),
      ]);
      // keep the prefilled pin selectable even if it just got claimed
      setFreePins(gpio != null && !pins.includes(gpio) ? [gpio, ...pins] : pins);
      setRooms(rms);
      setRoomId((r) => r || rms[0]?.id || '');
      setPin((p) => (p != null ? p : pins[0] ?? null));
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [nodeId, activeHomeId, gpio]);

  useEffect(() => { load(); }, [load]);

  async function submit() {
    if (!name.trim()) { Alert.alert('Name required'); return; }
    if (pin == null) { Alert.alert('Pick a GPIO pin'); return; }
    if (!roomId) { Alert.alert('Pick a room'); return; }
    setSaving(true);
    try {
      await DevicesApi.create({ name: name.trim(), roomId, deviceType: type, nodeId, gpioPin: pin, activeHigh });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Could not add device', e?.message ?? 'Error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <View style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator color={Colors.accent} /></View>;
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Svg width={19} height={19} viewBox="0 0 24 24"><Path d="m15 18-6-6 6-6" stroke={Colors.textSecondary} strokeWidth={2.2} strokeLinecap="round" fill="none" /></Svg>
        </TouchableOpacity>
        <Text style={styles.title}>Add Device</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>NAME</Text>
        <TextInput style={styles.input} placeholder="e.g. Ceiling Light" placeholderTextColor={Colors.textMuted} value={name} onChangeText={setName} />

        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>TYPE</Text>
        <View style={styles.wrap}>
          {TYPES.map((t) => (
            <TouchableOpacity key={t.type} style={[styles.chip, type === t.type && styles.chipActive]} onPress={() => setType(t.type)}>
              <Text style={[styles.chipText, type === t.type && styles.chipTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>GPIO PIN {freePins.length === 0 && '· none free!'}</Text>
        <View style={styles.wrap}>
          {freePins.map((g) => (
            <TouchableOpacity key={g} style={[styles.pinChip, pin === g && styles.chipActive]} onPress={() => setPin(g)}>
              <Text style={[styles.chipText, pin === g && styles.chipTextActive]}>GPIO {g}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>ROOM</Text>
        <View style={styles.wrap}>
          {rooms.map((r) => (
            <TouchableOpacity key={r.id} style={[styles.chip, roomId === r.id && styles.chipActive]} onPress={() => setRoomId(r.id)}>
              <Text style={[styles.chipText, roomId === r.id && styles.chipTextActive]}>{r.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.polarityRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.polarityLabel}>Active-high</Text>
            <Text style={styles.polaritySub}>Off for active-low relay modules</Text>
          </View>
          <Toggle value={activeHigh} onToggle={() => setActiveHigh((v) => !v)} activeColor={Colors.accent} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.primaryBtn, (saving || !name.trim() || pin == null) && { opacity: 0.5 }]} onPress={submit} disabled={saving || !name.trim() || pin == null}>
          <Text style={styles.primaryBtnText}>{saving ? 'Adding…' : 'Add Device'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  iconBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  content: { padding: 20, paddingBottom: 120 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 12 },
  input: { backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.textPrimary },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 20, paddingHorizontal: 15, paddingVertical: 9, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  pinChip: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.accentSoft, borderColor: Colors.accent },
  chipText: { fontSize: 13, color: Colors.textDim, fontWeight: '500' },
  chipTextActive: { color: Colors.accent, fontWeight: '700' },
  polarityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24, backgroundColor: Colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  polarityLabel: { fontSize: 14.5, fontWeight: '600', color: Colors.textPrimary },
  polaritySub: { fontSize: 12, color: Colors.textDim, marginTop: 2 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 34, backgroundColor: Colors.bg, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  primaryBtn: { borderRadius: 16, padding: 16, backgroundColor: Colors.accent, alignItems: 'center' },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
