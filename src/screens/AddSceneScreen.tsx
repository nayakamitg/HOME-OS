import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { useTheme, ThemeColors } from '../theme/ThemeContext';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { addScene, SceneAction } from '../store/slices/scenesSlice';
import { addEvent } from '../store/slices/activitySlice';
import { pushCreateScene } from '../services/sync';

const COLOR_OPTIONS = [
  { key: 'accent', color: Colors.accent, label: 'Blue' },
  { key: 'warning', color: Colors.warning, label: 'Gold' },
  { key: 'success', color: Colors.success, label: 'Green' },
  { key: 'danger', color: Colors.danger, label: 'Red' },
  { key: 'purple', color: Colors.purple, label: 'Purple' },
];

type ActionType = 'turnOn' | 'turnOff' | 'setBrightness' | 'setTemperature';

const ACTION_LABELS: Record<ActionType, string> = {
  turnOn: 'Turn On',
  turnOff: 'Turn Off',
  setBrightness: 'Set Brightness',
  setTemperature: 'Set Temperature',
};

export function AddSceneScreen({ navigation }: any) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const dispatch = useAppDispatch();
  const devices = useAppSelector(s => s.devices.devices);

  const [sceneName, setSceneName] = useState('');
  const [sceneDesc, setSceneDesc] = useState('');
  const [colorKey, setColorKey] = useState('accent');
  const [actions, setActions] = useState<SceneAction[]>([]);
  const [showAddAction, setShowAddAction] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState(devices[0]?.id || '');
  const [selectedAction, setSelectedAction] = useState<ActionType>('turnOn');
  const [actionValue, setActionValue] = useState('');

  function addAction() {
    if (!selectedDeviceId) return;
    const action: SceneAction = {
      deviceId: selectedDeviceId,
      action: selectedAction,
      value: (selectedAction === 'setBrightness' || selectedAction === 'setTemperature')
        ? parseInt(actionValue) || undefined
        : undefined,
    };
    setActions(prev => [...prev, action]);
    setShowAddAction(false);
    setActionValue('');
  }

  function removeAction(index: number) {
    setActions(prev => prev.filter((_, i) => i !== index));
  }

  function saveScene() {
    if (!sceneName.trim()) {
      Alert.alert('Name Required', 'Please enter a scene name.');
      return;
    }
    const id = sceneName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    const scene = {
      id,
      name: sceneName.trim(),
      description: sceneDesc.trim() || `${actions.length} actions`,
      colorKey,
      actions,
      deviceCount: new Set(actions.map(a => a.deviceId)).size,
    };
    dispatch(addScene(scene));
    dispatch(addEvent({ title: `Scene "${sceneName}" created`, subtitle: `${actions.length} actions`, category: 'automation' }));
    dispatch(pushCreateScene({ ...scene, isActive: false, createdAt: new Date().toISOString() }));
    navigation.goBack();
  }

  const selectedColor = COLOR_OPTIONS.find(c => c.key === colorKey)?.color || Colors.accent;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Svg width={19} height={19} viewBox="0 0 24 24"><Path d="m15 18-6-6 6-6" stroke={Colors.textSecondary} strokeWidth={2.2} strokeLinecap="round" fill="none" /></Svg>
        </TouchableOpacity>
        <Text style={styles.title}>New Scene</Text>
        <TouchableOpacity onPress={saveScene}>
          <Text style={styles.saveBtn}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Preview card */}
        <View style={[styles.previewCard, { backgroundColor: `${selectedColor}22`, borderColor: `${selectedColor}44` }]}>
          <View style={[styles.previewIcon, { backgroundColor: `${selectedColor}33` }]}>
            <Svg width={28} height={28} viewBox="0 0 24 24"><Path d="M12 2 9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5Z" stroke={selectedColor} strokeWidth={1.9} strokeLinecap="round" fill="none" /></Svg>
          </View>
          <Text style={[styles.previewName, { color: selectedColor }]}>{sceneName || 'Scene Name'}</Text>
          <Text style={styles.previewDesc}>{sceneDesc || 'Scene description'}</Text>
        </View>

        <Text style={styles.sectionLabel}>SCENE NAME</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Good Morning"
          placeholderTextColor={Colors.textMuted}
          value={sceneName}
          onChangeText={setSceneName}
        />

        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>DESCRIPTION</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Bright lights, coffee maker on"
          placeholderTextColor={Colors.textMuted}
          value={sceneDesc}
          onChangeText={setSceneDesc}
        />

        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>COLOR</Text>
        <View style={styles.colorRow}>
          {COLOR_OPTIONS.map(c => (
            <TouchableOpacity
              key={c.key}
              style={[styles.colorDot, { backgroundColor: c.color }, colorKey === c.key && styles.colorDotActive]}
              onPress={() => setColorKey(c.key)}
            >
              {colorKey === c.key && (
                <Svg width={14} height={14} viewBox="0 0 24 24"><Path d="M20 6 9 17l-5-5" stroke="#fff" strokeWidth={3} strokeLinecap="round" fill="none" /></Svg>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actionsHeader}>
          <Text style={styles.sectionLabel}>ACTIONS ({actions.length})</Text>
          <TouchableOpacity style={styles.addActionBtn} onPress={() => setShowAddAction(true)}>
            <Svg width={14} height={14} viewBox="0 0 24 24"><Path d="M12 5v14M5 12h14" stroke={Colors.accent} strokeWidth={2.5} strokeLinecap="round" /></Svg>
            <Text style={styles.addActionText}>Add</Text>
          </TouchableOpacity>
        </View>

        {actions.length === 0 && (
          <View style={styles.emptyActions}>
            <Text style={styles.emptyActionsText}>No actions yet. Add actions to control devices when this scene runs.</Text>
          </View>
        )}

        {actions.map((action, i) => {
          const device = devices.find(d => d.id === action.deviceId);
          return (
            <View key={i} style={styles.actionRow}>
              <View style={styles.actionIconWrap}>
                <Svg width={16} height={16} viewBox="0 0 24 24"><Path d="M13 2 3 14h9l-1 8 10-12h-9z" stroke={Colors.warning} strokeWidth={2} strokeLinecap="round" fill="none" /></Svg>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionDeviceName}>{device?.name || 'Unknown'}</Text>
                <Text style={styles.actionDesc}>
                  {ACTION_LABELS[action.action]}
                  {action.value !== undefined ? ` → ${action.value}${action.action === 'setTemperature' ? '°C' : '%'}` : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => removeAction(i)}>
                <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M18 6 6 18M6 6l12 12" stroke={Colors.danger} strokeWidth={2} strokeLinecap="round" /></Svg>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Add Action Modal inline */}
        {showAddAction && (
          <View style={styles.addActionCard}>
            <Text style={styles.sectionLabel}>SELECT DEVICE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {devices.map(d => (
                <TouchableOpacity
                  key={d.id}
                  style={[styles.deviceChip, selectedDeviceId === d.id && styles.deviceChipActive]}
                  onPress={() => setSelectedDeviceId(d.id)}
                >
                  <Text style={[styles.deviceChipText, selectedDeviceId === d.id && styles.deviceChipTextActive]}>{d.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.sectionLabel}>ACTION</Text>
            <View style={styles.actionTypeRow}>
              {(Object.keys(ACTION_LABELS) as ActionType[]).map(a => (
                <TouchableOpacity
                  key={a}
                  style={[styles.actionTypeChip, selectedAction === a && styles.actionTypeChipActive]}
                  onPress={() => setSelectedAction(a)}
                >
                  <Text style={[styles.actionTypeText, selectedAction === a && styles.actionTypeTextActive]}>{ACTION_LABELS[a]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {(selectedAction === 'setBrightness' || selectedAction === 'setTemperature') && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: 16 }]}>
                  {selectedAction === 'setBrightness' ? 'BRIGHTNESS (0-100%)' : 'TEMPERATURE (°C)'}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={selectedAction === 'setBrightness' ? '0-100' : '16-30'}
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={actionValue}
                  onChangeText={setActionValue}
                />
              </>
            )}

            <View style={styles.addActionFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddAction(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={addAction}>
                <Text style={styles.confirmBtnText}>Add Action</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  saveBtn: { fontSize: 15, fontWeight: '600', color: Colors.accent },
  content: { padding: 20, paddingBottom: 80 },
  previewCard: { borderRadius: 24, padding: 20, borderWidth: 1, alignItems: 'center', gap: 8, marginBottom: 24 },
  previewIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  previewName: { fontSize: 20, fontWeight: '600' },
  previewDesc: { fontSize: 13, color: Colors.textDim },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 10 },
  input: { backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.textPrimary },
  colorRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  colorDot: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'transparent' },
  colorDotActive: { borderColor: 'rgba(255,255,255,0.5)' },
  actionsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  addActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.accentSoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  addActionText: { fontSize: 12.5, fontWeight: '600', color: Colors.accent },
  emptyActions: { borderRadius: 14, padding: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', alignItems: 'center', marginBottom: 16 },
  emptyActionsText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  actionIconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(240,194,103,0.15)', alignItems: 'center', justifyContent: 'center' },
  actionDeviceName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  actionDesc: { fontSize: 12, color: Colors.textDim, marginTop: 2 },
  addActionCard: { backgroundColor: Colors.elevated, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: Colors.border, marginTop: 8 },
  deviceChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  deviceChipActive: { backgroundColor: Colors.accentSoft, borderColor: Colors.accent },
  deviceChipText: { fontSize: 13, color: Colors.textDim },
  deviceChipTextActive: { color: Colors.accent, fontWeight: '600' },
  actionTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionTypeChip: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  actionTypeChipActive: { backgroundColor: Colors.accentSoft, borderColor: Colors.accent },
  actionTypeText: { fontSize: 12, color: Colors.textDim },
  actionTypeTextActive: { color: Colors.accent, fontWeight: '600' },
  addActionFooter: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: { flex: 1, borderRadius: 14, padding: 13, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  confirmBtn: { flex: 1, borderRadius: 14, padding: 13, backgroundColor: Colors.accent, alignItems: 'center' },
  confirmBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
