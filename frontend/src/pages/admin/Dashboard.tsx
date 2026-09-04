import { useState, useEffect } from "react";
import API_BASE_URL, { apiFetch } from "@/config/api";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Users,
    Briefcase,
    AlertTriangle,
    Activity,
    UserCheck,
    Clock,
    CheckCircle,
    Loader2,
    ArrowUpRight,
    ArrowDownRight,
    CalendarDays,
    MoreHorizontal,
    TrendingUp,
    UserPlus,
    FolderPlus,
    ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { LucideIcon } from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";

interface DashboardData {
    kpi: {
        totalStaff: { value: number; trend: string };
        presentToday: { value: number; trend: string };
        onBench: { value: number; trend: string };
        systemAlerts: { value: number; trend: string };
    };
    charts: {
        attendanceDistribution: {
            name: string;
            value: number;
            color: string;
        }[];
        attendanceTrend: {
            date: string;
            present: number;
            note: string | null;
        }[];
        resourceUtilization: {
            name: string;
            value: number;
            color: string;
        }[];
    };
    quickActions: {
        pendingApprovals: number;
        alerts: number;
    };
}

const defaultData: DashboardData = {
    kpi: {
        totalStaff: { value: 0, trend: "Loading..." },
        presentToday: { value: 0, trend: "Loading..." },
        onBench: { value: 0, trend: "Loading..." },
        systemAlerts: { value: 0, trend: "Loading..." },
    },
    charts: {
        attendanceDistribution: [],
        attendanceTrend: [],
        resourceUtilization: [],
    },
    quickActions: {
        pendingApprovals: 0,
        alerts: 0,
    },
};

