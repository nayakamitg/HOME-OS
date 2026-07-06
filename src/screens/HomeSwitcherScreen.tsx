import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { useTheme, ThemeColors } from '../theme/ThemeContext';

const OTHER_HOMES = [
  { name: 'Office Tower', devices: '12 rooms · 64 devices · 40 on', color: Colors.success, softBg: 'rgba(61,220,151,0.14)' },
  { name: 'Farm House', devices: '8 rooms · 31 devices · 6 on', color: Colors.warning, softBg: 'rgba(240,194,103,0.14)' },
  { name: 'City Apartment', devices: '3 rooms · 14 devices · 2 on', color: Colors.purple, softBg: 'rgba(200,162,255,0.14)' },
];

export function HomeSwitcherScreen({ navigation }: any) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  return (
    <View style={styles.screen}>
      <StatusBar />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Homes</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M18 6 6 18M6 6l12 12" stroke={Colors.textSecondary} strokeWidth={2.4} strokeLinecap="round"/></Svg>
          </TouchableOpacity>
        </View>
        <Text style={styles.sub}>4 properties · 1 selected</Text>

        {/* Active home */}
        <View style={styles.activeCard}>
          <View style={styles.activeBadge}><Text style={styles.activeBadgeText}>Active</Text></View>
          <View style={styles.homeIcon}>
            <Svg width={24} height={24} viewBox="0 0 24 24"><Path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="#9db4ff" strokeWidth={1.8} strokeLinecap="round" fill="none"/><Path d="M9 22V12h6v10" stroke="#9db4ff" strokeWidth={1.8} fill="none"/></Svg>
          </View>
          <Text style={styles.activeName}>Smith Residence</Text>
          <View style={styles.activeStats}>
            <Text style={styles.activeStat}>5 rooms</Text>
            <Text style={styles.activeStatDot}>·</Text>
            <Text style={styles.activeStat}>24 devices</Text>
            <Text style={styles.activeStatDot}>·</Text>
            <Text style={styles.activeStat}>18 on</Text>
          </View>
        </View>

        {/* Other homes */}
        <View style={{ gap: 10 }}>
          {OTHER_HOMES.map(h => (
            <TouchableOpacity key={h.name} style={styles.homeRow} activeOpacity={0.8}>
              <View style={[styles.homeRowIcon, { backgroundColor: h.softBg }]}>
                <Svg width={22} height={22} viewBox="0 0 24 24"><Rect x={4} y={2} width={16} height={20} rx={2} stroke={h.color} strokeWidth={1.8} fill="none"/></Svg>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.homeRowName}>{h.name}</Text>
                <Text style={styles.homeRowSub}>{h.devices}</Text>
              </View>
              <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="m9 18 6-6-6-6" stroke={Colors.textMuted} strokeWidth={2.2} strokeLinecap="round" fill="none"/></Svg>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.addHome}>
            <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M12 5v14M5 12h14" stroke={Colors.textSecondary} strokeWidth={2.2} strokeLinecap="round"/></Svg>
            <Text style={styles.addHomeText}>Add a home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 22, paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  title: { fontSize: 27, fontWeight: '600', color: Colors.textPrimary, letterSpacing: -0.5 },
  closeBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  sub: { fontSize: 13.5, color: Colors.textDim, marginBottom: 20 },
  activeCard: { borderRadius: 24, height: 170, backgroundColor: '#1b2440', borderWidth: 1.5, borderColor: Colors.accent, marginBottom: 14, padding: 20, justifyContent: 'flex-end' },
  activeBadge: { position: 'absolute', top: 16, right: 16, backgroundColor: Colors.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  activeBadgeText: { fontSize: 11.5, fontWeight: '700', color: '#fff' },
  homeIcon: { position: 'absolute', top: 18, left: 20, width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(91,140,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  activeName: { fontSize: 23, fontWeight: '600', color: Colors.textPrimary },
  activeStats: { flexDirection: 'row', gap: 6, marginTop: 8 },
  activeStat: { fontSize: 12.5, color: '#b9c4e6', fontFamily: 'monospace' },
  activeStatDot: { color: 'rgba(185,196,230,0.4)', fontSize: 12 },
  homeRow: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, padding: 14, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  homeRowIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  homeRowName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  homeRowSub: { fontSize: 12, color: Colors.textDim },
  addHome: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', borderStyle: 'dashed', borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  addHomeText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
});
