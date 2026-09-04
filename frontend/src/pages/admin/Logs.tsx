import { useState, useEffect } from "react";
import { apiFetch } from "@/config/api";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

import { Input } from "@/components/ui/input";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";

import {
    Activity,
    Search,
    Download,
    AlertCircle,
    CheckCircle2,
    AlertTriangle,
    Loader2,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/* ======================
   TYPES
====================== */

type LogSeverity =
    | "Info"
    | "Warning"
    | "Error"
    | "Success";

type LogAction =
    | "Create"
    | "Update"
    | "Delete"
    | "Login"
    | "Logout"
    | "Approve"
    | "Reject"
    | "View"
    | "Export";

interface LogEntry {
    _id: string;
    timestamp: string;
    action: LogAction;
    module: string;
    description: string;
    user: {
        email: string;
        id: string;
        name: string;
        role: "ADMIN" | "HR" | "EMPLOYEE";
        profileImage?: string;
    };
    severity: LogSeverity;
    ipAddress: string;
}

/* ======================
   ROLE BADGE
====================== */

function RoleBadge({
    role,
}: {
    role?: string;
}) {
    const styles: Record<
        string,
        {
            wrapper: string;
            dot: string;
        }
    > = {
        ADMIN: {
            wrapper:
                "bg-violet-50 text-violet-700 border-violet-200",
            dot: "bg-violet-500",
        },

        HR: {
            wrapper:
                "bg-blue-50 text-blue-700 border-blue-200",
            dot: "bg-blue-500",
        },

        EMPLOYEE: {
            wrapper:
                "bg-slate-50 text-slate-600 border-slate-200",
            dot: "bg-slate-400",
        },
    };

    const currentRole = role || "EMPLOYEE";

    const style =
        styles[currentRole] || styles.EMPLOYEE;

    return (
        <Badge
            variant="outline"
            className={cn(
                "gap-2 rounded-full px-3 py-1 text-[11px] font-semibold",
                style.wrapper
            )}
        >
            <span
                className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    style.dot
                )}
            />

            {role || "-"}
        </Badge>
    );
}

/* ======================
   MODULE BADGE
====================== */

function ModuleBadge({
    module,
}: {
    module?: string;
}) {
    const moduleStyles: Record<
        string,
        {
            wrapper: string;
            dot: string;
        }
    > = {
        Auth: {
            wrapper:
                "bg-blue-50 text-blue-700 border-blue-200",
            dot: "bg-blue-500",
        },

        User: {
            wrapper:
                "bg-violet-50 text-violet-700 border-violet-200",
            dot: "bg-violet-500",
        },

        Policy: {
            wrapper:
                "bg-amber-50 text-amber-700 border-amber-200",
            dot: "bg-amber-500",
        },

        Admin: {
            wrapper:
                "bg-slate-50 text-slate-700 border-slate-200",
            dot: "bg-slate-500",
        },
    };

    const currentModule = module || "Unknown";

    const style =
        moduleStyles[currentModule] || {
            wrapper:
                "bg-slate-50 text-slate-600 border-slate-200",
            dot: "bg-slate-400",
        };

    return (
        <Badge
            variant="outline"
            className={cn(
                "gap-2 rounded-full px-3 py-1 text-[11px] font-semibold",
                style.wrapper
            )}
        >
            <span
                className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    style.dot
                )}
            />

            {module || "-"}
        </Badge>
    );
}

/* ======================
   SEVERITY
====================== */

const getSeverityColor = (
    severity: LogSeverity
) => {
    switch (severity) {
        case "Success":
            return "bg-emerald-50 text-emerald-700 border-emerald-200";

        case "Error":
            return "bg-red-50 text-red-700 border-red-200";

        case "Warning":
            return "bg-amber-50 text-amber-700 border-amber-200";

        case "Info":
            return "bg-blue-50 text-blue-700 border-blue-200";

        default:
            return "bg-slate-50 text-slate-700 border-slate-200";
    }
};

const getSeverityIcon = (
    severity: LogSeverity
) => {
    switch (severity) {
        case "Success":
            return CheckCircle2;

        case "Error":
            return AlertCircle;

        case "Warning":
            return AlertTriangle;

        default:
            return Activity;
    }
};

/* ======================
   MAIN COMPONENT
====================== */

