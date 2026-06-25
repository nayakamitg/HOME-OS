import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { useTheme, ThemeColors } from '../theme/ThemeContext';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  addAutomation, AutomationType, RepeatMode,
  SensorTriggerType, AutomationAction, ScheduleConfig, SensorConfig, ModeConfig,
} from '../store/slices/automationsSlice';
import { addEvent } from '../store/slices/activitySlice';
import { pushCreateAutomation } from '../services/sync';

// ─── Constant data ─────────────────────────────────────────────────────────────
const REPEAT_OPTIONS: { value: RepeatMode; label: string; sub: string }[] = [
  { value: 'everyday', label: 'Every day', sub: 'Monday through Sunday' },
  { value: 'weekdays', label: 'Weekdays', sub: 'Mon – Fri only' },
  { value: 'weekends', label: 'Weekends', sub: 'Sat & Sun only' },
  { value: 'custom', label: 'Custom days', sub: 'Choose specific days' },
  { value: 'once', label: 'Just once', sub: 'Runs one time only' },
];

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const DAY_LABELS: Record<string, string> = { mon: 'M', tue: 'T', wed: 'W', thu: 'T', fri: 'F', sat: 'S', sun: 'S' };
const DAY_FULL: Record<string, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };

const SENSOR_TRIGGERS: { value: SensorTriggerType; label: string; sub: string; icon: string; hasThreshold: boolean }[] = [
  { value: 'motion_detected', label: 'Motion detected', sub: 'Sensor sees movement', icon: '👤', hasThreshold: false },
  { value: 'no_motion', label: 'No motion for', sub: 'Room inactive', icon: '🚶', hasThreshold: false },
  { value: 'temp_above', label: 'Temperature above', sub: 'Room too warm', icon: '🌡️', hasThreshold: true },
  { value: 'temp_below', label: 'Temperature below', sub: 'Room too cold', icon: '❄️', hasThreshold: true },
  { value: 'humidity_above', label: 'Humidity above', sub: 'Too humid', icon: '💧', hasThreshold: true },
  { value: 'humidity_below', label: 'Humidity below', sub: 'Too dry', icon: '🏜️', hasThreshold: true },
  { value: 'light_on', label: 'Light turns on', sub: 'Device powers up', icon: '💡', hasThreshold: false },
  { value: 'light_off', label: 'Light turns off', sub: 'Device powers down', icon: '🌑', hasThreshold: false },
  { value: 'door_open', label: 'Door opens', sub: 'Entry sensor triggered', icon: '🚪', hasThreshold: false },
  { value: 'door_closed', label: 'Door closes', sub: 'Entry sensor closed', icon: '🔒', hasThreshold: false },
];

const MODE_TRIGGERS: { value: 'on_activate' | 'on_deactivate'; label: string; sub: string }[] = [
  { value: 'on_activate', label: 'When mode activates', sub: 'As soon as the scene starts' },
  { value: 'on_deactivate', label: 'When mode deactivates', sub: 'When the scene is stopped' },
];

const ACTION_TYPES: { value: AutomationAction['action']; label: string; hasValue: boolean; unit?: string }[] = [
  { value: 'turnOn', label: 'Turn On', hasValue: false },
  { value: 'turnOff', label: 'Turn Off', hasValue: false },
  { value: 'toggle', label: 'Toggle', hasValue: false },
  { value: 'setBrightness', label: 'Set Brightness', hasValue: true, unit: '%' },
  { value: 'setTemperature', label: 'Set Temperature', hasValue: true, unit: '°C' },
];

type Step = 'type' | 'trigger' | 'actions' | 'name';

