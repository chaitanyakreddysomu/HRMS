import { useState, useEffect } from "react";
import { apiFetch } from "@/config/api";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    CreditCard,
    Search,
    Download,
    Building2,
    Users,
    Clock,
    AlertCircle,
    Loader2,
    type LucideIcon,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function AdminBankDetails() {
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const [employees, setEmployees] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalEmployees: 0,
        bankAccountsAdded: 0,
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchBankDetails = async () => {
        setLoading(true);

        try {
            const token = localStorage.getItem("token");

            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: "10",
            });

            if (searchTerm.trim()) {
                params.append("search", searchTerm.trim());
            }

            if (roleFilter !== "ALL") {
                params.append("role", roleFilter);
            }

            if (statusFilter !== "ALL") {
                params.append("status", statusFilter);
            }

            const res = await apiFetch(
                `/api/admin/employee-bank-details?${params.toString()}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!res.ok) {
                throw new Error("Failed to fetch bank details");
            }

            const data = await res.json();

            setEmployees(data.employees || []);

            setStats(
                data.stats || {
                    totalEmployees: 0,
                    bankAccountsAdded: 0,
                }
            );

            if (data.pagination) {
                setTotalPages(data.pagination.pages || 1);
                setTotalRecords(data.pagination.total || 0);
            } else {
                setTotalPages(1);
                setTotalRecords(data.employees?.length || 0);
            }
        } catch (error) {
            console.error("Failed to fetch bank details", error);
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    };

    /*
     * Automatic search/filter.
     * No Apply button required.
     */
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchBankDetails();
        }, 400);

        return () => clearTimeout(timer);
    }, [currentPage, searchTerm, roleFilter, statusFilter]);

    /*
     * Reset pagination whenever search/filter changes.
     */
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, roleFilter, statusFilter]);

    const pendingVerification = 0;
    const missingDetails = Math.max(
        stats.totalEmployees - stats.bankAccountsAdded,
        0
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center shadow-lg">
                            <CreditCard className="h-6 w-6 text-white" />
                        </div>

                        <span>Bank Details</span>
                    </h1>
                </div>

                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200">
                    <Download className="mr-2 h-4 w-4" />
                    Export Report
                </Button>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Employees"
                    value={stats.totalEmployees.toString()}
                    color="violet"
                    icon={Users}
                />

                <StatCard
                    title="Bank Accounts Added"
                    value={stats.bankAccountsAdded.toString()}
                    color="green"
                    icon={CreditCard}
                />

                <StatCard
                    title="Pending Verification"
                    value={pendingVerification.toString()}
                    color="orange"
                    icon={Clock}
                />

                <StatCard
                    title="Missing Details"
                    value={missingDetails.toString()}
                    color="red"
                    icon={AlertCircle}
                />
            </div>

            {/* SEARCH + FILTERS + TABLE */}
            <Card className="border shadow-sm overflow-hidden">
                {/* FILTER BAR */}
                <div className="p-4 bg-slate-50/50 border-b">
                    <div className="flex flex-col md:flex-row gap-2 w-full">
                        {/* SEARCH */}
                        <div className="relative flex-1">
                            <Search
                                className="
                                    absolute
                                    left-3
                                    top-1/2
                                    h-4
                                    w-4
                                    -translate-y-1/2
                                    text-slate-400
                                    pointer-events-none
                                "
                            />

                            <Input
                                placeholder="Search employees, banks or account details..."
                                className="
                                    h-10
                                    w-full
                                    rounded-md
                                    border-slate-200
                                    bg-white
                                    pl-10
                                    pr-4
                                    text-sm
                                    shadow-none
                                    outline-none
                                    focus-visible:outline-none
                                    focus-visible:ring-0
                                    focus-visible:ring-offset-0
                                    focus:border-primary
                                "
                                value={searchTerm}
                                onChange={(e) =>
                                    setSearchTerm(e.target.value)
                                }
                            />
                        </div>

                        {/* STATUS DROPDOWN */}
                        <Select
                            value={statusFilter}
                            onValueChange={setStatusFilter}
                        >
                            <SelectTrigger
                                className="
                                    h-10
                                    w-full
                                    md:w-[190px]
                                    bg-white
                                    border-slate-200
                                    shadow-none
                                    focus:ring-0
                                    focus:ring-offset-0
                                "
                            >
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem
                                    value="ALL"
                                    className="focus:bg-primary focus:text-primary-foreground"
                                >
                                    All Status
                                </SelectItem>

                                <SelectItem
                                    value="ADDED"
                                    className="focus:bg-primary focus:text-primary-foreground"
                                >
                                    Bank Details Added
                                </SelectItem>

                                <SelectItem
                                    value="NOT_ADDED"
                                    className="focus:bg-primary focus:text-primary-foreground"
                                >
                                    Bank Details Not Added
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        {/* ROLE DROPDOWN */}
                        <Select
                            value={roleFilter}
                            onValueChange={setRoleFilter}
                        >
                            <SelectTrigger
                                className="
                                    h-10
                                    w-full
                                    md:w-[150px]
                                    bg-white
                                    border-slate-200
                                    shadow-none
                                    focus:ring-0
                                    focus:ring-offset-0
                                "
                            >
                                <SelectValue placeholder="All Roles" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem
                                    value="ALL"
                                    className="focus:bg-primary focus:text-primary-foreground"
                                >
                                    All Roles
                                </SelectItem>

                                <SelectItem
                                    value="HR"
                                    className="focus:bg-primary focus:text-primary-foreground"
                                >
                                    HR
                                </SelectItem>

                                <SelectItem
                                    value="EMPLOYEE"
                                    className="focus:bg-primary focus:text-primary-foreground"
                                >
                                    Employee
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* TABLE */}
                <CardContent className="p-0">
                    <div className="overflow-x-auto min-h-[400px]">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                    <TableHead className="font-semibold text-slate-700 pl-6">
                                        Employee
                                    </TableHead>

                                    <TableHead className="font-semibold text-slate-700">
                                        Role
                                    </TableHead>

                                    <TableHead className="font-semibold text-slate-700">
                                        Account Details
                                    </TableHead>

                                    <TableHead className="font-semibold text-slate-700">
                                        Bank Name
                                    </TableHead>

                                    <TableHead className="font-semibold text-slate-700">
                                        Branch & IFSC
                                    </TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="h-24 text-center"
                                        >
                                            <div className="flex justify-center items-center gap-2 text-muted-foreground">
                                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                Loading details...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : employees.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="h-24 text-center text-muted-foreground"
                                        >
                                            No bank details found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    employees.map((emp) => {
                                        const hasProfile =
                                            !!emp.profileImage || !!emp.avatar;

                                        return (
                                            <TableRow
                                                key={emp.id}
                                                className="
                                                    hover:bg-slate-50/50
                                                    transition-colors
                                                "
                                            >
                                                {/* EMPLOYEE */}
                                                <TableCell className="pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9 border border-slate-100">
                                                            {hasProfile && (
                                                                <AvatarImage
                                                                    className="object-cover"
                                                                    src={
                                                                        emp.profileImage ||
                                                                        emp.avatar
                                                                    }
                                                                    alt={
                                                                        emp.name
                                                                    }
                                                                />
                                                            )}

                                                            <AvatarFallback
                                                                className="
                                                                    bg-blue-50
                                                                    text-blue-600
                                                                    font-semibold
                                                                    border
                                                                    border-blue-100
                                                                "
                                                            >
                                                                {(
                                                                    emp.name ||
                                                                    "?"
                                                                )
                                                                    .charAt(0)
                                                                    .toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>

                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-slate-900">
                                                                {emp.name}
                                                            </span>

                                                            <span className="text-xs text-muted-foreground">
                                                                {emp.id}
                                                                {emp.designation
                                                                    ? ` • ${emp.designation}`
                                                                    : ""}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* ROLE */}
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "font-normal",
                                                            emp.role === "HR"
                                                                ? "bg-purple-100 text-purple-700 border-purple-200"
                                                                : "bg-blue-100 text-blue-700 border-blue-200"
                                                        )}
                                                    >
                                                        {emp.role === "EMPLOYEE"
                                                            ? "Employee"
                                                            : emp.role}
                                                    </Badge>
                                                </TableCell>

                                                {/* ACCOUNT DETAILS */}
                                                <TableCell>
                                                    {emp.bankDetails
                                                        ?.accountNumber ? (
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                                                A/C No.
                                                            </span>

                                                            <span className="font-mono text-sm font-medium text-slate-800">
                                                                {
                                                                    emp
                                                                        .bankDetails
                                                                        .accountNumber
                                                                }
                                                            </span>

                                                            <span className="text-xs text-slate-500">
                                                                Holder:{" "}
                                                                {
                                                                    emp
                                                                        .bankDetails
                                                                        .holderName
                                                                }
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <Badge
                                                            variant="outline"
                                                            className="
                                                                bg-slate-50
                                                                text-slate-500
                                                                border-slate-200
                                                                font-normal
                                                            "
                                                        >
                                                            Not Added
                                                        </Badge>
                                                    )}
                                                </TableCell>

                                                {/* BANK NAME */}
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center">
                                                            <Building2 className="h-4 w-4 text-purple-500" />
                                                        </div>

                                                        <span className="font-medium text-slate-700">
                                                            {emp.bankDetails
                                                                ?.bankName ||
                                                                "Not Added"}
                                                        </span>
                                                    </div>
                                                </TableCell>

                                                {/* BRANCH + IFSC */}
                                                <TableCell>
                                                    {emp.bankDetails?.branch ? (
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-sm font-medium text-slate-700">
                                                                {
                                                                    emp
                                                                        .bankDetails
                                                                        .branch
                                                                }
                                                            </span>

                                                            {emp.bankDetails
                                                                .ifsc ? (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="
                                                                        w-fit
                                                                        bg-slate-50
                                                                        text-slate-600
                                                                        border-slate-200
                                                                        font-mono
                                                                        text-[10px]
                                                                        tracking-wide
                                                                    "
                                                                >
                                                                    {
                                                                        emp
                                                                            .bankDetails
                                                                            .ifsc
                                                                    }
                                                                </Badge>
                                                            ) : null}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">
                                                            -
                                                        </span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* PAGINATION */}
                    <div className="flex items-center justify-between p-4 border-t bg-slate-50/50">
                        <div className="text-sm text-muted-foreground">
                            Page{" "}
                            <span className="font-medium text-slate-900">
                                {currentPage}
                            </span>{" "}
                            of{" "}
                            <span className="font-medium text-slate-900">
                                {totalPages === 0 ? 1 : totalPages}
                            </span>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.max(prev - 1, 1)
                                    )
                                }
                                disabled={currentPage === 1 || loading}
                                className="h-8"
                            >
                                Previous
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.min(
                                            prev + 1,
                                            totalPages
                                        )
                                    )
                                }
                                disabled={
                                    currentPage >= totalPages || loading
                                }
                                className="h-8"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

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
    color: "violet" | "green" | "orange" | "blue" | "red";
    icon: LucideIcon;
}) {
    const styles = {
        violet: {
            border: "border-l-violet-500",
            text: "text-violet-600",
            bg: "bg-violet-50/50",
            iconBg: "bg-violet-500 shadow-violet-200",
        },

        green: {
            border: "border-l-green-500",
            text: "text-green-600",
            bg: "bg-green-50/50",
            iconBg: "bg-green-600 shadow-green-200",
        },

        orange: {
            border: "border-l-orange-500",
            text: "text-orange-600",
            bg: "bg-orange-50/50",
            iconBg: "bg-orange-500 shadow-orange-200",
        },

        blue: {
            border: "border-l-blue-500",
            text: "text-blue-600",
            bg: "bg-blue-50/50",
            iconBg: "bg-blue-500 shadow-blue-200",
        },

        red: {
            border: "border-l-red-500",
            text: "text-red-600",
            bg: "bg-red-50/50",
            iconBg: "bg-red-500 shadow-red-200",
        },
    };

    const currentStyle = styles[color] || styles.blue;

    return (
        <Card
            className={cn(
                "group border-l-4 shadow-sm hover:shadow-md transition-all",
                currentStyle.bg,
                currentStyle.border
            )}
        >
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <CardTitle
                        className={cn(
                            "text-xs font-bold uppercase tracking-wider mb-2",
                            currentStyle.text
                        )}
                    >
                        {title}
                    </CardTitle>

                    <div className="text-2xl font-bold text-slate-800 tracking-tight">
                        {value}
                    </div>

                    {subtitle && (
                        <p className="text-xs text-muted-foreground mt-1 font-medium">
                            {subtitle}
                        </p>
                    )}
                </div>

                <div
                    className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110",
                        currentStyle.iconBg
                    )}
                >
                    <Icon className="h-6 w-6" />
                </div>
            </CardContent>
        </Card>
    );
}
