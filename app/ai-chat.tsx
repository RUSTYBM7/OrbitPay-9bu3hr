import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSupabaseClient } from '@/template';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { useWallet } from '../hooks/useWallet';
import { Colors, Spacing, FontSize, FontWeight, Radius, Shadow } from '../constants/theme';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  loading?: boolean;
}

const SUGGESTED_PROMPTS = [
  "What's my current balance?",
  "How can I improve my spending?",
  "Explain my crypto portfolio",
  "What are the best savings goals?",
  "How do I send money internationally?",
  "What's my spending this month?",
];

export default function AIChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, activeWallet, totalCryptoValue, totalInvestmentValue, transactions } = useWallet();
  const supabase = getSupabaseClient();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: `Hello ${user.firstName}! I'm your OrbitPay AI Banking Assistant. I can help you with your finances, spending insights, crypto portfolio, and more. What would you like to know?`,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    const loadingMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      loading: true,
    };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const history = messages.slice(-8).map(m => ({
        role: m.role,
        content: m.content,
      }));
      history.push({ role: 'user', content: text.trim() });

      const userContext = {
        name: user.name,
        firstName: user.firstName,
        tier: user.tier,
        primaryBalance: `${activeWallet.symbol}${activeWallet.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${activeWallet.currency}`,
        cryptoValue: totalCryptoValue.toFixed(2),
        investmentValue: totalInvestmentValue.toFixed(2),
        recentTxCount: transactions.length,
        kycStatus: user.kyc,
      };

      // Use fetch for streaming
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token ?? '';

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/ai-banking-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ messages: history, userContext }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Request failed');
      }

      let fullContent = '';

      const reader = response.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') break;
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content ?? '';
                if (delta) {
                  fullContent += delta;
                  setMessages(prev => prev.map(m =>
                    m.loading ? { ...m, content: fullContent, loading: false } : m
                  ));
                }
              } catch { /* ignore parse errors */ }
            }
          }
        }
      } else {
        // Fallback: non-streaming
        const data = await response.json();
        fullContent = data.choices?.[0]?.message?.content ?? 'I encountered an issue. Please try again.';
        setMessages(prev => prev.map(m =>
          m.loading ? { ...m, content: fullContent, loading: false } : m
        ));
      }

      if (!fullContent) {
        setMessages(prev => prev.map(m =>
          m.loading ? { ...m, content: "I'm sorry, I couldn't process that request. Please try again.", loading: false } : m
        ));
      }

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      setMessages(prev => prev.map(m =>
        m.loading ? {
          ...m,
          content: `I'm having trouble connecting right now. Please try again in a moment. (${errMsg.slice(0, 60)})`,
          loading: false,
        } : m
      ));
    } finally {
      setIsTyping(false);
    }
  }, [messages, isTyping, user, activeWallet, totalCryptoValue, totalInvestmentValue, transactions, supabase]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAI]}>
        {!isUser && (
          <View style={styles.aiAvatar}>
            <MaterialIcons name="smart-toy" size={18} color={Colors.textOnDark} />
          </View>
        )}
        <View style={[styles.msgBubble, isUser ? styles.msgBubbleUser : styles.msgBubbleAI]}>
          {item.loading ? (
            <View style={styles.typingIndicator}>
              <View style={[styles.typingDot, styles.typingDot1]} />
              <View style={[styles.typingDot, styles.typingDot2]} />
              <View style={[styles.typingDot, styles.typingDot3]} />
            </View>
          ) : (
            <Text style={[styles.msgText, isUser ? styles.msgTextUser : styles.msgTextAI]}>
              {item.content}
            </Text>
          )}
          <Text style={[styles.msgTime, isUser ? styles.msgTimeUser : styles.msgTimeAI]}>
            {item.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {isUser && (
          <View style={styles.userAvatar}>
            <MaterialIcons name="person" size={16} color={Colors.primary} />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.primary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.headerAIIcon}>
            <MaterialIcons name="smart-toy" size={20} color={Colors.textOnDark} />
          </View>
          <View>
            <Text style={styles.headerTitle}>AI Banking Assistant</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online · Powered by Gemini</Text>
            </View>
          </View>
        </View>
        <Pressable
          style={styles.clearBtn}
          onPress={() => setMessages([{
            id: '0',
            role: 'assistant',
            content: `Hello ${user.firstName}! How can I help you with your finances today?`,
            timestamp: new Date(),
          }])}
          hitSlop={8}
        >
          <MaterialIcons name="refresh" size={20} color={Colors.textMuted} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          ListFooterComponent={() => (
            messages.length === 1 ? (
              <View style={styles.suggestionsWrap}>
                <Text style={styles.suggestionsTitle}>Try asking:</Text>
                <View style={styles.suggestions}>
                  {SUGGESTED_PROMPTS.map(prompt => (
                    <Pressable
                      key={prompt}
                      style={styles.suggestionChip}
                      onPress={() => sendMessage(prompt)}
                    >
                      <Text style={styles.suggestionText}>{prompt}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null
          )}
        />

        {/* Input Bar */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + Spacing.sm }]}>
          {/* Context pill */}
          <View style={styles.contextPill}>
            <MaterialIcons name="account-balance-wallet" size={12} color={Colors.primary} />
            <Text style={styles.contextText}>
              {activeWallet.symbol}{activeWallet.amount.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </Text>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask about your finances…"
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={500}
              onSubmitEditing={() => sendMessage(inputText)}
              accessibilityLabel="Chat input"
              returnKeyType="send"
              blurOnSubmit
            />
            <Pressable
              style={[styles.sendBtn, (!inputText.trim() || isTyping) && styles.sendBtnDisabled]}
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim() || isTyping}
              accessibilityLabel="Send message"
            >
              {isTyping ? (
                <ActivityIndicator color={Colors.textOnDark} size="small" />
              ) : (
                <MaterialIcons name="send" size={20} color={Colors.textOnDark} />
              )}
            </Pressable>
          </View>

          <Text style={styles.disclaimer}>
            AI responses are for informational purposes only. Not financial advice.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: Radius.circle, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center', ...Shadow.sm,
  },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginLeft: Spacing.sm },
  headerAIIcon: {
    width: 40, height: 40, borderRadius: Radius.circle, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.success },
  onlineText: { fontSize: FontSize.xs, color: Colors.textMuted },
  clearBtn: { padding: Spacing.sm },
  messageList: { padding: Spacing.base, paddingBottom: Spacing.md },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: Spacing.md, gap: Spacing.sm },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowAI: { justifyContent: 'flex-start' },
  aiAvatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  userAvatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    borderWidth: 1, borderColor: Colors.border,
  },
  msgBubble: { maxWidth: '78%', borderRadius: Radius.xl, padding: Spacing.md },
  msgBubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  msgBubbleAI: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    ...Shadow.sm,
  },
  msgText: { fontSize: FontSize.base, lineHeight: 22 },
  msgTextUser: { color: Colors.textOnDark },
  msgTextAI: { color: Colors.textPrimary },
  msgTime: { fontSize: 10, marginTop: 4 },
  msgTimeUser: { color: 'rgba(255,255,255,0.6)', textAlign: 'right' },
  msgTimeAI: { color: Colors.textMuted },
  typingIndicator: { flexDirection: 'row', gap: 4, padding: Spacing.xs },
  typingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, opacity: 0.4 },
  typingDot1: { opacity: 0.8 },
  typingDot2: { opacity: 0.5 },
  typingDot3: { opacity: 0.3 },
  suggestionsWrap: { marginTop: Spacing.md },
  suggestionsTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textMuted, marginBottom: Spacing.sm },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  suggestionChip: {
    backgroundColor: Colors.surface, borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md, paddingVertical: 9,
    borderWidth: 1, borderColor: Colors.border,
  },
  suggestionText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.medium },
  inputBar: {
    backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.divider,
    paddingHorizontal: Spacing.base, paddingTop: Spacing.sm,
  },
  contextPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    backgroundColor: Colors.background, borderRadius: Radius.pill,
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: Spacing.xs,
    borderWidth: 1, borderColor: Colors.border,
  },
  contextText: { fontSize: 10, color: Colors.primary, fontWeight: FontWeight.semibold },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
  },
  input: {
    flex: 1, backgroundColor: Colors.background, borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSize.base, color: Colors.textPrimary, maxHeight: 100,
    borderWidth: 1, borderColor: Colors.border, includeFontPadding: false,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: Radius.circle,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    ...Shadow.sm,
  },
  sendBtnDisabled: { backgroundColor: Colors.border },
  disclaimer: {
    fontSize: 9, color: Colors.textMuted, textAlign: 'center',
    marginTop: Spacing.xs, lineHeight: 13,
  },
});
