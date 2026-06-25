import React, { useRef, useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, KeyboardAvoidingView, Platform, StatusBar, Alert } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { useTheme, ThemeColors } from '../theme/ThemeContext';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setListening, addMessage } from '../store/slices/assistantSlice';
import { sendMessage } from '../services/assistantService';
import { addScene } from '../store/slices/scenesSlice';

export function AssistantScreen({ navigation }: any) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const dispatch = useAppDispatch();
  const messages = useAppSelector(s => s.assistant.messages);
  const isTyping = useAppSelector(s => s.assistant.isTyping);
  const isListening = useAppSelector(s => s.assistant.isListening);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, isTyping]);

  function handleSend() {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    dispatch(sendMessage(text) as any);
  }

  function handleCreateAutomation(when: string, then: string) {
    Alert.alert('Automation Created', `WHEN: ${when}\nTHEN: ${then}`);
  }

  function handleCreateScene(name: string) {
    const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    dispatch(addScene({ id, name, description: 'Custom scene', colorKey: 'accent', actions: [], deviceCount: 0 }));
    Alert.alert('Scene Created', `Scene "${name}" created! Go to Scenes to configure it.`);
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Svg width={19} height={19} viewBox="0 0 24 24"><Path d="m15 18-6-6 6-6" stroke={Colors.textSecondary} strokeWidth={2.2} strokeLinecap="round" fill="none" /></Svg>
        </TouchableOpacity>
        <View style={styles.ariaIcon}>
          <Svg width={20} height={20} viewBox="0 0 24 24"><Path d="M12 2 9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5Z" stroke="#fff" strokeWidth={2} strokeLinecap="round" fill="none" /></Svg>
        </View>
        <View>
          <Text style={styles.ariaName}>Aria</Text>
          <Text style={styles.ariaStatus}>● Connected · understands your home</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map(m => (
          <View key={m.id} style={[styles.msgWrap, m.role === 'user' && styles.msgWrapUser]}>
            {m.role === 'user' ? (
              <View style={styles.userBubble}>
                <Text style={styles.userText}>{m.text}</Text>
              </View>
            ) : (
              <View style={styles.assistantBubble}>
                <Text style={styles.assistantText}>{m.text}</Text>

                {m.actions && m.actions.length > 0 && (
                  <View style={{ gap: 8, marginTop: 12 }}>
                    {m.actions.map((a, j) => (
                      <View key={j} style={styles.actionRow}>
                        <View style={[styles.actionIcon, { backgroundColor: `${a.color}29` }]}>
                          <Svg width={13} height={13} viewBox="0 0 24 24"><Path d="M20 6 9 17l-5-5" stroke={a.color} strokeWidth={3} strokeLinecap="round" fill="none" /></Svg>
                        </View>
                        <Text style={styles.actionLabel}>{a.label}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {m.automation && (
                  <View style={styles.automationCard}>
                    <View style={styles.automationRow}>
                      <Text style={styles.whenTag}>WHEN</Text>
                      <Text style={styles.automationText}>{m.automation.when}</Text>
                    </View>
                    <View style={[styles.automationRow, { marginTop: 9 }]}>
                      <Text style={styles.thenTag}>THEN</Text>
                      <Text style={styles.automationText}>{m.automation.then}</Text>
                    </View>
                    <View style={styles.automationBtns}>
                      <TouchableOpacity
                        style={styles.createBtn}
                        onPress={() => handleCreateAutomation(m.automation!.when, m.automation!.then)}
                      >
                        <Text style={styles.createBtnText}>Create</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('Automation')}>
                        <Text style={styles.editBtnText}>Edit</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {m.canUndo && (
                  <TouchableOpacity style={styles.undoBtn}>
                    <Text style={styles.undoBtnText}>Undo</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        ))}

        {isTyping && (
          <View style={styles.msgWrap}>
            <View style={styles.assistantBubble}>
              <View style={styles.typingIndicator}>
                <View style={[styles.typingDot, { opacity: 0.4 }]} />
                <View style={[styles.typingDot, { opacity: 0.7 }]} />
                <View style={styles.typingDot} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick Suggestions */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestions} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {['Turn off all lights', 'Start Movie Mode', 'What\'s on?', 'Set AC to 22°', 'Run Sleep Mode'].map(s => (
          <TouchableOpacity key={s} style={styles.suggestionChip} onPress={() => { setInputText(s); }}>
            <Text style={styles.suggestionText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Ask Aria anything…"
          placeholderTextColor={Colors.textDim}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          multiline={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, inputText.trim().length > 0 && styles.sendBtnActive]}
          onPress={handleSend}
          disabled={inputText.trim().length === 0}
          activeOpacity={0.85}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24"><Path d="m22 2-7 20-4-9-9-4Z" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>
        </TouchableOpacity>
      </View>

      {/* Listening overlay */}
      {isListening && (
        <View style={styles.listeningOverlay}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => dispatch(setListening(false))}
            activeOpacity={0.8}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M18 6 6 18M6 6l12 12" stroke={Colors.textSecondary} strokeWidth={2.4} strokeLinecap="round" /></Svg>
          </TouchableOpacity>
          <View style={styles.pulseBg}>
            <View style={styles.micCircle}>
              <Svg width={40} height={40} viewBox="0 0 24 24"><Path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3ZM19 10v2a7 7 0 0 1-14 0v-2M12 19v3" stroke="#fff" strokeWidth={2} strokeLinecap="round" fill="none" /></Svg>
            </View>
          </View>
          <Text style={styles.listeningTitle}>Listening…</Text>
          <Text style={styles.listeningHint}>Say a command or tap to type</Text>
          <View style={styles.bars}>
            {[60, 100, 40, 80, 55, 90, 45].map((h, i) => (
              <View key={i} style={[styles.audioBar, { height: h * 0.34 }]} />
            ))}
          </View>
          <TouchableOpacity
            style={styles.stopListeningBtn}
            onPress={() => {
              dispatch(setListening(false));
              dispatch(sendMessage('Turn on the lights') as any);
            }}
          >
            <Text style={styles.stopListeningText}>Simulate Command</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 16, paddingTop: 10, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  ariaIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  ariaName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  ariaStatus: { fontSize: 11.5, color: Colors.success },
  messages: { flex: 1 },
  messagesContent: { padding: 16, gap: 12, paddingBottom: 8 },
  msgWrap: { alignItems: 'flex-start' },
  msgWrapUser: { alignItems: 'flex-end' },
  userBubble: { maxWidth: '80%', backgroundColor: Colors.accent, padding: 12, borderRadius: 20, borderBottomRightRadius: 6 },
  userText: { fontSize: 14.5, color: '#fff', lineHeight: 20 },
  assistantBubble: { maxWidth: '88%', backgroundColor: '#161618', borderWidth: 1, borderColor: Colors.border, padding: 14, borderRadius: 20, borderBottomLeftRadius: 6 },
  assistantText: { fontSize: 14, color: '#e8e8ee', lineHeight: 21 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.bg, borderRadius: 12, padding: 10 },
  actionIcon: { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 13, color: '#c8c8d0' },
  undoBtn: { marginTop: 8, borderWidth: 1, borderColor: 'rgba(255,107,107,0.3)', backgroundColor: 'rgba(255,107,107,0.08)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start' },
  undoBtnText: { fontSize: 12.5, fontWeight: '600', color: '#ff8a8a' },
  automationCard: { backgroundColor: Colors.bg, borderRadius: 14, padding: 13, marginTop: 12 },
  automationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  whenTag: { fontSize: 10, fontWeight: '700', color: Colors.accent, backgroundColor: Colors.accentSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  thenTag: { fontSize: 10, fontWeight: '700', color: Colors.success, backgroundColor: Colors.successSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  automationText: { fontSize: 12.5, color: '#c8c8d0', flex: 1 },
  automationBtns: { flexDirection: 'row', gap: 8, marginTop: 12 },
  createBtn: { flex: 1, backgroundColor: Colors.accent, borderRadius: 11, padding: 10, alignItems: 'center' },
  createBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  editBtn: { borderWidth: 1, borderColor: Colors.border, borderRadius: 11, paddingHorizontal: 16, paddingVertical: 10 },
  editBtnText: { fontSize: 13, fontWeight: '600', color: '#c8c8d0' },
  typingIndicator: { flexDirection: 'row', gap: 5, alignItems: 'center', padding: 4 },
  typingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.textMuted },
  suggestions: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)', paddingVertical: 10 },
  suggestionChip: { backgroundColor: Colors.surface, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: Colors.border },
  suggestionText: { fontSize: 12.5, color: Colors.textSecondary },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, paddingHorizontal: 16, paddingBottom: 26, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  textInput: { flex: 1, backgroundColor: '#161618', borderWidth: 1, borderColor: Colors.border, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 12, fontSize: 14, color: Colors.textPrimary },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  sendBtnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  listeningOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8,9,12,0.86)', alignItems: 'center', justifyContent: 'center', gap: 24 },
  closeBtn: { position: 'absolute', top: 60, right: 26, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  pulseBg: { width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(91,140,255,0.4)', alignItems: 'center', justifyContent: 'center' },
  micCircle: { width: 108, height: 108, borderRadius: 54, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  listeningTitle: { fontSize: 22, fontWeight: '600', color: Colors.textPrimary },
  listeningHint: { fontSize: 14, color: '#9696a0', marginTop: -10 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 34 },
  audioBar: { width: 4, backgroundColor: Colors.accent, borderRadius: 3 },
  stopListeningBtn: { backgroundColor: Colors.surface, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border },
  stopListeningText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
});
