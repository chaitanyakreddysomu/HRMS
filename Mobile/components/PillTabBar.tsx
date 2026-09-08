import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import GlassSurface from "./GlassSurface";

/**
 * ============================================================
 * PILL TAB BAR
 * ============================================================
 *
 * Floating, pill shaped bottom navigation in liquid glass. It
 * hovers above the content instead of being pinned to the screen
 * edge, and the active item is marked by a sliding highlight that
 * the icons ride on top of.
 */
export interface PillTab {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  /** when set the tab renders this image instead of an icon */
  imageUri?: string;
}

interface Props {
  tabs: PillTab[];
  activeKey: string;
  onChange: (key: string) => void;
  /** a long press on a tab, e.g. the profile shortcut menu */
  onLongPress?: (key: string) => void;
  bottomInset?: number;
}

const ACTIVE = "#2563EB";
const INACTIVE = "#94A3B8";

export default function PillTabBar({
  tabs,
  activeKey,
  onChange,
  onLongPress,
  bottomInset = 0,
}: Props) {
  const index = Math.max(
    0,
    tabs.findIndex((t) => t.key === activeKey)
  );
  const slide = useRef(new Animated.Value(index)).current;
  const [barWidth, setBarWidth] = React.useState(0);

  useEffect(() => {
    Animated.spring(slide, {
      toValue: index,
      friction: 9,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [index]);

  const slotWidth = barWidth ? barWidth / tabs.length : 0;

  const highlightX = slide.interpolate({
    inputRange: tabs.map((_, i) => i),
    outputRange: tabs.map((_, i) => i * slotWidth),
  });

  return (
    <View
      style={[styles.wrap, { paddingBottom: Math.max(bottomInset, 14) }]}
      pointerEvents="box-none"
    >
      <GlassSurface radius={34} intensity={60} style={styles.bar}>
        <View
          style={styles.barInner}
          onLayout={(e) => setBarWidth(e.nativeEvent.layout.width - 12)}
        >
          {slotWidth > 0 && (
            <Animated.View
              style={[
                styles.highlight,
                {
                  width: slotWidth,
                  transform: [{ translateX: highlightX }],
                },
              ]}
            />
          )}

          {tabs.map((tab) => {
            const active = tab.key === activeKey;
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.8}
                onPress={() => onChange(tab.key)}
                onLongPress={
                  onLongPress ? () => onLongPress(tab.key) : undefined
                }
                delayLongPress={350}
                style={styles.item}
              >
                {tab.imageUri ? (
                  <Image
                    source={{ uri: tab.imageUri }}
                    style={[
                      styles.avatar,
                      active && { borderColor: ACTIVE, borderWidth: 2 },
                    ]}
                  />
                ) : (
                  <Ionicons
                    name={active ? tab.activeIcon : tab.icon}
                    size={22}
                    color={active ? ACTIVE : INACTIVE}
                  />
                )}
                <Text
                  style={[
                    styles.label,
                    { color: active ? ACTIVE : INACTIVE },
                    active && styles.labelActive,
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    paddingHorizontal: 14,
  },
  bar: {
    alignSelf: "stretch",
    height: 68,
  },
  barInner: {
    flex: 1,
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  highlight: {
    position: "absolute",
    left: 6,
    top: 6,
    bottom: 6,
    borderRadius: 28,
    backgroundColor: "rgba(37,99,235,0.12)",
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 3,
  },
  labelActive: {
    fontWeight: "800",
  },
});
