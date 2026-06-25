import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Svg, { Path, Rect, Line } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { useTheme, ThemeColors } from '../theme/ThemeContext';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { runScene, deleteScene } from '../store/slices/scenesSlice';
import { setDeviceOn, setDeviceBrightness, setDeviceTemperature } from '../store/slices/devicesSlice';
import { addEvent } from '../store/slices/activitySlice';

const COLOR_MAP: Record<string, string> = {
  warning: Colors.warning,
  accent: Colors.accent,
  success: Colors.success,
  danger: Colors.danger,
  purple: Colors.purple,
};

function SceneIcon({ colorKey }: { colorKey: string }) {
  const color = COLOR_MAP[colorKey] || Colors.accent;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path d="M12 2 9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5Z" stroke={color} strokeWidth={1.9} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

export function ScenesScreen({ navigation }: any) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const dispatch = useAppDispatch();
  const scenes = useAppSelector(s => s.scenes.scenes);
  const activeSceneId = useAppSelector(s => s.scenes.activeSceneId);
  const devices = useAppSelector(s => s.devices.devices);

  const activeScene = scenes.find(s => s.id === activeSceneId);
  const featuredScene = scenes.find(s => s.id === 'movie');
  const gridScenes = scenes.filter(s => s.id !== 'movie');

  function executeScene(sceneId: string) {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) return;

    scene.actions.forEach(action => {
      if (action.action === 'turnOn') dispatch(setDeviceOn({ id: action.deviceId, isOn: true }));
      else if (action.action === 'turnOff') dispatch(setDeviceOn({ id: action.deviceId, isOn: false }));
      else if (action.action === 'setBrightness' && action.value !== undefined) dispatch(setDeviceBrightness({ id: action.deviceId, brightness: action.value }));
      else if (action.action === 'setTemperature' && action.value !== undefined) dispatch(setDeviceTemperature({ id: action.deviceId, temperature: action.value }));
    });

    dispatch(runScene(sceneId));
    dispatch(addEvent({ title: `${scene.name} scene activated`, subtitle: `Adjusting ${scene.deviceCount} devices`, category: 'automation' }));
  }

  function confirmDelete(sceneId: string, sceneName: string) {
    Alert.alert('Delete Scene', `Delete "${sceneName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => dispatch(deleteScene(sceneId)) },
    ]);
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Scenes</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('AddScene')}>
            <Svg width={19} height={19} viewBox="0 0 24 24"><Path d="M12 5v14M5 12h14" stroke={Colors.textSecondary} strokeWidth={2.2} strokeLinecap="round" /></Svg>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Set the mood of your whole home in one tap.</Text>

        {activeScene && (
          <View style={styles.runningBanner}>
            <View style={styles.bannerIcon}>
              <View style={styles.bar} />
              <View style={[styles.bar, { height: 18 }]} />
              <View style={styles.bar} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>{activeScene.name} running</Text>
              <Text style={styles.bannerSub}>Adjusting {activeScene.deviceCount} devices…</Text>
            </View>
          </View>
        )}

        {/* Featured Movie */}
        {featuredScene && (
          <TouchableOpacity
            style={[styles.featured, activeSceneId === 'movie' && styles.featuredActive]}
            onPress={() => executeScene('movie')}
            activeOpacity={0.85}
          >
            <View style={styles.featuredContent}>
              <View style={styles.featuredRow}>
                <Svg width={22} height={22} viewBox="0 0 24 24"><Path d="m22 8-6 4 6 4V8Z" stroke={Colors.purple} strokeWidth={2} strokeLinecap="round" fill="none" /><Rect x={2} y={6} width={14} height={12} rx={2} stroke={Colors.purple} strokeWidth={2} fill="none" /></Svg>
                <Text style={styles.featuredTitle}>{featuredScene.name}</Text>
              </View>
              <Text style={styles.featuredSub}>{featuredScene.description}</Text>
            </View>
            <View style={[styles.runBtn, activeSceneId === 'movie' && styles.runBtnActive]}>
              <Text style={styles.runBtnText}>{activeSceneId === 'movie' ? 'Active' : 'Run'}</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Grid */}
        <View style={styles.grid}>
          {gridScenes.map(s => {
            const color = COLOR_MAP[s.colorKey] || Colors.accent;
            const active = activeSceneId === s.id;
            const isDefault = ['evening', 'sleep', 'work', 'gaming', 'vacation'].includes(s.id);
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.sceneCard, active && { borderColor: `${color}73`, backgroundColor: `${color}1A` }]}
                onPress={() => executeScene(s.id)}
                onLongPress={() => !isDefault && confirmDelete(s.id, s.name)}
                activeOpacity={0.85}
              >
                <View style={[styles.sceneIcon, { backgroundColor: `${color}29` }]}>
                  <SceneIcon colorKey={s.colorKey} />
                </View>
                <View style={{ flex: 1 }} />
                <Text style={styles.sceneName}>{s.name}</Text>
                <Text style={styles.sceneState}>{active ? 'Running' : s.description}</Text>
                {!isDefault && (
                  <View style={styles.customBadge}><Text style={styles.customBadgeText}>Custom</Text></View>
                )}
              </TouchableOpacity>
            );
          })}

          {/* Add scene card */}
          <TouchableOpacity
            style={styles.addCard}
            onPress={() => navigation.navigate('AddScene')}
            activeOpacity={0.85}
          >
            <View style={styles.addIcon}>
              <Svg width={24} height={24} viewBox="0 0 24 24"><Path d="M12 5v14M5 12h14" stroke={Colors.textMuted} strokeWidth={2.2} strokeLinecap="round" /></Svg>
            </View>
            <Text style={styles.addText}>Add Scene</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 22, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  title: { fontSize: 27, fontWeight: '600', color: Colors.textPrimary, letterSpacing: -0.5 },
  iconBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  subtitle: { fontSize: 13.5, color: Colors.textDim, marginBottom: 18 },
  runningBanner: { borderRadius: 20, padding: 15, backgroundColor: 'rgba(91,140,255,0.15)', borderWidth: 1, borderColor: 'rgba(91,140,255,0.4)', flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 18 },
  bannerIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: 'rgba(10,10,11,0.4)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 3 },
  bar: { width: 3, height: 12, backgroundColor: '#9db4ff', borderRadius: 2 },
  bannerTitle: { fontSize: 14.5, fontWeight: '600', color: Colors.textPrimary },
  bannerSub: { fontSize: 12, color: '#b9c4e6' },
  featured: { borderRadius: 24, height: 148, backgroundColor: '#3a2a52', marginBottom: 14, padding: 20, justifyContent: 'flex-end', borderWidth: 1, borderColor: 'transparent' },
  featuredActive: { borderColor: 'rgba(200,162,255,0.5)' },
  featuredContent: { position: 'absolute', left: 20, bottom: 18 },
  featuredRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  featuredTitle: { fontSize: 22, fontWeight: '600', color: Colors.textPrimary },
  featuredSub: { fontSize: 12.5, color: '#c2b8d8' },
  runBtn: { position: 'absolute', top: 18, right: 18, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)' },
  runBtnActive: { backgroundColor: 'rgba(200,162,255,0.3)' },
  runBtnText: { fontSize: 12.5, fontWeight: '600', color: Colors.textPrimary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  sceneCard: { width: '47.5%', borderRadius: 22, padding: 16, height: 130, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, justifyContent: 'space-between' },
  sceneIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  sceneName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  sceneState: { fontSize: 11, color: Colors.textDim },
  customBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(91,140,255,0.2)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  customBadgeText: { fontSize: 9, fontWeight: '700', color: Colors.accent },
  addCard: { width: '47.5%', borderRadius: 22, height: 130, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  addText: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
});
