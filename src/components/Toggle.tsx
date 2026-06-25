import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

interface ToggleProps {
  value: boolean;
  onToggle: () => void;
  activeColor?: string;
}

export function Toggle({ value, onToggle, activeColor = Colors.accent }: ToggleProps) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      style={[styles.track, { backgroundColor: value ? activeColor : '#2a2a2e' }]}
      activeOpacity={0.8}
    >
      <View style={[styles.thumb, { marginLeft: value ? 'auto' : 0 }]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: { width: 46, height: 27, borderRadius: 999, padding: 3, flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 21, height: 21, borderRadius: 999, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 3, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
});
