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

// import { Label } from "@/components/ui/label";

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
    AlertCircle,
    Search,
    Eye,
    FileWarning,
    CircleDot,
    CheckCircle2,
    Loader2,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";

/* ======================
   TYPES
====================== */

interface Complaint {
    id: string;
    userId: string;
    userName: string;
    subject: string;
    description: string;
    date: string;
    status:
        | "Open"
        | "Investigating"
        | "Resolved";
    avatar?: string;
    profileImage?: string;
    department: string;
}

/* ======================
   STATUS BADGE
====================== */

function StatusBadge({
    status,
}: {
    status: Complaint["status"];
}) {
    const styles = {
        Open: {
            wrapper:
                "bg-red-50 text-red-700 border-red-200",
            dot: "bg-red-500",
        },

        Investigating: {
            wrapper:
                "bg-amber-50 text-amber-700 border-amber-200",
            dot: "bg-amber-500",
        },

        Resolved: {
            wrapper:
                "bg-emerald-50 text-emerald-700 border-emerald-200",
            dot: "bg-emerald-500",
        },
    };

    const style = styles[status];

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

            {status}
        </Badge>
    );
}

/* ======================
   DEPARTMENT BADGE
====================== */

function DepartmentBadge({
    department,
}: {
    department: string;
}) {
    const styles: Record<
        string,
        {
            wrapper: string;
            dot: string;
        }
    > = {
        HR: {
            wrapper:
                "bg-blue-50 text-blue-700 border-blue-200",
            dot: "bg-blue-500",
        },

        IT: {
            wrapper:
                "bg-violet-50 text-violet-700 border-violet-200",
            dot: "bg-violet-500",
        },

        Finance: {
            wrapper:
                "bg-emerald-50 text-emerald-700 border-emerald-200",
            dot: "bg-emerald-500",
        },

        Admin: {
            wrapper:
                "bg-slate-50 text-slate-700 border-slate-200",
            dot: "bg-slate-500",
        },
    };

    const style = styles[department] || {
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

            {department || "General"}
        </Badge>
    );
}

/* ======================
   MAIN COMPONENT
====================== */