export default function AdminLogs() {
    const [searchTerm, setSearchTerm] =
        useState("");

    const [moduleFilter, setModuleFilter] =
        useState<string>("All");

    const [severityFilter, setSeverityFilter] =
        useState<string>("All");

    const [logs, setLogs] =
        useState<LogEntry[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [currentPage, setCurrentPage] =
        useState(1);

    const [totalPages, setTotalPages] =
        useState(1);

    const [totalRecords, setTotalRecords] =
        useState(0);

    const [stats, setStats] = useState({
        errors: 0,
        warnings: 0,
        successful: 0,
    });

    /* ======================
       FETCH LOGS
    ====================== */

    const fetchLogs = async () => {
        setLoading(true);

        try {
            const token =
                localStorage.getItem("token");

            const params =
                new URLSearchParams();

            params.append(
                "page",
                currentPage.toString()
            );

            params.append("limit", "10");

            if (searchTerm) {
                params.append(
                    "search",
                    searchTerm
                );
            }

            if (moduleFilter !== "All") {
                params.append(
                    "module",
                    moduleFilter
                );
            }

            if (severityFilter !== "All") {
                params.append(
                    "severity",
                    severityFilter
                );
            }

            const response = await apiFetch(
                `/api/logs?${params.toString()}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Network response was not ok"
                );
            }

            const data =
                await response.json();

            if (data.pagination) {
                setLogs(data.logs || []);

                setTotalPages(
                    data.pagination.pages || 1
                );

                setTotalRecords(
                    data.pagination.total || 0
                );

                if (data.pagination.stats) {
                    setStats(
                        data.pagination.stats
                    );
                }
            } else {
                const logData = Array.isArray(data)
                    ? data
                    : [];

                setLogs(logData);

                setTotalPages(1);

                setTotalRecords(
                    logData.length
                );
            }
        } catch (error) {
            console.error(
                "Failed to fetch logs:",
                error
            );

            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    /* ======================
       FETCH EFFECT
    ====================== */

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLogs();
        }, 500);

        return () => clearTimeout(timer);
    }, [
        searchTerm,
        moduleFilter,
        severityFilter,
        currentPage,
    ]);

    /* ======================
       RESET PAGE
    ====================== */

    useEffect(() => {
        setCurrentPage(1);
    }, [
        searchTerm,
        moduleFilter,
        severityFilter,
    ]);

    const filteredLogs = logs;

    /* ======================
       RENDER
    ====================== */

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* ======================
                HEADER
            ====================== */}

            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">

                <div className="flex items-center gap-4">

                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-lg">
                        <Activity className="h-6 w-6 text-white" />
                    </div>

                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            System Logs
                        </h1>
                    </div>

                </div>

                <Button
                    variant="outline"
                    className="
                        gap-2
                        rounded-xl
                        border-slate-200
                        bg-white
                        shadow-none
                        hover:bg-primary/5
                        hover:text-primary
                    "
                >
                    <Download className="h-4 w-4" />
                    Export Logs
                </Button>

            </div>

            {/* ======================
                STATS
            ====================== */}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">

                <StatCard
                    title="Total Events"
                    value={totalRecords.toString()}
                    color="blue"
                    icon={Activity}
                />

                <StatCard
                    title="Errors"
                    value={stats.errors.toString()}
                    color="red"
                    icon={AlertCircle}
                />

                <StatCard
                    title="Warnings"
                    value={stats.warnings.toString()}
                    color="orange"
                    icon={AlertTriangle}
                />

                <StatCard
                    title="Successful"
                    value={stats.successful.toString()}
                    color="green"
                    icon={CheckCircle2}
                />

            </div>

            {/* ======================
                MAIN CARD
            ====================== */}

            <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                {/* ======================
                    FILTER BAR
                ====================== */}

                <CardHeader className="border-b border-slate-100 bg-white p-5">

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">

                        {/* SEARCH */}

                        <div className="relative min-w-0 flex-1">

                            <Search
                                className="
                                    absolute
                                    left-3
                                    top-1/2
                                    h-4
                                    w-4
                                    -translate-y-1/2
                                    text-slate-400
                                "
                            />

                            <Input
                                placeholder="Search by name, email, action or description..."
                                className="
                                    h-11
                                    w-full
                                    rounded-xl
                                    border-slate-200
                                    bg-slate-50/70
                                    pl-10
                                    text-sm
                                    transition

                                    focus:bg-white
                                    focus:outline-none
                                    focus:ring-2
                                    focus:ring-primary/20
                                    focus:ring-offset-0

                                    focus-visible:outline-none
                                    focus-visible:ring-2
                                    focus-visible:ring-primary/20
                                    focus-visible:ring-offset-0
                                "
                                value={searchTerm}
                                onChange={(e) =>
                                    setSearchTerm(
                                        e.target.value
                                    )
                                }
                            />

                        </div>

                        {/* DROPDOWNS */}

                        <div className="flex w-full gap-2 lg:w-auto">

                            {/* MODULE */}

                            <Select
                                value={moduleFilter}
                                onValueChange={
                                    setModuleFilter
                                }
                            >
                                <SelectTrigger
                                    className="
                                        h-11
                                        w-full
                                        rounded-xl
                                        border-slate-200
                                        bg-white
                                        shadow-none
                                        focus:ring-2
                                        focus:ring-primary/20
                                        focus:ring-offset-0
                                        lg:w-[150px]
                                    "
                                >
                                    <SelectValue placeholder="Module" />
                                </SelectTrigger>

                                <SelectContent>

                                    <SelectItem
                                        value="All"
                                        className="
                                            focus:bg-primary
                                            focus:text-white
                                            data-[highlighted]:bg-primary
                                            data-[highlighted]:text-white
                                        "
                                    >
                                        All Modules
                                    </SelectItem>

                                    <SelectItem
                                        value="Auth"
                                        className="
                                            focus:bg-primary
                                            focus:text-white
                                            data-[highlighted]:bg-primary
                                            data-[highlighted]:text-white
                                        "
                                    >
                                        Auth
                                    </SelectItem>

                                    <SelectItem
                                        value="User"
                                        className="
                                            focus:bg-primary
                                            focus:text-white
                                            data-[highlighted]:bg-primary
                                            data-[highlighted]:text-white
                                        "
                                    >
                                        User
                                    </SelectItem>

                                    <SelectItem
                                        value="Policy"
                                        className="
                                            focus:bg-primary
                                            focus:text-white
                                            data-[highlighted]:bg-primary
                                            data-[highlighted]:text-white
                                        "
                                    >
                                        Policy
                                    </SelectItem>

                                    <SelectItem
                                        value="Admin"
                                        className="
                                            focus:bg-primary
                                            focus:text-white
                                            data-[highlighted]:bg-primary
                                            data-[highlighted]:text-white
                                        "
                                    >
                                        Admin
                                    </SelectItem>

                                </SelectContent>
                            </Select>

                            {/* SEVERITY */}

                            <Select
                                value={severityFilter}
                                onValueChange={
                                    setSeverityFilter
                                }
                            >
                                <SelectTrigger
                                    className="
                                        h-11
                                        w-full
                                        rounded-xl
                                        border-slate-200
                                        bg-white
                                        shadow-none
                                        focus:ring-2
                                        focus:ring-primary/20
                                        focus:ring-offset-0
                                        lg:w-[160px]
                                    "
                                >
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>

                                <SelectContent>

                                    <SelectItem
                                        value="All"
                                        className="
                                            focus:bg-primary
                                            focus:text-white
                                            data-[highlighted]:bg-primary
                                            data-[highlighted]:text-white
                                        "
                                    >
                                        All Statuses
                                    </SelectItem>

                                    <SelectItem
                                        value="Info"
                                        className="
                                            focus:bg-primary
                                            focus:text-white
                                            data-[highlighted]:bg-primary
                                            data-[highlighted]:text-white
                                        "
                                    >
                                        Info
                                    </SelectItem>

                                    <SelectItem
                                        value="Success"
                                        className="
                                            focus:bg-primary
                                            focus:text-white
                                            data-[highlighted]:bg-primary
                                            data-[highlighted]:text-white
                                        "
                                    >
                                        Success
                                    </SelectItem>

                                    <SelectItem
                                        value="Warning"
                                        className="
                                            focus:bg-primary
                                            focus:text-white
                                            data-[highlighted]:bg-primary
                                            data-[highlighted]:text-white
                                        "
                                    >
                                        Warning
                                    </SelectItem>

                                    <SelectItem
                                        value="Error"
                                        className="
                                            focus:bg-primary
                                            focus:text-white
                                            data-[highlighted]:bg-primary
                                            data-[highlighted]:text-white
                                        "
                                    >
                                        Error
                                    </SelectItem>

                                </SelectContent>
                            </Select>

                        </div>

                    </div>

                </CardHeader>

                {/* ======================
                    TABLE
                ====================== */}

                <CardContent className="p-0">

                    <div className="overflow-x-auto">

                        <Table>

                            <TableHeader>

                                <TableRow
                                    className="
                                        border-b
                                        border-slate-100
                                        bg-slate-50/70
                                        hover:bg-slate-50/70
                                    "
                                >

                                    <TableHead className="h-12 whitespace-nowrap pl-6 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        Timestamp
                                    </TableHead>

                                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        User
                                    </TableHead>

                                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        Role
                                    </TableHead>

                                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        Module
                                    </TableHead>

                                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        Action
                                    </TableHead>

                                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        Description
                                    </TableHead>

                                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        Status
                                    </TableHead>

                                </TableRow>

                            </TableHeader>

                            <TableBody>

                                {/* LOADING */}

                                {loading ? (

                                    <TableRow>

                                        <TableCell
                                            colSpan={7}
                                            className="h-[360px]"
                                        >

                                            <div className="flex h-full flex-col items-center justify-center gap-3">

                                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">

                                                    <Loader2
                                                        className="
                                                            h-5
                                                            w-5
                                                            animate-spin
                                                            text-primary
                                                        "
                                                    />

                                                </div>

                                                <div className="text-center">

                                                    <p className="text-sm font-semibold text-slate-700">
                                                        Updating logs
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-400">
                                                        Fetching the latest system activity...
                                                    </p>

                                                </div>

                                            </div>

                                        </TableCell>

                                    </TableRow>

                                ) : filteredLogs.length === 0 ? (

                                    /* EMPTY */

                                    <TableRow>

                                        <TableCell
                                            colSpan={7}
                                            className="h-[320px]"
                                        >

                                            <div className="flex flex-col items-center justify-center text-center">

                                                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">

                                                    <Search className="h-6 w-6 text-slate-400" />

                                                </div>

                                                <p className="font-semibold text-slate-800">
                                                    No logs found
                                                </p>

                                                <p className="mt-1 text-sm text-slate-400">
                                                    Try changing your search or filters.
                                                </p>

                                            </div>

                                        </TableCell>

                                    </TableRow>

                                ) : (

                                    /* DATA */

                                    filteredLogs.map(
                                        (log) => {

                                            const SeverityIcon =
                                                getSeverityIcon(
                                                    log.severity
                                                );

                                            return (
                                                <TableRow
                                                    key={
                                                        log._id
                                                    }
                                                    className="
                                                        group
                                                        border-b
                                                        border-slate-100
                                                        transition-colors
                                                        hover:bg-primary/[0.025]
                                                    "
                                                >

                                                    {/* TIMESTAMP */}

                                                    <TableCell className="whitespace-nowrap py-4 pl-6">
    <div className="flex flex-col">
        <span className="text-sm font-semibold tracking-tight text-slate-700">
            {new Date(log.timestamp).toLocaleDateString(
                "en-GB",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                }
            )}
        </span>

        <span className="mt-0.5 text-xs font-medium text-slate-400">
            {new Date(log.timestamp).toLocaleTimeString(
                "en-US",
                {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                }
            )}
        </span>
    </div>
</TableCell>


                                                    {/* USER */}

                                                    <TableCell className="py-4">

                                                        <div className="flex items-center gap-3">

                                                            <Avatar
                                                                className="
                                                                    h-10
                                                                    w-10
                                                                    border-2
                                                                    border-white
                                                                    shadow-sm
                                                                    ring-1
                                                                    ring-slate-200
                                                                "
                                                            >

                                                                <AvatarImage
                                                                    src={
                                                                        log.user?.profileImage ||
                                                                        ""
                                                                    }
                                                                    alt={
                                                                        log.user?.name ||
                                                                        "User"
                                                                    }
                                                                    className="object-cover"
                                                                />

                                                                <AvatarFallback
                                                                    className="
                                                                        bg-slate-100
                                                                        font-semibold
                                                                        text-slate-500
                                                                    "
                                                                >
                                                                    {(
                                                                        log.user?.name ||
                                                                        "?"
                                                                    )
                                                                        .split(
                                                                            " "
                                                                        )
                                                                        .map(
                                                                            (
                                                                                name
                                                                            ) =>
                                                                                name.charAt(
                                                                                    0
                                                                                )
                                                                        )
                                                                        .join(
                                                                            ""
                                                                        )
                                                                        .toUpperCase()
                                                                        .substring(
                                                                            0,
                                                                            2
                                                                        )}
                                                                </AvatarFallback>

                                                            </Avatar>

                                                            <div className="min-w-0">

                                                                <p className="
                                                                    truncate
                                                                    text-sm
                                                                    font-semibold
                                                                    text-slate-800
                                                                    transition-colors
                                                                    group-hover:text-primary
                                                                ">
                                                                    {
                                                                        log.user
                                                                            ?.name ||
                                                                        "Unknown User"
                                                                    }
                                                                    {/* <span className="text-sm text-muted-foreground">
                                                                        {
                                                                            log.user
                                                                                ?.email
                                                                        }
                                                                    </span> */}
                                                                </p>

                                                            </div>

                                                        </div>

                                                    </TableCell>

                                                    {/* ROLE */}

                                                    <TableCell>
                                                        <RoleBadge
                                                            role={
                                                                log
                                                                    .user
                                                                    ?.role
                                                            }
                                                        />
                                                    </TableCell>

                                                    {/* MODULE */}

                                                    <TableCell>
                                                        <ModuleBadge
                                                            module={
                                                                log.module
                                                            }
                                                        />
                                                    </TableCell>

                                                    {/* ACTION */}

                                                    <TableCell>

                                                        <span className="
                                                            text-sm
                                                            font-semibold
                                                            text-slate-700
                                                        ">
                                                            {
                                                                log.action
                                                            }
                                                        </span>

                                                    </TableCell>

                                                    {/* DESCRIPTION */}

                                                    <TableCell className="max-w-[320px]">

                                                        <p
                                                            className="
                                                                truncate
                                                                text-sm
                                                                text-slate-600
                                                            "
                                                            title={
                                                                log.description
                                                            }
                                                        >
                                                            {
                                                                log.description
                                                            }
                                                        </p>

                                                    </TableCell>

                                                    {/* STATUS */}

                                                    <TableCell>

                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold shadow-none",
                                                                getSeverityColor(
                                                                    log.severity
                                                                )
                                                            )}
                                                        >

                                                            <SeverityIcon className="h-3.5 w-3.5" />

                                                            {
                                                                log.severity
                                                            }

                                                        </Badge>

                                                    </TableCell>

                                                </TableRow>
                                            );
                                        }
                                    )
                                )}

                            </TableBody>

                        </Table>

                    </div>

                    {/* ======================
                        PAGINATION
                    ====================== */}

                    {!loading &&
                        filteredLogs.length >
                            0 && (

                            <div className="
                                flex
                                flex-col
                                gap-3
                                border-t
                                border-slate-100
                                bg-slate-50/40
                                px-5
                                py-4
                                sm:flex-row
                                sm:items-center
                                sm:justify-between
                            ">

                                {/* RECORD COUNT */}

                                <p className="text-xs text-slate-500">

                                    Showing{" "}

                                    <span className="font-semibold text-slate-800">
                                        {(currentPage -
                                            1) *
                                            10 +
                                            1}
                                    </span>

                                    {" "}–{" "}

                                    <span className="font-semibold text-slate-800">
                                        {Math.min(
                                            currentPage *
                                                10,
                                            totalRecords
                                        )}
                                    </span>

                                    {" "}of{" "}

                                    <span className="font-semibold text-slate-800">
                                        {totalRecords}
                                    </span>

                                    {" "}logs

                                </p>

                                {/* PAGINATION */}

                                <div className="flex items-center gap-1">

                                    {/* PREVIOUS */}

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setCurrentPage(
                                                (
                                                    prev
                                                ) =>
                                                    Math.max(
                                                        prev -
                                                            1,
                                                        1
                                                    )
                                            )
                                        }
                                        disabled={
                                            currentPage ===
                                                1 ||
                                            loading
                                        }
                                        className="
                                            h-9
                                            rounded-lg
                                            border-slate-200
                                            bg-white
                                            px-3
                                            text-xs
                                            font-medium
                                            text-slate-700
                                            shadow-none
                                            hover:bg-primary/10
                                            hover:text-primary
                                            disabled:text-slate-400
                                        "
                                    >
                                        Previous
                                    </Button>

                                    {/* PAGE NUMBERS */}

                                    <div className="hidden items-center gap-1 sm:flex">

                                        {Array.from(
                                            {
                                                length: Math.min(
                                                    totalPages,
                                                    5
                                                ),
                                            },
                                            (
                                                _,
                                                index
                                            ) => {

                                                const page =
                                                    index +
                                                    1;

                                                return (
                                                    <Button
                                                        key={
                                                            page
                                                        }
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            setCurrentPage(
                                                                page
                                                            )
                                                        }
                                                        disabled={
                                                            loading
                                                        }
                                                        className={cn(
                                                            "h-9 w-9 rounded-lg p-0 text-xs",
                                                            currentPage ===
                                                                page
                                                                ? "bg-primary text-white hover:bg-primary/90 hover:text-white"
                                                                : "text-slate-500 hover:bg-primary/5 hover:text-primary"
                                                        )}
                                                    >
                                                        {
                                                            page
                                                        }
                                                    </Button>
                                                );
                                            }
                                        )}

                                    </div>

                                    {/* NEXT */}

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setCurrentPage(
                                                (
                                                    prev
                                                ) =>
                                                    Math.min(
                                                        prev +
                                                            1,
                                                        totalPages
                                                    )
                                            )
                                        }
                                        disabled={
                                            currentPage >=
                                                totalPages ||
                                            loading
                                        }
                                        className="
                                            h-9
                                            rounded-lg
                                            border-slate-200
                                            bg-white
                                            px-3
                                            text-xs
                                            font-medium
                                            text-slate-700
                                            shadow-none
                                            hover:bg-primary/10
                                            hover:text-primary
                                            disabled:text-slate-400
                                        "
                                    >
                                        Next
                                    </Button>

                                </div>

                            </div>
                        )}

                </CardContent>

            </Card>

        </div>
    );
}

/* ======================
   STAT CARD
====================== */

function StatCard({
    title,
    value,
    subtitle,
    color,
    icon: Icon,
}: {
    title: string;
    value: string;
    subtitle?: string;
    color:
        | "violet"
        | "green"
        | "orange"
        | "blue"
        | "red";
    icon: LucideIcon;
}) {
    const styles = {
        violet: {
            border: "border-l-violet-500",
            text: "text-violet-600",
            bg: "bg-violet-50/50",
            iconBg:
                "bg-violet-500 shadow-violet-200",
        },

        green: {
            border: "border-l-green-500",
            text: "text-green-600",
            bg: "bg-green-50/50",
            iconBg:
                "bg-green-600 shadow-green-200",
        },

        orange: {
            border: "border-l-orange-500",
            text: "text-orange-600",
            bg: "bg-orange-50/50",
            iconBg:
                "bg-orange-500 shadow-orange-200",
        },

        blue: {
            border: "border-l-blue-500",
            text: "text-blue-600",
            bg: "bg-blue-50/50",
            iconBg:
                "bg-blue-500 shadow-blue-200",
        },

        red: {
            border: "border-l-red-500",
            text: "text-red-600",
            bg: "bg-red-50/50",
            iconBg:
                "bg-red-500 shadow-red-200",
        },
    };

    const currentStyle =
        styles[color] || styles.blue;

    return (
        <Card
            className={cn(
                "group border-l-4 shadow-sm transition-all hover:shadow-md",
                currentStyle.bg,
                currentStyle.border
            )}
        >
            <CardContent className="flex items-center justify-between p-6">

                <div>

                    <CardTitle
                        className={cn(
                            "mb-2 text-xs font-bold uppercase tracking-wider",
                            currentStyle.text
                        )}
                    >
                        {title}
                    </CardTitle>

                    <div className="text-2xl font-bold tracking-tight text-slate-800">
                        {value}
                    </div>

                    {subtitle && (
                        <p className="mt-1 text-xs font-medium text-muted-foreground">
                            {subtitle}
                        </p>
                    )}

                </div>

                <div
                    className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg transition-transform duration-300 group-hover:scale-110",
                        currentStyle.iconBg
                    )}
                >
                    <Icon className="h-6 w-6" />
                </div>

            </CardContent>
        </Card>
    );
}
