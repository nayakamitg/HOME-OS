import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Path } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { useTheme, ThemeColors } from '../theme/ThemeContext';

export function AppStatusBar() {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  return (
    <View style={styles.bar}>
      <Text style={styles.time}>9:41</Text>
      <View style={styles.icons}>
        <Svg width={17} height={12} viewBox="0 0 17 12">
          <Rect x={0} y={7} width={3} height={5} rx={1} fill={Colors.textPrimary} />
          <Rect x={4.5} y={4.5} width={3} height={7.5} rx={1} fill={Colors.textPrimary} />
          <Rect x={9} y={2} width={3} height={10} rx={1} fill={Colors.textPrimary} />
          <Rect x={13.5} y={0} width={3} height={12} rx={1} fill={Colors.textPrimary} opacity={0.35} />
        </Svg>
        <Svg width={16} height={12} viewBox="0 0 16 12">
          <Path d="M1 4.5C4.5 1 11.5 1 15 4.5M3.5 7C6 4.7 10 4.7 12.5 7M6 9.4c1.1-1 2.9-1 4 0" stroke={Colors.textPrimary} strokeWidth={1.5} strokeLinecap="round" fill="none" />
        </Svg>
        <View style={styles.battery}>
          <View style={styles.batteryFill} />
        </View>
      </View>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  bar: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 },
  time: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, letterSpacing: 0.4 },
  icons: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  battery: { width: 25, height: 12, borderWidth: 1.5, borderColor: 'rgba(244,244,246,0.5)', borderRadius: 3, padding: 1.5, flexDirection: 'row' },
  batteryFill: { flex: 1, backgroundColor: Colors.textPrimary, borderRadius: 1 },
});
