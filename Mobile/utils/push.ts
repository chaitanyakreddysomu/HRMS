import { AppState, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

import { getAuthSession } from "./authStorage";
import { apiFetch } from "./api";

/**
 * ============================================================
 * PUSH NOTIFICATIONS
 * ============================================================
 *
 * The app registers an Expo push token, which the backend keeps
 * beside the Firebase tokens the browser uses. Both are sent, so
 * a person signed in on a phone and a laptop hears on each.
 *
 * A notification carries the id of the record it is about, so a
 * tap can open the app straight on that notification rather than
 * dropping the reader on the home page.
 */
export interface PushTarget {
  notificationId?: string | null;
  category?: string | null;
  entityId?: string | null;
}

const DEVICE_KEY = "@hrms_device_id";

/**
 * Why the last registration attempt ended where it did. Push fails
 * quietly by nature — nothing arrives, and there is nothing on screen
 * to say why — so the reason is kept here for a debug view to read.
 */
export interface PushStatus {
  step:
    | "idle"
    | "not-a-device"
    | "permission-denied"
    | "no-project-id"
    | "token-failed"
    | "waiting-for-login"
    | "server-rejected"
    | "registered";
  token?: string | null;
  detail?: string;
}

let _status: PushStatus = { step: "idle" };

/** The outcome of the last registerForPush() call. */
export function getPushStatus(): PushStatus {
  return _status;
}

/**
 * ============================================================
 * IN-APP BANNER
 * ============================================================
 *
 * A notification arriving while somebody is already looking at
 * the app does not belong in the system tray: it would pull them
 * out of what they are doing to tell them about the screen they
 * are on. The shell shows it in the header pill instead, and the
 * OS banner is suppressed for exactly that case.
 */
export interface InAppBanner {
  /** changes per notification, so a repeat still animates */
  id: string;
  title: string;
  body: string;
  target: PushTarget;
}

type BannerHandler = (banner: InAppBanner) => void;

const bannerHandlers = new Set<BannerHandler>();

/** Called by the shell. Returns the unsubscribe. */
export function onInAppBanner(handler: BannerHandler) {
  bannerHandlers.add(handler);
  return () => {
    bannerHandlers.delete(handler);
  };
}

function publishBanner(banner: InAppBanner) {
  bannerHandlers.forEach((handler) => {
    try {
      handler(banner);
    } catch (error) {
      console.error("In-app banner handler error:", error);
    }
  });
}

/**
 * Foreground notifications are handed to the header, background
 * ones to the system tray. Nothing is dropped either way.
 */
/** a sender can ask for the tray even with the app open */
function wantsSystemTray(data: any): boolean {
  return data?.forceSystem === true || data?.forceSystem === "true";
}

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const foreground = AppState.currentState === "active";
    const forced = wantsSystemTray(notification.request.content.data);
    const inHeader = foreground && !forced;

    return {
      shouldShowAlert: !inHeader,
      shouldPlaySound: !inHeader,
      shouldSetBadge: true,
    };
  },
});

/** Turns every foreground arrival into a header banner. */
Notifications.addNotificationReceivedListener((notification) => {
  if (AppState.currentState !== "active") return;

  const content = notification.request.content;

  /** a forced one went to the tray, so the header stays out of it */
  if (wantsSystemTray(content.data)) return;

  publishBanner({
    id: `${notification.request.identifier || "push"}-${Date.now()}`,
    title: content.title || "Notification",
    body: content.body || "",
    target: targetFrom(content.data),
  });
});

/**
 * Shows a banner without a push behind it, for anything the app
 * itself wants to announce in the same place.
 */
export function showInAppBanner(title: string, body: string) {
  publishBanner({
    id: `local-${Date.now()}`,
    title,
    body,
    target: {},
  });
}

/** one id per install, so the server can retire a stale token */
async function deviceId(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(DEVICE_KEY);
    if (saved) return saved;

    const fresh =
      "mobile-" +
      Math.random().toString(36).slice(2) +
      Date.now().toString(36);

    await AsyncStorage.setItem(DEVICE_KEY, fresh);
    return fresh;
  } catch {
    return "mobile-unknown";
  }
}

