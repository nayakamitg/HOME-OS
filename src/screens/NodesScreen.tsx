import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme, ThemeColors } from '../theme/ThemeContext';
import { NodesApi } from '../api/resources';
import { BackendNode } from '../api/types';

export function NodesScreen({ navigation }: any) {
  const Colors = useTheme();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const [nodes, setNodes] = useState<BackendNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await NodesApi.list();
      setNodes(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load nodes');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // All nearby (announced) nodes are always listed; group by relationship.
  const unclaimed = nodes.filter((n) => !n.homeId);
  const mine = nodes.filter((n) => n.homeId && n.ownedByMe);
  const shared = nodes.filter((n) => n.homeId && !n.ownedByMe && n.sharedWithMe);
  const others = nodes.filter((n) => n.homeId && !n.ownedByMe && !n.sharedWithMe);

  const renderNode = (n: BackendNode) => {
    const locked = !!n.homeId && !n.ownedByMe && !n.sharedWithMe;
    return (
      <TouchableOpacity
        key={n.id}
        style={[styles.card, locked && { opacity: 0.6 }]}
        activeOpacity={0.85}
        onPress={() =>
          locked
            ? Alert.alert(
                'In use by another user',
                `"${n.name}" is paired to ${n.ownerName ?? 'another user'}. Ask them to assign it to you (Node → Shared access) to use its free pins.`,
              )
            : navigation.navigate('NodeDetail', { nodeId: n.id })
        }
      >
        <View style={[styles.statusDot, { backgroundColor: n.online ? Colors.success : Colors.textMuted }]} />
        <View style={styles.chipIcon}>
          <Svg width={22} height={22} viewBox="0 0 24 24">
            <Path d="M9 3H4a1 1 0 0 0-1 1v5M15 3h5a1 1 0 0 1 1 1v5M9 21H4a1 1 0 0 1-1-1v-5M15 21h5a1 1 0 0 1 1-1v-5" stroke={Colors.accent} strokeWidth={1.9} strokeLinecap="round" fill="none" />
            <Path d="M8 8h8v8H8z" stroke={Colors.accent} strokeWidth={1.9} fill="none" />
          </Svg>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.nodeName}>{n.name}</Text>
          <Text style={styles.nodeSub}>
            {n.id} · {n.online ? 'Online' : 'Offline'}
            {n._count ? ` · ${n._count.devices} device${n._count.devices === 1 ? '' : 's'}` : ''}
            {locked && n.ownerName ? ` · ${n.ownerName}` : ''}
          </Text>
        </View>
        {!n.homeId && <Text style={styles.newTag}>NEW</Text>}
        {n.sharedWithMe && !n.ownedByMe && <Text style={styles.sharedTag}>SHARED</Text>}
        {locked ? (
          <Svg width={16} height={16} viewBox="0 0 24 24"><Path d="M5 11h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2ZM8 11V7a4 4 0 0 1 8 0v4" stroke={Colors.textMuted} strokeWidth={1.9} fill="none" /></Svg>
        ) : (
          <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="m9 18 6-6-6-6" stroke={Colors.textMuted} strokeWidth={2} strokeLinecap="round" fill="none" /></Svg>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        {navigation.canGoBack() ? (
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Svg width={19} height={19} viewBox="0 0 24 24"><Path d="m15 18-6-6 6-6" stroke={Colors.textSecondary} strokeWidth={2.2} strokeLinecap="round" fill="none" /></Svg>
          </TouchableOpacity>
        ) : <View style={styles.backBtn} />}
        <Text style={styles.title}>Nodes</Text>
        <TouchableOpacity style={styles.backBtn} onPress={load}>
          <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M23 4v6h-6M1 20v-6h6" stroke={Colors.textSecondary} strokeWidth={2} strokeLinecap="round" fill="none" /><Path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" stroke={Colors.textSecondary} strokeWidth={2} strokeLinecap="round" fill="none" /></Svg>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.accent} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={Colors.accent} />}
        >
          {error && <Text style={styles.error}>{error}</Text>}

          {unclaimed.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>NEW · TAP TO SET UP</Text>
              {unclaimed.map(renderNode)}
              <View style={{ height: 18 }} />
            </>
          )}

          <Text style={styles.sectionLabel}>YOUR NODES ({mine.length})</Text>
          {nodes.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No nodes yet</Text>
              <Text style={styles.emptySub}>Flash & power on an ESP32 — it appears here automatically once it connects.</Text>
            </View>
          )}
          {mine.map(renderNode)}

          {shared.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 18 }]}>SHARED WITH YOU ({shared.length})</Text>
              {shared.map(renderNode)}
            </>
          )}

          {others.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 18 }]}>NEARBY · IN USE ({others.length})</Text>
              {others.map(renderNode)}
            </>
          )}

          <View style={styles.hintCard}>
            <Svg width={18} height={18} viewBox="0 0 24 24"><Circle cx={12} cy={12} r={10} stroke={Colors.accent} strokeWidth={1.8} fill="none" /><Path d="M12 16v-4M12 8h.01" stroke={Colors.accent} strokeWidth={1.9} strokeLinecap="round" /></Svg>
            <Text style={styles.hintText}>A node is an ESP32 board. Open one to allocate its GPIO pins to devices.</Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 60 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 12 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  chipIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: Colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  nodeName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  nodeSub: { fontSize: 11.5, color: Colors.textDim, marginTop: 2 },
  newTag: { fontSize: 10, fontWeight: '700', color: Colors.accent, backgroundColor: Colors.accentSoft, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  sharedTag: { fontSize: 10, fontWeight: '700', color: Colors.success, backgroundColor: 'rgba(61,220,151,0.14)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  error: { color: Colors.warning, fontSize: 13, marginBottom: 12 },
  empty: { alignItems: 'center', padding: 30, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },
  emptySub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  hintCard: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: Colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, marginTop: 20 },
  hintText: { flex: 1, fontSize: 12.5, color: Colors.textDim, lineHeight: 18 },
});
