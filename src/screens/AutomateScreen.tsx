import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Alert } from 'react-native';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { useTheme, ThemeColors } from '../theme/ThemeContext';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { toggleAutomation, deleteAutomation, Automation } from '../store/slices/automationsSlice';
import { pushToggleAutomation, pushDeleteAutomation } from '../services/sync';
import { Toggle } from '../components/Toggle';

// ─── Icons ────────────────────────────────────────────────────────────────────
function ScheduleIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.9} fill="none" />
      <Path d="M12 7v5l3 2" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
    </Svg>
  );
}
function SensorIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" stroke={color} strokeWidth={1.9} strokeLinecap="round" fill="none" />
    </Svg>
  );
}
function ModeIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path d="M12 2 9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5Z" stroke={color} strokeWidth={1.9} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatScheduleTrigger(a: Automation): string {
  if (!a.schedule) return '';
  const repeatLabel: Record<string, string> = {
    everyday: 'Every day', weekdays: 'Weekdays', weekends: 'Weekends',
    once: 'Once', custom: 'Custom days',
  };
  return `${a.schedule.time} · ${repeatLabel[a.schedule.repeat] || a.schedule.repeat}`;
}

function formatSensorTrigger(a: Automation): string {
  if (!a.sensor) return '';
  const labels: Record<string, string> = {
    motion_detected: 'Motion detected', no_motion: 'No motion for',
    temp_above: 'Temperature above', temp_below: 'Temperature below',
    humidity_above: 'Humidity above', humidity_below: 'Humidity below',
    light_on: 'Light turns on', light_off: 'Light turns off',
    door_open: 'Door opens', door_closed: 'Door closes',
  };
  const base = labels[a.sensor.triggerType] || a.sensor.triggerType;
  if (a.sensor.thresholdValue !== undefined) return `${base} ${a.sensor.thresholdValue}${a.sensor.triggerType.includes('temp') ? '°C' : '%'}`;
  return base;
}

function formatModeTrigger(a: Automation, sceneName: string): string {
  if (!a.mode) return '';
  return `When ${sceneName} ${a.mode.trigger === 'on_activate' ? 'activates' : 'deactivates'}`;
}

// ─── Category Summary Card ────────────────────────────────────────────────────
function CategoryCard({
  type, label, count, activeCount, color, softBg,
  icon, onPress,
}: {
  type: string; label: string; count: number; activeCount: number;
  color: string; softBg: string; icon: React.ReactNode; onPress: () => void;
}) {
  const styles = makeStyles(useTheme());
  return (
    <TouchableOpacity style={[styles.categoryCard, { borderColor: `${color}33` }]} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.categoryIcon, { backgroundColor: softBg }]}>{icon}</View>
      <Text style={styles.categoryLabel}>{label}</Text>
      <Text style={[styles.categoryCount, { color }]}>{count}</Text>
      <Text style={styles.categoryActive}>{activeCount} active</Text>
    </TouchableOpacity>
  );
}

// ─── Automation Row ───────────────────────────────────────────────────────────
function AutomationRow({
  automation, triggerText, accentColor, onPress, onToggle, onDelete,
}: {
  automation: Automation; triggerText: string; accentColor: string;
  onPress: () => void; onToggle: () => void; onDelete: () => void;
}) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  return (
    <TouchableOpacity
      style={[styles.autoRow, automation.isEnabled && { borderColor: `${accentColor}33`, backgroundColor: `${accentColor}0A` }]}
      onPress={onPress}
      onLongPress={onDelete}
      activeOpacity={0.85}
    >
      <View style={[styles.autoIconWrap, { backgroundColor: `${accentColor}22` }]}>
        <View style={[styles.autoStatusDot, { backgroundColor: automation.isEnabled ? accentColor : Colors.textMuted }]} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.autoName}>{automation.name}</Text>
        <Text style={styles.autoTrigger}>{triggerText}</Text>
        <Text style={styles.autoActions}>{automation.actions.length} action{automation.actions.length !== 1 ? 's' : ''} · ran {automation.triggerCount}×</Text>
      </View>
      <Toggle value={automation.isEnabled} onToggle={onToggle} activeColor={accentColor} />
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
type Filter = 'all' | 'schedule' | 'sensor' | 'mode';

