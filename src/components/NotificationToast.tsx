import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { dismissToast, NotificationKind } from '../store/slices/notificationsSlice';
import { useTheme } from '../theme/ThemeContext';

const ICONS: Record<NotificationKind, (color: string) => React.ReactNode> = {
  device: (c) => <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M9 18h6M10 22h4M15 14c.2-1 .7-1.7 1.4-2.5A4.6 4.6 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5C8.3 12.3 8.8 13 9 14" stroke={c} strokeWidth={1.9} strokeLinecap="round" fill="none" /></Svg>,
  scene: (c) => <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M9 18V5l12-2v13" stroke={c} strokeWidth={2} strokeLinecap="round" fill="none" /><Circle cx={6} cy={18} r={3} stroke={c} strokeWidth={2} fill="none" /></Svg>,
  automation: (c) => <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M13 2 3 14h9l-1 8 10-12h-9z" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>,
  info: (c) => <Svg width={18} height={18} viewBox="0 0 24 24"><Circle cx={12} cy={12} r={9} stroke={c} strokeWidth={2} fill="none" /><Path d="M12 8h.01M11 12h1v4h1" stroke={c} strokeWidth={2} strokeLinecap="round" fill="none" /></Svg>,
};

export function NotificationToast() {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const Colors = useTheme();
  const toast = useAppSelector((s) => s.notifications.toast);

  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!toast) return;

    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();

    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(hide, 3200);

    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast?.id]);

  function hide() {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -120, duration: 260, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => dispatch(dismissToast()));
  }

  if (!toast) return null;

  const accent = toast.kind === 'automation' ? Colors.warning
    : toast.kind === 'scene' ? Colors.purple
    : toast.kind === 'device' ? Colors.accent
    : Colors.success;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrap, { top: insets.top + 8, transform: [{ translateY }], opacity }]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={hide}
        style={[styles.card, { backgroundColor: Colors.elevated, borderColor: Colors.border }]}
      >
        <View style={[styles.icon, { backgroundColor: `${accent}22` }]}>{ICONS[toast.kind](accent)}</View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: Colors.textPrimary }]} numberOfLines={1}>{toast.title}</Text>
          <Text style={[styles.body, { color: Colors.textDim }]} numberOfLines={2}>{toast.body}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 14, right: 14, zIndex: 1000 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, padding: 13, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '700' },
  body: { fontSize: 12.5, marginTop: 1 },
});
