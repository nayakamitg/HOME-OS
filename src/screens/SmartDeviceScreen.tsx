import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { useTheme, ThemeColors } from '../theme/ThemeContext';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { toggleSwitch, setAllSwitches } from '../store/slices/smartDevicesSlice';
import { GradientSwitch } from '../components/GradientSwitch';

export function SmartDeviceScreen({ navigation, route }: any) {
  const Colors = useTheme();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const dispatch = useAppDispatch();
  const { deviceId } = route.params as { deviceId: string };
  const device = useAppSelector((s) => s.smartDevices.items.find((d) => d.id === deviceId));

  if (!device) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.emptyText}>Smart device not found</Text>
      </View>
    );
  }

  const onCount = device.switches.filter(Boolean).length;
  const allOn = onCount === device.switches.length;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Svg width={19} height={19} viewBox="0 0 24 24"><Path d="m15 18-6-6 6-6" stroke={Colors.textSecondary} strokeWidth={2.2} strokeLinecap="round" fill="none" /></Svg>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{device.name}</Text>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => dispatch(setAllSwitches({ deviceId: device.id, value: !allOn }))}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10" stroke={allOn ? Colors.accent : Colors.textSecondary} strokeWidth={2} strokeLinecap="round" fill="none" /></Svg>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Board summary */}
        <View style={styles.summaryCard}>
          <View style={styles.boardIcon}>
            <Svg width={24} height={24} viewBox="0 0 24 24">
              <Rect x={3} y={4} width={18} height={16} rx={3} stroke={Colors.accent} strokeWidth={1.9} fill="none" />
              <Path d="M8 9v6M12 9v6M16 9v6" stroke={Colors.accent} strokeWidth={1.9} strokeLinecap="round" />
            </Svg>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryTitle}>{device.name}</Text>
            <Text style={styles.summarySub}>{device.room} · {device.switches.length} switches · {onCount} on</Text>
          </View>
          <TouchableOpacity
            style={[styles.allBtn, allOn && { backgroundColor: Colors.accent }]}
            onPress={() => dispatch(setAllSwitches({ deviceId: device.id, value: !allOn }))}
          >
            <Text style={[styles.allBtnText, allOn && { color: '#fff' }]}>{allOn ? 'All Off' : 'All On'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>SWITCHES</Text>
        <View style={styles.grid}>
          {device.switches.map((on, i) => (
            <GradientSwitch
              key={i}
              label={`SW ${i + 1}`}
              on={on}
              onToggle={() => dispatch(toggleSwitch({ deviceId: device.id, index: i }))}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 10, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  iconBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 17, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' },
  content: { padding: 20, paddingBottom: 60 },
  emptyText: { fontSize: 15, color: Colors.textMuted },
  summaryCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 22 },
  boardIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: Colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  summaryTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  summarySub: { fontSize: 12, color: Colors.textDim, marginTop: 2 },
  allBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 11, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bg },
  allBtnText: { fontSize: 12.5, fontWeight: '700', color: Colors.textSecondary },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
});
