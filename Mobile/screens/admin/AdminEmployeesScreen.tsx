import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  ActivityIndicator,
  Image,
  RefreshControl,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { getAuthSession } from "../../utils/authStorage";
import { apiFetch, resetBaseUrl } from "../../utils/api";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "AdminEmployees"
>;

interface Employee {
  _id: string;
  id: string;
  name: string;
  email: string;
  role: "HR" | "EMPLOYEE" | "ADMIN";
  department?: string;
  designation?: string;
  status: "Active" | "Inactive" | "Pending" | "Rejected";
  projectStatus?: "In Project" | "Bench" | "Training";
  phone?: string;
  address?: string;
  dob?: string | Date;
  bloodGroup?: string;
  joiningDate?: string | Date;
  package?: number;
  uan?: string;
  profileImage?: string;
  avatar?: string;
  emergencyContact?: {
    name: string;
    phone: string;
  };
}

const STATUS_OPTIONS = [
  "Active",
  "All",
  "Pending",
  "Inactive",
];

const ROLE_OPTIONS = [
  "All",
  "HR",
  "EMPLOYEE",
  "ADMIN",
];

const PROJECT_OPTIONS = [
  "All",
  "In Project",
  "Bench",
  "Training",
];

export default function AdminEmployeesScreen({
  navigation,
}: Props) {
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("Active");

  const [roleFilter, setRoleFilter] =
    useState("All");

  const [projectFilter, setProjectFilter] =
    useState("All");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedEmployee, setSelectedEmployee] =
    useState<Employee | null>(null);

  const [openDropdown, setOpenDropdown] =
    useState<"status" | "role" | "project" | null>(null);

  const debounceRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const requestIdRef = useRef(0);

  // ============================================================
  // FETCH EMPLOYEES
  // ============================================================

  const fetchEmployees = useCallback(
    async (
      pageToLoad = 1,
      opts: {
        silent?: boolean;
        resetUrl?: boolean;
      } = {}
    ) => {
      const requestId = ++requestIdRef.current;

      if (pageToLoad === 1) {
        if (!opts.silent) {
          setLoading(true);
        }
      } else {
        setLoadingMore(true);
      }

      setError(null);

      if (opts.resetUrl) {
        resetBaseUrl();
      }

      try {
        const session = await getAuthSession();

        if (!session?.token) {
          if (requestId === requestIdRef.current) {
            setError("Not authenticated.");
          }
          return;
        }

        const params = new URLSearchParams();

        params.append("page", pageToLoad.toString());
        params.append("limit", "15");

        if (searchTerm.trim()) {
          params.append(
            "search",
            searchTerm.trim()
          );
        }

        if (statusFilter !== "All") {
          params.append(
            "status",
            statusFilter
          );
        }

        if (projectFilter !== "All") {
          params.append(
            "projectStatus",
            projectFilter
          );
        }

        if (roleFilter !== "All") {
          params.append(
            "role",
            roleFilter
          );
        }

        const res = await apiFetch(
          `/api/admin/employees?${params.toString()}`,
          session.token
        );

        if (!res.ok) {
          const body = await res
            .json()
            .catch(() => ({}));

          throw new Error(
            body?.message ||
              `Server error (${res.status})`
          );
        }

        const data = await res.json();

        // Ignore stale requests.
        if (requestId !== requestIdRef.current) {
          return;
        }

        const newEmployees =
          Array.isArray(data.employees)
            ? data.employees
            : Array.isArray(data)
            ? data
            : [];

        if (pageToLoad === 1) {
          setEmployees(newEmployees);
        } else {
          setEmployees((prev) => {
            const existingIds = new Set(
              prev.map((item) => item._id || item.id)
            );

            const uniqueNewEmployees =
              newEmployees.filter(
                (item: Employee) =>
                  !existingIds.has(
                    item._id || item.id
                  )
              );

            return [
              ...prev,
              ...uniqueNewEmployees,
            ];
          });
        }

        if (data.pagination) {
          setPage(
            data.pagination.page ||
              pageToLoad
          );

          setTotalPages(
            data.pagination.pages || 1
          );
        } else {
          setPage(pageToLoad);
          setTotalPages(
            newEmployees.length < 15
              ? pageToLoad
              : pageToLoad + 1
          );
        }
      } catch (err: any) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        const message =
          err?.message?.includes(
            "Network request failed"
          )
            ? "Cannot reach server."
            : err?.message ||
              "Something went wrong.";

        setError(message);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
        }
      }
    },
    [
      searchTerm,
      statusFilter,
      roleFilter,
      projectFilter,
    ]
  );

  // ============================================================
  // SEARCH / FILTER DEBOUNCE
  // ============================================================

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchEmployees(1);
    }, 400);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [
    searchTerm,
    statusFilter,
    roleFilter,
    projectFilter,
  ]);

  // ============================================================
  // REFRESH
  // ============================================================

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);

    fetchEmployees(1, {
      silent: true,
      resetUrl: true,
    });
  }, [fetchEmployees]);

  // ============================================================
  // PAGINATION
  // ============================================================

  const loadMore = useCallback(() => {
    if (loading || loadingMore) {
      return;
    }

    if (page >= totalPages) {
      return;
    }

    fetchEmployees(page + 1, {
      silent: true,
    });
  }, [
    loading,
    loadingMore,
    page,
    totalPages,
    fetchEmployees,
  ]);

  // ============================================================
  // HELPERS
  // ============================================================

  const getInitial = (name?: string) =>
    name?.charAt(0)?.toUpperCase() || "?";

  const getRoleStyle = (role: string) => {
    if (role === "ADMIN") {
      return {
        bg: "#FAF5FF",
        border: "#E9D5FF",
        text: "#7E22CE",
      };
    }

    if (role === "HR") {
      return {
        bg: "#EFF6FF",
        border: "#DBEAFE",
        text: "#1D4ED8",
      };
    }

    return {
      bg: "#F9FAFB",
      border: "#E5E7EB",
      text: "#4B5563",
    };
  };

  const getStatusColor = (status: string) => {
    if (status === "Active") {
      return "#10B981";
    }

    if (status === "Pending") {
      return "#F59E0B";
    }

    return "#EF4444";
  };

  // ============================================================
  // DROPDOWN
  // ============================================================

  const renderDropdown = (
    type: "status" | "role" | "project",
    label: string,
    value: string,
    options: string[],
    setter: (value: string) => void
  ) => {
    const isOpen = openDropdown === type;

    return (
      <View
        style={{
          flex: 1,
          position: "relative",
          zIndex: isOpen ? 100 : 1,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() =>
            setOpenDropdown(
              isOpen ? null : type
            )
          }
          style={{
            minHeight: 46,
            paddingHorizontal: 12,
            borderRadius: 12,
            backgroundColor: "#F9FAFB",
            borderWidth: 1,
            borderColor: isOpen
              ? "#2563EB"
              : "#E5E7EB",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "#9CA3AF",
                fontSize: 9,
                fontWeight: "700",
                textTransform: "uppercase",
              }}
            >
              {label}
            </Text>

            <Text
              style={{
                color: "#111827",
                fontSize: 12,
                fontWeight: "700",
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {value === "All"
                ? `All ${label}`
                : value}
            </Text>
          </View>

          <Ionicons
            name={
              isOpen
                ? "chevron-up"
                : "chevron-down"
            }
            size={16}
            color="#6B7280"
          />
        </TouchableOpacity>

        {isOpen && (
          <View
            style={{
              position: "absolute",
              top: 50,
              left: 0,
              right: 0,
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 4,
              },
              shadowOpacity: 0.12,
              shadowRadius: 8,
              elevation: 8,
              overflow: "hidden",
            }}
          >
            {options.map((option) => {
              const selected =
                value === option;

              return (
                <TouchableOpacity
                  key={option}
                  onPress={() => {
                    setter(option);
                    setOpenDropdown(null);
                  }}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 11,
                    backgroundColor: selected
                      ? "#EFF6FF"
                      : "#FFFFFF",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent:
                      "space-between",
                  }}
                >
                  <Text
                    style={{
                      color: selected
                        ? "#2563EB"
                        : "#374151",
                      fontSize: 12,
                      fontWeight: selected
                        ? "700"
                        : "500",
                    }}
                  >
                    {option === "All"
                      ? `All ${label}`
                      : option}
                  </Text>

                  {selected && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color="#2563EB"
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  // ============================================================
  // EMPLOYEE CARD
  // ============================================================

  const renderEmployee = ({
    item,
  }: {
    item: Employee;
  }) => {
    const roleStyle = getRoleStyle(
      item.role
    );

    const photoUri =
      item.profileImage ||
      item.avatar;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() =>
          setSelectedEmployee(item)
        }
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 20,
          padding: 16,
          borderWidth: 1,
          borderColor: "#F3F4F6",
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        {/* PROFILE */}

        <View
          style={{
            position: "relative",
            marginRight: 14,
          }}
        >
          {photoUri ? (
            <Image
              source={{
                uri: photoUri,
              }}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor:
                  "#F3F4F6",
              }}
            />
          ) : (
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor:
                  "#EFF6FF",
                borderWidth: 1,
                borderColor:
                  "#DBEAFE",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: "#2563EB",
                  fontSize: 18,
                  fontWeight: "700",
                }}
              >
                {getInitial(item.name)}
              </Text>
            </View>
          )}

          <View
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor:
                getStatusColor(
                  item.status
                ),
              borderWidth: 2,
              borderColor:
                "#FFFFFF",
            }}
          />
        </View>

        {/* NAME + EMAIL */}

        <View
          style={{
            flex: 1,
            marginRight: 12,
          }}
        >
          <Text
            style={{
              color: "#111827",
              fontWeight: "700",
              fontSize: 15,
            }}
            numberOfLines={1}
          >
            {item.name}
          </Text>

          <Text
            style={{
              color: "#6B7280",
              fontSize: 12,
              marginTop: 3,
            }}
            numberOfLines={1}
          >
            {item.email}
          </Text>
        </View>

        {/* ROLE ONLY */}

        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 10,
            backgroundColor:
              roleStyle.bg,
            borderWidth: 1,
            borderColor:
              roleStyle.border,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "800",
              color: roleStyle.text,
            }}
          >
            {item.role}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#F9FAFB",
      }}
    >
      <StatusBar style="dark" />

      {/* ======================================================
          HEADER
      ====================================================== */}

      <View
        style={{
          paddingHorizontal: 24,
          paddingVertical: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#FFFFFF",
          borderBottomWidth: 1,
          borderBottomColor:
            "#F3F4F6",
        }}
      >
        <TouchableOpacity
          onPress={() =>
            navigation.goBack()
          }
          style={{
            width: 44,
            height: 44,
            borderRadius: 16,
            backgroundColor:
              "#F9FAFB",
            borderWidth: 1,
            borderColor:
              "#E5E7EB",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color="#374151"
          />
        </TouchableOpacity>

        <Text
          style={{
            color: "#111827",
            fontSize: 20,
            fontWeight: "700",
          }}
        >
          Employees
        </Text>

        <TouchableOpacity
          onPress={onRefresh}
          style={{
            width: 44,
            height: 44,
            borderRadius: 16,
            backgroundColor:
              "#EFF6FF",
            borderWidth: 1,
            borderColor:
              "#DBEAFE",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name="refresh-outline"
            size={20}
            color="#2563EB"
          />
        </TouchableOpacity>
      </View>

      {/* ======================================================
          STICKY SEARCH + FILTER AREA
      ====================================================== */}

      <View
        style={{
          backgroundColor: "#FFFFFF",
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor:
            "#F3F4F6",
          zIndex: 100,
        }}
      >
        {/* SEARCH */}

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor:
              "#F9FAFB",
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderWidth: 1,
            borderColor:
              "#E5E7EB",
            marginBottom: 10,
          }}
        >
          <Ionicons
            name="search-outline"
            size={20}
            color="#9CA3AF"
          />

          <TextInput
            style={{
              flex: 1,
              color: "#111827",
              fontSize: 14,
              marginLeft: 10,
              padding: 0,
            }}
            placeholder="Search employees..."
            placeholderTextColor="#9CA3AF"
            value={searchTerm}
            onChangeText={
              setSearchTerm
            }
          />

          {searchTerm.length > 0 && (
            <TouchableOpacity
              onPress={() =>
                setSearchTerm("")
              }
            >
              <Ionicons
                name="close-circle"
                size={18}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          )}
        </View>

        {/* DROPDOWNS */}

        <View
          style={{
            flexDirection: "row",
            gap: 8,
          }}
        >
          {renderDropdown(
            "status",
            "Status",
            statusFilter,
            STATUS_OPTIONS,
            setStatusFilter
          )}

          {renderDropdown(
            "role",
            "Role",
            roleFilter,
            ROLE_OPTIONS,
            setRoleFilter
          )}

          {renderDropdown(
            "project",
            "Project",
            projectFilter,
            PROJECT_OPTIONS,
            setProjectFilter
          )}
        </View>
      </View>

      {/* ======================================================
          EMPLOYEE LIST
      ====================================================== */}

      {loading ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator
            size="large"
            color="#2563EB"
          />
        </View>
      ) : error ? (
        <View
          style={{
            flex: 1,
            paddingHorizontal: 20,
            paddingTop: 30,
          }}
        >
          <View
            style={{
              backgroundColor:
                "#FFF7F7",
              borderRadius: 24,
              padding: 24,
              alignItems:
                "center",
              borderWidth: 1,
              borderColor:
                "#FECACA",
            }}
          >
            <Ionicons
              name="alert-circle-outline"
              size={32}
              color="#EF4444"
            />

            <Text
              style={{
                color: "#B91C1C",
                textAlign:
                  "center",
                marginTop: 8,
                marginBottom: 12,
              }}
            >
              {error}
            </Text>

            <TouchableOpacity
              onPress={() =>
                fetchEmployees(1)
              }
              style={{
                backgroundColor:
                  "#EF4444",
                paddingHorizontal:
                  20,
                paddingVertical:
                  10,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  color:
                    "#FFFFFF",
                  fontWeight:
                    "700",
                }}
              >
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={employees}
          keyExtractor={(item) =>
            item._id || item.id
          }
          renderItem={
            renderEmployee
          }
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 40,
            flexGrow:
              employees.length === 0
                ? 1
                : undefined,
          }}
          showsVerticalScrollIndicator={
            false
          }
          onEndReached={
            loadMore
          }
          onEndReachedThreshold={
            0.5
          }
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={
                refreshing
              }
              onRefresh={
                onRefresh
              }
              tintColor="#2563EB"
              colors={[
                "#2563EB",
              ]}
            />
          }
          ListEmptyComponent={
            <View
              style={{
                flex: 1,
                backgroundColor:
                  "#FFFFFF",
                borderRadius: 24,
                padding: 32,
                alignItems:
                  "center",
                justifyContent:
                  "center",
                borderWidth: 1,
                borderColor:
                  "#F3F4F6",
              }}
            >
              <Ionicons
                name="people-outline"
                size={36}
                color="#9CA3AF"
              />

              <Text
                style={{
                  color:
                    "#111827",
                  fontWeight:
                    "700",
                  fontSize: 16,
                  marginTop: 10,
                }}
              >
                No Employees Found
              </Text>

              <Text
                style={{
                  color:
                    "#9CA3AF",
                  fontSize: 12,
                  marginTop: 4,
                  textAlign:
                    "center",
                }}
              >
                Try adjusting
                your search or
                filters.
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View
                style={{
                  paddingVertical:
                    20,
                  alignItems:
                    "center",
                }}
              >
                <ActivityIndicator
                  size="small"
                  color="#2563EB"
                />

                <Text
                  style={{
                    color:
                      "#9CA3AF",
                    fontSize: 11,
                    marginTop: 6,
                  }}
                >
                  Loading more
                  employees...
                </Text>
              </View>
            ) : page >=
              totalPages &&
              employees.length > 0 ? (
              <View
                style={{
                  paddingVertical:
                    16,
                  alignItems:
                    "center",
                }}
              >
                <Text
                  style={{
                    color:
                      "#9CA3AF",
                    fontSize: 11,
                  }}
                >
                  No more
                  employees
                </Text>
              </View>
            ) : null
          }
        />
      )}

      {/* ======================================================
          EMPLOYEE DETAIL MODAL
      ====================================================== */}

      <Modal
        animationType="slide"
        transparent
        visible={
          !!selectedEmployee
        }
        onRequestClose={() =>
          setSelectedEmployee(
            null
          )
        }
      >
        <View
          style={{
            flex: 1,
            justifyContent:
              "flex-end",
            backgroundColor:
              "rgba(0,0,0,0.5)",
          }}
        >
          <Pressable
            style={{
              flex: 1,
            }}
            onPress={() =>
              setSelectedEmployee(
                null
              )
            }
          />

          <View
            style={{
              backgroundColor:
                "#FFFFFF",
              borderTopLeftRadius:
                36,
              borderTopRightRadius:
                36,
              padding: 24,
              paddingBottom: 40,
              maxHeight: "85%",
            }}
          >
            {/* HANDLE */}

            <View
              style={{
                alignItems:
                  "center",
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 5,
                  backgroundColor:
                    "#D1D5DB",
                  borderRadius: 3,
                }}
              />
            </View>

            {/* HEADER */}

            <View
              style={{
                flexDirection:
                  "row",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight:
                    "700",
                  color:
                    "#111827",
                }}
              >
                Employee Details
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setSelectedEmployee(
                    null
                  )
                }
                style={{
                  width: 36,
                  height: 36,
                  borderRadius:
                    18,
                  backgroundColor:
                    "#F3F4F6",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                }}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            {selectedEmployee && (
              <FlatList
                data={[
                  "profile",
                  "company",
                  "personal",
                  "contact",
                ]}
                keyExtractor={(
                  item
                ) => item}
                showsVerticalScrollIndicator={
                  false
                }
                contentContainerStyle={{
                  paddingBottom: 10,
                }}
                renderItem={({
                  item: section,
                }) => {
                  if (
                    section ===
                    "profile"
                  ) {
                    return (
                      <View
                        style={{
                          flexDirection:
                            "row",
                          alignItems:
                            "center",
                          backgroundColor:
                            "#F9FAFB",
                          padding: 16,
                          borderRadius:
                            18,
                          borderWidth: 1,
                          borderColor:
                            "#E5E7EB",
                          marginBottom: 16,
                        }}
                      >
                        <View
                          style={{
                            position:
                              "relative",
                            marginRight:
                              16,
                          }}
                        >
                          {selectedEmployee
                            .profileImage ||
                          selectedEmployee
                            .avatar ? (
                            <Image
                              source={{
                                uri:
                                  selectedEmployee
                                    .profileImage ||
                                  selectedEmployee
                                    .avatar,
                              }}
                              style={{
                                width: 64,
                                height: 64,
                                borderRadius: 32,
                              }}
                            />
                          ) : (
                            <View
                              style={{
                                width: 64,
                                height: 64,
                                borderRadius:
                                  32,
                                backgroundColor:
                                  "#2563EB",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                              }}
                            >
                              <Text
                                style={{
                                  color:
                                    "#FFFFFF",
                                  fontSize: 24,
                                  fontWeight:
                                    "700",
                                }}
                              >
                                {getInitial(
                                  selectedEmployee.name
                                )}
                              </Text>
                            </View>
                          )}

                          <View
                            style={{
                              position:
                                "absolute",
                              bottom: 2,
                              right: 2,
                              width: 14,
                              height: 14,
                              borderRadius:
                                7,
                              backgroundColor:
                                getStatusColor(
                                  selectedEmployee.status
                                ),
                              borderWidth:
                                2,
                              borderColor:
                                "#FFFFFF",
                            }}
                          />
                        </View>

                        <View
                          style={{
                            flex: 1,
                          }}
                        >
                          <Text
                            style={{
                              color:
                                "#111827",
                              fontWeight:
                                "700",
                              fontSize: 18,
                            }}
                            numberOfLines={
                              1
                            }
                          >
                            {
                              selectedEmployee.name
                            }
                          </Text>

                          <Text
                            style={{
                              color:
                                "#6B7280",
                              fontSize: 13,
                              marginTop: 2,
                            }}
                            numberOfLines={
                              1
                            }
                          >
                            {
                              selectedEmployee.email
                            }
                          </Text>

                          <View
                            style={{
                              flexDirection:
                                "row",
                              alignItems:
                                "center",
                              marginTop: 6,
                            }}
                          >
                            <Text
                              style={{
                                color:
                                  "#2563EB",
                                fontSize: 12,
                                fontWeight:
                                  "600",
                                marginRight:
                                  8,
                              }}
                            >
                              ID:{" "}
                              {
                                selectedEmployee.id
                              }
                            </Text>

                            <View
                              style={{
                                paddingHorizontal:
                                  7,
                                paddingVertical:
                                  3,
                                borderRadius:
                                  7,
                                backgroundColor:
                                  getRoleStyle(
                                    selectedEmployee.role
                                  ).bg,
                                borderWidth:
                                  1,
                                borderColor:
                                  getRoleStyle(
                                    selectedEmployee.role
                                  ).border,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 10,
                                  fontWeight:
                                    "700",
                                  color:
                                    getRoleStyle(
                                      selectedEmployee.role
                                    ).text,
                                }}
                              >
                                {
                                  selectedEmployee.role
                                }
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  }

                  if (
                    section ===
                    "company"
                  ) {
                    const fields = [
                      {
                        label:
                          "Department",
                        value:
                          selectedEmployee.department ||
                          "N/A",
                      },
                      {
                        label:
                          "Designation",
                        value:
                          selectedEmployee.designation ||
                          "N/A",
                      },
                      {
                        label:
                          "Joining Date",
                        value:
                          selectedEmployee.joiningDate
                            ? String(
                                selectedEmployee.joiningDate
                              ).split(
                                "T"
                              )[0]
                            : "N/A",
                      },
                      {
                        label:
                          "Project Status",
                        value:
                          selectedEmployee.projectStatus ||
                          "N/A",
                      },
                      {
                        label:
                          "UAN Number",
                        value:
                          selectedEmployee.uan ||
                          "N/A",
                      },
                    ];

                    return (
                      <View
                        style={{
                          backgroundColor:
                            "#F9FAFB",
                          borderRadius:
                            16,
                          padding: 16,
                          borderWidth: 1,
                          borderColor:
                            "#E5E7EB",
                          marginBottom: 16,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight:
                              "700",
                            color:
                              "#374151",
                            marginBottom:
                              12,
                          }}
                        >
                          Company Details
                        </Text>

                        {fields.map(
                          (
                            field,
                            index
                          ) => (
                            <View
                              key={
                                field.label
                              }
                              style={{
                                flexDirection:
                                  "row",
                                justifyContent:
                                  "space-between",
                                paddingBottom:
                                  index ===
                                  fields.length -
                                    1
                                    ? 0
                                    : 8,
                                marginBottom:
                                  index ===
                                  fields.length -
                                    1
                                    ? 0
                                    : 8,
                                borderBottomWidth:
                                  index ===
                                  fields.length -
                                    1
                                    ? 0
                                    : 1,
                                borderBottomColor:
                                  "#E5E7EB",
                              }}
                            >
                              <Text
                                style={{
                                  color:
                                    "#6B7280",
                                  fontSize: 12,
                                  fontWeight:
                                    "600",
                                }}
                              >
                                {
                                  field.label
                                }
                              </Text>

                              <Text
                                style={{
                                  color:
                                    "#111827",
                                  fontSize: 13,
                                  fontWeight:
                                    "700",
                                  flex: 1,
                                  textAlign:
                                    "right",
                                  marginLeft:
                                    16,
                                }}
                              >
                                {
                                  field.value
                                }
                              </Text>
                            </View>
                          )
                        )}
                      </View>
                    );
                  }

                  if (
                    section ===
                    "personal"
                  ) {
                    return (
                      <View
                        style={{
                          backgroundColor:
                            "#F9FAFB",
                          borderRadius:
                            16,
                          padding: 16,
                          borderWidth: 1,
                          borderColor:
                            "#E5E7EB",
                          marginBottom: 16,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight:
                              "700",
                            color:
                              "#374151",
                            marginBottom:
                              12,
                          }}
                        >
                          Personal Details
                        </Text>

                        <View
                          style={{
                            flexDirection:
                              "row",
                            justifyContent:
                              "space-between",
                            paddingBottom:
                              8,
                            marginBottom:
                              8,
                            borderBottomWidth:
                              1,
                            borderBottomColor:
                              "#E5E7EB",
                          }}
                        >
                          <Text
                            style={{
                              color:
                                "#6B7280",
                              fontSize: 12,
                              fontWeight:
                                "600",
                            }}
                          >
                            Date of Birth
                          </Text>

                          <Text
                            style={{
                              color:
                                "#111827",
                              fontSize: 13,
                              fontWeight:
                                "700",
                            }}
                          >
                            {selectedEmployee.dob
                              ? String(
                                  selectedEmployee.dob
                                ).split(
                                  "T"
                                )[0]
                              : "N/A"}
                          </Text>
                        </View>

                        <View
                          style={{
                            flexDirection:
                              "row",
                            justifyContent:
                              "space-between",
                          }}
                        >
                          <Text
                            style={{
                              color:
                                "#6B7280",
                              fontSize: 12,
                              fontWeight:
                                "600",
                            }}
                          >
                            Blood Group
                          </Text>

                          <Text
                            style={{
                              color:
                                "#111827",
                              fontSize: 13,
                              fontWeight:
                                "700",
                            }}
                          >
                            {
                              selectedEmployee.bloodGroup ||
                              "N/A"
                            }
                          </Text>
                        </View>
                      </View>
                    );
                  }

                  return (
                    <View
                      style={{
                        backgroundColor:
                          "#F9FAFB",
                        borderRadius:
                          16,
                        padding: 16,
                        borderWidth: 1,
                        borderColor:
                          "#E5E7EB",
                        marginBottom: 16,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight:
                            "700",
                          color:
                            "#374151",
                          marginBottom:
                            12,
                        }}
                      >
                        Contact Information
                      </Text>

                      {/* PHONE */}

                      <View
                        style={{
                          flexDirection:
                            "row",
                          justifyContent:
                            "space-between",
                          paddingBottom:
                            8,
                          marginBottom:
                            8,
                          borderBottomWidth:
                            1,
                          borderBottomColor:
                            "#E5E7EB",
                        }}
                      >
                        <Text
                          style={{
                            color:
                              "#6B7280",
                            fontSize: 12,
                            fontWeight:
                              "600",
                          }}
                        >
                          Phone
                        </Text>

                        <Text
                          style={{
                            color:
                              "#111827",
                            fontSize: 13,
                            fontWeight:
                              "700",
                          }}
                        >
                          {
                            selectedEmployee.phone ||
                            "N/A"
                          }
                        </Text>
                      </View>

                      {/* ADDRESS */}

                      <View
                        style={{
                          flexDirection:
                            "row",
                          justifyContent:
                            "space-between",
                          paddingBottom:
                            8,
                          marginBottom:
                            8,
                          borderBottomWidth:
                            1,
                          borderBottomColor:
                            "#E5E7EB",
                        }}
                      >
                        <Text
                          style={{
                            color:
                              "#6B7280",
                            fontSize: 12,
                            fontWeight:
                              "600",
                          }}
                        >
                          Address
                        </Text>

                        <Text
                          style={{
                            color:
                              "#111827",
                            fontSize: 13,
                            fontWeight:
                              "700",
                            flex: 1,
                            textAlign:
                              "right",
                            marginLeft:
                              16,
                          }}
                        >
                          {
                            selectedEmployee.address ||
                            "N/A"
                          }
                        </Text>
                      </View>

                      {/* EMERGENCY CONTACT */}

                      <View
                        style={{
                          flexDirection:
                            "row",
                          justifyContent:
                            "space-between",
                        }}
                      >
                        <Text
                          style={{
                            color:
                              "#6B7280",
                            fontSize: 12,
                            fontWeight:
                              "600",
                          }}
                        >
                          Emergency Contact
                        </Text>

                        <View
                          style={{
                            flex: 1,
                            marginLeft:
                              16,
                            alignItems:
                              "flex-end",
                          }}
                        >
                          {selectedEmployee
                            .emergencyContact
                            ?.name ? (
                            <>
                              <Text
                                style={{
                                  color:
                                    "#111827",
                                  fontSize: 13,
                                  fontWeight:
                                    "700",
                                  textAlign:
                                    "right",
                                }}
                              >
                                {
                                  selectedEmployee
                                    .emergencyContact
                                    .name
                                }
                              </Text>

                              <Text
                                style={{
                                  color:
                                    "#6B7280",
                                  fontSize: 12,
                                  marginTop:
                                    2,
                                }}
                              >
                                {
                                  selectedEmployee
                                    .emergencyContact
                                    .phone
                                }
                              </Text>
                            </>
                          ) : (
                            <Text
                              style={{
                                color:
                                  "#111827",
                                fontSize: 13,
                                fontWeight:
                                  "700",
                              }}
                            >
                              N/A
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
