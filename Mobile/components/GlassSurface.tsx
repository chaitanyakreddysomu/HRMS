import React from "react";
import { Platform, StyleSheet, View, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";

/**
 * ============================================================
 * GLASS SURFACE
 * ============================================================
 *
 * The liquid glass material behind the floating header pills,
 * the three dot menu and the bottom navigation.
 *
 * iOS gets a native blur. Android gets the same blur through the
 * Dimezis backend, which needs the experimental flag; where that
 * is unavailable the tinted layer still reads as frosted glass,
 * so it never falls back to an opaque block.
 *
 * The glass is painted as a backdrop rather than a wrapper, so
 * children lay out exactly as they would in a plain View.
 */
interface Props {
  style?: ViewStyle | ViewStyle[];
  radius: number;
  children: React.ReactNode;
  /** 0 - 100, higher is more frosted */
  intensity?: number;
  elevated?: boolean;
}

export default function GlassSurface({
  style,
  radius,
  children,
  intensity = Platform.OS === "ios" ? 55 : 45,
  elevated = true,
}: Props) {
  return (
    <View style={[{ borderRadius: radius }, elevated && styles.shadow, style]}>
      <View
        style={[StyleSheet.absoluteFill, styles.clip, { borderRadius: radius }]}
        pointerEvents="none"
      >
        <BlurView
          intensity={intensity}
          tint="light"
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
        {/* tint keeps contrast when the blur is weak or disabled */}
        <View style={[StyleSheet.absoluteFill, styles.tint]} />
        {/* lit rim */}
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.rim,
            { borderRadius: radius },
          ]}
        />
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: "hidden",
  },
  tint: {
    backgroundColor:
      Platform.OS === "ios"
        ? "rgba(255,255,255,0.45)"
        : "rgba(255,255,255,0.62)",
  },
  rim: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: "rgba(255,255,255,0.85)",
  },
  shadow: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
