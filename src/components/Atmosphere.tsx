import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradient } from '../theme';

const { width, height } = Dimensions.get('window');

type Props = {
  intensity?: number;
};

export function Atmosphere({ intensity = 1 }: Props) {
  const glow = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 10000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 10000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [glow, drift]);

  const orbStyle = {
    opacity: glow.interpolate({
      inputRange: [0, 1],
      outputRange: [0.28 * intensity, 0.65 * intensity],
    }),
    transform: [
      {
        translateY: drift.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -36],
        }),
      },
      {
        translateX: drift.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 22],
        }),
      },
      {
        scale: glow.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.08],
        }),
      },
    ],
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[...gradient.colors]}
        locations={[...gradient.locations]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.orb, orbStyle]}>
        <LinearGradient
          colors={[colors.orb, 'rgba(255,214,160,0)']}
          style={styles.orbFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    top: height * 0.12,
    right: -width * 0.15,
    width: width * 0.85,
    height: width * 0.85,
  },
  orbFill: {
    flex: 1,
    borderRadius: 9999,
  },
});
