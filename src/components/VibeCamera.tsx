import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../themes/ThemeContext';

export type Shot = { uri: string; width?: number; height?: number };

type Props = {
  onCapture: (shot: Shot) => void;
  onClose: () => void;
};

/**
 * Full-bleed capture surface. Replaces the system picker so the shutter, the
 * flip, and the framing all live inside the app's own visual language.
 */
export function VibeCamera({ onCapture, onClose }: Props) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('front');
  const [busy, setBusy] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const capture = useCallback(async () => {
    if (busy || !cameraRef.current) return;
    setBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) {
        onCapture({ uri: photo.uri, width: photo.width, height: photo.height });
        return;
      }
    } catch {
      // Fall through to re-enable the shutter so the screen is never stuck.
    }
    setBusy(false);
  }, [busy, onCapture]);

  const flip = useCallback(() => {
    Haptics.selectionAsync();
    setFacing((current) => (current === 'front' ? 'back' : 'front'));
  }, []);

  if (!permission) return <View style={styles.root} />;

  if (!permission.granted) {
    return (
      <View style={[styles.root, styles.askRoot]}>
        <Text style={styles.askTitle}>Camera access</Text>
        <Text style={styles.askBody}>
          Vibe reads your selfie on this device to score it. The photo is never
          uploaded.
        </Text>
        <Pressable onPress={requestPermission} style={styles.pill} accessibilityRole="button">
          <Text style={styles.pillText}>Allow camera</Text>
        </Pressable>
        <Pressable onPress={onClose} hitSlop={12} style={styles.back} accessibilityRole="button">
          <Text style={styles.backText}>Not now</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />

      <View style={styles.topBar}>
        <Pressable onPress={onClose} hitSlop={14} accessibilityRole="button">
          <Text style={styles.topText}>Close</Text>
        </Pressable>
        <Pressable onPress={flip} hitSlop={14} accessibilityRole="button">
          <Text style={styles.topText}>Flip</Text>
        </Pressable>
      </View>

      <View style={styles.shutterBar}>
        <Pressable
          onPress={capture}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Take photo"
          style={({ pressed }) => [styles.shutterRing, pressed && styles.shutterPressed]}
        >
          <View style={[styles.shutterCore, busy && styles.shutterBusy]} />
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000' },
    askRoot: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
    askTitle: { ...theme.display, fontSize: 30, letterSpacing: -1, color: theme.text },
    askBody: {
      ...theme.body,
      fontSize: 18,
      lineHeight: 25,
      color: theme.textMuted,
      textAlign: 'center',
      marginBottom: 10,
    },
    topBar: {
      position: 'absolute',
      top: 58,
      left: 24,
      right: 24,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    topText: {
      ...theme.label,
      fontSize: 13,
      color: '#fff',
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowRadius: 6,
    },
    shutterBar: { position: 'absolute', left: 0, right: 0, bottom: 54, alignItems: 'center' },
    shutterRing: {
      width: 86,
      height: 86,
      borderRadius: 43,
      borderWidth: 5,
      borderColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },
    shutterPressed: { opacity: 0.8 },
    shutterCore: { width: 66, height: 66, borderRadius: 33, backgroundColor: '#fff' },
    shutterBusy: { opacity: 0.4 },
    pill: {
      marginTop: 8,
      paddingVertical: 15,
      paddingHorizontal: 32,
      borderRadius: 999,
      backgroundColor: theme.text,
    },
    pillText: { ...theme.label, fontSize: 15, letterSpacing: 0, color: theme.bg },
    back: { marginTop: 6, padding: 10 },
    backText: { ...theme.label, fontSize: 12, color: theme.textMuted },
  });
}
