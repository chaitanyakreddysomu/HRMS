import { useState, useEffect } from "react";
import { apiFetch } from "@/config/api";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    CheckCircle2,
    XCircle,
    Clock,
    Search,
    FileText,
    ArrowUpDown,
    Check,
    X,
    Eye,
    Loader2,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO } from "date-fns";

interface LeaveRequest {
    _id: string;
    userId: string;
    userName: string;
    type: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: string;
    appliedOn: string;
    rejectionReason?: string;
    profileImage?: string;
    avatar?: string;
}

interface LeaveStats {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
}

export default function AdminLeaves() {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [typeFilter, setTypeFilter] = useState("All");

    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [stats, setStats] = useState<LeaveStats>({
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
    });

    const [loading, setLoading] = useState(false);

    const [sortConfig, setSortConfig] = useState<{
        key: string;
        direction: "asc" | "desc";
    } | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    // Rejection Dialog
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [rejectId, setRejectId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");

    // Details Dialog
    const [selectedLeave, setSelectedLeave] =
        useState<LeaveRequest | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const fetchLeaves = async () => {
        setLoading(true);

        try {
            const token = localStorage.getItem("token");

            const params = new URLSearchParams();

            if (searchTerm.trim()) {
                params.append("search", searchTerm.trim());
            }

            if (statusFilter !== "All") {
                params.append("status", statusFilter);
            }

            if (typeFilter !== "All") {
                params.append("type", typeFilter);
            }

            if (sortConfig) {
                params.append("sortBy", sortConfig.key);
                params.append("order", sortConfig.direction);
            }

            params.append("page", currentPage.toString());
            params.append("limit", "10");

            const res = await apiFetch(`/api/admin/leaves?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.ok) {
                const data = await res.json();

                setRequests(data.leaves || []);

                setStats(
                    data.stats || {
                        total: 0,
                        approved: 0,
                        pending: 0,
                        rejected: 0,
                    }
                );

                if (data.pagination) {
                    setTotalPages(Math.max(data.pagination.pages || 1, 1));
                    setTotalRecords(data.pagination.total || 0);
                } else {
                    setTotalPages(1);
                    setTotalRecords(data.leaves?.length || 0);
                }
            }
        } catch (error) {
            console.error("Failed to fetch leaves", error);
        } finally {
            setLoading(false);
        }
    };

    // Auto search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLeaves();
        }, 400);

        return () => clearTimeout(timer);
    }, [
        searchTerm,
        statusFilter,
        typeFilter,
        sortConfig,
        currentPage,
    ]);

    // Reset page when filters/search change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, typeFilter]);

    const handleSort = (key: string) => {
        setSortConfig((current) => {
            if (current?.key === key) {
                return {
                    key,
                    direction:
                        current.direction === "asc" ? "desc" : "asc",
                };
            }

            return {
                key,
                direction: "asc",
            };
        });
    };

    const updateStatus = async (
        id: string,
        action: "approve" | "reject"
    ) => {
        if (action === "reject") {
            setRejectId(id);
            setIsRejectDialogOpen(true);
            return;
        }

        await performStatusUpdate(id, "Approved");
    };

    const confirmReject = async () => {
        if (!rejectId || !rejectionReason.trim()) return;

        await performStatusUpdate(
            rejectId,
            "Rejected",
            rejectionReason.trim()
        );

        setIsRejectDialogOpen(false);
        setRejectId(null);
        setRejectionReason("");
    };

    const performStatusUpdate = async (
        id: string,
        status: string,
        reason?: string
    ) => {
        try {
            const token = localStorage.getItem("token");

            const res = await apiFetch(`/api/admin/leaves/${id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status,
                    rejectionReason: reason,
                }),
            });

            if (res.ok) {
                await fetchLeaves();

                if (selectedLeave?._id === id) {
                    setSelectedLeave((prev) =>
                        prev
                            ? {
                                  ...prev,
                                  status,
                                  rejectionReason: reason,
                              }
                            : null
                    );
                }
            } else {
                alert("Failed to update status");
            }
        } catch (error) {
            console.error("Update failed", error);
        }
    };

    const getDuration = (start: string, end: string) => {
        const s = new Date(start);
        const e = new Date(end);

        const diffTime = Math.abs(e.getTime() - s.getTime());
        const diffDays =
            Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        return diffDays === 1 ? "1 Day" : `${diffDays} Days`;
    };

    const formatDateTime = (date?: string) => {
        if (!date) {
            return {
                date: "N/A",
                time: "",
            };
        }

        try {
            const parsed = parseISO(date);

            return {
                date: format(parsed, "dd MMM yyyy"),
                time: format(parsed, "hh:mm a"),
            };
        } catch {
            return {
                date: "N/A",
                time: "",
            };
        }
    };

    const showingFrom =
        totalRecords === 0
            ? 0
            : (currentPage - 1) * 10 + 1;

    const showingTo =
        totalRecords === 0
            ? 0
            : Math.min(currentPage * 10, totalRecords);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* HEADER */}
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center shadow-lg">
                    <FileText className="h-6 w-6 text-white" />
                </div>

                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Leave Management
                    </h1>
                </div>
            </div>

            {/* STATS */}
            <div className="grid gap-6 md:grid-cols-4">
                <StatCard
                    title="Total Requests"
                    value={stats.total}
                    icon={FileText}
                    color="blue"
                />

                <StatCard
                    title="Approved"
                    value={stats.approved}
                    icon={CheckCircle2}
                    color="green"
                />

                <StatCard
                    title="Pending"
                    value={stats.pending}
                    icon={Clock}
                    color="orange"
                />

                <StatCard
                    title="Rejected"
                    value={stats.rejected}
                    icon={XCircle}
                    color="red"
                />
            </div>

            {/* SEARCH + FILTERS + TABLE */}
            <Card className="border-none shadow-md overflow-hidden">
                {/* FILTER BAR */}
                <div className="p-4 border-b bg-slate-50/70">
                    <div className="flex flex-col lg:flex-row gap-2 items-center">
                        {/* FULL SEARCH */}
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                            <input
                                className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-white text-sm ring-offset-background outline-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                placeholder="Search employees, leave type or reason..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                }}
                            />
                        </div>

                        {/* TYPE */}
                        <Select
                            value={typeFilter}
                            onValueChange={(value) => {
                                setTypeFilter(value);
                            }}
                        >
                            <SelectTrigger
                                className="
                                    w-full lg:w-[180px]
                                    h-10
                                    bg-white
                                    border-input
                                    focus:ring-2
                                    focus:ring-primary/20
                                "
                            >
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem
                                    value="All"
                                    className="focus:bg-primary focus:text-primary-foreground"
                                >
                                    All Types
                                </SelectItem>

                                <SelectItem
                                    value="Casual"
                                    className="focus:bg-primary focus:text-primary-foreground"
                                >
                                    Casual Leave
                                </SelectItem>

                                <SelectItem
                                    value="Sick"
                                    className="focus:bg-primary focus:text-primary-foreground"
                                >
                                    Sick Leave
                                </SelectItem>

                                <SelectItem
                                    value="Annual"
                                    className="focus:bg-primary focus:text-primary-foreground"
                                >
                                    Annual Leave
                                </SelectItem>

                                <SelectItem
                                    value="WFH"
                                    className="focus:bg-primary focus:text-primary-foreground"
                                >
                                    WFH
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        {/* STATUS */}
                        <Select
                            value={statusFilter}
                            onValueChange={(value) => {
                                setStatusFilter(value);
                            }}
                        >
                            <SelectTrigger
                                className="
                                    w-full lg:w-[180px]
                                    h-10
                                    bg-white
                                    border-input
                                    focus:ring-2
                                    focus:ring-primary/20
                                "
                            >
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem
                                    value="All"
                                    className="focus:bg-primary focus:text-primary-foreground"
                                >
                                    All Status
                                </SelectItem>

                                <SelectItem
                                    value="Pending"
                                    className="focus:bg-primary focus:text-primary-foreground"
                                >
                                    Pending
                                </SelectItem>

                                <SelectItem
                                    value="Approved"
                                    className="focus:bg-primary focus:text-primary-foreground"
                                >
                                    Approved
                                </SelectItem>

                                <SelectItem
                                    value="Rejected"
                                    className="focus:bg-primary focus:text-primary-foreground"
                                >
                                    Rejected
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* TABLE */}
                <CardContent className="p-0">
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th
                                        className="h-12 px-4 align-middle font-medium text-muted-foreground cursor-pointer select-none"
                                        onClick={() =>
                                            handleSort("userName")
                                        }
                                    >
                                        <div className="flex items-center gap-1">
                                            Employee
                                            <ArrowUpDown className="h-3 w-3" />
                                        </div>
                                    </th>

                                    <th
                                        className="h-12 px-4 align-middle font-medium text-muted-foreground cursor-pointer select-none"
                                        onClick={() =>
                                            handleSort("type")
                                        }
                                    >
                                        <div className="flex items-center gap-1">
                                            Type
                                            <ArrowUpDown className="h-3 w-3" />
                                        </div>
                                    </th>

                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">
                                        Duration
                                    </th>

                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">
                                        Reason
                                    </th>

                                    <th
                                        className="h-12 px-4 align-middle font-medium text-muted-foreground cursor-pointer select-none"
                                        onClick={() =>
                                            handleSort("status")
                                        }
                                    >
                                        <div className="flex items-center gap-1">
                                            Status
                                            <ArrowUpDown className="h-3 w-3" />
                                        </div>
                                    </th>

                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="[&_tr:last-child]:border-0">
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="h-28 text-center"
                                        >
                                            <div className="flex justify-center items-center gap-2 text-muted-foreground">
                                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                                Loading leave requests...
                                            </div>
                                        </td>
                                    </tr>
                                ) : requests.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="h-28 text-center text-muted-foreground"
                                        >
                                            No leave requests found.
                                        </td>
                                    </tr>
                                ) : (
                                    requests.map((req) => {
                                        const appliedDate =
                                            formatDateTime(
                                                req.appliedOn
                                            );

                                        return (
                                            <tr
                                                key={req._id}
                                                className="border-b transition-colors hover:bg-transparent"
                                            >
                                                {/* EMPLOYEE */}
                                                <td className="p-4 align-middle">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9 border">
                                                            <AvatarImage
                                                                className="object-cover"
                                                                src={
                                                                    req.profileImage ||
                                                                    req.avatar ||
                                                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                                        req.userName || "User"
                                                                    )}&background=e0f2fe&color=0369a1`
                                                                }
                                                                alt={
                                                                    req.userName
                                                                }
                                                            />

                                                            <AvatarFallback className="bg-sky-50 text-sky-700 font-semibold">
                                                                {req.userName
                                                                    ? req.userName.charAt(
                                                                          0
                                                                      ).toUpperCase()
                                                                    : "U"}
                                                            </AvatarFallback>
                                                        </Avatar>

                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-slate-900">
                                                                {req.userName ||
                                                                    "Unknown"}
                                                            </span>

                                                            {/* DATE TOP / TIME BOTTOM */}
                                                            <div className="flex flex-col mt-0.5">
                                                                <span className="text-[11px] font-medium text-slate-500">
                                                                    {
                                                                        appliedDate.date
                                                                    }
                                                                </span>

                                                                {appliedDate.time && (
                                                                    <span className="text-[10px] font-mono tracking-wide text-slate-400">
                                                                        {
                                                                            appliedDate.time
                                                                        }
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* TYPE */}
                                                <td className="p-4 align-middle">
                                                    <LeaveTypeBadge
                                                        type={req.type}
                                                    />
                                                </td>

                                                {/* DURATION */}
                                                <td className="p-4 align-middle">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-800">
                                                            {getDurationSafe(
                                                                req.startDate,
                                                                req.endDate
                                                            )}
                                                        </span>

                                                        <span className="text-[11px] text-slate-400 font-mono tracking-wide">
                                                            {formatDateSafe(
                                                                req.startDate
                                                            )}{" "}
                                                            -{" "}
                                                            {formatDateSafe(
                                                                req.endDate
                                                            )}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* REASON */}
                                                <td
                                                    className="p-4 align-middle max-w-[240px]"
                                                    title={req.reason}
                                                >
                                                    <div className="truncate text-slate-700">
                                                        {req.reason || "N/A"}
                                                    </div>
                                                </td>

                                                {/* STATUS */}
                                                <td className="p-4 align-middle">
                                                    <LeaveStatusBadge
                                                        status={req.status}
                                                    />
                                                </td>

                                                {/* ACTION */}
                                                <td className="p-4 align-middle text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            className="
                                                                h-8 w-8 p-0
                                                                bg-blue-50
                                                                text-blue-600
                                                                hover:bg-blue-100
                                                                hover:text-blue-700
                                                                rounded-lg
                                                                shadow-sm
                                                            "
                                                            onClick={() => {
                                                                setSelectedLeave(
                                                                    req
                                                                );
                                                                setIsDetailsOpen(
                                                                    true
                                                                );
                                                            }}
                                                            title="View Details"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>

                                                        {req.status ===
                                                            "Pending" && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    className="
                                                                        h-8 w-8 p-0
                                                                        bg-green-50
                                                                        text-green-600
                                                                        hover:bg-green-100
                                                                        hover:text-green-700
                                                                        rounded-lg
                                                                        shadow-sm
                                                                    "
                                                                    onClick={() =>
                                                                        updateStatus(
                                                                            req._id,
                                                                            "approve"
                                                                        )
                                                                    }
                                                                    title="Approve"
                                                                >
                                                                    <Check className="h-4 w-4" />
                                                                </Button>

                                                                <Button
                                                                    variant="ghost"
                                                                    className="
                                                                        h-8 w-8 p-0
                                                                        bg-red-50
                                                                        text-red-600
                                                                        hover:bg-red-100
                                                                        hover:text-red-700
                                                                        rounded-lg
                                                                        shadow-sm
                                                                    "
                                                                    onClick={() =>
                                                                        updateStatus(
                                                                            req._id,
                                                                            "reject"
                                                                        )
                                                                    }
                                                                    title="Reject"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-4 border-t bg-slate-50/50">
                        <div className="text-sm text-muted-foreground">
                            Showing{" "}
                            <span className="font-medium text-slate-900">
                                {showingFrom}
                            </span>{" "}
                            to{" "}
                            <span className="font-medium text-slate-900">
                                {showingTo}
                            </span>{" "}
                            of{" "}
                            <span className="font-medium text-slate-900">
                                {totalRecords}
                            </span>{" "}
                            entries
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8"
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.max(prev - 1, 1)
                                    )
                                }
                                disabled={
                                    currentPage === 1 || loading
                                }
                            >
                                Previous
                            </Button>

                            <span className="text-sm font-medium min-w-[90px] text-center text-slate-700">
                                Page {currentPage} of{" "}
                                {totalPages || 1}
                            </span>

                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8"
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.min(
                                            prev + 1,
                                            totalPages
                                        )
                                    )
                                }
                                disabled={
                                    currentPage >= totalPages ||
                                    loading
                                }
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* DETAILS DIALOG */}
            <Dialog
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
            >
                <DialogContent className="sm:max-w-2xl rounded-2xl p-6">
                    <DialogHeader className="border-b pb-4">
                        <DialogTitle className="text-xl font-bold text-slate-900">
                            Leave Request Details
                        </DialogTitle>

                        <DialogDescription>
                            Review employee leave request details.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedLeave && (
                        <div className="space-y-5">
                            {/* EMPLOYEE HEADER */}
                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border">
                                    <AvatarImage
                                        className="object-cover"
                                        src={
                                            selectedLeave.profileImage ||
                                            selectedLeave.avatar ||
                                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                selectedLeave.userName ||
                                                    "User"
                                            )}&background=e0f2fe&color=0369a1`
                                        }
                                    />

                                    <AvatarFallback className="bg-sky-50 text-sky-700 font-semibold">
                                        {selectedLeave.userName?.charAt(
                                            0
                                        )}
                                    </AvatarFallback>
                                </Avatar>

                                <div>
                                    <h3 className="font-semibold text-lg text-slate-900">
                                        {selectedLeave.userName}
                                    </h3>

                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-slate-500">
                                            Applied on
                                        </span>

                                        <span className="text-xs font-medium text-slate-700">
                                            {formatDateSafe(
                                                selectedLeave.appliedOn
                                            )}
                                        </span>

                                        <span className="text-[10px] font-mono tracking-wide text-slate-400">
                                            {formatTimeSafe(
                                                selectedLeave.appliedOn
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* DETAILS GRID */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-xl border bg-slate-50/60 p-4">
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Leave Type
                                    </Label>

                                    <div className="mt-2">
                                        <LeaveTypeBadge
                                            type={selectedLeave.type}
                                        />
                                    </div>
                                </div>

                                <div className="rounded-xl border bg-slate-50/60 p-4">
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Status
                                    </Label>

                                    <div className="mt-2">
                                        <LeaveStatusBadge
                                            status={
                                                selectedLeave.status
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="rounded-xl border bg-slate-50/60 p-4">
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Start Date
                                    </Label>

                                    <p className="font-semibold text-sm text-slate-900 mt-1">
                                        {formatDateSafe(
                                            selectedLeave.startDate
                                        )}
                                    </p>
                                </div>

                                <div className="rounded-xl border bg-slate-50/60 p-4">
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        End Date
                                    </Label>

                                    <p className="font-semibold text-sm text-slate-900 mt-1">
                                        {formatDateSafe(
                                            selectedLeave.endDate
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* REASON */}
                            <div>
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Reason
                                </Label>

                                <div className="mt-2 max-h-[130px] overflow-y-auto rounded-xl border bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                                    {selectedLeave.reason ||
                                        "No reason provided."}
                                </div>
                            </div>

                            {/* REJECTION REASON */}
                            {selectedLeave.rejectionReason && (
                                <div>
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-red-500">
                                        Rejection Reason
                                    </Label>

                                    <div className="mt-2 max-h-[110px] overflow-y-auto rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 whitespace-pre-wrap">
                                        {
                                            selectedLeave.rejectionReason
                                        }
                                    </div>
                                </div>
                            )}

                            {/* ACTIONS */}
                            {selectedLeave.status === "Pending" && (
                                <div className="flex justify-end gap-2 pt-2 border-t">
                                    <Button
                                        variant="outline"
                                        className="
                                            border-red-200
                                            text-red-600
                                            hover:bg-primary
                                            hover:text-primary-foreground
                                            hover:border-primary
                                        "
                                        onClick={() => {
                                            setRejectId(
                                                selectedLeave._id
                                            );
                                            setIsDetailsOpen(false);
                                            setIsRejectDialogOpen(
                                                true
                                            );
                                        }}
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Reject
                                    </Button>

                                    <Button
                                        className="bg-primary hover:bg-primary/90 text-white"
                                        onClick={() => {
                                            updateStatus(
                                                selectedLeave._id,
                                                "approve"
                                            );
                                            setIsDetailsOpen(false);
                                        }}
                                    >
                                        <Check className="h-4 w-4 mr-2" />
                                        Approve
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* REJECTION DIALOG */}
            <Dialog
                open={isRejectDialogOpen}
                onOpenChange={setIsRejectDialogOpen}
            >
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            Reject Leave Request
                        </DialogTitle>

                        <DialogDescription>
                            Please provide a reason for rejection.
                            This will be visible to the employee.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-3 space-y-2">
                        <Label
                            htmlFor="reason"
                            className="text-sm font-semibold"
                        >
                            Reason for Rejection
                        </Label>

                        <Textarea
                            id="reason"
                            placeholder="e.g. Important client meeting, insufficient leave balance..."
                            value={rejectionReason}
                            onChange={(e) =>
                                setRejectionReason(
                                    e.target.value
                                )
                            }
                            className="min-h-[100px] resize-none"
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() =>
                                setIsRejectDialogOpen(false)
                            }
                        >
                            Cancel
                        </Button>

                        <Button
                            className="bg-primary hover:bg-primary/90 text-white"
                            onClick={confirmReject}
                            disabled={!rejectionReason.trim()}
                        >
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */

function formatDateSafe(date?: string) {
    if (!date) return "N/A";

    try {
        return format(parseISO(date), "dd MMM yyyy");
    } catch {
        return "N/A";
    }
}

function formatTimeSafe(date?: string) {
    if (!date) return "";

    try {
        return format(parseISO(date), "hh:mm a");
    } catch {
        return "";
    }
}

function getDurationSafe(start?: string, end?: string) {
    if (!start || !end) return "N/A";

    try {
        const s = new Date(start);
        const e = new Date(end);

        if (
            Number.isNaN(s.getTime()) ||
            Number.isNaN(e.getTime())
        ) {
            return "N/A";
        }

        const diffTime = Math.abs(
            e.getTime() - s.getTime()
        );

        const diffDays =
            Math.ceil(
                diffTime / (1000 * 60 * 60 * 24)
            ) + 1;

        return diffDays === 1
            ? "1 Day"
            : `${diffDays} Days`;
    } catch {
        return "N/A";
    }
}

/* ---------------------------------------------------------
   TYPE BADGE
--------------------------------------------------------- */

function LeaveTypeBadge({ type }: { type: string }) {
    const config: Record<
        string,
        string
    > = {
        Casual:
            "bg-blue-50 text-blue-700 border-blue-200",
        Sick:
            "bg-red-50 text-red-700 border-red-200",
        Annual:
            "bg-violet-50 text-violet-700 border-violet-200",
        WFH:
            "bg-cyan-50 text-cyan-700 border-cyan-200",
    };

    const className =
        config[type] ||
        "bg-slate-50 text-slate-700 border-slate-200";

    return (
        <Badge
            variant="outline"
            className={`px-2.5 py-1 font-medium border ${className}`}
        >
            {type || "N/A"}
        </Badge>
    );
}

/* ---------------------------------------------------------
   STATUS BADGE
--------------------------------------------------------- */

function LeaveStatusBadge({
    status,
}: {
    status: string;
}) {
    const statusConfig: Record<
        string,
        {
            icon: typeof CheckCircle2;
            badge: string;
        }
    > = {
        Approved: {
            icon: CheckCircle2,
            badge:
                "bg-green-100 text-green-700 border-green-200",
        },

        Pending: {
            icon: Clock,
            badge:
                "bg-orange-100 text-orange-700 border-orange-200",
        },

        Rejected: {
            icon: XCircle,
            badge:
                "bg-red-100 text-red-700 border-red-200",
        },
    };

    const config =
        statusConfig[status] ||
        statusConfig.Pending;

    const Icon = config.icon;

    return (
        <Badge
            variant="outline"
            className={`gap-1 pr-3 pl-2 py-1 font-normal border ${config.badge}`}
        >
            <Icon className="h-3 w-3" />
            {status}
        </Badge>
    );
}

/* ---------------------------------------------------------
   STAT CARD
--------------------------------------------------------- */

function StatCard({
    title,
    value,
    icon: Icon,
    color,
}: {
    title: string;
    value: number;
    icon: any;
    color:
        | "blue"
        | "green"
        | "orange"
        | "red"
        | "violet";
}) {
    const styles = {
        blue: {
            border: "border-l-blue-500",
            text: "text-blue-600",
            bg: "bg-blue-50/50",
            iconBg:
                "bg-blue-500 shadow-blue-200",
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

        red: {
            border: "border-l-red-500",
            text: "text-red-600",
            bg: "bg-red-50/50",
            iconBg:
                "bg-red-500 shadow-red-200",
        },

        violet: {
            border: "border-l-violet-500",
            text: "text-violet-600",
            bg: "bg-violet-50/50",
            iconBg:
                "bg-violet-500 shadow-violet-200",
        },
    };

    const current = styles[color];

    return (
        <Card
            className={`
                group
                border-l-4
                shadow-sm
                hover:shadow-md
                transition-all
                ${current.bg}
                ${current.border}
            `}
        >
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p
                        className={`
                            text-xs
                            font-bold
                            uppercase
                            tracking-wider
                            mb-2
                            ${current.text}
                        `}
                    >
                        {title}
                    </p>

                    <div className="text-2xl font-bold text-slate-800 tracking-tight">
                        {value}
                    </div>
                </div>

                <div
                    className={`
                        h-12
                        w-12
                        rounded-xl
                        flex
                        items-center
                        justify-center
                        text-white
                        shadow-lg
                        transition-transform
                        duration-300
                        group-hover:scale-110
                        ${current.iconBg}
                    `}
                >
                    <Icon className="h-6 w-6" />
                </div>
            </CardContent>
        </Card>
    );
}
