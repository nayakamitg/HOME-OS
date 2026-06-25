import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, StatusBar } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { AppStatusBar } from '../components/StatusBar';
import { Colors } from '../theme/colors';
import { useTheme, ThemeColors } from '../theme/ThemeContext';

export function AutomationScreen({ navigation }: any) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack?.()}>
            <Svg width={19} height={19} viewBox="0 0 24 24"><Path d="m15 18-6-6 6-6" stroke={Colors.textSecondary} strokeWidth={2.2} strokeLinecap="round" fill="none"/></Svg>
          </TouchableOpacity>
          <Text style={styles.title}>New Automation</Text>
          <TouchableOpacity><Text style={styles.saveBtn}>Save</Text></TouchableOpacity>
        </View>

        <TextInput
          style={styles.nameInput}
          defaultValue="Evening Welcome"
          placeholderTextColor={Colors.textDim}
        />

        {/* WHEN */}
        <View style={styles.sectionRow}>
          <View style={styles.whenTag}><Text style={styles.whenTagText}>WHEN</Text></View>
          <Text style={styles.sectionSub}>Trigger</Text>
        </View>
        {[
          { icon: <Svg width={20} height={20} viewBox="0 0 24 24"><Circle cx={12} cy={12} r={9} stroke={Colors.accent} strokeWidth={1.9} fill="none"/><Path d="M12 7v5l3 2" stroke={Colors.accent} strokeWidth={1.9} strokeLinecap="round"/></Svg>, title: 'Time is 7:00 PM', sub: 'Every day', color: Colors.accent },
          { icon: <Svg width={20} height={20} viewBox="0 0 24 24"><Path d="m22 8-6 4 6 4V8Z" stroke={Colors.accent} strokeWidth={1.9} strokeLinecap="round" fill="none"/><Path d="M2 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2z" stroke={Colors.accent} strokeWidth={1.9} fill="none"/></Svg>, title: 'Someone arrives home', sub: 'Aanya or Rohan', color: Colors.accent },
        ].map((item, i) => (
          <View key={i} style={[styles.triggerCard, i === 0 && styles.triggerCardActive]}>
            <View style={[styles.triggerIcon, { backgroundColor: `${item.color}29` }]}>{item.icon}</View>
            <View style={{ flex: 1 }}>
              <Text style={styles.triggerTitle}>{item.title}</Text>
              <Text style={styles.triggerSub}>{item.sub}</Text>
            </View>
            <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="m9 18 6-6-6-6" stroke={Colors.textMuted} strokeWidth={2.2} strokeLinecap="round" fill="none"/></Svg>
          </View>
        ))}

        <View style={styles.connector} />

        {/* IF */}
        <View style={styles.sectionRow}>
          <View style={styles.ifTag}><Text style={styles.ifTagText}>IF</Text></View>
          <Text style={styles.sectionSub}>Condition · optional</Text>
        </View>
        <View style={styles.triggerCard}>
          <View style={[styles.triggerIcon, { backgroundColor: Colors.warningSoft }]}>
            <Svg width={20} height={20} viewBox="0 0 24 24"><Path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" stroke={Colors.warning} strokeWidth={1.9} strokeLinecap="round" fill="none"/></Svg>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.triggerTitle}>After sunset</Text>
            <Text style={styles.triggerSub}>Only run when dark</Text>
          </View>
        </View>

        {/* THEN */}
        <View style={[styles.sectionRow, { marginTop: 16 }]}>
          <View style={styles.thenTag}><Text style={styles.thenTagText}>THEN</Text></View>
          <Text style={styles.sectionSub}>Actions</Text>
        </View>
        {[
          { title: 'Run "Evening" scene', sub: 'Warm lights · 40%', color: Colors.success },
          { title: 'Set AC to 24°C', sub: 'Living Room', color: Colors.accent },
        ].map((a, i) => (
          <View key={i} style={[styles.triggerCard, styles.actionCard]}>
            <View style={[styles.triggerIcon, { backgroundColor: `${a.color}29` }]}>
              <Svg width={20} height={20} viewBox="0 0 24 24"><Path d="M9 18V5l12-2v13M6 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke={a.color} strokeWidth={1.9} strokeLinecap="round" fill="none"/></Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.triggerTitle}>{a.title}</Text>
              <Text style={styles.triggerSub}>{a.sub}</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addAction}>
          <Svg width={17} height={17} viewBox="0 0 24 24"><Path d="M12 5v14M5 12h14" stroke={Colors.textSecondary} strokeWidth={2.2} strokeLinecap="round"/></Svg>
          <Text style={styles.addActionText}>Add action</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.enableBtn}>
          <Text style={styles.enableBtnText}>Enable automation</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 22 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  iconBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  saveBtn: { fontSize: 13.5, fontWeight: '600', color: Colors.accent },
  nameInput: { borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, borderRadius: 16, padding: 15, color: Colors.textPrimary, fontSize: 18, fontWeight: '600', marginBottom: 22 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 11 },
  sectionSub: { fontSize: 12, color: Colors.textDim },
  whenTag: { backgroundColor: Colors.accentSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  whenTagText: { fontSize: 11, fontWeight: '700', color: Colors.accent, letterSpacing: 0.4 },
  ifTag: { backgroundColor: Colors.warningSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  ifTagText: { fontSize: 11, fontWeight: '700', color: Colors.warning, letterSpacing: 0.4 },
  thenTag: { backgroundColor: Colors.successSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  thenTagText: { fontSize: 11, fontWeight: '700', color: Colors.success, letterSpacing: 0.4 },
  triggerCard: { flexDirection: 'row', alignItems: 'center', gap: 13, borderRadius: 18, padding: 15, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  triggerCardActive: { borderColor: 'rgba(91,140,255,0.25)' },
  actionCard: { borderColor: 'rgba(61,220,151,0.2)' },
  triggerIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  triggerTitle: { fontSize: 14.5, fontWeight: '600', color: Colors.textPrimary },
  triggerSub: { fontSize: 12, color: Colors.textDim },
  connector: { width: 2, height: 24, backgroundColor: Colors.accent, marginLeft: 20, marginVertical: 6 },
  addAction: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', borderStyle: 'dashed', borderRadius: 18, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addActionText: { fontSize: 13.5, fontWeight: '600', color: Colors.textSecondary },
  footer: { padding: 18, paddingHorizontal: 22, paddingBottom: 28, backgroundColor: Colors.bg, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  enableBtn: { borderRadius: 16, padding: 16, backgroundColor: Colors.accent, alignItems: 'center' },
  enableBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
