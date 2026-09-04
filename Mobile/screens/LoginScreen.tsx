import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";

import { saveAuthSession, getAuthSession } from "../utils/authStorage";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

/**
 * ============================================================
 * BACKEND CONFIGURATION
 * ============================================================
 *
 * Physical Android/iPhone:
 *   Use your computer's LAN IP:
 *   http://192.168.1.34:5000
 *
 * Android Emulator:
 *   http://10.0.2.2:5000
 *
 * iOS Simulator:
 *   http://127.0.0.1:5000
 *
 * Make sure your backend listens on 0.0.0.0, not only localhost.
 */
const LOCAL_IP = "192.168.1.34";
const API_BASE_URL = `http://${LOCAL_IP}:5000`;

const LOGIN_ENDPOINT = `${API_BASE_URL}/api/auth/login`;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /**
   * ============================================================
   * NAVIGATION BY ROLE
   * ============================================================
   */
  const navigateByRole = (roleStr: string, userName: string) => {
    const normalized = String(roleStr || "EMPLOYEE").toUpperCase();

    console.log("Navigating by role:", normalized);

    if (normalized === "ADMIN") {
      navigation.replace("AdminDashboard", {
        role: "ADMIN",
        name: userName,
      });
    } else if (normalized === "HR") {
      navigation.replace("HrDashboard", {
        role: "HR",
        name: userName,
      });
    } else {
      navigation.replace("UserDashboard", {
        role: "EMPLOYEE",
        name: userName,
      });
    }
  };

  /**
   * ============================================================
   * CHECK SAVED SESSION
   * ============================================================
   */
  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const session = await getAuthSession();

        console.log("Saved session found:", !!session);

        if (
          mounted &&
          session?.token &&
          session?.user &&
          session.user.role
        ) {
          console.log("Restoring session for:", session.user.email);
          console.log("Restored role:", session.user.role);

          navigateByRole(
            session.user.role,
            session.user.name || "User"
          );

          return;
        }
      } catch (err) {
        console.error("Session restoration error:", err);
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * ============================================================
   * LOGIN API
   * ============================================================
   */
  const handleLogin = async () => {
    if (loading) {
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password.trim()) {
      setErrorMsg("Please enter email and password");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    console.log("------------------------------------");
    console.log("LOGIN START");
    console.log("LOGIN URL:", LOGIN_ENDPOINT);
    console.log("EMAIL:", cleanEmail);
    console.log("------------------------------------");

    try {
      /**
       * --------------------------------------------------------
       * SEND LOGIN REQUEST
       * --------------------------------------------------------
       */
      const response = await fetch(LOGIN_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: cleanEmail,
          password: password,
        }),
      });

      /**
       * --------------------------------------------------------
       * READ RESPONSE AS TEXT FIRST
       *
       * This prevents JSON parsing errors from hiding the
       * actual backend response.
       * --------------------------------------------------------
       */
      const responseText = await response.text();

      console.log("LOGIN HTTP STATUS:", response.status);
      console.log("LOGIN RAW RESPONSE:", responseText);

      let data: any = null;

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error("Backend returned invalid JSON:", parseError);

          throw new Error(
            `Backend returned an invalid response (${response.status}).`
          );
        }
      }

      /**
       * --------------------------------------------------------
       * HANDLE HTTP ERROR
       * --------------------------------------------------------
       */
      if (!response.ok) {
        const backendMessage =
          data?.message ||
          data?.error ||
          data?.msg ||
          `Login failed (${response.status})`;

        throw new Error(backendMessage);
      }

      /**
       * --------------------------------------------------------
       * VALIDATE ACCESS TOKEN
       *
       * Your other API requests depend on this token.
       * --------------------------------------------------------
       */
      const accessToken =
        data?.accessToken ||
        data?.token ||
        data?.access_token;

      if (!accessToken) {
        console.error("Login response does not contain token:", data);

        throw new Error(
          "Login succeeded, but the server did not return an access token."
        );
      }

      /**
       * --------------------------------------------------------
       * GET USER DATA
       * --------------------------------------------------------
       */
      const backendUser = data?.user || data?.data?.user || {};

      const userId =
        backendUser?.id ||
        backendUser?._id ||
        data?.userId ||
        data?.id;

      const userName =
        backendUser?.name ||
        backendUser?.fullName ||
        data?.name ||
        "User";

      const userEmail =
        backendUser?.email ||
        cleanEmail;

      const rawRole =
        backendUser?.role ||
        data?.role ||
        "EMPLOYEE";

      const normalizedRole = String(rawRole).toUpperCase();

      /**
       * --------------------------------------------------------
       * DEBUG LOGIN DATA
       * --------------------------------------------------------
       */
      console.log("------------------------------------");
      console.log("LOGIN SUCCESS");
      console.log("USER ID:", userId);
      console.log("USER NAME:", userName);
      console.log("USER EMAIL:", userEmail);
      console.log("USER ROLE:", normalizedRole);
      console.log("ACCESS TOKEN RECEIVED:", !!accessToken);
      console.log("REFRESH TOKEN RECEIVED:", !!data?.refreshToken);
      console.log("------------------------------------");

      /**
       * --------------------------------------------------------
       * SAVE REAL AUTH SESSION
       * --------------------------------------------------------
       */
      await saveAuthSession({
        token: accessToken,

        refreshToken:
          data?.refreshToken ||
          data?.refresh_token ||
          undefined,

        user: {
          id: userId,
          name: userName,
          role: normalizedRole,
          email: userEmail,
        },
      });

      console.log("Auth session saved successfully.");

      /**
       * --------------------------------------------------------
       * NAVIGATE
       * --------------------------------------------------------
       */
      navigateByRole(normalizedRole, userName);
    } catch (err: any) {
      console.error("------------------------------------");
      console.error("LOGIN ERROR");
      console.error("Error:", err);
      console.error("Message:", err?.message);
      console.error("------------------------------------");

      let message = "Unable to login.";

      if (
        err?.message?.includes("Network request failed") ||
        err?.message?.includes("Failed to fetch")
      ) {
        message =
          `Cannot connect to backend.\n\n` +
          `Make sure:\n` +
          `• Backend is running on port 5000\n` +
          `• Phone and computer are on the same Wi-Fi\n` +
          `• Backend IP is ${LOCAL_IP}\n` +
          `• Backend listens on 0.0.0.0`;
      } else if (err?.name === "AbortError") {
        message = "Login request timed out. Check your backend connection.";
      } else if (err?.message) {
        message = err.message;
      }

      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * ============================================================
   * CHECKING SAVED SESSION
   * ============================================================
   */
  if (checkingSession) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />

        <Text className="text-gray-500 text-xs mt-3 font-semibold">
          Restoring session...
        </Text>
      </SafeAreaView>
    );
  }

  /**
   * ============================================================
   * UI
   * ============================================================
   */
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 justify-center py-8">

            {/* ==================================================
                BRAND HEADER
            ================================================== */}
            <View className="items-center mb-8">
              <View className="w-16 h-16 rounded-2xl items-center justify-center mb-3.5 bg-blue-600 shadow-md shadow-blue-500/30">
                <Ionicons
                  name="business"
                  size={34}
                  color="#ffffff"
                />
              </View>

              <Text className="text-gray-900 text-3xl font-bold tracking-tight">
                HRMS
              </Text>

              <Text className="text-gray-500 text-xs mt-1 tracking-widest uppercase font-semibold">
                Human Resource Management
              </Text>
            </View>

            {/* ==================================================
                LOGIN CARD
            ================================================== */}
            <View className="rounded-3xl p-6 bg-white border border-gray-200 shadow-xl shadow-gray-200/50">

              <Text className="text-gray-900 text-xl font-bold mb-1">
                Welcome back
              </Text>

              <Text className="text-gray-500 text-sm mb-6">
                Sign in to your account
              </Text>

              {/* ==================================================
                  ERROR
              ================================================== */}
              {errorMsg ? (
                <View className="flex-row items-center bg-red-50 border border-red-200 p-3.5 rounded-xl mb-4">
                  <Ionicons
                    name="alert-circle-outline"
                    size={18}
                    color="#EF4444"
                  />

                  <Text className="text-red-600 text-xs ml-2.5 flex-1 font-medium">
                    {errorMsg}
                  </Text>
                </View>
              ) : null}

              {/* ==================================================
                  EMAIL
              ================================================== */}
              <View className="mb-4">
                <Text className="text-gray-600 text-[11px] font-semibold mb-2 ml-1 tracking-wider uppercase">
                  Email Address
                </Text>

                <View
                  className={`flex-row items-center rounded-xl px-4 py-3.5 bg-gray-50 border ${
                    emailFocused
                      ? "border-blue-600 bg-white"
                      : "border-gray-200"
                  }`}
                >
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={
                      emailFocused
                        ? "#2563EB"
                        : "#9CA3AF"
                    }
                  />

                  <TextInput
                    className="flex-1 text-gray-900 text-sm ml-2.5 p-0"
                    placeholder="you@company.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* ==================================================
                  PASSWORD
              ================================================== */}
              <View className="mb-5">
                <Text className="text-gray-600 text-[11px] font-semibold mb-2 ml-1 tracking-wider uppercase">
                  Password
                </Text>

                <View
                  className={`flex-row items-center rounded-xl px-4 py-3.5 bg-gray-50 border ${
                    passwordFocused
                      ? "border-blue-600 bg-white"
                      : "border-gray-200"
                  }`}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={
                      passwordFocused
                        ? "#2563EB"
                        : "#9CA3AF"
                    }
                  />

                  <TextInput
                    className="flex-1 text-gray-900 text-sm ml-2.5 p-0"
                    placeholder="••••••••"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    onSubmitEditing={handleLogin}
                    returnKeyType="done"
                  />

                  <TouchableOpacity
                    onPress={() =>
                      setShowPassword(!showPassword)
                    }
                    activeOpacity={0.7}
                    disabled={loading}
                  >
                    <Ionicons
                      name={
                        showPassword
                          ? "eye-outline"
                          : "eye-off-outline"
                      }
                      size={18}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* ==================================================
                  SIGN IN
              ================================================== */}
              <TouchableOpacity
                activeOpacity={0.85}
                className="rounded-xl py-4 items-center bg-blue-600 shadow-md shadow-blue-500/20"
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator color="#ffffff" />

                    <Text className="text-white font-bold text-sm ml-3">
                      Signing in...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-white font-bold text-base tracking-wide">
                    Sign In
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* ==================================================
                DEVELOPMENT LOGIN HELPERS
            ================================================== */}
            <View className="mt-6 items-center">
              <Text className="text-gray-400 text-xs mb-2.5 font-medium">
                Quick Test Login Roles:
              </Text>

              <View className="flex-row gap-2">
                <TouchableOpacity
                  className="bg-white border border-gray-200 px-4 py-2.5 rounded-xl shadow-sm"
                  disabled={loading}
                  onPress={() => {
                    setEmail("admin@company.com");
                    setPassword("password123");
                    setErrorMsg(null);
                  }}
                >
                  <Text className="text-blue-600 text-xs font-semibold">
                    Admin
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-white border border-gray-200 px-4 py-2.5 rounded-xl shadow-sm"
                  disabled={loading}
                  onPress={() => {
                    setEmail("hr@company.com");
                    setPassword("password123");
                    setErrorMsg(null);
                  }}
                >
                  <Text className="text-blue-600 text-xs font-semibold">
                    HR
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-white border border-gray-200 px-4 py-2.5 rounded-xl shadow-sm"
                  disabled={loading}
                  onPress={() => {
                    setEmail("emp@company.com");
                    setPassword("password123");
                    setErrorMsg(null);
                  }}
                >
                  <Text className="text-blue-600 text-xs font-semibold">
                    Employee
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ==================================================
                BACKEND DEBUG INFO
            ================================================== */}
            <View className="mt-5 items-center">
              <Text className="text-gray-300 text-[10px]">
                Backend: {API_BASE_URL}
              </Text>
            </View>

            {/* ==================================================
                FOOTER
            ================================================== */}
            <Text className="text-gray-400 text-xs text-center mt-4">
              ICS · Human Resource Management System
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
