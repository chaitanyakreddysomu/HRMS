import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  LayoutAnimation,
  LayoutAnimationConfig,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import GlassSurface from "./GlassSurface";

/**
 * ============================================================
 * PILL HEADER
 * ============================================================
 *
 * Telegram style floating top bar, built from liquid glass:
 *
 *   ( back )   [        Title   v        ]   ( menu )
 *
 * A long press on the title turns the title pill and the menu
 * circle into one wide search field, and the left circle becomes
 * the way out of it:
 *
 *   ( back )   [  Search ....................... ]
 */
export interface PillHeaderProps {
  title: string;
  onBack?: () => void;
  /** shown instead of the back arrow, e.g. the app logo */
  logo?: number;
  onTitlePress?: () => void;
  onTitleLongPress?: () => void;
  expanded?: boolean;
  onMenuPress?: () => void;
  menuOpen?: boolean;
  /** replaces the three dots, e.g. a bell on the dashboard */
  actionIcon?: keyof typeof Ionicons.glyphMap;
  /** unread count drawn on the action circle */
  actionBadge?: number;
  /** search mode */
  searching?: boolean;
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (text: string) => void;
  onSearchClose?: () => void;
  /**
   * A notification that arrived while the app was open. The pill
   * stretches across the whole row to carry it, then settles back.
   * A new `id` restarts the animation, so two in a row both show.
   */
  banner?: { id: string; title: string; body: string } | null;
  onBannerPress?: () => void;
  /** fires when the banner has finished retracting */
  onBannerDone?: () => void;
}

const CIRCLE = 46;
const GAP = 8;

/** how long the banner stays at full width */
const BANNER_HOLD = 3000;

/**
 * The header's layout changes, run natively. Spring rather than
 * linear so the pill settles into its new width instead of
 * arriving flat, and opacity for the views entering and leaving.
 */
const HEADER_TRANSITION: LayoutAnimationConfig = {
  duration: 300,
  create: {
    type: LayoutAnimation.Types.easeOut,
    property: LayoutAnimation.Properties.opacity,
    duration: 200,
    delay: 80,
  },
  update: {
    type: LayoutAnimation.Types.spring,
    springDamping: 0.85,
  },
  delete: {
    type: LayoutAnimation.Types.easeIn,
    property: LayoutAnimation.Properties.opacity,
    duration: 140,
  },
};

