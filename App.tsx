import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useFonts, Syne_700Bold, Syne_800ExtraBold } from '@expo-google-fonts/syne';
import {
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
} from '@expo-google-fonts/instrument-serif';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Atmosphere } from './src/components/Atmosphere';
import { colors } from './src/theme';
import { analyzingLines } from './src/vibe/copy';
import { analyzeVibeAsync } from './src/vibe/engine';
import type { VibeResult } from './src/vibe/types';

type Screen = 'home' | 'analyzing' | 'result';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [result, setResult] = useState<VibeResult | null>(null);
  const [analyzeCopy, setAnalyzeCopy] = useState(analyzingLines()[0]!);
  const [busy, setBusy] = useState(false);

  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandY = useRef(new Animated.Value(28)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const scoreScale = useRef(new Animated.Value(0.7)).current;
  const scoreOpacity = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    Syne_700Bold,
    Syne_800ExtraBold,
    InstrumentSerif_400Regular,
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

  const runCheck = useCallback(
    async (asset: ImagePicker.ImagePickerAsset) => {
      setBusy(true);
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

  const takeSelfie = useCallback(async () => {
    if (busy) return;
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    const shot = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
      cameraType: ImagePicker.CameraType.front,
    });
    if (!shot.canceled && shot.assets[0]) await runCheck(shot.assets[0]);
  }, [busy, runCheck]);

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
    setScreen('home');
  }, []);

  if (!fontsLoaded) {
    return <View style={styles.boot} />;
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Atmosphere intensity={screen === 'result' ? 0.75 : 1} />

      {photoUri && screen !== 'home' ? (
        <Image
          source={{ uri: photoUri }}
          style={styles.photoWash}
          contentFit="cover"
          blurRadius={screen === 'analyzing' ? 18 : 10}
        />
      ) : null}
      {photoUri && screen !== 'home' ? <View style={styles.photoScrim} /> : null}

      <SafeAreaView style={styles.safe}>
        {screen === 'home' && (
          <View style={styles.hero}>
            <Animated.View
              style={{
                opacity: brandOpacity,
                transform: [{ translateY: brandY }],
              }}
            >
              <Text style={styles.brand}>VIBE</Text>
            </Animated.View>

            <Animated.Text style={[styles.line, { opacity: contentOpacity }]}>
              Snap a selfie. Get a score. Leave with a story.
            </Animated.Text>

            <Animated.View style={[styles.actions, { opacity: contentOpacity }]}>
              <UnderlineButton label="Take a selfie" onPress={takeSelfie} />
              <UnderlineButton label="Choose a photo" onPress={choosePhoto} muted />
            </Animated.View>
          </View>
        )}

        {screen === 'analyzing' && (
          <View style={styles.centerStage}>
            <Text style={styles.brandSmall}>VIBE</Text>
            <Text style={styles.analyzeLine}>{analyzeCopy}</Text>
          </View>
        )}

        {screen === 'result' && result && (
          <View style={styles.result}>
            <Text style={styles.brandSmall}>VIBE</Text>

            <Animated.View
              style={{
                opacity: scoreOpacity,
                transform: [{ scale: scoreScale }],
                alignItems: 'flex-start',
              }}
            >
              <Text style={styles.score}>{result.score}</Text>
              <Text style={styles.scoreHint}>out of 100</Text>
            </Animated.View>

            <Text style={styles.analysis}>{result.analysis}</Text>

            <View style={styles.factors}>
              {result.factors.map((f) => (
                <View key={f.label} style={styles.factorRow}>
                  <Text style={styles.factorLabel}>{f.label}</Text>
                  <View style={styles.track}>
                    <View
                      style={[styles.fill, { width: `${Math.round(f.value * 100)}%` }]}
                    />
                  </View>
                </View>
              ))}
            </View>

            <UnderlineButton label="Check again" onPress={reset} />
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

function UnderlineButton({
  label,
  onPress,
  muted = false,
}: {
  label: string;
  onPress: () => void;
  muted?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
    >
      <Text style={[styles.ctaText, muted && styles.ctaMuted]}>{label}</Text>
      <View style={[styles.ctaRule, muted && styles.ctaRuleMuted]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: colors.deep,
  },
  root: {
    flex: 1,
    backgroundColor: colors.deep,
  },
  photoWash: {
    ...StyleSheet.absoluteFill,
    opacity: 0.35,
  },
  photoScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(22,58,53,0.55)',
  },
  safe: {
    flex: 1,
  },
  hero: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 28,
    paddingBottom: 48,
    gap: 22,
  },
  brand: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 72,
    letterSpacing: -2.5,
    color: colors.cream,
    lineHeight: 72,
  },
  brandSmall: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 22,
    letterSpacing: 2,
    color: colors.cream,
    marginBottom: 8,
  },
  line: {
    fontFamily: 'InstrumentSerif_400Regular_Italic',
    fontSize: 26,
    lineHeight: 34,
    color: colors.creamSoft,
    maxWidth: 320,
  },
  actions: {
    marginTop: 10,
    gap: 22,
  },
  centerStage: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 28,
    paddingBottom: 64,
    gap: 18,
  },
  analyzeLine: {
    fontFamily: 'InstrumentSerif_400Regular_Italic',
    fontSize: 28,
    lineHeight: 36,
    color: colors.cream,
    maxWidth: 300,
  },
  result: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 28,
    paddingBottom: 48,
    gap: 18,
  },
  score: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 96,
    letterSpacing: -4,
    color: colors.cream,
    lineHeight: 96,
  },
  scoreHint: {
    fontFamily: 'Syne_700Bold',
    fontSize: 12,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.creamMuted,
    marginTop: 4,
  },
  analysis: {
    fontFamily: 'InstrumentSerif_400Regular_Italic',
    fontSize: 22,
    lineHeight: 30,
    color: colors.creamSoft,
    maxWidth: 340,
  },
  factors: {
    gap: 12,
    marginTop: 6,
    marginBottom: 8,
  },
  factorRow: {
    gap: 6,
  },
  factorLabel: {
    fontFamily: 'Syne_700Bold',
    fontSize: 11,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: colors.creamMuted,
  },
  track: {
    height: 2,
    backgroundColor: 'rgba(244,239,230,0.22)',
    width: '100%',
  },
  fill: {
    height: 2,
    backgroundColor: colors.cream,
  },
  cta: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  ctaPressed: {
    opacity: 0.7,
  },
  ctaText: {
    fontFamily: 'Syne_700Bold',
    fontSize: 15,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.cream,
  },
  ctaMuted: {
    color: colors.creamMuted,
  },
  ctaRule: {
    marginTop: 10,
    height: 1.5,
    width: '100%',
    backgroundColor: colors.cream,
  },
  ctaRuleMuted: {
    backgroundColor: colors.creamMuted,
  },
});
