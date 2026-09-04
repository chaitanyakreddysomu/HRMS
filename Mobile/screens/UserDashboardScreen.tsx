import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";

import { clearAuthSession } from "../utils/authStorage";

type Props = NativeStackScreenProps<RootStackParamList, "UserDashboard">;

export default function UserDashboardScreen({ route, navigation }: Props) {
  const name = route.params?.name || "Employee User";

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      {/* ── Header ── */}
      <View className="px-6 py-4 flex-row items-center justify-between bg-white border-b border-gray-200 shadow-sm">
        <View>
          <Text className="text-gray-400 text-[10px] tracking-widest uppercase font-semibold">
            ICS HRMS
          </Text>
          <Text className="text-gray-900 text-xl font-bold">Employee Portal</Text>
        </View>
        <TouchableOpacity
          className="w-10 h-10 rounded-full bg-blue-600 items-center justify-center shadow-md shadow-blue-500/20"
          onPress={async () => {
            await clearAuthSession();
            navigation.replace("Login");
          }}
        >
          <Text className="text-white text-base font-bold">{name.charAt(0).toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}>
        {/* Welcome Banner */}
        <View className="rounded-3xl p-6 bg-blue-600 mb-6 shadow-lg shadow-blue-500/25">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-blue-100 text-[11px] tracking-wider uppercase font-semibold">
              Employee Portal
            </Text>
            <View className="px-3 py-1 rounded-full bg-white/20">
              <Text className="text-white text-[10px] font-bold tracking-wider">EMPLOYEE</Text>
            </View>
          </View>

          <Text className="text-white text-2xl font-bold">{name} 👋</Text>
          <Text className="text-blue-100 text-xs mt-1.5 leading-5 font-normal">
            View attendance, apply for leave, and download payslips.
          </Text>
        </View>

        {/* Overview Metrics */}
        <Text className="text-gray-400 text-xs tracking-widest uppercase font-bold mb-3">
          My Work Metrics
        </Text>
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 rounded-2xl p-4 items-center bg-white border border-gray-200 shadow-sm">
            <Ionicons name="checkmark-circle-outline" size={22} color="#10B981" />
            <Text className="text-gray-900 text-xl font-bold mt-2">22 Days</Text>
            <Text className="text-gray-500 text-[11px] mt-0.5 text-center font-medium">Attendance</Text>
          </View>
          <View className="flex-1 rounded-2xl p-4 items-center bg-white border border-gray-200 shadow-sm">
            <Ionicons name="briefcase-outline" size={22} color="#2563EB" />
            <Text className="text-gray-900 text-xl font-bold mt-2">14 Days</Text>
            <Text className="text-gray-500 text-[11px] mt-0.5 text-center font-medium">Leave Balance</Text>
          </View>
          <View className="flex-1 rounded-2xl p-4 items-center bg-white border border-gray-200 shadow-sm">
            <Ionicons name="cash-outline" size={22} color="#F59E0B" />
            <Text className="text-gray-900 text-xl font-bold mt-2">Paid</Text>
            <Text className="text-gray-500 text-[11px] mt-0.5 text-center font-medium">Latest Payslip</Text>
          </View>
        </View>

        {/* User Actions */}
        <Text className="text-gray-400 text-xs tracking-widest uppercase font-bold mb-3">
          My Quick Actions
        </Text>
        <View className="gap-3 mb-6">
          <TouchableOpacity className="flex-row items-center rounded-2xl px-4 py-4 bg-white border border-gray-200 shadow-sm">
            <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center mr-3.5">
              <Ionicons name="document-text-outline" size={20} color="#2563EB" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 text-sm font-semibold">Apply for Leave</Text>
              <Text className="text-gray-500 text-xs mt-0.5">Submit sick or privilege leave request</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center rounded-2xl px-4 py-4 bg-white border border-gray-200 shadow-sm">
            <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center mr-3.5">
              <Ionicons name="cash-outline" size={20} color="#2563EB" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 text-sm font-semibold">My Payslips</Text>
              <Text className="text-gray-500 text-xs mt-0.5">Download monthly salary breakdown</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="flex-row items-center justify-center bg-red-50 border border-red-200 py-3.5 rounded-xl gap-2 mt-2"
          onPress={async () => {
            await clearAuthSession();
            navigation.replace("Login");
          }}
        >
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text className="text-red-600 text-sm font-semibold">Logout / Switch Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