export function AutomateScreen({ navigation }: any) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const dispatch = useAppDispatch();
  const automations = useAppSelector(s => s.automations.automations);
  const scenes = useAppSelector(s => s.scenes.scenes);
  const [filter, setFilter] = useState<Filter>('all');

  const scheduleList = automations.filter(a => a.type === 'schedule');
  const sensorList = automations.filter(a => a.type === 'sensor');
  const modeList = automations.filter(a => a.type === 'mode');

  const activeCount = automations.filter(a => a.isEnabled).length;

  const displayed = filter === 'all' ? automations : automations.filter(a => a.type === filter);

  function getSceneName(id: string) {
    return scenes.find(s => s.id === id)?.name || id;
  }

  function getTriggerText(a: Automation): string {
    if (a.type === 'schedule') return formatScheduleTrigger(a);
    if (a.type === 'sensor') return formatSensorTrigger(a);
    if (a.type === 'mode') return formatModeTrigger(a, getSceneName(a.mode!.sceneId));
    return '';
  }

  function getAccentColor(type: string) {
    if (type === 'schedule') return Colors.warning;
    if (type === 'sensor') return Colors.success;
    return Colors.purple;
  }

  function confirmDelete(id: string, name: string) {
    Alert.alert('Delete Automation', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { dispatch(pushDeleteAutomation(id)); dispatch(deleteAutomation(id)); } },
    ]);
  }

  function handleToggle(id: string) {
    dispatch(toggleAutomation(id));
    dispatch(pushToggleAutomation(id));
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Automate</Text>
            <Text style={styles.subtitle}>{activeCount} of {automations.length} automations active</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={styles.scenesBtn} onPress={() => navigation.navigate('Scenes')}>
              <Text style={styles.scenesBtnText}>Scenes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddAutomation')}>
              <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" /></Svg>
              <Text style={styles.addBtnText}>New</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Summary Cards */}
        <View style={styles.categoryRow}>
          <CategoryCard
            type="schedule" label="Scheduled" count={scheduleList.length}
            activeCount={scheduleList.filter(a => a.isEnabled).length}
            color={Colors.warning} softBg="rgba(240,194,103,0.14)"
            icon={<ScheduleIcon color={Colors.warning} />}
            onPress={() => setFilter(filter === 'schedule' ? 'all' : 'schedule')}
          />
          <CategoryCard
            type="sensor" label="Sensors" count={sensorList.length}
            activeCount={sensorList.filter(a => a.isEnabled).length}
            color={Colors.success} softBg="rgba(61,220,151,0.14)"
            icon={<SensorIcon color={Colors.success} />}
            onPress={() => setFilter(filter === 'sensor' ? 'all' : 'sensor')}
          />
          <CategoryCard
            type="mode" label="Modes" count={modeList.length}
            activeCount={modeList.filter(a => a.isEnabled).length}
            color={Colors.purple} softBg="rgba(200,162,255,0.14)"
            icon={<ModeIcon color={Colors.purple} />}
            onPress={() => setFilter(filter === 'mode' ? 'all' : 'mode')}
          />
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {(['all', 'schedule', 'sensor', 'mode'] as Filter[]).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
                {f === 'all' ? 'All' : f === 'schedule' ? '⏰ Schedule' : f === 'sensor' ? '📡 Sensor' : '✦ Mode'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── SCHEDULE section ── */}
        {(filter === 'all' || filter === 'schedule') && (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconRow}>
                <View style={[styles.sectionDot, { backgroundColor: Colors.warning }]} />
                <Text style={styles.sectionTitle}>SCHEDULED</Text>
              </View>
              <TouchableOpacity
                style={styles.sectionAddBtn}
                onPress={() => navigation.navigate('AddAutomation', { type: 'schedule' })}
              >
                <Text style={styles.sectionAddText}>+ Add</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionDesc}>Run device actions at specific times, dates, or on a repeating schedule.</Text>
            {scheduleList.map(a => (
              <AutomationRow
                key={a.id} automation={a} triggerText={getTriggerText(a)}
                accentColor={Colors.warning}
                onPress={() => navigation.navigate('AutomationDetail', { automationId: a.id })}
                onToggle={() => handleToggle(a.id)}
                onDelete={() => confirmDelete(a.id, a.name)}
              />
            ))}
            {scheduleList.length === 0 && (
              <TouchableOpacity style={styles.emptyCard} onPress={() => navigation.navigate('AddAutomation', { type: 'schedule' })}>
                <Text style={styles.emptyCardText}>No scheduled automations yet · Tap to create one</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* ── SENSOR section ── */}
        {(filter === 'all' || filter === 'sensor') && (
          <>
            <View style={[styles.sectionHeader, { marginTop: filter === 'all' ? 24 : 0 }]}>
              <View style={styles.sectionIconRow}>
                <View style={[styles.sectionDot, { backgroundColor: Colors.success }]} />
                <Text style={styles.sectionTitle}>SENSOR TRIGGERS</Text>
              </View>
              <TouchableOpacity
                style={styles.sectionAddBtn}
                onPress={() => navigation.navigate('AddAutomation', { type: 'sensor' })}
              >
                <Text style={styles.sectionAddText}>+ Add</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionDesc}>Trigger automations when a sensor detects motion, temperature change, or other events.</Text>
            {sensorList.map(a => (
              <AutomationRow
                key={a.id} automation={a} triggerText={getTriggerText(a)}
                accentColor={Colors.success}
                onPress={() => navigation.navigate('AutomationDetail', { automationId: a.id })}
                onToggle={() => handleToggle(a.id)}
                onDelete={() => confirmDelete(a.id, a.name)}
              />
            ))}
            {sensorList.length === 0 && (
              <TouchableOpacity style={styles.emptyCard} onPress={() => navigation.navigate('AddAutomation', { type: 'sensor' })}>
                <Text style={styles.emptyCardText}>No sensor automations yet · Tap to create one</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* ── MODE section ── */}
        {(filter === 'all' || filter === 'mode') && (
          <>
            <View style={[styles.sectionHeader, { marginTop: filter === 'all' ? 24 : 0 }]}>
              <View style={styles.sectionIconRow}>
                <View style={[styles.sectionDot, { backgroundColor: Colors.purple }]} />
                <Text style={styles.sectionTitle}>MODE BASED</Text>
              </View>
              <TouchableOpacity
                style={styles.sectionAddBtn}
                onPress={() => navigation.navigate('AddAutomation', { type: 'mode' })}
              >
                <Text style={styles.sectionAddText}>+ Add</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionDesc}>Automatically control devices when a scene or mode activates or deactivates.</Text>
            {modeList.map(a => (
              <AutomationRow
                key={a.id} automation={a} triggerText={getTriggerText(a)}
                accentColor={Colors.purple}
                onPress={() => navigation.navigate('AutomationDetail', { automationId: a.id })}
                onToggle={() => handleToggle(a.id)}
                onDelete={() => confirmDelete(a.id, a.name)}
              />
            ))}
            {modeList.length === 0 && (
              <TouchableOpacity style={styles.emptyCard} onPress={() => navigation.navigate('AddAutomation', { type: 'mode' })}>
                <Text style={styles.emptyCardText}>No mode automations yet · Tap to create one</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 20, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 27, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: Colors.textDim, marginTop: 3 },
  scenesBtn: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  scenesBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.accent, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  addBtnText: { fontSize: 13.5, fontWeight: '700', color: '#fff' },
  categoryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  categoryCard: { flex: 1, borderRadius: 18, padding: 14, backgroundColor: Colors.surface, borderWidth: 1, alignItems: 'center', gap: 6 },
  categoryIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  categoryLabel: { fontSize: 11.5, fontWeight: '600', color: Colors.textSecondary },
  categoryCount: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  categoryActive: { fontSize: 10.5, color: Colors.textMuted },
  filterScroll: { marginBottom: 20 },
  filterChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  filterChipActive: { backgroundColor: Colors.accentSoft, borderColor: Colors.accent },
  filterChipText: { fontSize: 12.5, color: Colors.textDim, fontWeight: '500' },
  filterChipTextActive: { color: Colors.accent, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  sectionIconRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 11.5, fontWeight: '700', letterSpacing: 0.6, color: Colors.textSecondary, textTransform: 'uppercase' },
  sectionAddBtn: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  sectionAddText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  sectionDesc: { fontSize: 12.5, color: Colors.textMuted, lineHeight: 18, marginBottom: 12 },
  autoRow: { flexDirection: 'row', alignItems: 'center', gap: 13, borderRadius: 18, padding: 14, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  autoIconWrap: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  autoStatusDot: { width: 10, height: 10, borderRadius: 5 },
  autoName: { fontSize: 14.5, fontWeight: '600', color: Colors.textPrimary },
  autoTrigger: { fontSize: 12, color: Colors.textDim },
  autoActions: { fontSize: 11, color: Colors.textMuted },
  emptyCard: { borderRadius: 16, padding: 18, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', alignItems: 'center', marginBottom: 4 },
  emptyCardText: { fontSize: 13, color: Colors.textMuted },
});