// ─── Main Screen ───────────────────────────────────────────────────────────────
export function AddAutomationScreen({ navigation, route }: any) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const dispatch = useAppDispatch();
  const devices = useAppSelector(s => s.devices.devices);
  const scenes = useAppSelector(s => s.scenes.scenes);

  const initialType: AutomationType = route?.params?.type || 'schedule';
  const [step, setStep] = useState<Step>(route?.params?.type ? 'trigger' : 'type');
  const [autoType, setAutoType] = useState<AutomationType>(initialType);

  // Schedule config
  const [schedTime, setSchedTime] = useState('07:00');
  const [schedRepeat, setSchedRepeat] = useState<RepeatMode>('everyday');
  const [schedDays, setSchedDays] = useState<string[]>(['mon', 'tue', 'wed', 'thu', 'fri']);

  // Sensor config
  const [sensorDeviceId, setSensorDeviceId] = useState(devices[0]?.id || '');
  const [sensorTrigger, setSensorTrigger] = useState<SensorTriggerType>('motion_detected');
  const [sensorThreshold, setSensorThreshold] = useState('');
  const [sensorDelay, setSensorDelay] = useState('');

  // Mode config
  const [selectedSceneId, setSelectedSceneId] = useState(scenes[0]?.id || '');
  const [modeTrigger, setModeTrigger] = useState<'on_activate' | 'on_deactivate'>('on_activate');

  // Actions
  const [actions, setActions] = useState<AutomationAction[]>([]);
  const [editingAction, setEditingAction] = useState(false);
  const [actDeviceId, setActDeviceId] = useState(devices[0]?.id || '');
  const [actType, setActType] = useState<AutomationAction['action']>('turnOn');
  const [actValue, setActValue] = useState('');
  const [actDelay, setActDelay] = useState('');

  // Name
  const [name, setName] = useState('');

  // ── Time picker helpers ────────────────────────────────────────────────────
  const [timeH, setTimeH] = useState(7);
  const [timeM, setTimeM] = useState(0);
  const formattedTime = `${String(timeH).padStart(2, '0')}:${String(timeM).padStart(2, '0')}`;

  function adjustH(delta: number) { setTimeH(h => (h + delta + 24) % 24); }
  function adjustM(delta: number) { setTimeM(m => (m + delta + 60) % 60); }

  function toggleDay(day: string) {
    setSchedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  }

  function addAction() {
    const actionDef = ACTION_TYPES.find(a => a.value === actType);
    const action: AutomationAction = {
      deviceId: actDeviceId,
      action: actType,
      value: actionDef?.hasValue ? (parseInt(actValue) || undefined) : undefined,
      delaySeconds: actDelay ? parseInt(actDelay) : undefined,
    };
    setActions(prev => [...prev, action]);
    setEditingAction(false);
    setActValue('');
    setActDelay('');
  }

  function removeAction(i: number) {
    setActions(prev => prev.filter((_, idx) => idx !== i));
  }

  function save() {
    const finalName = name.trim() || `${autoType === 'schedule' ? 'Schedule' : autoType === 'sensor' ? 'Sensor' : 'Mode'} Automation`;
    const id = finalName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();

    const schedule: ScheduleConfig | undefined = autoType === 'schedule'
      ? { time: formattedTime, repeat: schedRepeat, days: schedDays }
      : undefined;

    const sensor: SensorConfig | undefined = autoType === 'sensor'
      ? {
          sensorDeviceId,
          triggerType: sensorTrigger,
          thresholdValue: sensorThreshold ? parseFloat(sensorThreshold) : undefined,
          delaySeconds: sensorDelay ? parseInt(sensorDelay) : 0,
        }
      : undefined;

    const mode: ModeConfig | undefined = autoType === 'mode'
      ? { sceneId: selectedSceneId, trigger: modeTrigger }
      : undefined;

    dispatch(addAutomation({ id, name: finalName, type: autoType, isEnabled: true, schedule, sensor, mode, actions }));
    dispatch(addEvent({ title: `Automation "${finalName}" created`, subtitle: `${actions.length} actions`, category: 'automation' }));
    // Sync to backend (no-op when offline); swaps in the server id on success.
    dispatch(pushCreateAutomation({
      id, name: finalName, type: autoType, isEnabled: true,
      schedule, sensor, mode, actions, createdAt: new Date().toISOString(), triggerCount: 0,
    }));
    navigation.goBack();
  }

  // ── Render helpers ─────────────────────────────────────────────────────────
  const stepTitles: Record<Step, string> = {
    type: 'Automation Type', trigger: 'Configure Trigger', actions: 'Add Actions', name: 'Name & Save',
  };

  const steps: Step[] = ['type', 'trigger', 'actions', 'name'];
  const stepIndex = steps.indexOf(step);

  function next() {
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) setStep(steps[idx + 1]);
  }
  function back() {
    const idx = steps.indexOf(step);
    if (idx > 0) setStep(steps[idx - 1]);
    else navigation.goBack();
  }

  const accentColor = autoType === 'schedule' ? Colors.warning : autoType === 'sensor' ? Colors.success : Colors.purple;

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={back}>
          <Svg width={19} height={19} viewBox="0 0 24 24"><Path d="m15 18-6-6 6-6" stroke={Colors.textSecondary} strokeWidth={2.2} strokeLinecap="round" fill="none" /></Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{stepTitles[step]}</Text>
        {step === 'name' ? (
          <TouchableOpacity onPress={save}><Text style={[styles.saveText, { color: accentColor }]}>Save</Text></TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Progress */}
      <View style={styles.progressRow}>
        {steps.map((s, i) => (
          <View key={s} style={[styles.progressBar, i <= stepIndex && { backgroundColor: accentColor }]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* ── STEP 1: Choose type ─────────────────────────────────────────────── */}
        {step === 'type' && (
          <>
            <Text style={styles.stepLabel}>What should trigger this automation?</Text>
            {[
              { type: 'schedule' as AutomationType, label: 'Time & Schedule', sub: 'Run at a specific time, daily, weekly, or on custom days', color: Colors.warning, icon: <Svg width={24} height={24} viewBox="0 0 24 24"><Circle cx={12} cy={12} r={9} stroke={Colors.warning} strokeWidth={1.9} fill="none" /><Path d="M12 7v5l3 2" stroke={Colors.warning} strokeWidth={1.9} strokeLinecap="round" /></Svg> },
              { type: 'sensor' as AutomationType, label: 'Sensor Detected', sub: 'Motion, temperature, humidity, door, or any device event', color: Colors.success, icon: <Svg width={24} height={24} viewBox="0 0 24 24"><Path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" stroke={Colors.success} strokeWidth={1.9} strokeLinecap="round" fill="none" /></Svg> },
              { type: 'mode' as AutomationType, label: 'Mode / Scene', sub: 'When a scene activates or deactivates, run extra actions', color: Colors.purple, icon: <Svg width={24} height={24} viewBox="0 0 24 24"><Path d="M12 2 9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5Z" stroke={Colors.purple} strokeWidth={1.9} strokeLinecap="round" fill="none" /></Svg> },
            ].map(opt => (
              <TouchableOpacity
                key={opt.type}
                style={[styles.typeCard, autoType === opt.type && { borderColor: `${opt.color}66`, backgroundColor: `${opt.color}0D` }]}
                onPress={() => setAutoType(opt.type)}
                activeOpacity={0.85}
              >
                <View style={[styles.typeIconWrap, { backgroundColor: `${opt.color}22` }]}>{opt.icon}</View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.typeLabel}>{opt.label}</Text>
                  <Text style={styles.typeSub}>{opt.sub}</Text>
                </View>
                <View style={[styles.radioOuter, autoType === opt.type && { borderColor: opt.color }]}>
                  {autoType === opt.type && <View style={[styles.radioInner, { backgroundColor: opt.color }]} />}
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* ── STEP 2: Configure trigger ──────────────────────────────────────── */}
        {step === 'trigger' && autoType === 'schedule' && (
          <>
            <Text style={styles.stepLabel}>When should it run?</Text>

            {/* Time picker */}
            <View style={[styles.card, { borderColor: `${accentColor}33` }]}>
              <Text style={styles.cardLabel}>TIME</Text>
              <View style={styles.timePicker}>
                <View style={styles.timeUnit}>
                  <TouchableOpacity style={styles.timeArrow} onPress={() => adjustH(1)}>
                    <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="m18 15-6-6-6 6" stroke={Colors.textPrimary} strokeWidth={2.2} strokeLinecap="round" fill="none" /></Svg>
                  </TouchableOpacity>
                  <Text style={[styles.timeValue, { color: accentColor }]}>{String(timeH).padStart(2, '0')}</Text>
                  <TouchableOpacity style={styles.timeArrow} onPress={() => adjustH(-1)}>
                    <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="m6 9 6 6 6-6" stroke={Colors.textPrimary} strokeWidth={2.2} strokeLinecap="round" fill="none" /></Svg>
                  </TouchableOpacity>
                </View>
                <Text style={styles.timeSep}>:</Text>
                <View style={styles.timeUnit}>
                  <TouchableOpacity style={styles.timeArrow} onPress={() => adjustM(5)}>
                    <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="m18 15-6-6-6 6" stroke={Colors.textPrimary} strokeWidth={2.2} strokeLinecap="round" fill="none" /></Svg>
                  </TouchableOpacity>
                  <Text style={[styles.timeValue, { color: accentColor }]}>{String(timeM).padStart(2, '0')}</Text>
                  <TouchableOpacity style={styles.timeArrow} onPress={() => adjustM(-5)}>
                    <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="m6 9 6 6 6-6" stroke={Colors.textPrimary} strokeWidth={2.2} strokeLinecap="round" fill="none" /></Svg>
                  </TouchableOpacity>
                </View>
                <View style={styles.ampmCol}>
                  <TouchableOpacity style={[styles.ampmBtn, timeH < 12 && styles.ampmBtnActive]} onPress={() => { if (timeH >= 12) setTimeH(timeH - 12); }}>
                    <Text style={[styles.ampmText, timeH < 12 && { color: accentColor }]}>AM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.ampmBtn, timeH >= 12 && styles.ampmBtnActive]} onPress={() => { if (timeH < 12) setTimeH(timeH + 12); }}>
                    <Text style={[styles.ampmText, timeH >= 12 && { color: accentColor }]}>PM</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Repeat */}
            <Text style={[styles.cardLabel, { marginTop: 20, marginBottom: 10 }]}>REPEAT</Text>
            {REPEAT_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.optionRow, schedRepeat === opt.value && styles.optionRowActive]}
                onPress={() => setSchedRepeat(opt.value)}
                activeOpacity={0.85}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionLabel}>{opt.label}</Text>
                  <Text style={styles.optionSub}>{opt.sub}</Text>
                </View>
                <View style={[styles.radioOuter, schedRepeat === opt.value && { borderColor: accentColor }]}>
                  {schedRepeat === opt.value && <View style={[styles.radioInner, { backgroundColor: accentColor }]} />}
                </View>
              </TouchableOpacity>
            ))}

            {/* Custom day picker */}
            {schedRepeat === 'custom' && (
              <>
                <Text style={[styles.cardLabel, { marginTop: 18, marginBottom: 10 }]}>SELECT DAYS</Text>
                <View style={styles.daysRow}>
                  {DAYS.map(d => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.dayChip, schedDays.includes(d) && { backgroundColor: accentColor, borderColor: accentColor }]}
                      onPress={() => toggleDay(d)}
                    >
                      <Text style={[styles.dayChipText, schedDays.includes(d) && { color: '#fff' }]}>{DAY_LABELS[d]}</Text>
                      <Text style={[styles.dayFullText, schedDays.includes(d) && { color: '#ffffffaa' }]}>{DAY_FULL[d]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </>
        )}

        {step === 'trigger' && autoType === 'sensor' && (
          <>
            <Text style={styles.stepLabel}>What sensor event should trigger it?</Text>

            <Text style={[styles.cardLabel, { marginBottom: 10 }]}>TRIGGER TYPE</Text>
            {SENSOR_TRIGGERS.map(st => (
              <TouchableOpacity
                key={st.value}
                style={[styles.optionRow, sensorTrigger === st.value && styles.optionRowActive]}
                onPress={() => setSensorTrigger(st.value)}
                activeOpacity={0.85}
              >
                <Text style={styles.triggerEmoji}>{st.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionLabel}>{st.label}</Text>
                  <Text style={styles.optionSub}>{st.sub}</Text>
                </View>
                <View style={[styles.radioOuter, sensorTrigger === st.value && { borderColor: accentColor }]}>
                  {sensorTrigger === st.value && <View style={[styles.radioInner, { backgroundColor: accentColor }]} />}
                </View>
              </TouchableOpacity>
            ))}

            {/* Threshold */}
            {SENSOR_TRIGGERS.find(s => s.value === sensorTrigger)?.hasThreshold && (
              <>
                <Text style={[styles.cardLabel, { marginTop: 18, marginBottom: 8 }]}>
                  THRESHOLD VALUE ({sensorTrigger.includes('temp') ? '°C' : '%'})
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={sensorTrigger.includes('temp') ? 'e.g. 26' : 'e.g. 70'}
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={sensorThreshold}
                  onChangeText={setSensorThreshold}
                />
              </>
            )}

            {/* Delay */}
            <Text style={[styles.cardLabel, { marginTop: 18, marginBottom: 8 }]}>TRIGGER DELAY (seconds, optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 30 (wait 30s before running)"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={sensorDelay}
              onChangeText={setSensorDelay}
            />
          </>
        )}

        {step === 'trigger' && autoType === 'mode' && (
          <>
            <Text style={styles.stepLabel}>Which scene and when?</Text>

            <Text style={[styles.cardLabel, { marginBottom: 10 }]}>SELECT SCENE / MODE</Text>
            {scenes.map(sc => (
              <TouchableOpacity
                key={sc.id}
                style={[styles.optionRow, selectedSceneId === sc.id && styles.optionRowActive]}
                onPress={() => setSelectedSceneId(sc.id)}
                activeOpacity={0.85}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionLabel}>{sc.name}</Text>
                  <Text style={styles.optionSub}>{sc.description}</Text>
                </View>
                <View style={[styles.radioOuter, selectedSceneId === sc.id && { borderColor: accentColor }]}>
                  {selectedSceneId === sc.id && <View style={[styles.radioInner, { backgroundColor: accentColor }]} />}
                </View>
              </TouchableOpacity>
            ))}

            <Text style={[styles.cardLabel, { marginTop: 20, marginBottom: 10 }]}>WHEN TO TRIGGER</Text>
            {MODE_TRIGGERS.map(mt => (
              <TouchableOpacity
                key={mt.value}
                style={[styles.optionRow, modeTrigger === mt.value && styles.optionRowActive]}
                onPress={() => setModeTrigger(mt.value)}
                activeOpacity={0.85}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionLabel}>{mt.label}</Text>
                  <Text style={styles.optionSub}>{mt.sub}</Text>
                </View>
                <View style={[styles.radioOuter, modeTrigger === mt.value && { borderColor: accentColor }]}>
                  {modeTrigger === mt.value && <View style={[styles.radioInner, { backgroundColor: accentColor }]} />}
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* ── STEP 3: Actions ─────────────────────────────────────────────────── */}
        {step === 'actions' && (
          <>
            <Text style={styles.stepLabel}>What should happen when triggered?</Text>

            {actions.map((action, i) => {
              const dev = devices.find(d => d.id === action.deviceId);
              const actionDef = ACTION_TYPES.find(a => a.value === action.action);
              return (
                <View key={i} style={styles.actionRow}>
                  <View style={[styles.actionNumBadge, { backgroundColor: `${accentColor}22` }]}>
                    <Text style={[styles.actionNum, { color: accentColor }]}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actionDevice}>{dev?.name || 'Unknown device'}</Text>
                    <Text style={styles.actionDesc}>
                      {actionDef?.label}{action.value !== undefined ? ` → ${action.value}${actionDef?.unit || ''}` : ''}
                      {action.delaySeconds ? ` · after ${action.delaySeconds}s` : ''}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removeAction(i)}>
                    <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M18 6 6 18M6 6l12 12" stroke={Colors.danger} strokeWidth={2} strokeLinecap="round" /></Svg>
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* Add action inline form */}
            {editingAction ? (
              <View style={[styles.card, { borderColor: `${accentColor}33` }]}>
                <Text style={styles.cardLabel}>DEVICE</Text>
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

                <Text style={styles.cardLabel}>ACTION</Text>
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
                    <Text style={[styles.cardLabel, { marginTop: 12 }]}>
                      VALUE ({ACTION_TYPES.find(a => a.value === actType)?.unit})
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder={actType === 'setBrightness' ? '0 – 100' : '16 – 30'}
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={actValue}
                      onChangeText={setActValue}
                    />
                  </>
                )}

                <Text style={[styles.cardLabel, { marginTop: 12 }]}>DELAY BEFORE ACTION (seconds)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0 (no delay)"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={actDelay}
                  onChangeText={setActDelay}
                />

                <View style={styles.addActionBtns}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingAction(false)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: accentColor }]} onPress={addAction}>
                    <Text style={styles.confirmBtnText}>Add Action</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.addActionBtn} onPress={() => setEditingAction(true)}>
                <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M12 5v14M5 12h14" stroke={accentColor} strokeWidth={2.2} strokeLinecap="round" /></Svg>
                <Text style={[styles.addActionBtnText, { color: accentColor }]}>Add Action</Text>
              </TouchableOpacity>
            )}

            {actions.length === 0 && !editingAction && (
              <Text style={styles.hintText}>Add at least one action that runs when this automation triggers.</Text>
            )}
          </>
        )}

        {/* ── STEP 4: Name ────────────────────────────────────────────────────── */}
        {step === 'name' && (
          <>
            <Text style={styles.stepLabel}>Give it a name</Text>

            <TextInput
              style={[styles.nameInput, { borderColor: `${accentColor}66` }]}
              placeholder="e.g. Good Morning, Bedtime, Movie Night..."
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
              autoFocus
            />

            {/* Summary */}
            <View style={[styles.summaryCard, { borderColor: `${accentColor}33` }]}>
              <Text style={styles.cardLabel}>SUMMARY</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Type</Text>
                <Text style={styles.summaryValue}>{autoType.charAt(0).toUpperCase() + autoType.slice(1)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Trigger</Text>
                <Text style={styles.summaryValue} numberOfLines={1}>
                  {autoType === 'schedule'
                    ? `${formattedTime} · ${schedRepeat}`
                    : autoType === 'sensor'
                    ? SENSOR_TRIGGERS.find(s => s.value === sensorTrigger)?.label || sensorTrigger
                    : `${scenes.find(s => s.id === selectedSceneId)?.name} ${modeTrigger === 'on_activate' ? 'activates' : 'deactivates'}`
                  }
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Actions</Text>
                <Text style={styles.summaryValue}>{actions.length} action{actions.length !== 1 ? 's' : ''}</Text>
              </View>
            </View>
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Footer nav */}
      {step !== 'name' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: accentColor }]}
            onPress={next}
            activeOpacity={0.85}
          >
            <Text style={styles.nextBtnText}>
              {step === 'actions' ? 'Continue to Name' : 'Next'}
            </Text>
            <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="m9 18 6-6-6-6" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" fill="none" /></Svg>
          </TouchableOpacity>
        </View>
      )}
      {step === 'name' && (
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.nextBtn, { backgroundColor: accentColor }]} onPress={save}>
            <Text style={styles.nextBtnText}>Save Automation</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  saveText: { fontSize: 15, fontWeight: '700' },
  progressRow: { flexDirection: 'row', gap: 4, paddingHorizontal: 16, paddingVertical: 10 },
  progressBar: { flex: 1, height: 3, borderRadius: 2, backgroundColor: Colors.surface },
  content: { padding: 20, paddingBottom: 100 },
  stepLabel: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: 18, lineHeight: 24 },
  // Type selection
  typeCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.surface, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  typeIconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  typeLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: 3 },
  typeSub: { fontSize: 12.5, color: Colors.textDim, lineHeight: 18 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  // Time picker
  card: { backgroundColor: Colors.surface, borderRadius: 20, padding: 18, borderWidth: 1, marginBottom: 4 },
  cardLabel: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.8, color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 12 },
  timePicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  timeUnit: { alignItems: 'center', gap: 4 },
  timeArrow: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.elevated, alignItems: 'center', justifyContent: 'center' },
  timeValue: { fontSize: 46, fontWeight: '700', letterSpacing: -1, minWidth: 64, textAlign: 'center' },
  timeSep: { fontSize: 36, fontWeight: '300', color: Colors.textMuted, marginBottom: 4 },
  ampmCol: { gap: 6, marginLeft: 8 },
  ampmBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.elevated },
  ampmBtnActive: { backgroundColor: 'rgba(91,140,255,0.15)' },
  ampmText: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
  // Option rows
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: Colors.surface, borderRadius: 16, padding: 15, borderWidth: 1, borderColor: Colors.border, marginBottom: 9 },
  optionRowActive: { borderColor: 'rgba(91,140,255,0.35)', backgroundColor: 'rgba(91,140,255,0.07)' },
  optionLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  optionSub: { fontSize: 12, color: Colors.textDim, marginTop: 2 },
  triggerEmoji: { fontSize: 22 },
  // Days
  daysRow: { flexDirection: 'row', gap: 8 },
  dayChip: { flex: 1, backgroundColor: Colors.surface, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  dayChipText: { fontSize: 12, fontWeight: '700', color: Colors.textDim },
  dayFullText: { fontSize: 9, color: Colors.textMuted, marginTop: 2 },
  // Input
  input: { backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: Colors.textPrimary, marginBottom: 4 },
  // Actions
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  actionNumBadge: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionNum: { fontSize: 15, fontWeight: '700' },
  actionDevice: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  actionDesc: { fontSize: 12, color: Colors.textDim, marginTop: 2 },
  chipSmall: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: Colors.elevated, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  chipSmallText: { fontSize: 12.5, color: Colors.textDim },
  actionTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionTypeChip: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.elevated, borderWidth: 1, borderColor: Colors.border },
  actionTypeText: { fontSize: 12, color: Colors.textDim, fontWeight: '500' },
  addActionBtns: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cancelBtn: { flex: 1, borderRadius: 13, padding: 12, backgroundColor: Colors.elevated, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  cancelBtnText: { fontSize: 13.5, fontWeight: '600', color: Colors.textSecondary },
  confirmBtn: { flex: 1, borderRadius: 13, padding: 12, alignItems: 'center' },
  confirmBtnText: { fontSize: 13.5, fontWeight: '700', color: '#fff' },
  addActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', marginBottom: 12 },
  addActionBtnText: { fontSize: 14, fontWeight: '600' },
  hintText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20, marginTop: 8 },
  // Name step
  nameInput: { backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1.5, padding: 16, fontSize: 18, fontWeight: '600', color: Colors.textPrimary, marginBottom: 24 },
  summaryCard: { backgroundColor: Colors.surface, borderRadius: 20, padding: 18, borderWidth: 1, gap: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13, color: Colors.textDim },
  summaryValue: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, flex: 1, textAlign: 'right' },
  // Footer
  footer: { padding: 16, paddingHorizontal: 20, paddingBottom: 30, backgroundColor: Colors.bg, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  nextBtn: { borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
