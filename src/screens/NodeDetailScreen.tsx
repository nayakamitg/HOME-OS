import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme, ThemeColors } from '../theme/ThemeContext';
import { useAppSelector } from '../store/hooks';
import { Toggle } from '../components/Toggle';
import { NodesApi, DevicesApi } from '../api/resources';
import { BackendNodeDetail, PinMapEntry, BackendDeviceType, BackendNodeShare } from '../api/types';

const TYPE_LABEL: Record<BackendDeviceType, string> = {
  LIGHT: 'Light', FAN: 'Fan', AC: 'AC', PROJECTOR: 'Projector', TV: 'TV',
  RGB_LIGHT: 'RGB', SENSOR: 'Sensor', SMART_PLUG: 'Plug', GENERIC: 'Generic',
};

export function NodeDetailScreen({ navigation, route }: any) {
  const Colors = useTheme();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const { nodeId } = route.params as { nodeId: string };
  const activeHomeId = useAppSelector((s) => s.auth.activeHomeId);

  const [node, setNode] = useState<BackendNodeDetail | null>(null);
  const [pins, setPins] = useState<PinMapEntry[]>([]);
  const [power, setPower] = useState<Record<string, boolean>>({});
  const [shares, setShares] = useState<BackendNodeShare[]>([]);
  const [shareEmail, setShareEmail] = useState('');
  const [sharing, setSharing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [pairing, setPairing] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const pairTimer = useRef<any>(null);

  const load = useCallback(async () => {
    try {
      const [n, p] = await Promise.all([NodesApi.get(nodeId), NodesApi.pins(nodeId)]);
      setNode(n);
      setPins(p);
      setNameDraft(n.name);
      // Live status comes with the node payload (reported power per device).
      const map: Record<string, boolean> = {};
      n.devices.forEach((d) => { map[d.id] = !!d.on; });
      setPower(map);
      if (n.ownedByMe) {
        try { setShares(await NodesApi.shares(nodeId)); } catch { /* non-fatal */ }
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to load node');
    } finally {
      setLoading(false);
    }
  }, [nodeId]);

  /** Silent refresh so device on/off status stays live while the screen is open. */
  const refreshLive = useCallback(async () => {
    try {
      const n = await NodesApi.get(nodeId);
      setNode(n);
      const map: Record<string, boolean> = {};
      n.devices.forEach((d) => { map[d.id] = !!d.on; });
      setPower(map);
    } catch { /* keep last known state */ }
  }, [nodeId]);

  useFocusEffect(useCallback(() => {
    load();
    const t = setInterval(refreshLive, 4000);
    return () => clearInterval(t);
  }, [load, refreshLive]));

  async function saveName() {
    setEditingName(false);
    if (!node || !nameDraft.trim() || nameDraft === node.name) return;
    try {
      await NodesApi.update(nodeId, { name: nameDraft.trim() });
      setNode({ ...node, name: nameDraft.trim() });
    } catch (e: any) { Alert.alert('Error', e?.message); }
  }

  function stopPair() {
    if (pairTimer.current) { clearInterval(pairTimer.current); pairTimer.current = null; }
    setPairing(false);
  }
  useEffect(() => () => stopPair(), []);

  async function startPair() {
    if (!activeHomeId) { Alert.alert('No home', 'Log in / select a home first.'); return; }
    try {
      const { ttl } = await NodesApi.pairStart(nodeId, activeHomeId);
      let left = ttl;
      setSecondsLeft(left);
      setPairing(true);
      pairTimer.current = setInterval(async () => {
        left -= 1;
        setSecondsLeft(left);
        try {
          const { state } = await NodesApi.pairStatus(nodeId);
          if (state === 'paired') { stopPair(); Alert.alert('Paired ✓', 'This node is now linked to your account.'); load(); return; }
        } catch { /* keep polling */ }
        if (left <= 0) { stopPair(); Alert.alert('Not paired', 'BOOT button was not pressed in time. Try again.'); }
      }, 1000);
    } catch (e: any) { Alert.alert('Error', e?.message); }
  }

  async function toggleDevice(id: string) {
    const next = !power[id];
    setPower((p) => ({ ...p, [id]: next }));
    try { await DevicesApi.command(id, { power: next }); }
    catch (e: any) { setPower((p) => ({ ...p, [id]: !next })); Alert.alert('Error', e?.message); }
  }

  async function assignUser() {
    const email = shareEmail.trim().toLowerCase();
    if (!email) return;
    setSharing(true);
    try {
      setShares(await NodesApi.addShare(nodeId, email));
      setShareEmail('');
    } catch (e: any) { Alert.alert('Could not assign', e?.message ?? 'Unknown error'); }
    finally { setSharing(false); }
  }

  function unassignUser(s: BackendNodeShare) {
    Alert.alert('Unassign user', `Remove ${s.name}'s access to this node? Their devices keep their pins until they delete them.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Unassign', style: 'destructive', onPress: async () => {
          try { setShares(await NodesApi.removeShare(nodeId, s.userId)); }
          catch (e: any) { Alert.alert('Error', e?.message); }
        } },
    ]);
  }

  function confirmRemoveDevice(id: string, name: string) {
    Alert.alert('Remove device', `Remove "${name}"? This frees its pin.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
          try { await DevicesApi.remove(id); load(); } catch (e: any) { Alert.alert('Error', e?.message); }
        } },
    ]);
  }

  function confirmRemoveNode() {
    Alert.alert('Remove node', `Remove "${node?.name}"? Frees all its pins.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
          try { await NodesApi.remove(nodeId); navigation.goBack(); } catch (e: any) { Alert.alert('Error', e?.message); }
        } },
    ]);
  }

  function pinColor(p: PinMapEntry): string {
    if (p.allocated) return Colors.accent;
    if (!p.selectable || p.capability.reserved) return Colors.textMuted;
    if (p.capability.inputOnly) return Colors.purple;
    return Colors.success;
  }

  if (loading || !node) {
    return <View style={[styles.screen, styles.center]}><ActivityIndicator color={Colors.accent} /></View>;
  }

  const freeOutputs = pins.filter((p) => p.selectable && p.capability.output && !p.allocated).length;
  const isOwner = !!node.ownedByMe;
  const isSharedGuest = !!node.sharedWithMe && !isOwner;
  const canManage = isOwner || !node.homeId; // rename/remove: owner, or anyone while unclaimed

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Svg width={19} height={19} viewBox="0 0 24 24"><Path d="m15 18-6-6 6-6" stroke={Colors.textSecondary} strokeWidth={2.2} strokeLinecap="round" fill="none" /></Svg>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{node.name}</Text>
        {canManage ? (
          <TouchableOpacity style={styles.iconBtn} onPress={confirmRemoveNode}>
            <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" stroke={Colors.warning} strokeWidth={1.9} strokeLinecap="round" fill="none" /></Svg>
          </TouchableOpacity>
        ) : <View style={styles.iconBtn} />}
      </View>

      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={Colors.accent} />}>
        {/* Node info card */}
        <View style={styles.infoCard}>
          <View style={styles.infoTop}>
            <View style={[styles.statusDot, { backgroundColor: node.online ? Colors.success : Colors.textMuted }]} />
            {editingName && canManage ? (
              <TextInput
                style={styles.nameInput}
                value={nameDraft}
                onChangeText={setNameDraft}
                autoFocus
                onBlur={saveName}
                onSubmitEditing={saveName}
                placeholderTextColor={Colors.textMuted}
              />
            ) : (
              <TouchableOpacity style={{ flex: 1 }} disabled={!canManage} onPress={() => setEditingName(true)}>
                <Text style={styles.infoName}>{node.name}{canManage ? '  ✎' : ''}</Text>
              </TouchableOpacity>
            )}
            {isSharedGuest && <Text style={styles.sharedBadge}>SHARED</Text>}
          </View>
          <Text style={styles.infoMeta}>ID {node.id}</Text>
          {isSharedGuest && node.ownerName && (
            <Text style={styles.infoMeta}>Owner: {node.ownerName} · you can use the free pins</Text>
          )}
          <Text style={styles.infoMeta}>{node.board} · fw {node.firmware ?? '?'} · {node.ip ?? 'no ip'}</Text>
          <Text style={styles.infoMeta}>{node.online ? 'Online' : 'Offline'} · config v{node.configVersion} · {freeOutputs} pins free</Text>
          {!node.homeId && (
            <TouchableOpacity style={styles.claimBtn} onPress={startPair}>
              <Text style={styles.claimBtnText}>Pair this node</Text>
            </TouchableOpacity>
          )}
        </View>

        {!node.homeId && (
          <View style={styles.lockedCard}>
            <Svg width={20} height={20} viewBox="0 0 24 24"><Path d="M5 11h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2ZM8 11V7a4 4 0 0 1 8 0v4" stroke={Colors.textMuted} strokeWidth={1.9} fill="none" /></Svg>
            <Text style={styles.lockedText}>Pair this node (press its BOOT button) to configure its pins & devices.</Text>
          </View>
        )}

        {node.homeId ? (<>
        {/* Devices */}
        <View style={styles.rowBetween}>
          <Text style={styles.sectionLabel}>DEVICES ({node.devices.length})</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AddNodeDevice', { nodeId })}>
            <Text style={styles.addLink}>+ Add</Text>
          </TouchableOpacity>
        </View>
        {node.devices.length === 0 && <Text style={styles.dim}>No devices yet. Add one and pick a free pin.</Text>}
        {node.devices.map((d) => {
          const on = !!power[d.id];
          return (
            <View key={d.id} style={styles.devRow}>
              <View style={styles.pinBadge}><Text style={styles.pinBadgeText}>D{d.gpioPin}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.devName}>{d.name}</Text>
                <Text style={styles.devSub}>
                  {TYPE_LABEL[d.deviceType]} · GPIO {d.gpioPin}
                  {d.mine === false && d.ownerName ? ` · ${d.ownerName}` : ` · ${d.activeHigh ? 'active-high' : 'active-low'}`}
                </Text>
              </View>
              {d.mine !== false ? (
                <>
                  <TouchableOpacity onPress={() => confirmRemoveDevice(d.id, d.name)} style={{ padding: 6 }}>
                    <Svg width={16} height={16} viewBox="0 0 24 24"><Path d="M18 6 6 18M6 6l12 12" stroke={Colors.textMuted} strokeWidth={2} strokeLinecap="round" /></Svg>
                  </TouchableOpacity>
                  <Toggle value={on} onToggle={() => toggleDevice(d.id)} activeColor={Colors.accent} />
                </>
              ) : (
                // Someone else's device: live on/off status only, no control.
                <View style={[styles.livePill, { backgroundColor: on ? 'rgba(61,220,151,0.14)' : Colors.bg }]}>
                  <View style={[styles.liveDot, { backgroundColor: on ? Colors.success : Colors.textMuted }]} />
                  <Text style={[styles.livePillText, { color: on ? Colors.success : Colors.textMuted }]}>{on ? 'ON' : 'OFF'}</Text>
                </View>
              )}
            </View>
          );
        })}

        {/* Shared access (owner only) */}
        {isOwner && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 22 }]}>SHARED ACCESS ({shares.length})</Text>
            <Text style={styles.dim}>Assigned users can bind their own devices to this node's free pins. Pins already in use stay locked.</Text>
            {shares.map((s) => (
              <View key={s.userId} style={styles.shareRow}>
                <View style={styles.shareAvatar}><Text style={styles.shareAvatarText}>{s.name.charAt(0).toUpperCase()}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.devName}>{s.name}</Text>
                  <Text style={styles.devSub}>{s.email}</Text>
                </View>
                <TouchableOpacity onPress={() => unassignUser(s)} style={{ padding: 6 }}>
                  <Svg width={16} height={16} viewBox="0 0 24 24"><Path d="M18 6 6 18M6 6l12 12" stroke={Colors.warning} strokeWidth={2} strokeLinecap="round" /></Svg>
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.shareInputRow}>
              <TextInput
                style={styles.shareInput}
                value={shareEmail}
                onChangeText={setShareEmail}
                placeholder="user@email.com"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                onSubmitEditing={assignUser}
              />
              <TouchableOpacity
                style={[styles.shareBtn, (!shareEmail.trim() || sharing) && { opacity: 0.5 }]}
                disabled={!shareEmail.trim() || sharing}
                onPress={assignUser}
              >
                {sharing ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.shareBtnText}>Assign</Text>}
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Pin map */}
        <Text style={[styles.sectionLabel, { marginTop: 22 }]}>PIN MAP</Text>
        <View style={styles.legendRow}>
          <Legend color={Colors.accent} label="Allocated" Colors={Colors} />
          <Legend color={Colors.success} label="Free (output)" Colors={Colors} />
          <Legend color={Colors.purple} label="Input-only" Colors={Colors} />
          <Legend color={Colors.textMuted} label="Reserved" Colors={Colors} />
        </View>
        <View style={styles.pinGrid}>
          {pins.map((p) => {
            const free = p.selectable && p.capability.output && !p.allocated;
            return (
              <TouchableOpacity
                key={p.gpio}
                disabled={!free}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('AddNodeDevice', { nodeId, gpio: p.gpio })}
                style={[styles.pinCell, { borderColor: pinColor(p) }, p.allocated && { backgroundColor: Colors.accentSoft }]}
              >
                <Text style={[styles.pinNum, { color: pinColor(p) }]}>{p.gpio}</Text>
                <Text style={styles.pinRole} numberOfLines={1}>
                  {p.allocated ? p.deviceName : p.capability.reserved ? '—' : p.capability.inputOnly ? 'in' : 'free'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        </>) : null}

        {canManage && (
          <TouchableOpacity style={styles.removeBtn} onPress={confirmRemoveNode}>
            <Svg width={17} height={17} viewBox="0 0 24 24"><Path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" stroke={Colors.warning} strokeWidth={1.9} strokeLinecap="round" fill="none" /></Svg>
            <Text style={styles.removeBtnText}>Remove node</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {pairing && (
        <View style={styles.overlay}>
          <View style={styles.pairCard}>
            <View style={styles.pairPulse}>
              <Svg width={40} height={40} viewBox="0 0 24 24"><Circle cx={12} cy={12} r={4} stroke={Colors.accent} strokeWidth={2} fill="none" /><Path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke={Colors.accent} strokeWidth={2} strokeLinecap="round" /></Svg>
            </View>
            <Text style={styles.pairTitle}>Hold the BOOT button</Text>
            <Text style={styles.pairSub}>On your ESP32, press &amp; HOLD the BOOT (IO0) button for 5 seconds to prove it's physically yours.</Text>
            <Text style={styles.pairCountdown}>{secondsLeft}s</Text>
            <TouchableOpacity style={styles.pairCancel} onPress={stopPair}>
              <Text style={styles.pairCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

function Legend({ color, label, Colors }: { color: string; label: string; Colors: ThemeColors }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 9, height: 9, borderRadius: 3, borderWidth: 2, borderColor: color }} />
      <Text style={{ fontSize: 10.5, color: Colors.textDim }}>{label}</Text>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 10, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  iconBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 17, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' },
  content: { padding: 20, paddingBottom: 60 },
  infoCard: { backgroundColor: Colors.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 22 },
  infoTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  infoName: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  nameInput: { flex: 1, fontSize: 17, fontWeight: '600', color: Colors.textPrimary, borderBottomWidth: 1, borderBottomColor: Colors.accent, paddingVertical: 2 },
  infoMeta: { fontSize: 12, color: Colors.textDim, marginTop: 3 },
  claimBtn: { marginTop: 12, backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  claimBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 12 },
  addLink: { fontSize: 13, fontWeight: '700', color: Colors.accent },
  dim: { fontSize: 13, color: Colors.textMuted, marginBottom: 8 },
  devRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  pinBadge: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  pinBadgeText: { fontSize: 12, fontWeight: '700', color: Colors.accent },
  devName: { fontSize: 14.5, fontWeight: '600', color: Colors.textPrimary },
  devSub: { fontSize: 11.5, color: Colors.textDim, marginTop: 2 },
  sharedBadge: { fontSize: 10, fontWeight: '700', color: Colors.success, backgroundColor: 'rgba(61,220,151,0.14)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  livePillText: { fontSize: 11, fontWeight: '700' },
  shareRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  shareAvatar: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  shareAvatarText: { fontSize: 14, fontWeight: '700', color: Colors.accent },
  shareInputRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  shareInput: { flex: 1, backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13.5, color: Colors.textPrimary },
  shareBtn: { backgroundColor: Colors.accent, borderRadius: 12, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  shareBtnText: { color: '#fff', fontWeight: '700', fontSize: 13.5 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 14 },
  pinGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pinCell: { width: '17.5%', aspectRatio: 1, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', gap: 2 },
  pinNum: { fontSize: 15, fontWeight: '700' },
  pinRole: { fontSize: 8.5, color: Colors.textMuted, maxWidth: '90%' },
  lockedCard: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' },
  lockedText: { flex: 1, fontSize: 13, color: Colors.textDim, lineHeight: 19 },
  removeBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 30, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: Colors.border },
  removeBtnText: { fontSize: 14, fontWeight: '600', color: Colors.warning },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 30 },
  pairCard: { width: '100%', backgroundColor: Colors.surface, borderRadius: 22, padding: 26, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  pairPulse: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  pairTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  pairSub: { fontSize: 13.5, color: Colors.textDim, textAlign: 'center', lineHeight: 20 },
  pairCountdown: { fontSize: 34, fontWeight: '800', color: Colors.accent, marginVertical: 16 },
  pairCancel: { paddingHorizontal: 24, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  pairCancelText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
});
