import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Toggle } from '../components/Toggle';
import { Colors } from '../theme/colors';
import { useTheme, ThemeColors } from '../theme/ThemeContext';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { toggleDevice, setDeviceBrightness, setDeviceTemperature } from '../store/slices/devicesSlice';
import { addEvent } from '../store/slices/activitySlice';

const TABS = ['control', 'schedule', 'automation', 'info'] as const;
const TAB_LABELS = { control: 'Control', schedule: 'Schedule', automation: 'Rules', info: 'Info' };

export function DeviceDetailScreen({ navigation, route }: any) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const dispatch = useAppDispatch();
  const deviceId = route?.params?.deviceId || 'livingLamp';
  const deviceRaw = useAppSelector(s => s.devices.devices.find(d => d.id === deviceId));
  const [tab, setTab] = useState<typeof TABS[number]>('control');
  const device = deviceRaw!;

  if (!deviceRaw) {
    return (
      <View style={styles.screen}>
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Svg width={19} height={19} viewBox="0 0 24 24"><Path d="m15 18-6-6 6-6" stroke={Colors.textSecondary} strokeWidth={2.2} strokeLinecap="round" fill="none" /></Svg>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: Colors.textSecondary }}>Device not found</Text>
        </View>
      </View>
    );
  }

  const accentColor = device.type === 'light' || device.type === 'strip' ? Colors.warning :
    device.type === 'projector' ? Colors.purple : Colors.accent;

  function handleToggle() {
    dispatch(toggleDevice(device.id));
    dispatch(addEvent({
      title: `${device.name} ${device.isOn ? 'turned off' : 'turned on'}`,
      subtitle: device.room,
      category: 'devices',
    }));
  }

  function handleBrightness(delta: number) {
    const newVal = Math.min(100, Math.max(0, device.brightness + delta));
    dispatch(setDeviceBrightness({ id: device.id, brightness: newVal }));
  }

  function handleTemperature(delta: number) {
    const newVal = Math.min(30, Math.max(16, device.temperature + delta));
    dispatch(setDeviceTemperature({ id: device.id, temperature: newVal }));
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Nav */}
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Svg width={19} height={19} viewBox="0 0 24 24"><Path d="m15 18-6-6 6-6" stroke={Colors.textSecondary} strokeWidth={2.2} strokeLinecap="round" fill="none" /></Svg>
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.subTitle}>{device.room}</Text>
            <Text style={styles.deviceTitle}>{device.name}</Text>
          </View>
          <View style={styles.iconBtn}>
            <Svg width={19} height={19} viewBox="0 0 24 24"><Circle cx={12} cy={12} r={1.5} fill={Colors.textSecondary} /><Circle cx={12} cy={5} r={1.5} fill={Colors.textSecondary} /><Circle cx={12} cy={19} r={1.5} fill={Colors.textSecondary} /></Svg>
          </View>
        </View>

        {/* Dial */}
        <View style={styles.dialWrap}>
          <View style={[styles.dialOuter, device.isOn && { shadowColor: accentColor }]}>
            <View style={styles.dialInner}>
              <Text style={[styles.dialValue, device.isOn ? { color: accentColor } : { color: Colors.textMuted }]}>
                {device.type === 'ac' ? device.temperature : device.brightness}
                <Text style={styles.dialUnit}>{device.type === 'ac' ? '°C' : '%'}</Text>
              </Text>
              <Text style={styles.dialLabel}>{device.type === 'ac' ? 'Temperature' : 'Brightness'}</Text>
              <Text style={styles.onlineStatus}>{device.isOnline ? (device.isOn ? '● On' : '○ Off') : '✕ Offline'}</Text>
            </View>
          </View>
        </View>

        {/* Brightness / Temperature controls */}
        {device.type !== 'tv' && device.type !== 'projector' && (
          <View style={styles.sliderRow}>
            <TouchableOpacity style={styles.sliderBtn} onPress={() => device.type === 'ac' ? handleTemperature(-1) : handleBrightness(-10)}>
              <Text style={styles.sliderBtnText}>−</Text>
            </TouchableOpacity>
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderFill, { width: `${device.type === 'ac' ? ((device.temperature - 16) / 14) * 100 : device.brightness}%`, backgroundColor: accentColor }]} />
            </View>
            <TouchableOpacity style={styles.sliderBtn} onPress={() => device.type === 'ac' ? handleTemperature(1) : handleBrightness(10)}>
              <Text style={styles.sliderBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Power row */}
        <View style={styles.powerRow}>
          <TouchableOpacity
            style={[styles.powerBtn, device.isOn && { borderColor: `${accentColor}66`, backgroundColor: `${accentColor}15` }]}
            onPress={handleToggle}
            activeOpacity={0.8}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M12 2v10M18.4 6.6a9 9 0 1 1-12.77.04" stroke={device.isOn ? accentColor : Colors.textSecondary} strokeWidth={2.2} strokeLinecap="round" fill="none" /></Svg>
            <Text style={[styles.powerBtnText, device.isOn && { color: accentColor }]}>{device.isOn ? 'Turn Off' : 'Turn On'}</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{TAB_LABELS[t]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'control' && (
          <View>
            {device.type === 'light' && (
              <>
                <Text style={styles.panelLabel}>COLOR TEMPERATURE</Text>
                <View style={styles.tempSlider}>
                  <View style={[styles.tempThumb, { left: `${((device.temperature - 2700) / (6500 - 2700)) * 80}%` }]} />
                </View>
                <View style={styles.tempLabels}>
                  <Text style={styles.tempLabel}>Warm 2700K</Text>
                  <Text style={styles.tempLabel}>Cool 6500K</Text>
                </View>
                <Text style={styles.panelLabel}>PRESETS</Text>
                <View style={styles.colorRow}>
                  {['#f0c267', '#ff6b6b', '#3ddc97', '#5b8cff', '#c8a2ff'].map((c, i) => (
                    <TouchableOpacity key={i} style={[styles.colorDot, { backgroundColor: c }]} />
                  ))}
                </View>
              </>
            )}
            <View style={styles.statsRowSmall}>
              <View style={styles.statSmallCard}>
                <Text style={styles.statSmallLabel}>Power draw</Text>
                <Text style={styles.statSmallValue}>{device.isOn ? `${device.powerWatts}W` : '0W'}</Text>
              </View>
              <View style={styles.statSmallCard}>
                <Text style={styles.statSmallLabel}>Status</Text>
                <Text style={styles.statSmallValue}>{device.isOnline ? 'Online' : 'Offline'}</Text>
              </View>
            </View>
          </View>
        )}

        {tab === 'schedule' && (
          <View style={{ gap: 10 }}>
            {[
              { name: 'Sunset On', time: 'Daily · 18:30 · Warm 40%', color: Colors.warning, active: true },
              { name: 'Bedtime Off', time: 'Daily · 23:00', color: Colors.accent, active: false },
            ].map(s => (
              <View key={s.name} style={styles.scheduleRow}>
                <View style={[styles.scheduleIcon, { backgroundColor: `${s.color}29` }]}>
                  <Svg width={18} height={18} viewBox="0 0 24 24"><Circle cx={12} cy={12} r={9} stroke={s.color} strokeWidth={2} fill="none" /><Path d="M12 7v5l3 2" stroke={s.color} strokeWidth={2} strokeLinecap="round" /></Svg>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.scheduleName}>{s.name}</Text>
                  <Text style={styles.scheduleTime}>{s.time}</Text>
                </View>
                <Toggle value={s.active} onToggle={() => { }} activeColor={Colors.accent} />
              </View>
            ))}
            <TouchableOpacity style={styles.addBtn}>
              <Svg width={17} height={17} viewBox="0 0 24 24"><Path d="M12 5v14M5 12h14" stroke={Colors.textSecondary} strokeWidth={2.2} strokeLinecap="round" /></Svg>
              <Text style={styles.addBtnText}>Add schedule</Text>
            </TouchableOpacity>
          </View>
        )}

        {tab === 'automation' && (
          <View style={{ gap: 10 }}>
            {[
              { when: 'Motion detected nearby', then: `Turn ${device.name} on` },
              { when: 'Sleep scene starts', then: `Turn ${device.name} off` },
            ].map((r, i) => (
              <View key={i} style={styles.ruleCard}>
                <View style={styles.ruleRow}><Text style={styles.ruleTag}>WHEN</Text><Text style={styles.ruleText}>{r.when}</Text></View>
                <View style={[styles.ruleRow, { marginTop: 8 }]}><Text style={[styles.ruleTag, styles.ruleTagGreen]}>DO</Text><Text style={styles.ruleText}>{r.then}</Text></View>
              </View>
            ))}
            <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('Automation')}>
              <Svg width={17} height={17} viewBox="0 0 24 24"><Path d="M12 5v14M5 12h14" stroke={Colors.textSecondary} strokeWidth={2.2} strokeLinecap="round" /></Svg>
              <Text style={styles.addBtnText}>Create automation</Text>
            </TouchableOpacity>
          </View>
        )}

        {tab === 'info' && (
          <View style={styles.infoTable}>
            {[
              { label: 'Device ID', value: device.id },
              { label: 'Type', value: device.type },
              { label: 'Room', value: device.room },
              { label: 'Status', value: device.isOnline ? 'Online' : 'Offline', valueColor: device.isOnline ? Colors.success : Colors.danger },
              { label: 'Power', value: `${device.powerWatts}W` },
            ].map((row, i, arr) => (
              <View key={row.label} style={[styles.infoRow, i < arr.length - 1 && styles.infoRowBorder]}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={[styles.infoValue, row.valueColor ? { color: row.valueColor } : {}]}>{row.value}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 22, paddingBottom: 60 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  iconBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  subTitle: { fontSize: 11.5, color: Colors.textDim },
  deviceTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  dialWrap: { alignItems: 'center', marginVertical: 10 },
  dialOuter: { width: 210, height: 210, borderRadius: 105, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 8 },
  dialInner: { width: 170, height: 170, borderRadius: 85, backgroundColor: '#0d0d0f', alignItems: 'center', justifyContent: 'center' },
  dialValue: { fontSize: 44, fontWeight: '600', letterSpacing: -1, marginTop: 6 },
  dialUnit: { fontSize: 20 },
  dialLabel: { fontSize: 12, color: Colors.textDim },
  onlineStatus: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 12 },
  sliderBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  sliderBtnText: { fontSize: 20, color: Colors.textPrimary, lineHeight: 24 },
  sliderTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: Colors.surface, overflow: 'hidden' },
  sliderFill: { height: '100%', borderRadius: 4 },
  powerRow: { flexDirection: 'row', gap: 10, marginVertical: 14 },
  powerBtn: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.surface },
  powerBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  tabBar: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 14, backgroundColor: Colors.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 18 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.elevated },
  tabText: { fontSize: 12.5, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.textPrimary },
  panelLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4, color: Colors.textSecondary, textTransform: 'uppercase', marginBottom: 11 },
  tempSlider: { height: 54, borderRadius: 16, backgroundColor: '#ffb74d', marginBottom: 8, justifyContent: 'center', overflow: 'hidden' },
  tempThumb: { position: 'absolute', width: 30, height: 30, borderRadius: 15, backgroundColor: '#fff', borderWidth: 3, borderColor: Colors.bg, top: 12 },
  tempLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22 },
  tempLabel: { fontSize: 11, color: Colors.textDim },
  colorRow: { flexDirection: 'row', gap: 12, marginBottom: 22 },
  colorDot: { width: 44, height: 44, borderRadius: 22 },
  statsRowSmall: { flexDirection: 'row', gap: 10 },
  statSmallCard: { flex: 1, borderRadius: 16, padding: 13, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  statSmallLabel: { fontSize: 11, color: Colors.textDim },
  statSmallValue: { fontFamily: 'monospace', fontSize: 17, fontWeight: '600', color: Colors.textPrimary, marginTop: 4 },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 13, borderRadius: 16, padding: 14, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  scheduleIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  scheduleName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  scheduleTime: { fontSize: 12, color: Colors.textDim },
  addBtn: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', borderStyle: 'dashed', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addBtnText: { fontSize: 13.5, fontWeight: '600', color: Colors.textSecondary },
  ruleCard: { borderRadius: 16, padding: 15, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleTag: { fontSize: 10.5, fontWeight: '700', color: Colors.accent, backgroundColor: Colors.accentSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  ruleTagGreen: { color: Colors.success, backgroundColor: Colors.successSoft },
  ruleText: { fontSize: 13, color: '#c8c8d0', flex: 1 },
  infoTable: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: Colors.surface },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.bg },
  infoLabel: { fontSize: 13, color: Colors.textDim },
  infoValue: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
});
