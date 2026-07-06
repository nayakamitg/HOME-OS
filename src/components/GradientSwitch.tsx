import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

/**
 * RN port of the animated "gradient button" (web styled-components original).
 * ON  → dark tile with rotating banded radial-gradient layers (each layer has
 *       its own period, like the CSS animationDuration stagger), a pulsing
 *       light bar and a glowing label.
 * OFF → all animation stops and the tile falls back to a plain white face.
 */

const LAYERS = [
  { duration: 25000, opacity: 0.9, direction: 1 },
  { duration: 15900, opacity: 0.5, direction: -1 },
  { duration: 19200, opacity: 0.35, direction: 1 },
];

// Alternating white/blue bands ≈ the CSS radial-gradient(...#fff,#00f,#fff...)
const BAND_COLORS = ['#ffffff', '#2f4bff'];
const BANDS = Array.from({ length: 11 }, (_, i) => ({
  offset: `${(i / 10) * 100}%`,
  color: BAND_COLORS[i % 2],
}));

interface GradientSwitchProps {
  label: string;
  on: boolean;
  onToggle: () => void;
}

function GradientLayer({ on, duration, opacity, direction }: {
  on: boolean; duration: number; opacity: number; direction: 1 | -1 | number;
}) {
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (on) {
      const loop = Animated.loop(
        Animated.timing(rot, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }),
      );
      loop.start();
      return () => { loop.stop(); rot.setValue(0); };
    }
    rot.stopAnimation();
    rot.setValue(0);
  }, [on, duration, rot]);

  const spin = rot.interpolate({
    inputRange: [0, 1],
    outputRange: direction > 0 ? ['0deg', '360deg'] : ['360deg', '0deg'],
  });

  const gradId = `gs-${duration}-${direction > 0 ? 'cw' : 'ccw'}`;
  return (
    <Animated.View style={[styles.layer, { opacity, transform: [{ rotate: spin }] }]} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <Defs>
          {/* ellipse at 65% 180% — off-center focus gives the sweeping bands */}
          <RadialGradient id={gradId} cx="65%" cy="115%" rx="120%" ry="90%" gradientUnits="objectBoundingBox">
            {BANDS.map((b, i) => <Stop key={i} offset={b.offset} stopColor={b.color} />)}
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={100} height={100} fill={`url(#${gradId})`} />
      </Svg>
    </Animated.View>
  );
}

export function GradientSwitch({ label, on, onToggle }: GradientSwitchProps) {
  const pulse = useRef(new Animated.Value(1)).current;   // light bar (3s)
  const textPulse = useRef(new Animated.Value(1)).current; // label glow (5s)
  const press = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (on) {
      const a = Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 0.1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]));
      const b = Animated.loop(Animated.sequence([
        Animated.timing(textPulse, { toValue: 0.5, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(textPulse, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]));
      a.start(); b.start();
      return () => { a.stop(); b.stop(); pulse.setValue(1); textPulse.setValue(1); };
    }
    pulse.stopAnimation(); pulse.setValue(1);
    textPulse.stopAnimation(); textPulse.setValue(1);
  }, [on, pulse, textPulse]);

  return (
    <Pressable
      onPress={onToggle}
      onPressIn={() => Animated.spring(press, { toValue: 0.95, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(press, { toValue: 1, useNativeDriver: true }).start()}
      style={styles.pressWrap}
    >
      <Animated.View
        style={[
          styles.wrapper,
          { transform: [{ scale: press }] },
          on ? styles.wrapperOn : styles.wrapperOff,
        ]}
      >
        {on && LAYERS.map((l) => (
          <GradientLayer key={l.duration} on={on} duration={l.duration} opacity={l.opacity} direction={l.direction} />
        ))}

        {/* .light — soft pulsing glow bar */}
        {on && <Animated.View style={[styles.light, { opacity: pulse }]} pointerEvents="none" />}

        {/* .text-overlay */}
        <Animated.Text
          style={[
            styles.label,
            on
              ? { color: '#0b0b16', opacity: textPulse, textShadowColor: 'rgba(255,255,255,0.9)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 0 } }
              : { color: '#3a3a44' },
          ]}
          numberOfLines={1}
        >
          {label}
        </Animated.Text>
        <View style={[styles.stateDot, { backgroundColor: on ? '#0b0b16' : '#c9c9d4' }]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressWrap: { width: '47.5%' },
  wrapper: {
    height: 84,
    borderRadius: 26,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapperOn: { borderColor: '#ffffff', backgroundColor: '#101024' },
  // OFF: animation gone, plain white face
  wrapperOff: { borderColor: '#d9d9e3', backgroundColor: '#ffffff' },
  layer: {
    position: 'absolute',
    // Oversized so corners stay covered while it rotates
    width: '340%',
    aspectRatio: 1,
    left: '-120%',
    top: '-160%',
  },
  light: {
    position: 'absolute',
    width: '80%',
    height: 26,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1.2,
    maxWidth: '86%',
  },
  stateDot: {
    position: 'absolute',
    bottom: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