export default function PillHeader({
  title,
  onBack,
  logo,
  onTitlePress,
  onTitleLongPress,
  expanded = false,
  onMenuPress,
  menuOpen = false,
  actionIcon,
  actionBadge = 0,
  searching = false,
  searchValue = "",
  searchPlaceholder = "Search",
  onSearchChange,
  onSearchClose,
  banner = null,
  onBannerPress,
  onBannerDone,
}: PillHeaderProps) {
  const input = useRef<TextInput>(null);

  useEffect(() => {
    if (searching) {
      const t = setTimeout(() => input.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [searching]);

  /**
   * ============================================================
   * SEARCH TRANSITION
   * ============================================================
   *
   * Opening search drops the right circle and lets the pill take
   * the width. That is a layout change, so it is handed to the
   * platform: LayoutAnimation moves every affected view in one
   * native pass rather than one JavaScript frame at a time.
   *
   * Configured during render because the layout it describes is
   * the one this render commits.
   */
  /**
   * Everything that changes the header's shape: search opening,
   * the left circle turning from logo to back arrow, the right
   * one turning from menu to bell, and the badge coming or going.
   */
  const shape = [
    searching,
    !!onBack,
    actionIcon || "menu",
    actionBadge > 0,
  ].join("|");

  const lastShape = useRef(shape);

  if (lastShape.current !== shape) {
    LayoutAnimation.configureNext(HEADER_TRANSITION);
    lastShape.current = shape;
  }

  /** the title and the field cross over rather than cutting */
  const searchAnim = useRef(new Animated.Value(searching ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(searchAnim, {
      toValue: searching ? 1 : 0,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [searching, searchAnim]);

  const searchOpacity = searchAnim;

  const titleFade = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  /**
   * ============================================================
   * BANNER ANIMATION
   * ============================================================
   *
   * 0 is the resting header, 1 is the banner at full width. The
   * banner is an overlay rather than a change of layout, so the
   * title and the two circles underneath never reflow.
   */
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = React.useState<PillHeaderProps["banner"]>(null);
  const doneRef = useRef(onBannerDone);
  doneRef.current = onBannerDone;

  useEffect(() => {
    if (!banner) return;

    setShown(banner);

    const sequence = Animated.sequence([
      Animated.spring(bannerAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 70,
      }),
      Animated.delay(BANNER_HOLD),
      Animated.timing(bannerAnim, {
        toValue: 0,
        duration: 260,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    sequence.start(({ finished }) => {
      if (!finished) return;
      setShown(null);
      doneRef.current?.();
    });

    return () => sequence.stop();
  }, [banner?.id]);

  /**
   * Everything here is transform and opacity, so the whole thing
   * runs on the native driver. Animating the width instead would
   * mean resizing a BlurView every frame, which is what made an
   * earlier version of this stutter on Android.
   *
   * The circles draw in toward the centre and shrink away while
   * the wide pill rises in their place, so the three read as one
   * closing together.
   */
  const sideOpacity = bannerAnim.interpolate({
    inputRange: [0, 0.55],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const sideScale = bannerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.35],
  });

  const leftShift = bannerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, (CIRCLE + GAP) / 2],
  });

  const rightShift = bannerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -(CIRCLE + GAP) / 2],
  });

  /** the title steps aside for the notification, and back after */
  const titleOpacity = bannerAnim.interpolate({
    inputRange: [0, 0.4],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const bannerOpacity = bannerAnim.interpolate({
    inputRange: [0.35, 1],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const bannerScale = bannerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  const bannerLift = bannerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-6, 0],
  });

  return (
    <View style={styles.row}>
      {/* left circle, folding away as the banner opens ----------- */}
      <Animated.View
        style={[
          styles.side,
          {
            opacity: sideOpacity,
            transform: [{ translateX: leftShift }, { scale: sideScale }],
          },
        ]}
        pointerEvents={shown ? "none" : "auto"}
      >
        <View style={styles.sideInnerLeft}>
          <GlassSurface radius={CIRCLE / 2} style={styles.circle}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={searching ? onSearchClose : onBack}
              disabled={!searching && !onBack}
              style={styles.fill}
            >
              {logo && !searching && !onBack ? (
                <Image source={logo} style={styles.logo} resizeMode="contain" />
              ) : (
                <Ionicons name="arrow-back" size={22} color="#1F2937" />
              )}
            </TouchableOpacity>
          </GlassSurface>
        </View>
      </Animated.View>

      {/* the one pill that stays, and grows into the whole row ---- */}
      <GlassSurface radius={CIRCLE / 2} style={styles.pill}>
        <Animated.View
          style={[styles.pillContent, { opacity: titleOpacity }]}
          pointerEvents={shown ? "none" : "auto"}
        >
        {searching ? (
          <Animated.View
            style={[styles.searchInner, { opacity: searchOpacity }]}
          >
            <TextInput
              ref={input}
              value={searchValue}
              onChangeText={onSearchChange}
              placeholder={searchPlaceholder}
              placeholderTextColor="#9CA3AF"
              returnKeyType="search"
              style={styles.searchInput}
            />
            {searchValue.length > 0 && (
              <TouchableOpacity
                onPress={() => onSearchChange?.("")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </Animated.View>
        ) : (
          <Animated.View style={[styles.pillContent, { opacity: titleFade }]}>
            <TouchableOpacity
              activeOpacity={onTitlePress || onTitleLongPress ? 0.7 : 1}
              onPress={onTitlePress}
              onLongPress={onTitleLongPress}
              delayLongPress={280}
              style={styles.pillInner}
            >
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              {!!onTitlePress && (
                <Ionicons
                  name={expanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color="#4B5563"
                  style={styles.caret}
                />
              )}
            </TouchableOpacity>
          </Animated.View>
        )}
        </Animated.View>
      </GlassSurface>

      {/* right circle, folding away with the left one ------------- */}
      {!searching && (
        <Animated.View
          style={[
            styles.side,
            {
              opacity: sideOpacity,
              transform: [{ translateX: rightShift }, { scale: sideScale }],
            },
          ]}
          pointerEvents={shown ? "none" : "auto"}
        >
          <View style={styles.sideInnerRight}>
            <GlassSurface radius={CIRCLE / 2} style={styles.circle}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onMenuPress}
                style={styles.fill}
              >
                <Ionicons
                  name={actionIcon || "ellipsis-vertical"}
                  size={actionIcon ? 22 : 20}
                  color={menuOpen ? "#2563EB" : "#1F2937"}
                />
              </TouchableOpacity>
            </GlassSurface>

            {actionBadge > 0 && (
              <View style={styles.badge} pointerEvents="none">
                <Text style={styles.badgeText}>
                  {actionBadge > 99 ? "99+" : actionBadge}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      )}

      {/* the three closed into one, carrying the arrival ---------- */}
      {!!shown && (
        <Animated.View
          style={[
            styles.banner,
            {
              opacity: bannerOpacity,
              transform: [{ translateY: bannerLift }, { scale: bannerScale }],
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={onBannerPress ? 0.75 : 1}
            onPress={onBannerPress}
            style={styles.bannerRow}
          >
            <View style={styles.bannerIcon}>
              <Ionicons name="notifications" size={17} color="#FFFFFF" />
            </View>

            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle} numberOfLines={1}>
                {shown.title}
              </Text>
              {!!shown.body && (
                <Text style={styles.bannerBody} numberOfLines={1}>
                  {shown.body}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  /**
   * The gap lives inside these wrappers rather than on the row, so
   * collapsing a wrapper to zero closes the space beside it too.
   */
  side: {
    justifyContent: "center",
  },
  sideInnerLeft: {
    marginRight: GAP,
  },
  sideInnerRight: {
    marginLeft: GAP,
  },
  /**
   * Deliberately not a GlassSurface. A blurred backdrop is costly
   * to composite while it moves, and this one is animating for its
   * whole life, so it is painted flat instead.
   */
  banner: {
    position: "absolute",
    left: 12,
    right: 12,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: "rgba(255,255,255,0.9)",
    shadowColor: "#0F172A",
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  bannerRow: {
    flex: 1,
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  bannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "800",
  },
  bannerBody: {
    color: "#4B5563",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 1,
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
  },
  pill: {
    flex: 1,
    height: CIRCLE,
  },
  fill: {
    flex: 1,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
  pillContent: {
    flex: 1,
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
  },
  pillInner: {
    flex: 1,
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  searchInner: {
    flex: 1,
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 20,
    paddingRight: 16,
  },
  searchInput: {
    flex: 1,
    color: "#111827",
    fontSize: 17,
    fontWeight: "500",
    height: "100%",
  },
  logo: {
    width: 30,
    height: 30,
  },
  title: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  caret: {
    marginLeft: 6,
  },
  badge: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: "#EF4444",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
});
