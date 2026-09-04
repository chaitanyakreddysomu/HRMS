import React, { useState, useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  Animated,
  Dimensions,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { clearAuthSession, getAuthSession } from "../utils/authStorage";

type Props = NativeStackScreenProps<RootStackParamList, "AdminDashboard">;

const { width } = Dimensions.get("window");
const SIDEBAR_WIDTH = width * 0.8;

export default function AdminDashboardScreen({ route, navigation }: Props) {
  const name = route.params?.name || "Admin User";
  const role = route.params?.role || "ADMIN";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [userData, setUserData] = useState<{
    name: string;
    role: string;
    email: string;
    profileImage?: string;
  }>({
    name,
    role: "Super Admin",
    email: "admin@company.com",
  });

  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  // Load User Data from local storage & API
  useEffect(() => {
    async function loadUser() {
      const session = await getAuthSession();
      if (session?.user) {
        setUserData((prev) => ({
          ...prev,
          name: session.user.name || name,
          role: session.user.role || role,
          email: session.user.email || "admin@company.com",
        }));
      }

      if (session?.token) {
        try {
          const res = await fetch("http://192.168.1.34:5000/api/admin/profile", {
            headers: { Authorization: `Bearer ${session.token}` },
          });
          if (res.ok) {
            const apiUser = await res.json();
            setUserData({
              name: apiUser.name || name,
              role: apiUser.role || role,
              email: apiUser.email || "admin@company.com",
              profileImage: apiUser.profileImage || apiUser.avatar,
            });
          }
        } catch (e) {
          // Fallback to cached session data
        }
      }
    }
    loadUser();
  }, []);

  const openDrawer = () => {
    setSidebarOpen(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = (callback?: () => void) => {
    Animated.timing(slideAnim, {
      toValue: -SIDEBAR_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setSidebarOpen(false);
      if (callback) callback();
    });
  };

  const navMenuItems = [
    { label: "Home", icon: "home-outline", route: "AdminDashboard" },
    { label: "Pending Request", icon: "time-outline", route: "AdminPendingRequests" },
    { label: "Employees", icon: "people-outline", route: "AdminEmployees" },
    { label: "Documents", icon: "folder-open-outline", route: "AdminDocuments" },
    { label: "Attendance", icon: "calendar-outline", route: "AdminAttendance" },
    { label: "Leaves", icon: "briefcase-outline", route: "AdminLeaves" },
    { label: "Holidays", icon: "airplane-outline", route: "AdminHolidays" },
    { label: "Birthdays", icon: "gift-outline", route: "AdminBirthdays" },
    { label: "Payslips", icon: "cash-outline", route: "AdminPayslips" },
    { label: "Bank Details", icon: "card-outline", route: "AdminBankDetails" },
    { label: "Referrals", icon: "person-add-outline", route: "AdminReferrals" },
    { label: "Complaints", icon: "alert-circle-outline", route: "AdminComplaints" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      {/* ── Top Header ── */}
      <View className="px-6 py-4 flex-row items-center justify-between bg-white border-b border-gray-100 shadow-sm">
        {/* Floating Liquid Glass Hamburger */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={openDrawer}
          className="w-11 h-11 rounded-2xl bg-white border border-gray-100 items-center justify-center shadow-sm"
        >
          <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center">
            <Ionicons name="menu" size={24} color="#2563EB" />
          </View>
        </TouchableOpacity>

        {/* Header Title */}
        <Text className="text-red-600 text-xs font-bold tracking-wider">
          ADMIN CONTROL PANEL
        </Text>

        {/* Floating Liquid Glass Notification */}
        <TouchableOpacity
          activeOpacity={0.7}
          className="w-11 h-11 rounded-2xl bg-white border border-gray-100 items-center justify-center relative shadow-sm"
        >
          <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center">
            <Ionicons name="notifications-outline" size={21} color="#2563EB" />
          </View>

          {unreadNotifications > 0 && (
            <View className="absolute -top-1 right-1 bg-red-500 min-w-[20px] h-5 rounded-full px-1.5 items-center justify-center border-2 border-white">
              <Text className="text-white text-[10px] font-extrabold">
                {unreadNotifications}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Main Scroll View Content ── */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View className="rounded-3xl p-6 bg-blue-600 mb-6 shadow-xl shadow-blue-500/20">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-blue-100 text-[11px] tracking-wider uppercase font-bold">
              System Administrator
            </Text>
            <View className="px-3 py-1 rounded-full bg-white/20">
              <Text className="text-white text-[10px] font-extrabold tracking-wider">SUPER ADMIN</Text>
            </View>
          </View>

          <Text className="text-white text-2xl font-bold">{userData.name} 👋</Text>
          <Text className="text-blue-100 text-xs mt-1.5 leading-5">
            Full administrative access. Open the left menu to access all system modules.
          </Text>
        </View>

        {/* Overview Metrics */}
        <Text className="text-gray-400 text-xs tracking-widest uppercase font-bold mb-3">
          Admin Metrics Overview
        </Text>
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 rounded-2xl p-4 items-center bg-white border border-gray-100 shadow-sm">
            <View className="w-10 h-10 rounded-xl bg-red-50 items-center justify-center mb-2">
              <Ionicons name="people" size={20} color="#EF4444" />
            </View>
            <Text className="text-gray-900 text-xl font-bold">248</Text>
            <Text className="text-gray-500 text-[11px] mt-0.5 text-center font-medium">Total Users</Text>
          </View>

          <View className="flex-1 rounded-2xl p-4 items-center bg-white border border-gray-100 shadow-sm">
            <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center mb-2">
              <Ionicons name="shield-checkmark" size={20} color="#2563EB" />
            </View>
            <Text className="text-gray-900 text-xl font-bold">12</Text>
            <Text className="text-gray-500 text-[11px] mt-0.5 text-center font-medium">HR Managers</Text>
          </View>

          <View className="flex-1 rounded-2xl p-4 items-center bg-white border border-gray-100 shadow-sm">
            <View className="w-10 h-10 rounded-xl bg-emerald-50 items-center justify-center mb-2">
              <Ionicons name="pulse" size={20} color="#10B981" />
            </View>
            <Text className="text-gray-900 text-xl font-bold">99.9%</Text>
            <Text className="text-gray-500 text-[11px] mt-0.5 text-center font-medium">Server Uptime</Text>
          </View>
        </View>

        {/* Control Center */}
        <Text className="text-gray-400 text-xs tracking-widest uppercase font-bold mb-3">
          Control Center
        </Text>
        <View className="gap-3 mb-6">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate("AdminEmployees")}
            className="flex-row items-center rounded-2xl px-4 py-4 bg-white border border-gray-100 shadow-sm"
          >
            <View className="w-11 h-11 rounded-xl bg-red-50 items-center justify-center mr-3.5 border border-red-100">
              <Ionicons name="person-add-outline" size={20} color="#EF4444" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 text-sm font-semibold">User & Role Management</Text>
              <Text className="text-gray-500 text-xs mt-0.5">Provision new accounts or modify permissions</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Left Slide-In Drawer Sidebar ── */}
      <Modal
        animationType="none"
        transparent={true}
        visible={sidebarOpen}
        onRequestClose={() => closeDrawer()}
      >
        <View className="flex-1 flex-row">
          {/* Dark Backdrop Overlay */}
          <Pressable
            className="absolute inset-0 bg-black/40"
            onPress={() => closeDrawer()}
          />

          {/* Animated Sliding Sidebar Panel */}
          <Animated.View
            style={{
              width: SIDEBAR_WIDTH,
              transform: [{ translateX: slideAnim }],
            }}
            className="bg-white h-full shadow-2xl justify-between border-r border-gray-100"
          >
            <View className="flex-1">
              {/* Header: User Profile Section & Close Button */}
              <View className="px-6 pt-12 pb-5 flex-row items-center justify-between border-b border-gray-100">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => closeDrawer(() => navigation.navigate("AdminProfile"))}
                  className="flex-row items-center flex-1 pr-2"
                >
                  {/* Perfect Circle Profile Avatar / Image */}
                  {userData.profileImage ? (
                    <Image
                      source={{ uri: userData.profileImage }}
                      className="w-12 h-12 rounded-full mr-3 bg-gray-100"
                    />
                  ) : (
                    <View className="w-12 h-12 rounded-full bg-blue-600 items-center justify-center shadow-md shadow-blue-500/20 mr-3">
                      <Text className="text-white text-lg font-bold">
                        {userData.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  {/* Clean 2-line layout: Name & Role */}
                  <View className="flex-1 justify-center">
                    <Text className="text-gray-900 font-bold text-base leading-5" numberOfLines={1}>
                      {userData.name}
                    </Text>
                    <Text className="text-blue-600 text-xs font-semibold mt-0.5" numberOfLines={1}>
                      {userData.role}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => closeDrawer()}
                  className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
                >
                  <Ionicons name="close" size={20} color="#4B5563" />
                </TouchableOpacity>
              </View>

              {/* Navigation Menu List */}
              <ScrollView className="flex-1 px-4 pt-3" showsVerticalScrollIndicator={false}>
                {navMenuItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.7}
                    onPress={() => {
                      closeDrawer(() => {
                        if (item.route !== "AdminDashboard") {
                          navigation.navigate(item.route as any);
                        }
                      });
                    }}
                    className="flex-row items-center px-4 py-3 rounded-2xl mb-1 active:bg-gray-100"
                  >
                    <Ionicons name={item.icon as any} size={22} color="#4B5563" />
                    <Text className="text-gray-800 text-sm font-semibold ml-4">
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Footer Logout Button */}
            <View className="p-5 border-t border-gray-100">
              <TouchableOpacity
                className="flex-row items-center bg-gray-50 py-3.5 px-4 rounded-2xl gap-3 border border-gray-200"
                onPress={() => {
                  closeDrawer(async () => {
                    await clearAuthSession();
                    navigation.replace("Login");
                  });
                }}
              >
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                <Text className="text-gray-700 text-sm font-bold">Logout</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
