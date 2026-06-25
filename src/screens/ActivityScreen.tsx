import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Colors } from '../theme/colors';
import { useTheme, ThemeColors } from '../theme/ThemeContext';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setFilter, markAllRead, ActivityCategory } from '../store/slices/activitySlice';

const FILTERS: { label: string; value: ActivityCategory }[] = [
  { label: 'All', value: 'all' },
  { label: 'Security', value: 'security' },
  { label: 'Automation', value: 'automation' },
  { label: 'Devices', value: 'devices' },
];

const CATEGORY_COLORS: Record<string, string> = {
  security: Colors.danger,
  automation: Colors.purple,
  devices: Colors.accent,
};

export function ActivityScreen() {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const dispatch = useAppDispatch();
  const events = useAppSelector(s => s.activity.events);
  const filter = useAppSelector(s => s.activity.filter);
  const unreadCount = events.filter(e => !e.read).length;

  const filtered = filter === 'all' ? events : events.filter(e => e.category === filter);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Activity</Text>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markAllBtn} onPress={() => dispatch(markAllRead())}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <View style={styles.unreadDot} />
            <Text style={styles.unreadText}>{unreadCount} new event{unreadCount > 1 ? 's' : ''}</Text>
          </View>
        )}

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.value}
              style={[styles.chip, filter === f.value && styles.chipActive]}
              onPress={() => dispatch(setFilter(f.value))}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, filter === f.value && styles.chipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.dayLabel}>TODAY · {filtered.length} events</Text>

        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No events</Text>
            <Text style={styles.emptySubText}>Activity will appear here as you use your home</Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            <View style={styles.timelineLine} />
            {filtered.map(ev => {
              const color = CATEGORY_COLORS[ev.category] || Colors.accent;
              return (
                <View key={ev.id} style={[styles.eventRow, !ev.read && styles.eventRowUnread]}>
                  <View style={[styles.dot, { borderColor: color }]}>
                    <View style={[styles.dotInner, { backgroundColor: color }]} />
                  </View>
                  <View style={styles.eventContent}>
                    <View style={styles.eventHeader}>
                      <Text style={styles.eventTitle}>{ev.title}</Text>
                      <View style={styles.eventMeta}>
                        {!ev.read && <View style={styles.unreadIndicator} />}
                        <Text style={styles.eventTime}>{ev.time}</Text>
                      </View>
                    </View>
                    <Text style={styles.eventSub}>{ev.subtitle}</Text>
                    <View style={styles.categoryChip}>
                      <Text style={[styles.categoryText, { color }]}>{ev.category}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 22, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 27, fontWeight: '600', color: Colors.textPrimary, letterSpacing: -0.5 },
  markAllBtn: { paddingHorizontal: 12, paddingVertical: 7, backgroundColor: Colors.surface, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  markAllText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  unreadBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.accentSoft, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, marginBottom: 16, borderWidth: 1, borderColor: `${Colors.accent}44` },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.accent },
  unreadText: { fontSize: 13, fontWeight: '600', color: Colors.accent },
  filtersScroll: { marginHorizontal: -22, paddingHorizontal: 22, marginBottom: 22 },
  chip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 999, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipText: { fontSize: 12.5, fontWeight: '600', color: '#c8c8d0' },
  chipTextActive: { color: '#fff' },
  dayLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 14 },
  timeline: { paddingLeft: 30, position: 'relative' },
  timelineLine: { position: 'absolute', left: 9, top: 6, bottom: 6, width: 2, backgroundColor: 'rgba(255,255,255,0.07)' },
  eventRow: { position: 'relative', marginBottom: 20, flexDirection: 'row' },
  eventRowUnread: { opacity: 1 },
  dot: { position: 'absolute', left: -30, top: 2, width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.bg, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dotInner: { width: 7, height: 7, borderRadius: 4 },
  eventContent: { flex: 1 },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eventTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  unreadIndicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accent },
  eventTime: { fontSize: 11.5, color: Colors.textMuted, fontFamily: 'monospace' },
  eventSub: { fontSize: 12.5, color: Colors.textDim, marginTop: 3, marginBottom: 5 },
  categoryChip: {},
  categoryText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  emptyState: { alignItems: 'center', padding: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  emptySubText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