export default function AdminDashboard() {
    const { user } = useAuth();

    const [dateRange, setDateRange] = useState("7d");
    const [department, setDepartment] = useState("all");
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<DashboardData>(defaultData);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem("token");

                const response = await apiFetch("/api/admin/dashboard", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                } else {
                    console.error("Failed to fetch dashboard data");
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();

        console.log(
            "Admin Dashboard API Base URL:",
            API_BASE_URL
        );
    }, []);

    const totalAttendance = data.charts.attendanceDistribution.reduce(
        (sum, item) => sum + item.value,
        0
    );

    const attendancePercentage =
        data.kpi.totalStaff.value > 0
            ? Math.round(
                (data.kpi.presentToday.value /
                    data.kpi.totalStaff.value) *
                100
            )
            : 0;

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-[1600px] space-y-6">

                {/* HEADER */}
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
                            <span>Dashboard</span>
                            <span>/</span>
                            <span className="text-slate-800">
                                Overview
                            </span>
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                            Welcome back,{" "}
                            <span className="text-primary">
                                {user?.name || "Admin"}
                            </span>
                            <span className="ml-1">👋</span>
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Here's what's happening with your workforce
                            today.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                            <CalendarDays className="h-4 w-4 text-slate-400" />

                            <select
                                value={dateRange}
                                onChange={(e) =>
                                    setDateRange(e.target.value)
                                }
                                className="bg-transparent text-sm font-medium text-slate-700 outline-none"
                            >
                                <option value="7d">
                                    Last 7 Days
                                </option>
                                <option value="30d">
                                    Last 30 Days
                                </option>
                            </select>
                        </div>

                        <select
                            value={department}
                            onChange={(e) =>
                                setDepartment(e.target.value)
                            }
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition hover:border-primary/40 focus:border-primary"
                        >
                            <option value="all">
                                All Departments
                            </option>
                            <option value="eng">
                                Engineering
                            </option>
                            <option value="hr">
                                HR
                            </option>
                        </select>

                        <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary">
                            <MoreHorizontal className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* KPI CARDS */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title="Total Staff"
                        value={
                            isLoading
                                ? "-"
                                : data.kpi.totalStaff.value.toString()
                        }
                        trend={
                            isLoading
                                ? "-"
                                : data.kpi.totalStaff.trend
                        }
                        icon={Users}
                        color="blue"
                    />

                    <StatCard
                        title="Present Today"
                        value={
                            isLoading
                                ? "-"
                                : data.kpi.presentToday.value.toString()
                        }
                        trend={
                            isLoading
                                ? "-"
                                : data.kpi.presentToday.trend
                        }
                        icon={UserCheck}
                        color="green"
                        badge={
                            !isLoading
                                ? `${attendancePercentage}% attendance`
                                : undefined
                        }
                    />

                    <StatCard
                        title="On Bench"
                        value={
                            isLoading
                                ? "-"
                                : data.kpi.onBench.value.toString()
                        }
                        trend={
                            isLoading
                                ? "-"
                                : data.kpi.onBench.trend
                        }
                        icon={Clock}
                        color="orange"
                    />

                    <StatCard
                        title="System Alerts"
                        value={
                            isLoading
                                ? "-"
                                : data.kpi.systemAlerts.value.toString()
                        }
                        trend={
                            isLoading
                                ? "-"
                                : data.kpi.systemAlerts.trend
                        }
                        icon={ShieldAlert}
                        color="red"
                    />
                </div>

                {/* MAIN CHARTS */}
                <div className="grid gap-5 lg:grid-cols-7">

                    {/* ATTENDANCE */}
                    <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-none lg:col-span-3">
                        <CardHeader className="border-b border-slate-100 pb-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                            <Activity className="h-4 w-4 text-primary" />
                                        </span>
                                        Daily Attendance
                                    </CardTitle>

                                    <CardDescription className="mt-1">
                                        Today's workforce distribution
                                    </CardDescription>
                                </div>

                                <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                                    <MoreHorizontal className="h-5 w-5" />
                                </button>
                            </div>
                        </CardHeader>

                        <CardContent className="p-5">
                            {isLoading ? (
                                <ChartLoader color="text-primary" />
                            ) : (
                                <div className="relative h-[270px]">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <PieChart>
                                            <Pie
                                                data={
                                                    data.charts
                                                        .attendanceDistribution
                                                }
                                                cx="50%"
                                                cy="46%"
                                                innerRadius={72}
                                                outerRadius={100}
                                                paddingAngle={4}
                                                dataKey="value"
                                                cornerRadius={5}
                                            >
                                                {data.charts.attendanceDistribution.map(
                                                    (entry, index) => (
                                                        <Cell
                                                            key={`attendance-${index}`}
                                                            fill={
                                                                entry.color
                                                            }
                                                            stroke="none"
                                                        />
                                                    )
                                                )}
                                            </Pie>

                                            <Tooltip
                                                contentStyle={{
                                                    borderRadius:
                                                        "12px",
                                                    border:
                                                        "1px solid #e2e8f0",
                                                    boxShadow:
                                                        "0 10px 30px rgba(15,23,42,0.08)",
                                                }}
                                            />

                                            <Legend
                                                verticalAlign="bottom"
                                                iconType="circle"
                                                iconSize={8}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>

                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-8">
                                        <div className="text-center">
                                            <p className="text-3xl font-bold tracking-tight text-slate-900">
                                                {
                                                    data.kpi
                                                        .presentToday
                                                        .value
                                                }
                                            </p>
                                            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                                Present
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!isLoading && (
                                <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                                    <div>
                                        <p className="text-xs text-slate-500">
                                            Total workforce
                                        </p>
                                        <p className="mt-0.5 font-bold text-slate-900">
                                            {totalAttendance}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-xs text-slate-500">
                                            Attendance rate
                                        </p>
                                        <p className="mt-0.5 font-bold text-primary">
                                            {attendancePercentage}%
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* ATTENDANCE TREND */}
                    <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-none lg:col-span-4">
                        <CardHeader className="border-b border-slate-100 pb-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                                            <TrendingUp className="h-4 w-4 text-blue-600" />
                                        </span>
                                        Attendance Trend
                                    </CardTitle>

                                    <CardDescription className="mt-1">
                                        Workforce attendance over time
                                    </CardDescription>
                                </div>

                                <div className="rounded-lg bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                                    Live
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-5">
                            {isLoading ? (
                                <ChartLoader color="text-blue-500" />
                            ) : (
                                <div className="h-[290px] w-full">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <LineChart
                                            data={
                                                data.charts
                                                    .attendanceTrend
                                            }
                                            margin={{
                                                top: 10,
                                                right: 10,
                                                left: -20,
                                                bottom: 0,
                                            }}
                                        >
                                            <defs>
                                                <linearGradient
                                                    id="attendanceGradient"
                                                    x1="0"
                                                    y1="0"
                                                    x2="0"
                                                    y2="1"
                                                >
                                                    <stop
                                                        offset="0%"
                                                        stopColor="hsl(var(--primary))"
                                                        stopOpacity={
                                                            0.2
                                                        }
                                                    />
                                                    <stop
                                                        offset="100%"
                                                        stopColor="hsl(var(--primary))"
                                                        stopOpacity={
                                                            0
                                                        }
                                                    />
                                                </linearGradient>
                                            </defs>

                                            <CartesianGrid
                                                strokeDasharray="4 4"
                                                vertical={false}
                                                stroke="#eef2f7"
                                            />

                                            <XAxis
                                                dataKey="date"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{
                                                    fill: "#94a3b8",
                                                    fontSize: 11,
                                                }}
                                                dy={8}
                                            />

                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{
                                                    fill: "#94a3b8",
                                                    fontSize: 11,
                                                }}
                                            />

                                            <Tooltip
                                                content={
                                                    <CustomLineTooltip />
                                                }
                                            />

                                            <Line
                                                type="monotone"
                                                dataKey="present"
                                                stroke="hsl(var(--primary))"
                                                strokeWidth={3}
                                                dot={{
                                                    r: 4,
                                                    fill: "hsl(var(--primary))",
                                                    strokeWidth: 3,
                                                    stroke: "#fff",
                                                }}
                                                activeDot={{
                                                    r: 7,
                                                    strokeWidth: 3,
                                                    stroke: "#fff",
                                                }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* BOTTOM ROW */}
                <div className="grid gap-5 lg:grid-cols-2">

                    {/* RESOURCE UTILIZATION */}
                    <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-none">
                        <CardHeader className="border-b border-slate-100 pb-4">
                            <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                                    <Briefcase className="h-4 w-4 text-indigo-600" />
                                </span>
                                Resource Utilization
                            </CardTitle>

                            <CardDescription>
                                Project allocation versus bench
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="p-5">
                            {isLoading ? (
                                <ChartLoader color="text-indigo-500" />
                            ) : (
                                <div className="h-[260px] w-full">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <PieChart>
                                            <Pie
                                                data={
                                                    data.charts
                                                        .resourceUtilization
                                                }
                                                cx="38%"
                                                cy="50%"
                                                outerRadius={88}
                                                innerRadius={58}
                                                paddingAngle={3}
                                                dataKey="value"
                                                cornerRadius={4}
                                            >
                                                {data.charts.resourceUtilization.map(
                                                    (entry, index) => (
                                                        <Cell
                                                            key={`resource-${index}`}
                                                            fill={
                                                                entry.color
                                                            }
                                                            stroke="none"
                                                        />
                                                    )
                                                )}
                                            </Pie>

                                            <Tooltip
                                                contentStyle={{
                                                    borderRadius:
                                                        "12px",
                                                    border:
                                                        "1px solid #e2e8f0",
                                                    boxShadow:
                                                        "0 10px 30px rgba(15,23,42,0.08)",
                                                }}
                                            />

                                            <Legend
                                                layout="vertical"
                                                verticalAlign="middle"
                                                align="right"
                                                iconType="circle"
                                                iconSize={8}
                                                formatter={(
                                                    value,
                                                    entry: any
                                                ) => {
                                                    const total =
                                                        data.charts.resourceUtilization.reduce(
                                                            (
                                                                acc,
                                                                cur
                                                            ) =>
                                                                acc +
                                                                cur.value,
                                                            0
                                                        );

                                                    const percent =
                                                        total > 0
                                                            ? Math.round(
                                                                ((entry.payload
                                                                    ?.value ||
                                                                    0) /
                                                                    total) *
                                                                100
                                                            )
                                                            : 0;

                                                    return (
                                                        <span className="ml-2 text-xs font-medium text-slate-600">
                                                            {value}{" "}
                                                            <span className="font-bold text-slate-900">
                                                                {
                                                                    entry
                                                                        .payload
                                                                        ?.value
                                                                }{" "}
                                                                (
                                                                {
                                                                    percent
                                                                }
                                                                %)
                                                            </span>
                                                        </span>
                                                    );
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* QUICK ACTIONS */}
                    <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-none">
                        <CardHeader className="border-b border-slate-100 pb-4">
                            <CardTitle className="text-base font-bold text-slate-900">
                                Quick Actions
                            </CardTitle>

                            <CardDescription>
                                Common tasks and shortcuts
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="grid gap-3 p-5 sm:grid-cols-2">
                            <ActionButton
                                icon={UserPlus}
                                label="Add Employee"
                                desc="Onboard new staff"
                                color="blue"
                            />

                            <ActionButton
                                icon={CheckCircle}
                                label="Approvals"
                                desc={`${data.quickActions.pendingApprovals} pending`}
                                color="green"
                                badge={
                                    data.quickActions.pendingApprovals
                                }
                            />

                            <ActionButton
                                icon={FolderPlus}
                                label="New Project"
                                desc="Create workspace"
                                color="indigo"
                            />

                            <ActionButton
                                icon={AlertTriangle}
                                label="Alerts"
                                desc={`${data.quickActions.alerts} critical`}
                                color="red"
                                badge={data.quickActions.alerts}
                                isDestructive
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* STAT CARD                                                                  */
/* -------------------------------------------------------------------------- */

function StatCard({
    title,
    value,
    trend,
    icon: Icon,
    color,
    badge,
}: {
    title: string;
    value: string;
    trend: string;
    icon: LucideIcon;
    color: "blue" | "green" | "orange" | "red";
    badge?: string;
}) {
    const styles = {
        blue: {
            icon: "bg-blue-50 text-blue-600",
            accent: "bg-blue-500",
            trend: "text-blue-600",
        },
        green: {
            icon: "bg-emerald-50 text-emerald-600",
            accent: "bg-emerald-500",
            trend: "text-emerald-600",
        },
        orange: {
            icon: "bg-orange-50 text-orange-600",
            accent: "bg-orange-500",
            trend: "text-orange-600",
        },
        red: {
            icon: "bg-red-50 text-red-600",
            accent: "bg-red-500",
            trend: "text-red-600",
        },
    };

    const current = styles[color];

    const isPositive =
        trend &&
        (trend.includes("+") ||
            trend.toLowerCase().includes("up") ||
            trend.toLowerCase().includes("increase"));

    return (
        <Card className="group relative overflow-hidden rounded-2xl border-slate-200 bg-white shadow-none transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_12px_35px_rgba(15,23,42,0.07)]">
            <div
                className={`absolute left-0 top-0 h-full w-1 ${current.accent}`}
            />

            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">
                            {title}
                        </p>

                        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                            {value}
                        </p>
                    </div>

                    <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${current.icon} transition-transform duration-300 group-hover:scale-105`}
                    >
                        <Icon className="h-5 w-5" />
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <div
                        className={`flex items-center gap-1 text-xs font-semibold ${current.trend}`}
                    >
                        {isPositive ? (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                        ) : (
                            <ArrowDownRight className="h-3.5 w-3.5" />
                        )}
                        {trend}
                    </div>

                    {badge && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                            {badge}
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

/* -------------------------------------------------------------------------- */
/* ACTION BUTTON                                                              */
/* -------------------------------------------------------------------------- */

function ActionButton({
    icon: Icon,
    label,
    desc,
    color,
    badge,
    isDestructive,
}: {
    icon: LucideIcon;
    label: string;
    desc: string;
    color: "blue" | "green" | "indigo" | "red";
    badge?: number;
    isDestructive?: boolean;
}) {
    const colors = {
        blue: {
            icon: "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
            hover: "hover:border-blue-200",
        },
        green: {
            icon: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white",
            hover: "hover:border-emerald-200",
        },
        indigo: {
            icon: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white",
            hover: "hover:border-indigo-200",
        },
        red: {
            icon: "bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white",
            hover: "hover:border-red-200",
        },
    };

    const current = colors[color];

    return (
        <button
            className={`group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-left transition-all duration-200 ${current.hover} hover:-translate-y-0.5 hover:shadow-sm`}
        >
            <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${current.icon}`}
            >
                <Icon className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate text-sm font-semibold text-slate-800">
                        {label}
                    </h3>

                    {typeof badge === "number" &&
                        badge > 0 && (
                            <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isDestructive
                                        ? "bg-red-50 text-red-600"
                                        : "bg-primary/10 text-primary"
                                    }`}
                            >
                                {badge}
                            </span>
                        )}
                </div>

                <p className="mt-0.5 truncate text-xs text-slate-400">
                    {desc}
                </p>
            </div>

            <ArrowUpRight className="h-4 w-4 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-slate-500" />
        </button>
    );
}

/* -------------------------------------------------------------------------- */
/* LOADER                                                                     */
/* -------------------------------------------------------------------------- */

function ChartLoader({
    color,
}: {
    color: string;
}) {
    return (
        <div className="flex h-[270px] w-full items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
                    <Loader2
                        className={`h-5 w-5 animate-spin ${color}`}
                    />
                </div>

                <span className="text-xs font-medium text-slate-400">
                    Loading data...
                </span>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* LINE TOOLTIP                                                               */
/* -------------------------------------------------------------------------- */

function CustomLineTooltip({
    active,
    payload,
    label,
}: any) {
    if (!active || !payload?.length) {
        return null;
    }

    const pointData = payload[0].payload;

    return (
        <div className="min-w-[150px] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
            <p className="mb-2 text-xs font-semibold text-slate-500">
                {label}
            </p>

            <div className="flex items-center justify-between gap-5">
                <span className="text-xs text-slate-500">
                    Present
                </span>

                <span className="text-sm font-bold text-primary">
                    {payload[0].value}
                </span>
            </div>

            {pointData.note && (
                <div className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-700">
                    {pointData.note}
                </div>
            )}
        </div>
    );
}
