import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AppStatusBar } from '../components/StatusBar';
import { Colors } from '../theme/colors';
import { useTheme, ThemeColors } from '../theme/ThemeContext';

const SUMMARY = [
  { icon: 'name', label: 'Name', value: 'Reading Lamp' },
  { icon: 'room', label: 'Room', value: 'Bedroom' },
  { icon: 'wifi', label: 'Network', value: 'Connected', valueColor: Colors.success },
  { icon: 'fw', label: 'Firmware', value: 'Up to date' },
];

export function OnboardingSuccessScreen({ navigation }: any) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  return (
    <View style={styles.screen}>
      <AppStatusBar />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress */}
        <View style={styles.progress}>
          {[1, 1, 1, 1, 1].map((_, i) => (
            <View key={i} style={[styles.progressBar, styles.progressBarActive]} />
          ))}
        </View>

        {/* Success seal */}
        <View style={styles.sealWrap}>
          <View style={styles.sealOuter}>
            <View style={styles.sealInner}>
              <Svg width={34} height={34} viewBox="0 0 24 24"><Path d="M20 6 9 17l-5-5" stroke="#fff" strokeWidth={3} strokeLinecap="round" fill="none"/></Svg>
            </View>
          </View>
        </View>

        <View style={styles.doneText}>
          <Text style={styles.doneTitle}>You're all set</Text>
          <Text style={styles.doneSub}>Lumio Smart Bulb is connected and ready.</Text>
        </View>

        <Text style={styles.sectionLabel}>SETUP SUMMARY</Text>
        <View style={styles.summaryTable}>
          {SUMMARY.map((row, i, arr) => (
            <View key={row.label} style={[styles.summaryRow, i < arr.length - 1 && styles.summaryRowBorder]}>
              <View style={styles.summaryLeft}>
                <Text style={styles.summaryLabel}>{row.label}</Text>
              </View>
              <Text style={[styles.summaryValue, row.valueColor && { color: row.valueColor }]}>{row.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.tipCard}>
          <Svg width={20} height={20} viewBox="0 0 24 24"><Path d="M12 2 9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5Z" stroke={Colors.accent} strokeWidth={1.9} strokeLinecap="round" fill="none"/></Svg>
          <Text style={styles.tipText}>Tip: ask Aria to "add Reading Lamp to Sleep scene".</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('OnboardingDiscover')}>
          <Text style={styles.secondaryBtnText}>Add another</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('MainTabs')}>
          <Text style={styles.primaryBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 22, paddingBottom: 120 },
  progress: { flexDirection: 'row', gap: 6, marginBottom: 30 },
  progressBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#2a2a2e' },
  progressBarActive: { backgroundColor: Colors.accent },
  sealWrap: { alignItems: 'center', marginBottom: 18 },
  sealOuter: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(61,220,151,0.22)', alignItems: 'center', justifyContent: 'center' },
  sealInner: { width: 68, height: 68, borderRadius: 34, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center' },
  doneText: { alignItems: 'center', marginBottom: 28 },
  doneTitle: { fontSize: 25, fontWeight: '600', color: Colors.textPrimary, letterSpacing: -0.5 },
  doneSub: { fontSize: 14, color: Colors.textDim, marginTop: 6 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 12 },
  summaryTable: { borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, marginBottom: 14 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: Colors.surface },
  summaryRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.bg },
  summaryLeft: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  summaryLabel: { fontSize: 13.5, color: '#9696a0' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  tipCard: { borderRadius: 16, padding: 14, backgroundColor: 'rgba(91,140,255,0.08)', borderWidth: 1, borderColor: 'rgba(91,140,255,0.25)', flexDirection: 'row', alignItems: 'center', gap: 11 },
  tipText: { fontSize: 13, color: '#b9c4e6', flex: 1 },
  footer: { flexDirection: 'row', gap: 10, padding: 18, paddingHorizontal: 22, paddingBottom: 28, backgroundColor: Colors.bg },
  secondaryBtn: { width: 120, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  secondaryBtnText: { fontSize: 14.5, fontWeight: '600', color: '#c8c8d0' },
  primaryBtn: { flex: 1, borderRadius: 16, padding: 16, backgroundColor: Colors.accent, alignItems: 'center' },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
