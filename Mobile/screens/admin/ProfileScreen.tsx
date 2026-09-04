import React, { useEffect, useRef, useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { getAuthSession } from "../../utils/authStorage";
import * as Clipboard from "expo-clipboard";



type Props = NativeStackScreenProps<RootStackParamList, "AdminProfile">;

type PopupType = "success" | "error" | "warning" | "info";

interface CustomPopupState {
  visible: boolean;
  type: PopupType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

function EditField({
  label,
  value,
  placeholder,
  icon,
  onChangeText,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  placeholder: string;
  icon: keyof typeof Ionicons.glyphMap;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "phone-pad" | "email-address" | "numeric";
}) {
  return (
    <View className="mb-4">
      <Text className="text-gray-700 text-xs font-bold mb-2">
        {label}
      </Text>

      <View className="h-12 flex-row items-center rounded-2xl bg-gray-50 border border-gray-200 px-3">
        <Ionicons
          name={icon}
          size={19}
          color="#6B7280"
        />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType={keyboardType}
          className="flex-1 ml-3 text-gray-900 text-sm font-medium"
        />
      </View>
    </View>
  );
}

export default function ProfileScreen({ navigation }: Props) {
  const [securityModalOpen, setSecurityModalOpen] = useState(false);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);

  /*
   * 2FA setup flow:
   *
   * "setup"    -> QR + manual key
   * "verify"   -> verification code
   */
  const [twoFactorStep, setTwoFactorStep] = useState<"setup" | "verify">(
    "setup"
  );

  const [setupData, setSetupData] = useState<{
    secret: string;
    qrCodeDataUrl: string;
  } | null>(null);

  const [verificationCode, setVerificationCode] = useState("");
  const [verificationLoading, setVerificationLoading] = useState(false);

  const [copied, setCopied] = useState(false);

  /*
   * Custom popup
   */
  const [popup, setPopup] = useState<CustomPopupState>({
    visible: false,
    type: "info",
    title: "",
    message: "",
  });

  const [profile, setProfile] = useState<any>({
    name: "Admin User",
    designation: "Super Administrator",
    status: "Active",
    empId: "EMP-001",
    department: "Administration",
    joiningDate: "Oct 12, 2021",
    workLocation: "Headquarters",
    email: "admin@company.com",
    phone: "+1 (555) 019-2834",
    dob: "Mar 15, 1994",
    gender: "Female",
    bloodGroup: "O+",
    emergencyContactName: "John Doe",
    emergencyContactPhone: "+1 (555) 987-6543",
    uan: "100987654321",
    bankName: "HDFC Bank",
    accountNumber: "5010023456789",
    ifsc: "HDFC0001234",
    profileImage: null,
  });


  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
const [savingProfile, setSavingProfile] = useState(false);
const [editForm, setEditForm] = useState({
  name: "",
  phone: "",
  workLocation: "",
  dob: "",
  bloodGroup: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
});

const [showDobPicker, setShowDobPicker] = useState(false);


const [customPopup, setCustomPopup] = useState<{
  visible: boolean;
  type: "success" | "error" | "warning" | "confirm";
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
}>({
  visible: false,
  type: "success",
  title: "",
  message: "",
});

const openEditProfile = () => {
  setEditForm({
    name: profile.name || "",
    phone: profile.phone || "",
    workLocation: profile.workLocation || "",
    dob: profile.dob || "",
    bloodGroup: profile.bloodGroup || "",
    emergencyContactName: profile.emergencyContactName || "",
    emergencyContactPhone: profile.emergencyContactPhone || "",
  });

  setEditProfileModalOpen(true);
};


const handleCloseEditProfile = () => {
  if (savingProfile) return;

  setCustomPopup({
    visible: true,
    type: "confirm",
    title: "Discard Changes?",
    message:
      "Your changes have not been saved. Do you want to close the editor?",
    confirmText: "Discard",
    cancelText: "Keep Editing",
    onConfirm: () => {
      setCustomPopup((prev) => ({
        ...prev,
        visible: false,
      }));

      setEditProfileModalOpen(false);
    },
  });
};

const handleSaveProfile = async () => {
  if (!editForm.name.trim()) {
    setCustomPopup({
      visible: true,
      type: "error",
      title: "Invalid Name",
      message: "Please enter your full name.",
    });
    return;
  }

  setSavingProfile(true);

  try {
    const session = await getAuthSession();

    if (!session?.token) {
      setCustomPopup({
        visible: true,
        type: "error",
        title: "Session Expired",
        message: "Please log in again to update your profile.",
      });
      return;
    }

    const res = await fetch(
      "http://192.168.1.34:5000/api/admin/profile",
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  name: editForm.name,
  phone: editForm.phone,
  address: editForm.workLocation,
  dob: editForm.dob,
  bloodGroup: editForm.bloodGroup,
  emergencyContact: {
    name: editForm.emergencyContactName,
    phone: editForm.emergencyContactPhone,
  },
}),

      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => null);

      setCustomPopup({
        visible: true,
        type: "error",
        title: "Update Failed",
        message:
          data?.message ||
          "Unable to update your profile. Please try again.",
      });

      return;
    }

    const data = await res.json();

    setProfile((prev: any) => ({
  ...prev,
  name: data.name || editForm.name,
  phone: data.phone || editForm.phone,
  workLocation: data.address || editForm.workLocation,
  dob: data.dob
    ? new Date(data.dob).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : editForm.dob,
  bloodGroup: data.bloodGroup || editForm.bloodGroup,
  emergencyContactName:
    data.emergencyContact?.name ||
    editForm.emergencyContactName,
  emergencyContactPhone:
    data.emergencyContact?.phone ||
    editForm.emergencyContactPhone,
}));


    setEditProfileModalOpen(false);

    setCustomPopup({
      visible: true,
      type: "success",
      title: "Profile Updated",
      message: "Your profile information has been updated successfully.",
      confirmText: "Done",
    });
  } catch (error) {
    console.error("Failed to update profile:", error);

    setCustomPopup({
      visible: true,
      type: "error",
      title: "Something Went Wrong",
      message:
        "We couldn't update your profile right now. Please try again.",
    });
  } finally {
    setSavingProfile(false);
  }
};

  /*
   * =========================================
   * CUSTOM POPUP HELPERS
   * =========================================
   */

  const closePopup = () => {
    setPopup((prev) => ({
      ...prev,
      visible: false,
    }));
  };

  const showPopup = (
    type: PopupType,
    title: string,
    message: string,
    options?: {
      confirmText?: string;
      cancelText?: string;
      onConfirm?: () => void;
      onCancel?: () => void;
    }
  ) => {
    setPopup({
      visible: true,
      type,
      title,
      message,
      confirmText: options?.confirmText || "OK",
      cancelText: options?.cancelText,
      onConfirm: options?.onConfirm,
      onCancel: options?.onCancel,
    });
  };

  const handlePopupConfirm = () => {
    const callback = popup.onConfirm;

    setPopup((prev) => ({
      ...prev,
      visible: false,
    }));

    if (callback) {
      setTimeout(() => {
        callback();
      }, 150);
    }
  };

  const handlePopupCancel = () => {
    const callback = popup.onCancel;

    setPopup((prev) => ({
      ...prev,
      visible: false,
    }));

    if (callback) {
      setTimeout(() => {
        callback();
      }, 150);
    }
  };

  /*
   * =========================================
   * POPUP COLORS
   * =========================================
   */

  const getPopupColors = () => {
    switch (popup.type) {
      case "success":
        return {
          iconBg: "bg-emerald-100",
          iconColor: "#059669",
          button: "bg-emerald-600",
          icon: "checkmark-circle",
        };

      case "error":
        return {
          iconBg: "bg-red-100",
          iconColor: "#DC2626",
          button: "bg-red-600",
          icon: "close-circle",
        };

      case "warning":
        return {
          iconBg: "bg-orange-100",
          iconColor: "#EA580C",
          button: "bg-orange-600",
          icon: "warning",
        };

      default:
        return {
          iconBg: "bg-blue-100",
          iconColor: "#2563EB",
          button: "bg-blue-600",
          icon: "information-circle",
        };
    }
  };

  /*
   * =========================================
   * LOAD PROFILE
   * =========================================
   */

  useEffect(() => {
    async function loadProfile() {
      try {
        const session = await getAuthSession();

        if (session?.token) {
          const res = await fetch(
            "http://192.168.1.34:5000/api/admin/profile",
            {
              headers: {
                Authorization: `Bearer ${session.token}`,
              },
            }
          );

          if (res.ok) {
            const data = await res.json();

            setProfile({
              name: data.name || "Admin User",
              designation: data.designation || "Super Administrator",
              status: data.status || "Active",
              empId: data.id || "EMP-001",
              department: data.department || "Administration",

              joiningDate: data.joiningDate
                ? new Date(data.joiningDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
                : "Oct 12, 2021",

              workLocation: data.address || "Headquarters",
              email: data.email || "admin@company.com",
              phone: data.phone || "+1 (555) 019-2834",

              dob: data.dob
                ? new Date(data.dob).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
                : "Mar 15, 1994",

              gender: data.gender || "Female",
              bloodGroup: data.bloodGroup || "O+",

              emergencyContactName:
                data.emergencyContact?.name || "John Doe",

              emergencyContactPhone:
                data.emergencyContact?.phone || "+1 (555) 987-6543",

              uan: data.uan || "100987654321",

              bankName:
                data.bankDetails?.bankName || "HDFC Bank",

              accountNumber:
                data.bankDetails?.accountNumber || "5010023456789",

              ifsc:
                data.bankDetails?.ifsc || "HDFC0001234",

              profileImage: data.profileImage || data.avatar,
            });
          }
        }
      } catch (err) {
        console.error("Failed to load profile details:", err);
      }
    }

    loadProfile();
  }, []);

  /*
   * =========================================
   * FETCH 2FA STATUS
   * =========================================
   */

  const fetch2FAStatus = async () => {
    try {
      setSecurityLoading(true);

      const session = await getAuthSession();

      if (!session?.token) {
        return;
      }

      const res = await fetch(
        "http://192.168.1.34:5000/api/auth/2fa/status",
        {
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();

        setTwoFactorEnabled(Boolean(data.twoFactorEnabled));
      }
    } catch (error) {
      console.error("Failed to fetch 2FA status:", error);
    } finally {
      setSecurityLoading(false);
    }
  };

  useEffect(() => {
    fetch2FAStatus();
  }, []);

  /*
   * =========================================
   * OPEN SECURITY MODAL
   * =========================================
   */

  const openSecurityModal = async () => {
    setSecurityModalOpen(true);

    setTwoFactorStep("setup");
    setVerificationCode("");
    setSetupData(null);
    setCopied(false);

    await fetch2FAStatus();
  };

  /*
   * =========================================
   * START 2FA SETUP
   * =========================================
   */

  const handleStartSetup = async () => {
    try {
      setSecurityLoading(true);

      const session = await getAuthSession();

      if (!session?.token) {
        showPopup(
          "error",
          "Authentication Required",
          "Your session has expired. Please login again."
        );
        return;
      }

      const res = await fetch(
        "http://192.168.1.34:5000/api/auth/2fa/setup",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.ok) {
        const data = await res.json();

        setSetupData({
          secret: data.secret,
          qrCodeDataUrl: data.qrCodeDataUrl,
        });

        setTwoFactorStep("setup");
        setVerificationCode("");
      } else {
        let data: any = {};

        try {
          data = await res.json();
        } catch { }

        showPopup(
          "error",
          "Setup Failed",
          data.message || "Failed to initialize 2FA setup."
        );
      }
    } catch (error) {
      console.error("2FA setup error:", error);

      showPopup(
        "error",
        "Something Went Wrong",
        "An error occurred while preparing 2FA setup."
      );
    } finally {
      setSecurityLoading(false);
    }
  };



  const copyManualKey = async () => {
    if (!setupData?.secret) return;

    try {
      // const Clipboard = await import("expo-clipboard");

      await Clipboard.setStringAsync(setupData.secret);

      setCopied(true);

      showPopup(
        "success",
        "Copied",
        "Manual setup key has been copied to your clipboard."
      );

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Copy error:", error);

      showPopup(
        "error",
        "Copy Failed",
        "Unable to copy the manual setup key."
      );
    }
  };

  /*
   * =========================================
   * GO TO VERIFICATION STEP
   * =========================================
   */

  const goToVerification = () => {
    if (!setupData) {
      showPopup(
        "warning",
        "Setup Required",
        "Please start the authenticator setup first."
      );

      return;
    }

    setTwoFactorStep("verify");
    setVerificationCode("");
  };

  /*
   * =========================================
   * VERIFY & ENABLE 2FA
   * =========================================
   */

  const handleVerifySetup = async () => {
    const code = verificationCode.replace(/\D/g, "");

    if (code.length !== 6) {
      showPopup(
        "warning",
        "Invalid Code",
        "Please enter the complete 6-digit verification code."
      );

      return;
    }

    try {
      setVerificationLoading(true);

      const session = await getAuthSession();

      if (!session?.token) {
        showPopup(
          "error",
          "Authentication Required",
          "Your session has expired. Please login again."
        );

        return;
      }

      const res = await fetch(
        "http://192.168.1.34:5000/api/auth/2fa/verify",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
          }),
        }
      );

      if (res.ok) {
        setTwoFactorEnabled(true);

        setSetupData(null);
        setVerificationCode("");
        setTwoFactorStep("setup");

        showPopup(
          "success",
          "2FA Enabled",
          "Two-Factor Authentication has been enabled successfully."
        );
      } else {
        let data: any = {};

        try {
          data = await res.json();
        } catch { }

        showPopup(
          "error",
          "Verification Failed",
          data.message || "Invalid verification code."
        );
      }
    } catch (error) {
      console.error("2FA verification error:", error);

      showPopup(
        "error",
        "Verification Failed",
        "An error occurred during verification."
      );
    } finally {
      setVerificationLoading(false);
    }
  };

  /*
   * =========================================
   * CANCEL SETUP
   * =========================================
   */

  const requestCancelSetup = () => {
    showPopup(
      "warning",
      "Cancel 2FA Setup?",
      "Your current authenticator setup will be discarded. You can configure it again later.",
      {
        confirmText: "Yes, Cancel",
        cancelText: "Continue Setup",
        onConfirm: () => {
          setSetupData(null);
          setVerificationCode("");
          setTwoFactorStep("setup");
          setCopied(false);
        },
      }
    );
  };

  /*
   * =========================================
   * DISABLE 2FA
   * =========================================
   */

  const requestDisable2FA = () => {
    showPopup(
      "warning",
      "Disable Two-Factor Authentication?",
      "After disabling 2FA, your account will no longer require an authenticator verification code during login.",
      {
        confirmText: "Disable 2FA",
        cancelText: "Keep Protection",
        onConfirm: executeDisable2FA,
      }
    );
  };

  const executeDisable2FA = async () => {
    try {
      setSecurityLoading(true);

      const session = await getAuthSession();

      if (!session?.token) {
        showPopup(
          "error",
          "Authentication Required",
          "Your session has expired. Please login again."
        );

        return;
      }

      const res = await fetch(
        "http://192.168.1.34:5000/api/auth/2fa/disable",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.ok) {
        setTwoFactorEnabled(false);

        setSetupData(null);
        setVerificationCode("");
        setTwoFactorStep("setup");

        showPopup(
          "success",
          "2FA Disabled",
          "Two-Factor Authentication has been disabled successfully."
        );
      } else {
        let data: any = {};

        try {
          data = await res.json();
        } catch { }

        showPopup(
          "error",
          "Disable Failed",
          data.message || "Failed to disable Two-Factor Authentication."
        );
      }
    } catch (error) {
      console.error("Disable 2FA error:", error);

      showPopup(
        "error",
        "Something Went Wrong",
        "An error occurred while disabling Two-Factor Authentication."
      );
    } finally {
      setSecurityLoading(false);
    }
  };

  /*
   * =========================================
   * CLOSE SECURITY MODAL
   * =========================================
   */

  const closeSecurityModal = () => {
    if (setupData) {
      showPopup(
        "warning",
        "Leave 2FA Setup?",
        "Your current setup will be discarded if you leave this screen.",
        {
          confirmText: "Leave Setup",
          cancelText: "Stay",
          onConfirm: () => {
            setSetupData(null);
            setVerificationCode("");
            setTwoFactorStep("setup");
            setSecurityModalOpen(false);
          },
        }
      );

      return;
    }

    setSecurityModalOpen(false);
  };

  /*
   * =========================================
   * SECURITY CARD COLORS
   * =========================================
   */

  const securityCardBackground = twoFactorEnabled
    ? "bg-emerald-50"
    : "bg-red-50";

  const securityCardBorder = twoFactorEnabled
    ? "border-emerald-200"
    : "border-red-200";

  const securityIconBackground = twoFactorEnabled
    ? "bg-emerald-100"
    : "bg-red-100";

  const securityIconColor = twoFactorEnabled ? "#059669" : "#DC2626";

  const securityTitleColor = twoFactorEnabled
    ? "text-emerald-900"
    : "text-red-900";

  const securityDescriptionColor = twoFactorEnabled
    ? "text-emerald-700"
    : "text-red-700";

  /*
   * =========================================
   * RENDER
   * =========================================
   */

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      {/* =========================================
          HEADER
      ========================================= */}

      <View className="px-6 py-4 flex-row items-center justify-between bg-white border-b border-gray-100 shadow-sm">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-11 h-11 rounded-2xl bg-gray-50 border border-gray-200 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={22} color="#374151" />
        </TouchableOpacity>

        <Text className="text-gray-900 text-xl font-bold">
          My Profile
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={openEditProfile}
          className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 items-center justify-center"
        >
          <Ionicons name="pencil-outline" size={20} color="#2563EB" />
        </TouchableOpacity>

      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* =========================================
            PROFILE HEADER
        ========================================= */}

        <View className="items-center mb-6">
          <View className="relative">
            <View className="w-32 h-32 rounded-full p-1 bg-white border-2 border-blue-600 shadow-md">
              {profile.profileImage ? (
                <Image
                  source={{ uri: profile.profileImage }}
                  className="w-full h-full rounded-full"
                />
              ) : (
                <View className="w-full h-full rounded-full bg-blue-600 items-center justify-center">
                  <Text className="text-white text-5xl font-bold">
                    {profile.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <View className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-white items-center justify-center">
              <Ionicons
                name="checkmark"
                size={14}
                color="#ffffff"
              />
            </View>
          </View>

          <Text className="text-gray-900 text-2xl font-extrabold mt-4">
            {profile.name}
          </Text>

          <Text className="text-gray-500 text-sm mt-1 font-semibold">
            {profile.designation}
          </Text>

          <View className="mt-3 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 flex-row items-center">
            <View className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2" />

            <Text className="text-emerald-700 text-xs font-bold">
              {profile.status}
            </Text>
          </View>
        </View>

        {/* =========================================
            EMPLOYMENT DETAILS
        ========================================= */}

        <View className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-5">
          <View className="flex-row items-center mb-5">
            <Ionicons
              name="briefcase-outline"
              size={22}
              color="#2563EB"
            />

            <Text className="text-gray-900 font-bold text-lg ml-3">
              Employment Details
            </Text>
          </View>

          <View>
            <ProfileRow
              label="Employee ID"
              value={profile.empId}
            />

            <ProfileRow
              label="Department"
              value={profile.department}
            />

            <ProfileRow
              label="Date of Joining"
              value={profile.joiningDate}
            />

            <ProfileRow
              label="Work Location"
              value={profile.workLocation}
              last
            />
          </View>
        </View>

        {/* =========================================
            PERSONAL INFORMATION
        ========================================= */}

        <View className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-5">
          <View className="flex-row items-center mb-5">
            <Ionicons
              name="person-outline"
              size={22}
              color="#2563EB"
            />

            <Text className="text-gray-900 font-bold text-lg ml-3">
              Personal Information
            </Text>
          </View>

          <ProfileRow
            label="Email"
            value={profile.email}
            valueClass="text-blue-600"
          />

          <ProfileRow
            label="Phone"
            value={profile.phone}
          />

          <ProfileRow
            label="Date of Birth"
            value={profile.dob}
          />

          <ProfileRow
            label="Gender"
            value={profile.gender}
          />

          <ProfileRow
            label="Blood Group"
            value={profile.bloodGroup}
            valueClass="text-red-600"
          />

          <ProfileRow
            label="Emergency Contact Name"
            value={profile.emergencyContactName}
          />

          <ProfileRow
            label="Emergency Contact Phone"
            value={profile.emergencyContactPhone}
            last
          />
        </View>

        {/* =========================================
            FINANCIAL DETAILS
        ========================================= */}

        <View className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-5">
          <View className="flex-row items-center mb-5">
            <Ionicons
              name="card-outline"
              size={22}
              color="#2563EB"
            />

            <Text className="text-gray-900 font-bold text-lg ml-3">
              Financial Details
            </Text>
          </View>

          <ProfileRow
            label="UAN Number"
            value={profile.uan}
          />

          <ProfileRow
            label="Bank Name"
            value={profile.bankName}
          />

          <ProfileRow
            label="Account Number"
            value={profile.accountNumber}
          />

          <ProfileRow
            label="IFSC Code"
            value={profile.ifsc}
            last
          />
        </View>

        {/* =========================================
            SECURITY & 2FA
        ========================================= */}

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={openSecurityModal}
          className={`${securityCardBackground} rounded-3xl p-5 border ${securityCardBorder} flex-row items-center justify-between mb-4`}
        >
          <View className="flex-row items-center flex-1">
            <View
              className={`w-12 h-12 rounded-2xl ${securityIconBackground} items-center justify-center mr-4`}
            >
              <Ionicons
                name={
                  twoFactorEnabled
                    ? "shield-checkmark"
                    : "shield-outline"
                }
                size={25}
                color={securityIconColor}
              />
            </View>

            <View className="flex-1">
              <View className="flex-row items-center">
                <Text
                  className={`${securityTitleColor} font-bold text-base`}
                >
                  Security & 2FA
                </Text>

                {/* ENABLED / DISABLED BADGE */}

                <View
                  className={`ml-2 px-2.5 py-1 rounded-full ${twoFactorEnabled
                    ? "bg-emerald-100"
                    : "bg-red-100"
                    }`}
                >
                  <Text
                    className={`text-[10px] font-extrabold ${twoFactorEnabled
                      ? "text-emerald-700"
                      : "text-red-700"
                      }`}
                  >
                    {twoFactorEnabled ? "Enabled" : "Disabled"}
                  </Text>
                </View>
              </View>

              <Text
                className={`${securityDescriptionColor} text-xs mt-1`}
              >
                {twoFactorEnabled
                  ? "Your account is protected with 2FA"
                  : "Two-factor authentication is not enabled"}
              </Text>
            </View>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={securityIconColor}
          />
        </TouchableOpacity>
      </ScrollView>

      {/* =========================================
          SECURITY BOTTOM SHEET
      ========================================= */}

      <Modal
        animationType="slide"
        transparent
        visible={securityModalOpen}
        onRequestClose={closeSecurityModal}
      >
        <View className="flex-1 justify-end bg-black/50">
          <Pressable
            className="flex-1"
            onPress={closeSecurityModal}
          />

          <View className="bg-white rounded-t-[36px] px-6 pt-4 pb-10 border-t border-gray-100">
            {/* DRAG HANDLE */}

            <View className="items-center mb-4">
              <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </View>

            {/* =========================================
                MODAL HEADER
            ========================================= */}

            <View className="flex-row items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <View className="flex-row items-center flex-1">
                <View
                  className={`w-10 h-10 rounded-2xl items-center justify-center mr-3 ${twoFactorEnabled
                    ? "bg-emerald-50"
                    : "bg-red-50"
                    }`}
                >
                  <Ionicons
                    name={
                      twoFactorEnabled
                        ? "shield-checkmark"
                        : "shield-outline"
                    }
                    size={22}
                    color={
                      twoFactorEnabled
                        ? "#059669"
                        : "#DC2626"
                    }
                  />
                </View>

                <Text className="text-gray-900 text-xl font-bold">
                  Security Settings
                </Text>
              </View>

              <TouchableOpacity
                onPress={closeSecurityModal}
                className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
              >
                <Ionicons
                  name="close"
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            {/* =========================================
                ENABLED STATE
            ========================================= */}

            {twoFactorEnabled ? (
              <View className="bg-emerald-50 rounded-3xl p-5 border border-emerald-200">
                <View className="flex-row items-center mb-4">
                  <View className="w-12 h-12 rounded-2xl bg-emerald-100 items-center justify-center mr-4">
                    <Ionicons
                      name="shield-checkmark"
                      size={26}
                      color="#059669"
                    />
                  </View>

                  <View className="flex-1">
                    <Text className="text-emerald-950 font-bold text-base">
                      Your account is protected
                    </Text>

                    <View className="flex-row items-center mt-1">
                      <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />

                      <Text className="text-emerald-700 text-xs font-semibold">
                        Two-Factor Authentication Enabled
                      </Text>
                    </View>
                  </View>
                </View>

                <Text className="text-emerald-700 text-xs leading-5 mb-5">
                  Your account requires an authenticator verification
                  code during login.
                </Text>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={requestDisable2FA}
                  disabled={securityLoading}
                  className="bg-red-600 rounded-2xl py-3.5 items-center"
                >
                  {securityLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View className="flex-row items-center">
                      <Ionicons
                        name="shield-outline"
                        size={18}
                        color="#fff"
                      />

                      <Text className="text-white font-bold text-sm ml-2">
                        Disable 2FA Protection
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              /* =========================================
                 DISABLED / SETUP STATE
              ========================================= */

              <>
                {/* =========================================
                    SETUP STEP
                ========================================= */}

                {twoFactorStep === "setup" && (
                  <View>
                    {!setupData ? (
                      <View className="bg-red-50 rounded-3xl p-5 border border-red-200">
                        <View className="flex-row items-center mb-4">
                          <View className="w-12 h-12 rounded-2xl bg-red-100 items-center justify-center mr-4">
                            <Ionicons
                              name="shield-outline"
                              size={26}
                              color="#DC2626"
                            />
                          </View>

                          <View className="flex-1">
                            <Text className="text-red-950 font-bold text-base">
                              Protect your account with 2FA
                            </Text>

                            <Text className="text-red-700 text-xs mt-1">
                              Protection is currently disabled
                            </Text>
                          </View>
                        </View>

                        <Text className="text-red-700 text-xs leading-5 mb-5">
                          Add an extra layer of security using an
                          authenticator app such as Google Authenticator.
                        </Text>

                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={handleStartSetup}
                          disabled={securityLoading}
                          className="bg-blue-600 rounded-2xl py-3.5 items-center"
                        >
                          {securityLoading ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <View className="flex-row items-center">
                              <Ionicons
                                name="shield-checkmark-outline"
                                size={18}
                                color="#fff"
                              />

                              <Text className="text-white font-bold text-sm ml-2">
                                Configure Two-Factor Authentication
                              </Text>

                              <Ionicons
                                name="arrow-forward"
                                size={17}
                                color="#fff"
                                style={{ marginLeft: 8 }}
                              />
                            </View>
                          )}
                        </TouchableOpacity>
                      </View>
                    ) : (
                      /* =========================================
                         QR + MANUAL KEY
                      ========================================= */

                      <View className="bg-gray-50 rounded-3xl border border-gray-200 overflow-hidden">
                        <View className="px-5 py-4 bg-white border-b border-gray-100">
                          <View className="flex-row items-center">
                            <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center mr-3">
                              <Ionicons
                                name="key-outline"
                                size={21}
                                color="#2563EB"
                              />
                            </View>

                            <View className="flex-1">
                              <Text className="text-gray-900 font-bold text-base">
                                Setup Authenticator
                              </Text>

                              <Text className="text-gray-500 text-xs mt-1">
                                Scan the QR code or use the manual key.
                              </Text>
                            </View>
                          </View>
                        </View>

                        <View className="p-5">
                          {/* QR CODE */}

                          <View className="items-center">
                            <View className="bg-white rounded-2xl p-4 border border-gray-200">
                              <Image
                                source={{
                                  uri: setupData.qrCodeDataUrl,
                                }}
                                style={{
                                  width: 210,
                                  height: 210,
                                }}
                                resizeMode="contain"
                              />
                            </View>

                            <Text className="text-gray-800 text-sm font-bold mt-4">
                              Scan this QR code
                            </Text>

                            <Text className="text-gray-500 text-xs text-center mt-1 leading-5">
                              Open your authenticator app and scan
                              this code.
                            </Text>
                          </View>

                          {/* MANUAL KEY */}

                          <View className="mt-6">
                            <Text className="text-gray-800 text-xs font-bold">
                              Manual setup key
                            </Text>

                            <Text className="text-gray-500 text-xs mt-1 mb-2">
                              If you cannot scan the QR code, enter
                              this key manually.
                            </Text>

                            <View className="bg-white border border-gray-200 rounded-2xl p-3 flex-row items-center">
                              <Text
                                selectable
                                className="flex-1 text-blue-600 text-xs font-bold"
                              >
                                {setupData.secret}
                              </Text>

                              <TouchableOpacity
                                onPress={copyManualKey}
                                className="w-9 h-9 rounded-xl bg-gray-100 items-center justify-center ml-2"
                              >
                                <Ionicons
                                  name={
                                    copied
                                      ? "checkmark"
                                      : "copy-outline"
                                  }
                                  size={18}
                                  color={
                                    copied
                                      ? "#059669"
                                      : "#6B7280"
                                  }
                                />
                              </TouchableOpacity>
                            </View>
                          </View>

                          {/* NEXT */}

                          <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={goToVerification}
                            className="bg-blue-600 rounded-2xl py-3.5 items-center mt-6"
                          >
                            <View className="flex-row items-center">
                              <Text className="text-white font-bold text-sm">
                                Next: Verify Code
                              </Text>

                              <Ionicons
                                name="arrow-forward"
                                size={18}
                                color="#fff"
                                style={{ marginLeft: 8 }}
                              />
                            </View>
                          </TouchableOpacity>

                          {/* CANCEL */}

                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={requestCancelSetup}
                            className="py-3 items-center mt-1"
                          >
                            <Text className="text-gray-500 text-sm font-semibold">
                              Cancel Setup
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* =========================================
                    VERIFICATION STEP
                ========================================= */}

                {twoFactorStep === "verify" && (
                  <View className="bg-gray-50 rounded-3xl border border-gray-200 overflow-hidden">
                    {/* HEADER */}

                    <View className="px-5 py-4 bg-white border-b border-gray-100">
                      <View className="flex-row items-center">
                        <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center mr-3">
                          <Ionicons
                            name="shield-checkmark-outline"
                            size={21}
                            color="#2563EB"
                          />
                        </View>

                        <View className="flex-1">
                          <Text className="text-gray-900 font-bold text-base">
                            Verify Authenticator
                          </Text>

                          <Text className="text-gray-500 text-xs mt-1">
                            Enter the 6-digit code from your app.
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View className="p-5">
                      {/* VERIFICATION CODE */}

                      <Text className="text-gray-800 text-sm font-bold">
                        Verification code
                      </Text>

                      <Text className="text-gray-500 text-xs mt-1 mb-4">
                        Enter the 6-digit code shown in your
                        authenticator app.
                      </Text>

                      <TextInput
                        value={verificationCode}
                        onChangeText={(value) => {
                          const cleaned = value
                            .replace(/\D/g, "")
                            .slice(0, 6);

                          setVerificationCode(cleaned);
                        }}
                        keyboardType="number-pad"
                        maxLength={6}
                        placeholder="000000"
                        placeholderTextColor="#9CA3AF"
                        autoFocus
                        className="bg-white border border-gray-200 rounded-2xl h-16 px-4 text-center text-2xl font-bold text-gray-900 tracking-[8px]"
                      />

                      {/* BUTTONS */}

                      <View className="flex-row mt-6">
                        {/* CANCEL */}

                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={requestCancelSetup}
                          disabled={verificationLoading}
                          className="flex-1 border border-gray-300 bg-white rounded-2xl py-3.5 items-center mr-2"
                        >
                          <Text className="text-gray-700 font-bold text-sm">
                            Cancel
                          </Text>
                        </TouchableOpacity>

                        {/* VERIFY */}

                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={handleVerifySetup}
                          disabled={
                            verificationLoading ||
                            verificationCode.length !== 6
                          }
                          className={`flex-1 rounded-2xl py-3.5 items-center ml-2 ${verificationCode.length === 6 &&
                            !verificationLoading
                            ? "bg-blue-600"
                            : "bg-gray-300"
                            }`}
                        >
                          {verificationLoading ? (
                            <View className="flex-row items-center">
                              <ActivityIndicator color="#fff" />

                              <Text className="text-white font-bold text-sm ml-2">
                                Verifying...
                              </Text>
                            </View>
                          ) : (
                            <View className="flex-row items-center">
                              <Ionicons
                                name="shield-checkmark"
                                size={17}
                                color={
                                  verificationCode.length === 6
                                    ? "#fff"
                                    : "#9CA3AF"
                                }
                              />

                              <Text
                                className={`font-bold text-sm ml-2 ${verificationCode.length === 6
                                  ? "text-white"
                                  : "text-gray-500"
                                  }`}
                              >
                                Verify & Enable
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      </View>

                      {/* BACK */}

                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                          setTwoFactorStep("setup");
                        }}
                        disabled={verificationLoading}
                        className="py-3 items-center mt-2"
                      >
                        <Text className="text-blue-600 text-xs font-semibold">
                          Back to Setup
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* =========================================
          CUSTOM ALERT / CONFIRMATION POPUP
      ========================================= */}

      <Modal
        visible={popup.visible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (popup.cancelText) {
            handlePopupCancel();
          } else {
            closePopup();
          }
        }}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="w-full max-w-[390px] bg-white rounded-[28px] overflow-hidden shadow-2xl">
            {/* POPUP CONTENT */}

            <View className="px-6 pt-7 pb-5 items-center">
              {/* ICON */}

              <View
                className={`w-16 h-16 rounded-2xl ${getPopupColors().iconBg} items-center justify-center mb-4`}
              >
                <Ionicons
                  name={getPopupColors().icon as any}
                  size={32}
                  color={getPopupColors().iconColor}
                />
              </View>

              {/* TITLE */}

              <Text className="text-gray-900 text-xl font-bold text-center">
                {popup.title}
              </Text>

              {/* MESSAGE */}

              <Text className="text-gray-500 text-sm text-center leading-5 mt-2">
                {popup.message}
              </Text>
            </View>

            {/* BUTTONS */}

            <View className="px-6 pb-6">
              {popup.cancelText ? (
                <View className="flex-row">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handlePopupCancel}
                    className="flex-1 h-12 rounded-2xl border border-gray-200 bg-gray-50 items-center justify-center mr-2"
                  >
                    <Text className="text-gray-700 font-bold text-sm">
                      {popup.cancelText}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handlePopupConfirm}
                    className={`flex-1 h-12 rounded-2xl ${getPopupColors().button} items-center justify-center ml-2`}
                  >
                    <Text className="text-white font-bold text-sm">
                      {popup.confirmText || "Confirm"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handlePopupConfirm}
                  className={`h-12 rounded-2xl ${getPopupColors().button} items-center justify-center`}
                >
                  <Text className="text-white font-bold text-sm">
                    {popup.confirmText || "OK"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>


      <Modal
  animationType="slide"
  transparent
  visible={editProfileModalOpen}
  onRequestClose={() => {
    if (savingProfile) return;

    setCustomPopup({
      visible: true,
      type: "confirm",
      title: "Discard Changes?",
      message:
        "You have unsaved profile changes. Are you sure you want to close without saving?",
      confirmText: "Discard",
      cancelText: "Keep Editing",
      onConfirm: () => {
        setCustomPopup((prev) => ({
          ...prev,
          visible: false,
        }));
        setEditProfileModalOpen(false);
      },
    });
  }}
>
  <View className="flex-1 justify-end bg-black/50">
    <Pressable
      className="flex-1"
      onPress={() => {
        if (savingProfile) return;

        setCustomPopup({
          visible: true,
          type: "confirm",
          title: "Discard Changes?",
          message:
            "You have unsaved profile changes. Are you sure you want to close without saving?",
          confirmText: "Discard",
          cancelText: "Keep Editing",
          onConfirm: () => {
            setCustomPopup((prev) => ({
              ...prev,
              visible: false,
            }));
            setEditProfileModalOpen(false);
          },
        });
      }}
    />

    <View className="bg-white rounded-t-[36px] px-6 pt-5 pb-10 max-h-[90%]">
      {/* Handle */}
      <View className="items-center mb-4">
        <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
      </View>

      {/* Header */}
      <View className="flex-row items-center justify-between pb-4 border-b border-gray-100">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 items-center justify-center mr-3">
            <Ionicons
              name="create-outline"
              size={22}
              color="#2563EB"
            />
          </View>

          <View>
            <Text className="text-gray-900 text-xl font-bold">
              Edit Profile
            </Text>
            <Text className="text-gray-400 text-xs mt-0.5">
              Update your personal details
            </Text>
          </View>
        </View>

        <TouchableOpacity
          disabled={savingProfile}
          onPress={() => {
            setCustomPopup({
              visible: true,
              type: "confirm",
              title: "Discard Changes?",
              message:
                "Your changes have not been saved. Do you want to close the editor?",
              confirmText: "Discard",
              cancelText: "Keep Editing",
              onConfirm: () => {
                setCustomPopup((prev) => ({
                  ...prev,
                  visible: false,
                }));
                setEditProfileModalOpen(false);
              },
            });
          }}
          className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
        >
          <Ionicons name="close" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: 20,
          paddingBottom: 20,
        }}
      >
        
       

       {/* Full Name */}
<EditField
  label="Full Name"
  value={editForm.name}
  placeholder="Enter your name"
  icon="person-outline"
  onChangeText={(value) =>
    setEditForm((prev) => ({
      ...prev,
      name: value,
    }))
  }
/>

{/* Phone */}
<EditField
  label="Phone"
  value={editForm.phone}
  placeholder="Enter phone number"
  icon="call-outline"
  keyboardType="phone-pad"
  onChangeText={(value) =>
    setEditForm((prev) => ({
      ...prev,
      phone: value,
    }))
  }
/>

{/* Work Location */}
<EditField
  label="Work Location"
  value={editForm.workLocation}
  placeholder="Enter work location"
  icon="location-outline"
  onChangeText={(value) =>
    setEditForm((prev) => ({
      ...prev,
      workLocation: value,
    }))
  }
/>

{/* Date of Birth */}
<View className="mb-4">
  <Text className="text-gray-700 text-xs font-bold mb-2">
    Date of Birth
  </Text>

  <TouchableOpacity
    activeOpacity={0.7}
    onPress={() => setShowDobPicker(true)}
    className="h-12 flex-row items-center rounded-2xl bg-gray-50 border border-gray-200 px-3"
  >
    {showDobPicker && (
  <DateTimePicker
    value={
      editForm.dob
        ? new Date(editForm.dob)
        : new Date(1995, 0, 1)
    }
    mode="date"
    display="default"
    maximumDate={new Date()}
    onChange={(event, selectedDate) => {
      setShowDobPicker(false);

      if (!selectedDate) return;

      const formattedDate = selectedDate.toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
        }
      );

      setEditForm((prev) => ({
        ...prev,
        dob: formattedDate,
      }));
    }}
  />
)}

    <Ionicons
      name="calendar-outline"
      size={19}
      color="#6B7280"
    />

    <Text
      className={`flex-1 ml-3 text-sm font-medium ${
        editForm.dob ? "text-gray-900" : "text-gray-400"
      }`}
    >
      {editForm.dob || "Select date of birth"}
    </Text>

    <Ionicons
      name="chevron-down-outline"
      size={18}
      color="#9CA3AF"
    />
  </TouchableOpacity>
</View>

{/* Blood Group */}
<EditField
  label="Blood Group"
  value={editForm.bloodGroup}
  placeholder="Enter blood group"
  icon="water-outline"
  onChangeText={(value) =>
    setEditForm((prev) => ({
      ...prev,
      bloodGroup: value,
    }))
  }
/>

{/* Emergency Contact Name */}
<EditField
  label="Emergency Contact Name"
  value={editForm.emergencyContactName}
  placeholder="Enter contact name"
  icon="person-add-outline"
  onChangeText={(value) =>
    setEditForm((prev) => ({
      ...prev,
      emergencyContactName: value,
    }))
  }
/>

{/* Emergency Contact Phone */}
<EditField
  label="Emergency Contact Phone"
  value={editForm.emergencyContactPhone}
  placeholder="Enter contact phone"
  icon="call-outline"
  keyboardType="phone-pad"
  onChangeText={(value) =>
    setEditForm((prev) => ({
      ...prev,
      emergencyContactPhone: value,
    }))
  }
/>


        {/* Buttons */}
        <View className="flex-row gap-3 mt-4">
          <TouchableOpacity
            disabled={savingProfile}
            onPress={() => {
              setCustomPopup({
                visible: true,
                type: "confirm",
                title: "Discard Changes?",
                message:
                  "Are you sure you want to cancel? Your changes will not be saved.",
                confirmText: "Discard",
                cancelText: "Keep Editing",
                onConfirm: () => {
                  setCustomPopup((prev) => ({
                    ...prev,
                    visible: false,
                  }));
                  setEditProfileModalOpen(false);
                },
              });
            }}
            className="flex-1 h-12 rounded-2xl bg-gray-100 border border-gray-200 items-center justify-center"
          >
            <Text className="text-gray-700 font-bold">
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={savingProfile}
            onPress={handleSaveProfile}
            className="flex-1 h-12 rounded-2xl bg-blue-600 items-center justify-center"
          >
            {savingProfile ? (
              <View className="flex-row items-center">
                <Ionicons
                  name="sync-outline"
                  size={18}
                  color="#fff"
                />
                <Text className="text-white font-bold ml-2">
                  Saving...
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <Ionicons
                  name="checkmark-circle-outline"
                  size={19}
                  color="#fff"
                />
                <Text className="text-white font-bold ml-2">
                  Save Changes
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  </View>
</Modal>

    </SafeAreaView>
  );
}

/*
 * =========================================
 * PROFILE ROW COMPONENT
 * =========================================
 */

function ProfileRow({
  label,
  value,
  valueClass = "text-gray-900",
  last = false,
}: {
  label: string;
  value: string;
  valueClass?: string;
  last?: boolean;
}) {
  return (
    <View
      className={`flex-row justify-between items-center ${!last ? "pb-3 mb-3 border-b border-gray-100" : ""
        }`}
    >
      <Text className="text-gray-500 text-sm font-medium flex-1 mr-4">
        {label}
      </Text>

      <Text
        className={`${valueClass} text-sm font-bold text-right flex-1`}
      >
        {value}
      </Text>
    </View>
  );
}
