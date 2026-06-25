import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { useTheme, ThemeColors } from '../theme/ThemeContext';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  updateAutomation, deleteAutomation, toggleAutomation,
  Automation, AutomationAction, SensorTriggerType, RepeatMode,
} from '../store/slices/automationsSlice';
import { addEvent } from '../store/slices/activitySlice';
import { pushUpdateAutomation, pushDeleteAutomation, pushToggleAutomation } from '../services/sync';
import { Toggle } from '../components/Toggle';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const DAY_LABELS: Record<string, string> = { mon: 'M', tue: 'T', wed: 'W', thu: 'T', fri: 'F', sat: 'S', sun: 'S' };

const REPEAT_OPTIONS: { value: RepeatMode; label: string }[] = [
  { value: 'everyday', label: 'Every day' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekends', label: 'Weekends' },
  { value: 'custom', label: 'Custom days' },
  { value: 'once', label: 'Just once' },
];

const SENSOR_TRIGGERS: { value: SensorTriggerType; label: string; hasThreshold: boolean }[] = [
  { value: 'motion_detected', label: 'Motion detected', hasThreshold: false },
  { value: 'no_motion', label: 'No motion', hasThreshold: false },
  { value: 'temp_above', label: 'Temp above', hasThreshold: true },
  { value: 'temp_below', label: 'Temp below', hasThreshold: true },
  { value: 'humidity_above', label: 'Humidity above', hasThreshold: true },
  { value: 'humidity_below', label: 'Humidity below', hasThreshold: true },
  { value: 'light_on', label: 'Light turns on', hasThreshold: false },
  { value: 'light_off', label: 'Light turns off', hasThreshold: false },
  { value: 'door_open', label: 'Door opens', hasThreshold: false },
  { value: 'door_closed', label: 'Door closes', hasThreshold: false },
];

const ACTION_TYPES: { value: AutomationAction['action']; label: string; hasValue: boolean; unit?: string }[] = [
  { value: 'turnOn', label: 'Turn On', hasValue: false },
  { value: 'turnOff', label: 'Turn Off', hasValue: false },
  { value: 'toggle', label: 'Toggle', hasValue: false },
  { value: 'setBrightness', label: 'Set Brightness', hasValue: true, unit: '%' },
  { value: 'setTemperature', label: 'Set Temp', hasValue: true, unit: '°C' },
];

export function AutomationDetailScreen({ navigation, route }: any) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const dispatch = useAppDispatch();
  const automationId: string = route?.params?.automationId;
  const automationRaw = useAppSelector(s => s.automations.automations.find(a => a.id === automationId));
  const devices = useAppSelector(s => s.devices.devices);
  const automation = automationRaw!;
  const scenes = useAppSelector(s => s.scenes.scenes);

  const [name, setName] = useState(automation?.name || '');
  const [editingName, setEditingName] = useState(false);

  // Schedule edits
  const [timeH, setTimeH] = useState(() => {
    const t = automation?.schedule?.time || '07:00';
    return parseInt(t.split(':')[0]);
  });
  const [timeM, setTimeM] = useState(() => {
    const t = automation?.schedule?.time || '07:00';
    return parseInt(t.split(':')[1]);
  });
  const [schedRepeat, setSchedRepeat] = useState<RepeatMode>(automation?.schedule?.repeat || 'everyday');
  const [schedDays, setSchedDays] = useState<string[]>(automation?.schedule?.days || ['mon', 'tue', 'wed', 'thu', 'fri']);

  // Sensor edits
  const [sensorTrigger, setSensorTrigger] = useState<SensorTriggerType>(automation?.sensor?.triggerType || 'motion_detected');
  const [sensorThreshold, setSensorThreshold] = useState(String(automation?.sensor?.thresholdValue || ''));
  const [sensorDelay, setSensorDelay] = useState(String(automation?.sensor?.delaySeconds || ''));

  // Mode edits
  const [selectedSceneId, setSelectedSceneId] = useState(automation?.mode?.sceneId || scenes[0]?.id || '');
  const [modeTrigger, setModeTrigger] = useState<'on_activate' | 'on_deactivate'>(automation?.mode?.trigger || 'on_activate');

  // Actions
  const [actions, setActions] = useState<AutomationAction[]>(automation?.actions || []);
  const [editingAction, setEditingAction] = useState(false);
  const [actDeviceId, setActDeviceId] = useState(devices[0]?.id || '');
  const [actType, setActType] = useState<AutomationAction['action']>('turnOn');
  const [actValue, setActValue] = useState('');
  const [actDelay, setActDelay] = useState('');

  if (!automationRaw) {
    return (
      <View style={styles.screen}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Svg width={19} height={19} viewBox="0 0 24 24"><Path d="m15 18-6-6 6-6" stroke={Colors.textSecondary} strokeWidth={2.2} strokeLinecap="round" fill="none" /></Svg>
        </TouchableOpacity>
        <Text style={{ color: Colors.textSecondary, textAlign: 'center', marginTop: 40 }}>Automation not found</Text>
      </View>
    );
  }

  const accentColor = automation.type === 'schedule' ? Colors.warning :
    automation.type === 'sensor' ? Colors.success : Colors.purple;
  const formattedTime = `${String(timeH).padStart(2, '0')}:${String(timeM).padStart(2, '0')}`;

  function save() {
    const updates: Partial<Automation> = { name };
    if (automation.type === 'schedule') {
      updates.schedule = { time: formattedTime, repeat: schedRepeat, days: schedDays };
    } else if (automation.type === 'sensor') {
      updates.sensor = {
        sensorDeviceId: automation.sensor?.sensorDeviceId || '',
        triggerType: sensorTrigger,
        thresholdValue: sensorThreshold ? parseFloat(sensorThreshold) : undefined,
        delaySeconds: sensorDelay ? parseInt(sensorDelay) : 0,
      };
    } else if (automation.type === 'mode') {
      updates.mode = { sceneId: selectedSceneId, trigger: modeTrigger };
    }
    updates.actions = actions;
    dispatch(updateAutomation({ id: automationId, ...updates }));
    dispatch(addEvent({ title: `Automation "${name}" updated`, subtitle: '', category: 'automation' }));
    dispatch(pushUpdateAutomation({ ...automation, ...updates } as Automation));
    navigation.goBack();
  }

  function confirmDelete() {
    Alert.alert('Delete Automation', `Delete "${automation.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => { dispatch(pushDeleteAutomation(automationId)); dispatch(deleteAutomation(automationId)); navigation.goBack(); },
      },
    ]);
  }

  function handleStatusToggle() {
    dispatch(toggleAutomation(automationId));
    dispatch(pushToggleAutomation(automationId));
  }

  function addNewAction() {
    const actionDef = ACTION_TYPES.find(a => a.value === actType);
    const action: AutomationAction = {
      deviceId: actDeviceId,
      action: actType,
      value: actionDef?.hasValue ? (parseInt(actValue) || undefined) : undefined,
      delaySeconds: actDelay ? parseInt(actDelay) : undefined,
    };
    setActions(prev => [...prev, action]);
    setEditingAction(false);
    setActValue(''); setActDelay('');
  }

  function removeAction(i: number) { setActions(prev => prev.filter((_, idx) => idx !== i)); }

  function toggleDayLocal(day: string) {
    setSchedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Svg width={19} height={19} viewBox="0 0 24 24"><Path d="m15 18-6-6 6-6" stroke={Colors.textSecondary} strokeWidth={2.2} strokeLinecap="round" fill="none" /></Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{automation.name}</Text>
        <TouchableOpacity onPress={save}><Text style={[styles.saveText, { color: accentColor }]}>Save</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Status toggle */}
        <View style={[styles.statusCard, { borderColor: `${accentColor}33`, backgroundColor: `${accentColor}0A` }]}>
          <View>
            <Text style={[styles.statusLabel, { color: accentColor }]}>
              {automation.isEnabled ? 'Active' : 'Disabled'}
            </Text>
            <Text style={styles.statusSub}>Ran {automation.triggerCount} time{automation.triggerCount !== 1 ? 's' : ''}</Text>
          </View>
          <Toggle
            value={automation.isEnabled}
            onToggle={handleStatusToggle}
            activeColor={accentColor}
          />
        </View>

        {/* Name */}
        <Text style={styles.sectionLabel}>NAME</Text>
        <TextInput
          style={[styles.input, { borderColor: editingName ? `${accentColor}66` : Colors.border }]}
          value={name}
          onChangeText={setName}
          onFocus={() => setEditingName(true)}
          onBlur={() => setEditingName(false)}
          placeholder="Automation name"
          placeholderTextColor={Colors.textMuted}
        />

        {/* ── Schedule config ─────────────────────────────────────── */}
        {automation.type === 'schedule' && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 18 }]}>TIME</Text>
            <View style={[styles.card, { borderColor: `${accentColor}33` }]}>
              <View style={styles.timePicker}>
                <View style={styles.timeUnit}>
                  <TouchableOpacity style={styles.timeArrow} onPress={() => setTimeH(h => (h + 1) % 24)}>
                    <Svg width={16} height={16} viewBox="0 0 24 24"><Path d="m18 15-6-6-6 6" stroke={Colors.textPrimary} strokeWidth={2.2} strokeLinecap="round" fill="none" /></Svg>
                  </TouchableOpacity>
                  <Text style={[styles.timeValue, { color: accentColor }]}>{String(timeH).padStart(2, '0')}</Text>
                  <TouchableOpacity style={styles.timeArrow} onPress={() => setTimeH(h => (h - 1 + 24) % 24)}>
                    <Svg width={16} height={16} viewBox="0 0 24 24"><Path d="m6 9 6 6 6-6" stroke={Colors.textPrimary} strokeWidth={2.2} strokeLinecap="round" fill="none" /></Svg>
                  </TouchableOpacity>
                </View>
                <Text style={styles.timeSep}>:</Text>
                <View style={styles.timeUnit}>
                  <TouchableOpacity style={styles.timeArrow} onPress={() => setTimeM(m => (m + 5) % 60)}>
                    <Svg width={16} height={16} viewBox="0 0 24 24"><Path d="m18 15-6-6-6 6" stroke={Colors.textPrimary} strokeWidth={2.2} strokeLinecap="round" fill="none" /></Svg>
                  </TouchableOpacity>
                  <Text style={[styles.timeValue, { color: accentColor }]}>{String(timeM).padStart(2, '0')}</Text>
                  <TouchableOpacity style={styles.timeArrow} onPress={() => setTimeM(m => (m - 5 + 60) % 60)}>
                    <Svg width={16} height={16} viewBox="0 0 24 24"><Path d="m6 9 6 6 6-6" stroke={Colors.textPrimary} strokeWidth={2.2} strokeLinecap="round" fill="none" /></Svg>
                  </TouchableOpacity>
                </View>
                <View style={styles.ampmCol}>
                  <TouchableOpacity style={[styles.ampmBtn, timeH < 12 && { backgroundColor: `${accentColor}22` }]} onPress={() => { if (timeH >= 12) setTimeH(timeH - 12); }}>
                    <Text style={[styles.ampmText, timeH < 12 && { color: accentColor }]}>AM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.ampmBtn, timeH >= 12 && { backgroundColor: `${accentColor}22` }]} onPress={() => { if (timeH < 12) setTimeH(timeH + 12); }}>
                    <Text style={[styles.ampmText, timeH >= 12 && { color: accentColor }]}>PM</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 18 }]}>REPEAT</Text>
            <View style={styles.repeatRow}>
              {REPEAT_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.repeatChip, schedRepeat === opt.value && { backgroundColor: `${accentColor}22`, borderColor: accentColor }]}
                  onPress={() => setSchedRepeat(opt.value)}
                >
                  <Text style={[styles.repeatChipText, schedRepeat === opt.value && { color: accentColor }]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {schedRepeat === 'custom' && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: 16 }]}>ACTIVE DAYS</Text>
                <View style={styles.daysRow}>
                  {DAYS.map(d => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.dayChip, schedDays.includes(d) && { backgroundColor: accentColor, borderColor: accentColor }]}
                      onPress={() => toggleDayLocal(d)}
                    >
                      <Text style={[styles.dayChipText, schedDays.includes(d) && { color: '#fff' }]}>{DAY_LABELS[d]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </>
        )}

        {/* ── Sensor config ────────────────────────────────────────── */}
        {automation.type === 'sensor' && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 18 }]}>TRIGGER EVENT</Text>
            <View style={styles.sensorGrid}>
              {SENSOR_TRIGGERS.map(st => (
                <TouchableOpacity
                  key={st.value}
                  style={[styles.sensorChip, sensorTrigger === st.value && { backgroundColor: `${accentColor}22`, borderColor: accentColor }]}
                  onPress={() => setSensorTrigger(st.value)}
                >
                  <Text style={[styles.sensorChipText, sensorTrigger === st.value && { color: accentColor }]}>{st.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {SENSOR_TRIGGERS.find(s => s.value === sensorTrigger)?.hasThreshold && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: 18 }]}>
                  THRESHOLD ({sensorTrigger.includes('temp') ? '°C' : '%'})
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Threshold value"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={sensorThreshold}
                  onChangeText={setSensorThreshold}
                />
              </>
            )}

            <Text style={[styles.sectionLabel, { marginTop: 18 }]}>DELAY BEFORE TRIGGER (seconds)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={sensorDelay}
              onChangeText={setSensorDelay}
            />
          </>
        )}

        {/* ── Mode config ──────────────────────────────────────────── */}
        {automation.type === 'mode' && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 18 }]}>SCENE / MODE</Text>
            {scenes.map(sc => (
              <TouchableOpacity
                key={sc.id}
                style={[styles.modeRow, selectedSceneId === sc.id && { borderColor: `${accentColor}55`, backgroundColor: `${accentColor}0A` }]}
                onPress={() => setSelectedSceneId(sc.id)}
                activeOpacity={0.85}
              >
                <Text style={styles.modeLabel}>{sc.name}</Text>
                <Text style={styles.modeSub}>{sc.description}</Text>
                <View style={[styles.radioOuter, selectedSceneId === sc.id && { borderColor: accentColor }]}>
                  {selectedSceneId === sc.id && <View style={[styles.radioInner, { backgroundColor: accentColor }]} />}
                </View>
              </TouchableOpacity>
            ))}

            <Text style={[styles.sectionLabel, { marginTop: 18 }]}>TRIGGER WHEN</Text>
            {[
              { value: 'on_activate', label: 'Scene activates' },
              { value: 'on_deactivate', label: 'Scene deactivates' },
            ].map(mt => (
              <TouchableOpacity
                key={mt.value}
                style={[styles.modeRow, modeTrigger === mt.value && { borderColor: `${accentColor}55`, backgroundColor: `${accentColor}0A` }]}
                onPress={() => setModeTrigger(mt.value as any)}
                activeOpacity={0.85}
              >
                <Text style={styles.modeLabel}>{mt.label}</Text>
                <View style={[styles.radioOuter, modeTrigger === mt.value && { borderColor: accentColor }]}>
                  {modeTrigger === mt.value && <View style={[styles.radioInner, { backgroundColor: accentColor }]} />}
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* ── Actions ──────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { marginTop: 22 }]}>ACTIONS ({actions.length})</Text>

        {actions.map((action, i) => {
          const dev = devices.find(d => d.id === action.deviceId);
          const def = ACTION_TYPES.find(a => a.value === action.action);
          return (
            <View key={i} style={styles.actionRow}>
              <View style={[styles.actionNum, { backgroundColor: `${accentColor}22` }]}>
                <Text style={[styles.actionNumText, { color: accentColor }]}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionDevice}>{dev?.name || '?'}</Text>
                <Text style={styles.actionDesc}>
                  {def?.label}
                  {action.value !== undefined ? ` → ${action.value}${def?.unit || ''}` : ''}
                  {action.delaySeconds ? ` · delay ${action.delaySeconds}s` : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => removeAction(i)}>
                <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M18 6 6 18M6 6l12 12" stroke={Colors.danger} strokeWidth={2} strokeLinecap="round" /></Svg>
              </TouchableOpacity>
            </View>
          );
        })}

        {editingAction ? (
          <View style={[styles.card, { borderColor: `${accentColor}33` }]}>
            <Text style={styles.sectionLabel}>DEVICE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {devices.map(d => (
                <TouchableOpacity
                  key={d.id}
                  style={[styles.chipSmall, actDeviceId === d.id && { backgroundColor: `${accentColor}22`, borderColor: accentColor }]}
                  onPress={() => setActDeviceId(d.id)}
                >
                  <Text style={[styles.chipSmallText, actDeviceId === d.id && { color: accentColor }]}>{d.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.sectionLabel}>ACTION</Text>
            <View style={styles.actionTypeGrid}>
              {ACTION_TYPES.map(at => (
                <TouchableOpacity
                  key={at.value}
                  style={[styles.actionTypeChip, actType === at.value && { backgroundColor: `${accentColor}22`, borderColor: accentColor }]}
                  onPress={() => setActType(at.value)}
                >
                  <Text style={[styles.actionTypeText, actType === at.value && { color: accentColor }]}>{at.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {ACTION_TYPES.find(a => a.value === actType)?.hasValue && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: 12 }]}>VALUE ({ACTION_TYPES.find(a => a.value === actType)?.unit})</Text>
                <TextInput style={styles.input} placeholder="Enter value" placeholderTextColor={Colors.textMuted} keyboardType="numeric" value={actValue} onChangeText={setActValue} />
              </>
            )}
            <Text style={[styles.sectionLabel, { marginTop: 12 }]}>DELAY (seconds)</Text>
            <TextInput style={styles.input} placeholder="0" placeholderTextColor={Colors.textMuted} keyboardType="numeric" value={actDelay} onChangeText={setActDelay} />
            <View style={styles.addActionBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingAction(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: accentColor }]} onPress={addNewAction}>
                <Text style={styles.confirmBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.addActionBtn} onPress={() => setEditingAction(true)}>
            <Svg width={17} height={17} viewBox="0 0 24 24"><Path d="M12 5v14M5 12h14" stroke={accentColor} strokeWidth={2.2} strokeLinecap="round" /></Svg>
            <Text style={[styles.addActionBtnText, { color: accentColor }]}>Add Action</Text>
          </TouchableOpacity>
        )}

        {/* Delete */}
        <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete}>
          <Svg width={17} height={17} viewBox="0 0 24 24"><Path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke={Colors.danger} strokeWidth={1.9} strokeLinecap="round" fill="none" /></Svg>
          <Text style={styles.deleteBtnText}>Delete Automation</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, flex: 1, textAlign: 'center', marginHorizontal: 8 },
  saveText: { fontSize: 15, fontWeight: '700' },
  content: { padding: 18, paddingBottom: 80 },
  statusCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 18, padding: 16, borderWidth: 1, marginBottom: 20 },
  statusLabel: { fontSize: 15, fontWeight: '700' },
  statusSub: { fontSize: 12, color: Colors.textDim, marginTop: 2 },
  sectionLabel: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.8, color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 10 },
  input: { backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: Colors.textPrimary, marginBottom: 4 },
  card: { backgroundColor: Colors.surface, borderRadius: 18, padding: 16, borderWidth: 1, marginBottom: 4 },
  timePicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  timeUnit: { alignItems: 'center', gap: 6 },
  timeArrow: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.elevated, alignItems: 'center', justifyContent: 'center' },
  timeValue: { fontSize: 42, fontWeight: '700', letterSpacing: -1, minWidth: 58, textAlign: 'center' },
  timeSep: { fontSize: 32, fontWeight: '300', color: Colors.textMuted, marginBottom: 4 },
  ampmCol: { gap: 6, marginLeft: 6 },
  ampmBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, backgroundColor: Colors.elevated },
  ampmText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  repeatRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  repeatChip: { borderRadius: 14, paddingHorizontal: 13, paddingVertical: 8, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  repeatChipText: { fontSize: 12.5, color: Colors.textDim, fontWeight: '500' },
  daysRow: { flexDirection: 'row', gap: 7 },
  dayChip: { flex: 1, backgroundColor: Colors.surface, borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  dayChipText: { fontSize: 12, fontWeight: '700', color: Colors.textDim },
  sensorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sensorChip: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  sensorChipText: { fontSize: 12.5, color: Colors.textDim, fontWeight: '500' },
  modeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 8 },
  modeLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
  modeSub: { fontSize: 12, color: Colors.textDim },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  actionNum: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionNumText: { fontSize: 14, fontWeight: '700' },
  actionDevice: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  actionDesc: { fontSize: 12, color: Colors.textDim, marginTop: 2 },
  chipSmall: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: Colors.elevated, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  chipSmallText: { fontSize: 12.5, color: Colors.textDim },
  actionTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionTypeChip: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.elevated, borderWidth: 1, borderColor: Colors.border },
  actionTypeText: { fontSize: 12, color: Colors.textDim, fontWeight: '500' },
  addActionBtns: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cancelBtn: { flex: 1, borderRadius: 13, padding: 12, backgroundColor: Colors.elevated, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  cancelBtnText: { fontSize: 13.5, fontWeight: '600', color: Colors.textSecondary },
  confirmBtn: { flex: 1, borderRadius: 13, padding: 12, alignItems: 'center' },
  confirmBtnText: { fontSize: 13.5, fontWeight: '700', color: '#fff' },
  addActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, padding: 15, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', marginBottom: 24 },
  addActionBtnText: { fontSize: 14, fontWeight: '600' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 16, padding: 15, borderWidth: 1, borderColor: `${Colors.danger}44`, backgroundColor: `${Colors.danger}08` },
  deleteBtnText: { fontSize: 14, fontWeight: '600', color: Colors.danger },
});