/**
 * A dashboard can mount before the session is on disk. Rather than
 * give up and never try again, wait a few seconds for the login to
 * land — the token is useless to the server without it.
 */
async function waitForSession(attempts = 10, gapMs = 1000) {
  for (let i = 0; i < attempts; i += 1) {
    const session = await getAuthSession();
    if (session?.token) return session;

    await new Promise((resolve) => setTimeout(resolve, gapMs));
  }

  return null;
}

/**
 * Asks for permission, reads the Expo token and hands it to the
 * backend. Safe to call on every launch: the server treats it as
 * an upsert keyed on the device.
 */
export async function registerForPush(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      _status = { step: "not-a-device" };
      return null;
    }

    if (Platform.OS === "android") {
      /** Android needs a channel before anything will show */
      await Notifications.setNotificationChannelAsync("default", {
        name: "Updates",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#2563EB",
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;

    if (status !== "granted") {
      const asked = await Notifications.requestPermissionsAsync();
      status = asked.status;
    }

    if (status !== "granted") {
      _status = { step: "permission-denied" };
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      (Constants as any)?.easConfig?.projectId;

    if (!projectId) {
      _status = {
        step: "no-project-id",
        detail: "expo.extra.eas.projectId is missing from app.json",
      };
      return null;
    }

    /**
     * The Expo token is the only one used. Delivery still runs over
     * FCM underneath on Android, so a build without google-services.json
     * fails here rather than later in silence.
     */
    let token: string;

    try {
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (error: any) {
      _status = {
        step: "token-failed",
        detail: error?.message || String(error),
      };
      console.error("Expo push token error:", error);
      return null;
    }

    const session = await waitForSession();

    if (!session?.token) {
      _status = { step: "waiting-for-login", token };
      return token;
    }

    const res = await apiFetch("/api/notifications/register-expo", session.token, {
      method: "POST",
      body: JSON.stringify({
        token,
        device: Device.modelName || Platform.OS,
        deviceId: await deviceId(),
      }),
    });

    _status = res.ok
      ? { step: "registered", token }
      : { step: "server-rejected", token, detail: `HTTP ${res.status}` };

    return token;
  } catch (error: any) {
    _status = { step: "token-failed", detail: error?.message || String(error) };
    console.error("Push registration error:", error);
    return null;
  }
}

/** Drops this device on logout so it stops receiving pushes. */
export async function unregisterPush(): Promise<void> {
  try {
    const session = await getAuthSession();
    if (!session?.token) return;

    const id = await deviceId();

    await apiFetch("/api/notifications/unregister-expo", session.token, {
      method: "POST",
      body: JSON.stringify({ deviceId: id }),
    });

    _status = { step: "idle" };
  } catch (error) {
    console.error("Push unregister error:", error);
  }
}

/** Pulls the target out of whatever shape the payload arrived in. */
function targetFrom(data: any): PushTarget {
  if (!data) return {};

  return {
    notificationId: data.notificationId || null,
    category: data.category || null,
    entityId: data.entityId || null,
  };
}

/**
 * The notification that opened the app from the background or
 * from cold, if there was one. Read once on mount.
 */
export async function openedFromPush(): Promise<PushTarget | null> {
  try {
    const response = await Notifications.getLastNotificationResponseAsync();
    if (!response) return null;

    return targetFrom(response.notification.request.content.data);
  } catch {
    return null;
  }
}

/** Fires when a notification is tapped while the app is running. */
export function onPushTapped(handler: (target: PushTarget) => void) {
  const sub = Notifications.addNotificationResponseReceivedListener(
    (response) => handler(targetFrom(response.notification.request.content.data))
  );

  return () => sub.remove();
}

/** Fires when one arrives with the app in the foreground. */
export function onPushReceived(handler: (target: PushTarget) => void) {
  const sub = Notifications.addNotificationReceivedListener((notification) =>
    handler(targetFrom(notification.request.content.data))
  );

  return () => sub.remove();
}

/** Clears the number on the app icon. */
export async function clearBadge(): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch {
    /* the platform may not have a badge */
  }
}