export default function AdminComplaints() {
    const [selectedComplaint, setSelectedComplaint] =
        useState<Complaint | null>(null);

    const [isDetailsOpen, setIsDetailsOpen] =
        useState(false);

    const [filterStatus, setFilterStatus] =
        useState("All");

    const [complaints, setComplaints] =
        useState<Complaint[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [search, setSearch] =
        useState("");

    const [currentPage, setCurrentPage] =
        useState(1);

    const [totalPages, setTotalPages] =
        useState(1);

    const [totalRecords, setTotalRecords] =
        useState(0);

    const [stats, setStats] = useState({
        total: 0,
        open: 0,
        investigating: 0,
        resolved: 0,
    });

    const [debouncedSearch, setDebouncedSearch] =
        useState("");

    /* ======================
       SEARCH DEBOUNCE
    ====================== */

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    /* ======================
       FETCH COMPLAINTS
    ====================== */

    const fetchComplaints = async () => {
        setLoading(true);

        try {
            const token =
                localStorage.getItem("token");

            const queryParams =
                new URLSearchParams();

            queryParams.append(
                "page",
                currentPage.toString()
            );

            queryParams.append(
                "limit",
                "10"
            );

            if (filterStatus !== "All") {
                queryParams.append(
                    "status",
                    filterStatus
                );
            }

            if (debouncedSearch) {
                queryParams.append(
                    "search",
                    debouncedSearch
                );
            }

            const res = await apiFetch(
                `/api/admin/complaints?${queryParams.toString()}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!res.ok) {
                throw new Error(
                    "Failed to fetch complaints"
                );
            }

            const data = await res.json();

            const rawComplaints =
                data.complaints || [];

            const pagination =
                data.pagination;

            const mapped =
                rawComplaints.map(
                    (c: any) => ({
                        id: c._id,
                        userId: c.userId,
                        userName:
                            c.userName ||
                            "Unknown",
                        subject:
                            c.subject,
                        description:
                            c.description,
                        date: c.date,
                        status:
                            c.status,
                        avatar:
                            c.avatar,
                        profileImage:
                            c.profileImage,
                        department:
                            c.department ||
                            "General",
                    })
                );

            setComplaints(mapped);

            if (pagination) {
                setTotalPages(
                    pagination.pages || 1
                );

                setTotalRecords(
                    pagination.total || 0
                );

                if (pagination.stats) {
                    setStats(
                        pagination.stats
                    );
                }
            }
        } catch (error) {
            console.error(
                "Fetch complaints failed",
                error
            );

            setComplaints([]);
        } finally {
            setLoading(false);
        }
    };

    /* ======================
       FETCH EFFECT
    ====================== */

    useEffect(() => {
        fetchComplaints();
    }, [
        filterStatus,
        debouncedSearch,
        currentPage,
    ]);

    /* ======================
       RESET PAGE
    ====================== */

    useEffect(() => {
        setCurrentPage(1);
    }, [
        filterStatus,
        debouncedSearch,
    ]);

    /* ======================
       UPDATE STATUS
    ====================== */

    const handleUpdateStatus = async (
        status: Complaint["status"]
    ) => {
        if (!selectedComplaint) return;

        try {
            const token =
                localStorage.getItem("token");

            const res = await apiFetch(
                `/api/admin/complaints/${selectedComplaint.id}?update=${status}`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!res.ok) {
                throw new Error(
                    "Failed to update status"
                );
            }

            const updated =
                await res.json();

            setComplaints((prev) =>
                prev.map((complaint) =>
                    complaint.id ===
                    selectedComplaint.id
                        ? {
                              ...complaint,
                              status:
                                  updated.status,
                          }
                        : complaint
                )
            );

            setSelectedComplaint(
                (prev) =>
                    prev
                        ? {
                              ...prev,
                              status:
                                  updated.status,
                          }
                        : null
            );

            // Refresh stats/list from backend
            fetchComplaints();
        } catch (error) {
            console.error(
                "Update status failed",
                error
            );

            alert(
                "Failed to update status"
            );
        }
    };

    /* ======================
       STATS
    ====================== */

    const totalComplaints =
        stats.total;

    const openComplaints =
        stats.open;

    const investigatingComplaints =
        stats.investigating;

    const resolvedComplaints =
        stats.resolved;

    /* ======================
       RENDER
    ====================== */

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* ======================
                HEADER
            ====================== */}

            <div className="flex items-center justify-between">

                <div className="flex items-center gap-4">

                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-lg">
                        <AlertCircle className="h-6 w-6 text-white" />
                    </div>

                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            Complaints Administration
                        </h1>
                    </div>

                </div>

            </div>

            {/* ======================
                STAT CARDS
            ====================== */}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">

                <StatCard
                    title="Total Complaints"
                    value={totalComplaints.toString()}
                    color="violet"
                    icon={FileWarning}
                />

                <StatCard
                    title="Open"
                    value={openComplaints.toString()}
                    color="red"
                    icon={AlertCircle}
                />

                <StatCard
                    title="Investigating"
                    value={investigatingComplaints.toString()}
                    color="orange"
                    icon={CircleDot}
                />

                <StatCard
                    title="Resolved"
                    value={resolvedComplaints.toString()}
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
                                placeholder="Search by employee, subject or complaint..."
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
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                            />

                        </div>

                        {/* STATUS DROPDOWN */}

                        <div className="flex w-full gap-2 lg:w-auto">

                            <Select
                                value={
                                    filterStatus
                                }
                                onValueChange={
                                    setFilterStatus
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
                                        lg:w-[180px]
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
                                        value="Open"
                                        className="
                                            focus:bg-primary
                                            focus:text-white
                                            data-[highlighted]:bg-primary
                                            data-[highlighted]:text-white
                                        "
                                    >
                                        Open
                                    </SelectItem>

                                    <SelectItem
                                        value="Investigating"
                                        className="
                                            focus:bg-primary
                                            focus:text-white
                                            data-[highlighted]:bg-primary
                                            data-[highlighted]:text-white
                                        "
                                    >
                                        Investigating
                                    </SelectItem>

                                    <SelectItem
                                        value="Resolved"
                                        className="
                                            focus:bg-primary
                                            focus:text-white
                                            data-[highlighted]:bg-primary
                                            data-[highlighted]:text-white
                                        "
                                    >
                                        Resolved
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

                                    <TableHead className="h-12 pl-6 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        Employee
                                    </TableHead>

                                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        Subject
                                    </TableHead>

                                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        Date
                                    </TableHead>

                                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        Department
                                    </TableHead>

                                    <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        Status
                                    </TableHead>

                                    <TableHead className="h-12 pr-6 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        Action
                                    </TableHead>

                                </TableRow>

                            </TableHeader>

                            <TableBody>

                                {/* LOADING */}

                                {loading ? (

                                    <TableRow>

                                        <TableCell
                                            colSpan={6}
                                            className="h-[360px]"
                                        >

                                            <div className="flex h-full flex-col items-center justify-center gap-3">

                                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">

                                                    <Loader2 className="h-5 w-5 animate-spin text-primary" />

                                                </div>

                                                <div className="text-center">

                                                    <p className="text-sm font-semibold text-slate-700">
                                                        Updating complaints
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-400">
                                                        Fetching the latest complaints...
                                                    </p>

                                                </div>

                                            </div>

                                        </TableCell>

                                    </TableRow>

                                ) : complaints.length ===
                                  0 ? (

                                    /* EMPTY */

                                    <TableRow>

                                        <TableCell
                                            colSpan={6}
                                            className="h-[320px]"
                                        >

                                            <div className="flex flex-col items-center justify-center text-center">

                                                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">

                                                    <Search className="h-6 w-6 text-slate-400" />

                                                </div>

                                                <p className="font-semibold text-slate-800">
                                                    No complaints found
                                                </p>

                                                <p className="mt-1 text-sm text-slate-400">
                                                    Try changing your search or filters.
                                                </p>

                                            </div>

                                        </TableCell>

                                    </TableRow>

                                ) : (

                                    /* DATA */

                                    complaints.map(
                                        (
                                            complaint
                                        ) => (

                                            <TableRow
                                                key={
                                                    complaint.id
                                                }
                                                className="
                                                    group
                                                    border-b
                                                    border-slate-100
                                                    transition-colors
                                                    hover:bg-primary/[0.025]
                                                "
                                            >

                                                {/* EMPLOYEE */}

                                                <TableCell className="py-4 pl-6">

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
                                                                    complaint.profileImage ||
                                                                    ""
                                                                }
                                                                alt={
                                                                    complaint.userName
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
                                                                {complaint.userName
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
                                                                    complaint.userName
                                                                }
                                                            </p>

                                                            <p className="mt-0.5 truncate text-xs text-slate-400">
                                                                {
                                                                    complaint.userId
                                                                }
                                                            </p>

                                                        </div>

                                                    </div>

                                                </TableCell>

                                                {/* SUBJECT */}

                                                <TableCell>

                                                    <div className="max-w-[260px]">

                                                        <p className="truncate text-sm font-semibold text-slate-700">
                                                            {
                                                                complaint.subject
                                                            }
                                                        </p>

                                                        <p
                                                            className="mt-0.5 truncate text-xs text-slate-400"
                                                            title={
                                                                complaint.description
                                                            }
                                                        >
                                                            {
                                                                complaint.description
                                                            }
                                                        </p>

                                                    </div>

                                                </TableCell>

                                                {/* DATE */}

                                                <TableCell className="whitespace-nowrap">

                                                    <div className="flex flex-col">

                                                        <span className="text-sm font-semibold tracking-tight text-slate-700">

                                                            {new Date(
                                                                complaint.date
                                                            ).toLocaleDateString(
                                                                "en-GB",
                                                                {
                                                                    day: "2-digit",
                                                                    month: "short",
                                                                    year: "numeric",
                                                                }
                                                            )}

                                                        </span>

                                                        <span className="mt-0.5 text-xs font-medium text-slate-400">

                                                            {new Date(
                                                                complaint.date
                                                            ).toLocaleTimeString(
                                                                "en-US",
                                                                {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                    hour12: true,
                                                                }
                                                            )}

                                                        </span>

                                                    </div>

                                                </TableCell>

                                                {/* DEPARTMENT */}

                                                <TableCell>

                                                    <DepartmentBadge
                                                        department={
                                                            complaint.department
                                                        }
                                                    />

                                                </TableCell>

                                                {/* STATUS */}

                                                <TableCell>

                                                    <StatusBadge
                                                        status={
                                                            complaint.status
                                                        }
                                                    />

                                                </TableCell>

                                                {/* ACTION */}

                                                <TableCell className="pr-6 text-right">

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedComplaint(
                                                                complaint
                                                            );
                                                            setIsDetailsOpen(
                                                                true
                                                            );
                                                        }}
                                                        className="
                                                            h-9
                                                            w-9
                                                            rounded-lg
                                                            bg-primary
                                                            p-0
                                                            text-white
                                                            shadow-md
                                                            shadow-primary/20
                                                            hover:bg-primary/90
                                                            hover:text-white
                                                            active:scale-95
                                                        "
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>

                                                </TableCell>

                                            </TableRow>

                                        )
                                    )
                                )}

                            </TableBody>

                        </Table>

                    </div>

                    {/* ======================
                        PAGINATION
                    ====================== */}

                    {!loading &&
                        complaints.length >
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

                                    {" "}complaints

                                </p>

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

            {/* ======================
                DETAILS DIALOG
            ====================== */}

            <Dialog
                open={isDetailsOpen}
                onOpenChange={
                    setIsDetailsOpen
                }
            >

                <DialogContent className="w-[92vw] max-w-3xl rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl">
    <DialogHeader className="rounded-t-2xl border-b border-slate-100 bg-slate-50/70 px-6 py-4">
        <DialogTitle className="text-lg font-bold text-slate-900">
            Complaint Details
        </DialogTitle>
        <DialogDescription className="mt-1 text-xs text-slate-500">
            Review the complaint and update its investigation status.
        </DialogDescription>
    </DialogHeader>

    {selectedComplaint && (
        <div className="px-6 py-5">
            {/* Employee / Department / Date */}
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">

                {/* Employee */}
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-slate-200 shadow-sm">
                        <AvatarImage
                            src={
                                selectedComplaint.profileImage ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    selectedComplaint.userName
                                )}&background=f1f5f9&color=334155`
                            }
                            alt={selectedComplaint.userName}
                            className="object-cover"
                        />

                        <AvatarFallback className="bg-slate-100 text-slate-600 font-semibold">
                            {selectedComplaint.userName
                                .charAt(0)
                                .toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                            {selectedComplaint.userName}
                        </p>

                        <p className="truncate text-xs text-slate-400">
                            {selectedComplaint.userId}
                        </p>
                    </div>
                </div>

                {/* Department */}
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Department
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                        {selectedComplaint.department}
                    </p>
                </div>

                {/* Date */}
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Submitted
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                        {new Date(
                            selectedComplaint.date
                        ).toLocaleDateString()}
                    </p>

                    <p className="text-[11px] text-slate-400">
                        {new Date(
                            selectedComplaint.date
                        ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </p>
                </div>
            </div>

            {/* Subject */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Subject
                </p>

                <h3 className="mt-1 text-base font-bold text-slate-900">
                    {selectedComplaint.subject}
                </h3>
            </div>

            {/* Description - Scrollable */}
            <div className="mt-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Complaint Description
                </p>

                <div className="h-[120px] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm leading-6 text-slate-700 whitespace-pre-wrap scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                    {selectedComplaint.description}
                </div>
            </div>

            {/* Status */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-slate-800">
                            Complaint Status
                        </p>

                        <p className="mt-0.5 text-[11px] text-slate-400">
                            Update the current investigation status.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
    <Button
        size="sm"
        variant={
            selectedComplaint.status === "Open"
                ? "default"
                : "outline"
        }
        className={cn(
            "h-8 rounded-lg px-3 text-xs transition-colors",
            selectedComplaint.status === "Open"
                ? "bg-red-600 text-white hover:bg-red-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-primary hover:bg-primary hover:text-white"
        )}
        onClick={() => handleUpdateStatus("Open")}
    >
        Open
    </Button>

    <Button
        size="sm"
        variant={
            selectedComplaint.status === "Investigating"
                ? "default"
                : "outline"
        }
        className={cn(
            "h-8 rounded-lg px-3 text-xs transition-colors",
            selectedComplaint.status === "Investigating"
                ? "bg-orange-500 text-white hover:bg-orange-600"
                : "border-slate-200 bg-white text-slate-600 hover:border-primary hover:bg-primary hover:text-white"
        )}
        onClick={() =>
            handleUpdateStatus("Investigating")
        }
    >
        Investigating
    </Button>

    <Button
        size="sm"
        variant={
            selectedComplaint.status === "Resolved"
                ? "default"
                : "outline"
        }
        className={cn(
            "h-8 rounded-lg px-3 text-xs transition-colors",
            selectedComplaint.status === "Resolved"
                ? "bg-green-600 text-white hover:bg-green-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-primary hover:bg-primary hover:text-white"
        )}
        onClick={() => handleUpdateStatus("Resolved")}
    >
        Resolved
    </Button>
</div>

                </div>
            </div>
        </div>
    )}
</DialogContent>




            </Dialog>

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
