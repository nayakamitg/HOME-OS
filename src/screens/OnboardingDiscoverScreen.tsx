import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme, ThemeColors } from '../theme/ThemeContext';
import { useAppSelector } from '../store/hooks';

export function OnboardingDiscoverScreen({ navigation }: any) {
  const Colors = useTheme();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const devices = useAppSelector(s => s.devices.devices);

  return (
    <View style={styles.screen}>
      <StatusBar />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Svg width={19} height={19} viewBox="0 0 24 24"><Path d="m15 18-6-6 6-6" stroke={Colors.textSecondary} strokeWidth={2.2} strokeLinecap="round" fill="none"/></Svg>
          </TouchableOpacity>
          <Text style={styles.stepText}>Step 2 of 5</Text>
        </View>

        {/* Progress */}
        <View style={styles.progress}>
          {[1, 1, 0, 0, 0].map((v, i) => (
            <View key={i} style={[styles.progressBar, v === 1 && styles.progressBarActive]} />
          ))}
        </View>

        <Text style={styles.title}>Your devices</Text>
        <Text style={styles.subtitle}>These are the devices currently set up in your home. Run a scan to add more.</Text>

        {/* Radar */}
        <View style={styles.radarWrap}>
          <View style={styles.radarPulse}>
            <View style={styles.radarCore}>
              <Svg width={34} height={34} viewBox="0 0 24 24"><Path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" stroke={Colors.accent} strokeWidth={1.8} strokeLinecap="round" fill="none"/></Svg>
            </View>
          </View>
        </View>

        <Text style={styles.foundLabel}>IN YOUR HOME · {devices.length}</Text>
        <View style={{ gap: 10 }}>
          {devices.length === 0 && (
            <Text style={styles.emptyText}>No devices yet — run a scan to find nearby devices.</Text>
          )}
          {devices.map(dev => (
            <View key={dev.id} style={styles.deviceRow}>
              <View style={styles.devIcon}>
                <Svg width={20} height={20} viewBox="0 0 24 24"><Circle cx={12} cy={12} r={9} stroke={dev.isOnline ? Colors.success : Colors.textMuted} strokeWidth={1.9} fill="none"/></Svg>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.devName}>{dev.name}</Text>
                <Text style={styles.devSub}>{dev.room} · {dev.isOnline ? 'Online' : 'Offline'}</Text>
              </View>
              <View style={styles.checkCircle}>
                <Svg width={13} height={13} viewBox="0 0 24 24"><Path d="M20 6 9 17l-5-5" stroke="#fff" strokeWidth={3} strokeLinecap="round" fill="none"/></Svg>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('AddDevice')}>
          <Text style={styles.primaryBtnText}>Scan for new devices</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 22, paddingBottom: 120 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  iconBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 12.5, color: Colors.textDim },
  progress: { flexDirection: 'row', gap: 6, marginBottom: 24 },
  progressBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.elevated },
  progressBarActive: { backgroundColor: Colors.accent },
  title: { fontSize: 25, fontWeight: '600', color: Colors.textPrimary, letterSpacing: -0.5, marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.textDim, lineHeight: 21, marginBottom: 26 },
  radarWrap: { alignItems: 'center', marginBottom: 28 },
  radarPulse: { width: 150, height: 150, borderRadius: 75, backgroundColor: Colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  radarCore: { width: 84, height: 84, borderRadius: 42, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderActive, alignItems: 'center', justifyContent: 'center' },
  foundLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 12 },
  emptyText: { fontSize: 13.5, color: Colors.textDim, lineHeight: 20 },
  deviceRow: { flexDirection: 'row', alignItems: 'center', gap: 13, borderRadius: 18, padding: 14, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  devIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: Colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  devName: { fontSize: 14.5, fontWeight: '600', color: Colors.textPrimary },
  devSub: { fontSize: 12, color: Colors.textDim },
  checkCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  footer: { padding: 18, paddingHorizontal: 22, paddingBottom: 28, backgroundColor: Colors.bg },
  primaryBtn: { borderRadius: 16, padding: 16, backgroundColor: Colors.accent, alignItems: 'center' },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
