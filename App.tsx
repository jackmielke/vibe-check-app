import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useFonts } from 'expo-font';
// Per-weight imports: the package roots require() every weight, so importing
// from them ships fonts the app never renders.
import { Syne_700Bold } from '@expo-google-fonts/syne/700Bold';
import { Syne_800ExtraBold } from '@expo-google-fonts/syne/800ExtraBold';
import { InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif/400Regular_Italic';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Atmosphere } from './src/components/Atmosphere';
import { LockedFeed } from './src/components/LockedFeed';
import { VibeCamera, type Shot } from './src/components/VibeCamera';
import { isUnlocked } from './src/social/gate';
import { ThemeProvider, useTheme } from './src/themes/ThemeContext';
import { themeOrder, themes, type Theme } from './src/themes';
import { analyzingLines } from './src/vibe/copy';
import { analyzeVibeAsync } from './src/vibe/engine';
import type { VibeResult } from './src/vibe/types';
import {
  blockUser,
  deleteVibe,
  fetchFeed,
  reportVibe,
  shareVibe,
  timeAgo,
  type FeedItem,
  type ShareOutcome,
} from './src/social/api';

type Screen = 'home' | 'camera' | 'analyzing' | 'result' | 'feed';
type ShareState = 'idle' | 'sharing' | ShareOutcome;

const shareLabels: Record<ShareState, string> = {
  idle: 'Share to the feed',
  sharing: 'Sharing…',
  shared: 'On the feed',
  offline: 'Feed is offline',
  'auth-unavailable': 'Feed opens soon',
  failed: 'Couldn’t share — try again',
};

/** Each theme gets its own voice for the same moments. */
const tagline: Record<string, string> = {
  field: 'Snap a selfie. Get a score. Leave with a story.',
  real: 'One selfie. One score. No filter.',
  neo: 'Take a selfie and let the light do the judging.',
  meme: 'take selfie. get judged. cope.',
};

const scoreCaption: Record<string, string> = {
  field: 'out of 100',
  real: 'out of 100',
  neo: 'out of 100',
  meme: '/100 lmao',
};

export default function App() {
  return (
    <ThemeProvider>
      <VibeApp />
    </ThemeProvider>
  );
}

function VibeApp() {
  const { theme, themeId, setThemeId } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [screen, setScreen] = useState<Screen>('home');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [result, setResult] = useState<VibeResult | null>(null);
  const [analyzeCopy, setAnalyzeCopy] = useState(analyzingLines()[0]!);
  const [busy, setBusy] = useState(false);
  const [shareState, setShareState] = useState<ShareState>('idle');
  const [feed, setFeed] = useState<FeedItem[] | null>(null);
  const [feedLoading, setFeedLoading] = useState(false);

  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandY = useRef(new Animated.Value(28)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const scoreScale = useRef(new Animated.Value(0.7)).current;
  const scoreOpacity = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    Syne_700Bold,
    Syne_800ExtraBold,
    InstrumentSerif_400Regular_Italic,
  });

  useEffect(() => {
    if (!fontsLoaded) return;
    Animated.stagger(140, [
      Animated.parallel([
        Animated.timing(brandOpacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(brandY, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fontsLoaded, brandOpacity, brandY, contentOpacity]);

  useEffect(() => {
    if (screen !== 'analyzing') return;
    const lines = analyzingLines();
    let i = 0;
    setAnalyzeCopy(lines[0]!);
    const id = setInterval(() => {
      i = (i + 1) % lines.length;
      setAnalyzeCopy(lines[i]!);
    }, 700);
    return () => clearInterval(id);
  }, [screen]);

  useEffect(() => {
    if (screen !== 'result' || !result) return;
    scoreScale.setValue(0.7);
    scoreOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(scoreScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scoreOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [screen, result, scoreScale, scoreOpacity]);

  // Both the in-app camera and the library picker feed this, so it takes only
  // the fields the scoring engine reads rather than a picker-shaped asset.
  const runCheck = useCallback(
    async (asset: {
      uri: string;
      width?: number | null;
      height?: number | null;
      fileSize?: number | null;
    }) => {
      setBusy(true);
      setShareState('idle');
      setPhotoUri(asset.uri);
      setScreen('analyzing');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const vibe = await analyzeVibeAsync({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        fileSize: asset.fileSize,
      });

      setResult(vibe);
      setScreen('result');
      setBusy(false);
    },
    []
  );

  const takeSelfie = useCallback(() => {
    if (busy) return;
    Haptics.selectionAsync();
    setScreen('camera');
  }, [busy]);

  const onCaptured = useCallback(
    async (shot: Shot) => {
      await runCheck({ uri: shot.uri, width: shot.width, height: shot.height });
    },
    [runCheck]
  );

  const choosePhoto = useCallback(async () => {
    if (busy) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    const pick = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
    });
    if (!pick.canceled && pick.assets[0]) await runCheck(pick.assets[0]);
  }, [busy, runCheck]);

  const reset = useCallback(() => {
    Haptics.selectionAsync();
    setResult(null);
    setPhotoUri(null);
    setShareState('idle');
    setScreen('home');
  }, []);

  const share = useCallback(async () => {
    if (!result || shareState === 'sharing' || shareState === 'shared') return;
    setShareState('sharing');
    Haptics.selectionAsync();
    const outcome = await shareVibe(result);
    setShareState(outcome);
    if (outcome === 'shared') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [result, shareState]);

  const openFeed = useCallback(async () => {
    Haptics.selectionAsync();
    setScreen('feed');
    setFeedLoading(true);
    setFeed(await fetchFeed());
    setFeedLoading(false);
  }, []);

  const refreshFeed = useCallback(async () => {
    setFeedLoading(true);
    setFeed(await fetchFeed());
    setFeedLoading(false);
  }, []);

  const promptReport = useCallback((item: FeedItem) => {
    const reasons = ['Offensive', 'Spam', 'Harassment', 'Something else'];
    Alert.alert('Report this vibe', 'Tell us what is wrong so we can review it.', [
      ...reasons.map((reason) => ({
        text: reason,
        onPress: async () => {
          const outcome = await reportVibe(item.id, reason);
          Alert.alert(
            outcome === 'done' ? 'Reported' : 'Could not send that report',
            outcome === 'done'
              ? 'Thanks. We review reports within 24 hours.'
              : 'Try again in a moment.'
          );
        },
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  }, []);

  const confirmBlock = useCallback(
    (item: FeedItem) => {
      Alert.alert(
        `Block ${item.displayName}?`,
        'You will stop seeing their vibes in the feed.',
        [
          {
            text: 'Block',
            style: 'destructive',
            onPress: async () => {
              const outcome = await blockUser(item.userId);
              if (outcome === 'done') await refreshFeed();
              else Alert.alert('Could not block that person. Try again.');
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    },
    [refreshFeed]
  );

  // Apple's UGC rules want reporting and blocking reachable from the content
  // itself, so every row carries the menu rather than hiding it in settings.
  const openRowActions = useCallback(
    (item: FeedItem) => {
      Haptics.selectionAsync();

      if (item.mine) {
        Alert.alert('Your vibe', undefined, [
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              const outcome = await deleteVibe(item.id);
              if (outcome === 'done') await refreshFeed();
              else Alert.alert('Could not delete that. Try again.');
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]);
        return;
      }

      Alert.alert(item.displayName, undefined, [
        {
          text: 'Report this vibe',
          style: 'destructive',
          onPress: () => promptReport(item),
        },
        {
          text: 'Block this person',
          style: 'destructive',
          onPress: () => confirmBlock(item),
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    },
    [refreshFeed, promptReport, confirmBlock]
  );

  const closeFeed = useCallback(() => {
    Haptics.selectionAsync();
    setScreen(result ? 'result' : 'home');
  }, [result]);

  if (!fontsLoaded) {
    return <View style={styles.boot} />;
  }

  const switcher = (
    <ThemeSwitcher
      styles={styles}
      activeId={themeId}
      onPick={(id) => {
        Haptics.selectionAsync();
        setThemeId(id);
      }}
    />
  );

  return (
    <View style={styles.root}>
      <StatusBar style={theme.id === 'neo' || theme.id === 'meme' ? 'dark' : 'light'} />
      <Atmosphere intensity={screen === 'result' ? 0.75 : 1} />

      {photoUri && screen !== 'home' ? (
        <Image
          source={{ uri: photoUri }}
          style={[styles.photoWash, { opacity: theme.photoWash }]}
          contentFit="cover"
          blurRadius={screen === 'analyzing' ? 18 : 10}
        />
      ) : null}
      {photoUri && screen !== 'home' ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.photoScrim }]} />
      ) : null}

      {/* Absolute so it covers the screen; as a flex sibling of SafeAreaView
          the two would each take half the height. */}
      {screen === 'camera' && (
        <View style={styles.cameraLayer}>
          <VibeCamera onCapture={onCaptured} onClose={() => setScreen('home')} />
        </View>
      )}

      <SafeAreaView style={styles.safe} pointerEvents={screen === 'camera' ? 'none' : 'auto'}>
        {screen === 'home' && (
          <View style={styles.hero}>
            <Animated.View
              style={{ opacity: brandOpacity, transform: [{ translateY: brandY }] }}
            >
              <Text style={styles.brand}>VIBE</Text>
            </Animated.View>

            <Animated.Text style={[styles.line, { opacity: contentOpacity }]}>
              {tagline[theme.id]}
            </Animated.Text>

            <Animated.View style={[styles.actions, { opacity: contentOpacity }]}>
              <ThemedButton styles={styles} label="Take a selfie" onPress={takeSelfie} />
              <ThemedButton styles={styles} label="Choose a photo" onPress={choosePhoto} muted />
              <ThemedButton styles={styles} label="See the feed" onPress={openFeed} muted />
            </Animated.View>

            <Animated.View style={{ opacity: contentOpacity }}>{switcher}</Animated.View>
          </View>
        )}

        {screen === 'analyzing' && (
          <View style={styles.centerStage}>
            <Text style={styles.brandSmall}>VIBE</Text>
            <Text style={styles.analyzeLine}>{analyzeCopy}</Text>
          </View>
        )}

        {screen === 'result' && result && (
          <ScrollView
            contentContainerStyle={styles.resultScroll}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.brandSmall}>VIBE</Text>

            <Animated.View
              style={{
                opacity: scoreOpacity,
                transform: [{ scale: scoreScale }],
                alignItems: 'flex-start',
              }}
            >
              <Text style={styles.score}>{result.score}</Text>
              <Text style={styles.scoreHint}>{scoreCaption[theme.id]}</Text>
            </Animated.View>

            <Text style={styles.analysis}>{result.analysis}</Text>

            <View style={styles.factors}>
              {result.factors.map((f) => (
                <View key={f.label} style={styles.factorRow}>
                  <Text style={styles.factorLabel}>{f.label}</Text>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${Math.round(f.value * 100)}%` }]} />
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.resultActions}>
              <ThemedButton
                styles={styles}
                label={shareLabels[shareState]}
                onPress={share}
                muted={shareState !== 'idle' && shareState !== 'failed'}
              />
              <ThemedButton styles={styles} label="See the feed" onPress={openFeed} muted />
              <ThemedButton styles={styles} label="Check again" onPress={reset} muted />
            </View>

            {switcher}
          </ScrollView>
        )}

        {screen === 'feed' && !feedLoading && !isUnlocked(feed) && (
          <LockedFeed
            feed={feed}
            onCheckVibe={() => {
              setScreen('home');
              takeSelfie();
            }}
            onBack={closeFeed}
          />
        )}

        {screen === 'feed' && (feedLoading || isUnlocked(feed)) && (
          <View style={styles.feed}>
            <Text style={styles.brandSmall}>VIBE</Text>
            <Text style={styles.feedTitle}>The feed</Text>

            <ScrollView
              style={styles.feedList}
              contentContainerStyle={styles.feedListContent}
              showsVerticalScrollIndicator={false}
            >
              {feedLoading && <Text style={styles.feedEmpty}>Reading the room…</Text>}
              {!feedLoading && feed === null && (
                <Text style={styles.feedEmpty}>The feed isn’t reachable right now.</Text>
              )}
              {!feedLoading && feed !== null && feed.length === 0 && (
                <Text style={styles.feedEmpty}>Nothing here yet. Share the first vibe.</Text>
              )}
              {!feedLoading &&
                feed?.map((item) => (
                  <View key={item.id} style={styles.feedRow}>
                    <Text style={styles.feedScore}>{item.score}</Text>
                    <View style={styles.feedBody}>
                      <Text style={styles.feedMeta}>
                        {item.mine ? 'you' : item.displayName} · {timeAgo(item.createdAt)}
                      </Text>
                      <Text style={styles.feedAnalysis}>{item.analysis}</Text>
                    </View>
                    <Pressable
                      onPress={() => openRowActions(item)}
                      hitSlop={12}
                      style={styles.rowMenu}
                      accessibilityRole="button"
                      accessibilityLabel={
                        item.mine ? 'Options for your vibe' : `Report or block ${item.displayName}`
                      }
                    >
                      <Text style={styles.rowMenuGlyph}>•••</Text>
                    </Pressable>
                  </View>
                ))}
            </ScrollView>

            <ThemedButton
              styles={styles}
              label={result ? 'Back to result' : 'Back'}
              onPress={closeFeed}
            />
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

type Styles = ReturnType<typeof makeStyles>;

function ThemeSwitcher({
  styles,
  activeId,
  onPick,
}: {
  styles: Styles;
  activeId: string;
  onPick: (id: (typeof themeOrder)[number]) => void;
}) {
  return (
    <View style={styles.switcher}>
      {themeOrder.map((id) => {
        const active = id === activeId;
        return (
          <Pressable
            key={id}
            onPress={() => onPick(id)}
            style={[styles.swatch, active && styles.swatchActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${themes[id].name} theme`}
          >
            <Text style={[styles.swatchText, active && styles.swatchTextActive]}>
              {themes[id].name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ThemedButton({
  styles,
  label,
  onPress,
  muted = false,
}: {
  styles: Styles;
  label: string;
  onPress: () => void;
  muted?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.cta, muted && styles.ctaMutedBox, pressed && styles.ctaPressed]}
    >
      <Text style={[styles.ctaText, muted && styles.ctaMuted]}>{label}</Text>
      <View style={[styles.ctaRule, muted && styles.ctaRuleMuted]} />
    </Pressable>
  );
}

function makeStyles(theme: Theme) {
  // Neumorphism reads as light from the top-left, so surfaces get a soft
  // drop shadow plus a white edge instead of a border.
  const raised = theme.raised
    ? {
        backgroundColor: theme.card,
        borderRadius: theme.radius,
        borderWidth: 1,
        borderColor: theme.cardBorder,
        shadowColor: '#A3B1C6',
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.55,
        shadowRadius: 10,
      }
    : null;

  // Only the meme theme wants a hard poster outline.
  const outlined =
    theme.id === 'meme'
      ? {
          backgroundColor: theme.card,
          borderRadius: theme.radius,
          borderWidth: 3,
          borderColor: theme.cardBorder,
        }
      : null;

  const boxed =
    theme.id === 'real'
      ? {
          backgroundColor: theme.card,
          borderRadius: theme.radius,
          borderWidth: 1,
          borderColor: theme.cardBorder,
        }
      : null;

  const ctaBox = raised ?? outlined ?? boxed;
  const ctaPadding = ctaBox ? { paddingVertical: 14, paddingHorizontal: 20 } : { paddingVertical: 8 };

  return StyleSheet.create({
    boot: { flex: 1, backgroundColor: theme.bg },
    root: { flex: 1, backgroundColor: theme.bg },
    photoWash: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    cameraLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 },
    safe: { flex: 1 },

    hero: {
      flex: 1,
      justifyContent: 'flex-end',
      paddingHorizontal: 28,
      paddingBottom: 40,
      gap: 20,
    },
    brand: {
      ...theme.display,
      fontSize: 72 * theme.displayScale,
      color: theme.text,
      lineHeight: 76 * theme.displayScale,
    },
    brandSmall: {
      ...theme.label,
      fontSize: 22,
      letterSpacing: 2,
      color: theme.text,
      marginBottom: 8,
    },
    line: {
      ...theme.body,
      fontSize: 26,
      lineHeight: 34,
      color: theme.textSoft,
      maxWidth: 320,
    },
    actions: { marginTop: 6, gap: ctaBox ? 12 : 22 },

    centerStage: {
      flex: 1,
      justifyContent: 'flex-end',
      paddingHorizontal: 28,
      paddingBottom: 64,
      gap: 18,
    },
    analyzeLine: {
      ...theme.body,
      fontSize: 28,
      lineHeight: 36,
      color: theme.text,
      maxWidth: 300,
    },

    resultScroll: {
      flexGrow: 1,
      justifyContent: 'flex-end',
      paddingHorizontal: 28,
      paddingTop: 24,
      paddingBottom: 40,
      gap: 16,
    },
    score: {
      ...theme.display,
      fontSize: 96 * theme.displayScale,
      color: theme.text,
      lineHeight: 100 * theme.displayScale,
    },
    scoreHint: {
      ...theme.label,
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 4,
    },
    analysis: {
      ...theme.body,
      fontSize: 22,
      lineHeight: 30,
      color: theme.textSoft,
      maxWidth: 340,
    },
    factors: { gap: 12, marginTop: 6, marginBottom: 8 },
    factorRow: { gap: 6 },
    factorLabel: { ...theme.label, fontSize: 11, color: theme.textMuted },
    track: {
      height: theme.id === 'meme' ? 10 : 2,
      backgroundColor: theme.id === 'neo' ? '#CDD5E0' : `${theme.text}33`,
      width: '100%',
      borderRadius: theme.id === 'meme' ? 0 : 999,
      borderWidth: theme.id === 'meme' ? 2 : 0,
      borderColor: theme.cardBorder,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      backgroundColor: theme.id === 'field' ? theme.text : theme.accent,
    },
    resultActions: { gap: ctaBox ? 12 : 14, marginTop: 4 },

    feed: {
      flex: 1,
      paddingHorizontal: 28,
      paddingTop: 18,
      paddingBottom: 32,
      gap: 10,
    },
    feedTitle: { ...theme.body, fontSize: 30, color: theme.text, marginBottom: 6 },
    feedList: { flex: 1 },
    feedListContent: { gap: 22, paddingBottom: 24 },
    feedEmpty: {
      ...theme.body,
      fontSize: 20,
      lineHeight: 28,
      color: theme.textMuted,
      marginTop: 12,
    },
    feedRow: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
    feedScore: {
      ...theme.display,
      fontSize: 34,
      lineHeight: 38,
      letterSpacing: -1,
      color: theme.text,
      minWidth: 54,
    },
    feedBody: { flex: 1, gap: 4, paddingTop: 2 },
    rowMenu: { paddingTop: 4, paddingLeft: 6 },
    rowMenuGlyph: { ...theme.label, fontSize: 13, color: theme.textMuted },
    feedMeta: { ...theme.label, fontSize: 11, color: theme.textMuted },
    feedAnalysis: { ...theme.body, fontSize: 17, lineHeight: 23, color: theme.textSoft },

    cta: {
      alignSelf: 'flex-start',
      ...ctaPadding,
      ...(ctaBox ?? {}),
    },
    ctaMutedBox: theme.raised
      ? { shadowOpacity: 0.3 }
      : theme.id === 'meme'
        ? { backgroundColor: 'transparent' }
        : {},
    ctaPressed: { opacity: 0.7 },
    ctaText: { ...theme.label, fontSize: 15, color: theme.id === 'meme' ? theme.onAccent : theme.text },
    ctaMuted: { color: theme.textMuted },
    // Only the underline look needs a rule; boxed themes draw their own edge.
    ctaRule: ctaBox
      ? { height: 0 }
      : { marginTop: 10, height: 1.5, width: '100%', backgroundColor: theme.text },
    ctaRuleMuted: ctaBox ? { height: 0 } : { backgroundColor: theme.textMuted },

    switcher: { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' },
    swatch: {
      paddingVertical: 7,
      paddingHorizontal: 13,
      borderRadius: theme.raised ? 14 : 999,
      borderWidth: 1,
      borderColor: `${theme.text}33`,
    },
    swatchActive: { backgroundColor: theme.accent, borderColor: theme.accent },
    swatchText: { ...theme.label, fontSize: 10, color: theme.textMuted },
    swatchTextActive: { color: theme.onAccent },
  });
}
