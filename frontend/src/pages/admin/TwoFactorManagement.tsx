import { useState, useEffect } from "react";
import { apiFetch } from "@/config/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, ShieldLock, ShieldAlert, Search, Loader2 } from "lucide-react";

interface User2FA {
    _id: string;
    id: string;
    name: string;
    email: string;
    role: string;
    profileImage?: string;
    twoFactorEnabled: boolean;
}

export default function TwoFactorManagement() {
    const [users, setUsers] = useState<User2FA[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isTableLoading, setIsTableLoading] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [roleFilter, setRoleFilter] = useState<string>("All");
    const [statusFilter, setStatusFilter] = useState<string>("All");

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalRecords, setTotalRecords] = useState<number>(0);

    function RoleBadge({ role }: { role: string }) {
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

    const style = styles[role] || styles.EMPLOYEE;

    return (
        <Badge
            variant="outline"
            className={`gap-2 rounded-full px-3 py-1 text-[11px] font-semibold ${style.wrapper}`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
            />
            {role}
        </Badge>
    );
}


    useEffect(() => {
        const fetchUsers = async () => {
            if (users.length === 0 && isLoading) {
                // Keep default full page loader
            } else {
                setIsTableLoading(true);
            }

            try {
                const params = new URLSearchParams();
                params.append('page', currentPage.toString());
                params.append('limit', '10');
                if (searchTerm) params.append('search', searchTerm);
                if (roleFilter !== 'All') params.append('role', roleFilter);
                if (statusFilter !== 'All') params.append('status', statusFilter);

                const res = await apiFetch(`/api/admin/users-2fa?${params.toString()}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.pagination) {
                        setUsers(data.users || []);
                        setTotalPages(data.pagination.pages);
                        setTotalRecords(data.pagination.total);
                    } else {
                        setUsers(Array.isArray(data) ? data : []);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch users 2FA details:", error);
            } finally {
                setIsLoading(false);
                setIsTableLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchUsers();
        }, 300); // 300ms debounce for search

        return () => clearTimeout(timer);
    }, [currentPage, searchTerm, roleFilter, statusFilter]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, roleFilter, statusFilter]);

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center shadow-lg">
                        <Shield className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">2FA Users Dashboard</h1>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-10">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-r-transparent mb-2"></div>
                    <p className="text-muted-foreground">Loading authentication database...</p>
                </div>
            ) : (
               <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    {/* FILTER BAR */}
    <CardHeader className="border-b border-slate-100 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            {/* Search */}
           <div className="relative flex-1">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

    <Input
        placeholder="Search by name or email..."
        className="h-11 rounded-xl border-slate-200 bg-slate-50/70 pl-10 text-sm transition
                   focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20
                   focus-visible:ring-offset-0"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
    />
</div>


            {/* Filters */}
            <div className="flex w-full gap-3 lg:w-auto">
                <Select
                    value={roleFilter}
                    onValueChange={setRoleFilter}
                >
                    <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white lg:w-[150px]">
                        <SelectValue placeholder="Role" />
                    </SelectTrigger>

                    <SelectContent>
    <SelectItem
        value="All"
        className="focus:bg-primary focus:text-white data-[highlighted]:bg-primary data-[highlighted]:text-white"
    >
        All Roles
    </SelectItem>

    <SelectItem
        value="EMPLOYEE"
        className="focus:bg-primary focus:text-white data-[highlighted]:bg-primary data-[highlighted]:text-white"
    >
        Employees
    </SelectItem>

    <SelectItem
        value="HR"
        className="focus:bg-primary focus:text-white data-[highlighted]:bg-primary data-[highlighted]:text-white"
    >
        HR Team
    </SelectItem>

    <SelectItem
        value="ADMIN"
        className="focus:bg-primary focus:text-white data-[highlighted]:bg-primary data-[highlighted]:text-white"
    >
        Admins
    </SelectItem>
</SelectContent>

                </Select>

                <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                >
                    <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white lg:w-[160px]">
                        <SelectValue placeholder="2FA Status" />
                    </SelectTrigger>

                    <SelectContent>
    <SelectItem
        value="All"
        className="focus:bg-primary focus:text-white data-[highlighted]:bg-primary data-[highlighted]:text-white"
    >
        All Statuses
    </SelectItem>

    <SelectItem
        value="Enabled"
        className="focus:bg-primary focus:text-white data-[highlighted]:bg-primary data-[highlighted]:text-white"
    >
        Enabled
    </SelectItem>

    <SelectItem
        value="Disabled"
        className="focus:bg-primary focus:text-white data-[highlighted]:bg-primary data-[highlighted]:text-white"
    >
        Disabled
    </SelectItem>
</SelectContent>

                </Select>
            </div>
        </div>
    </CardHeader>

    <CardContent className="p-0">
        <div className="overflow-x-auto">
            <Table>
                {/* TABLE HEADER */}
                <TableHeader>
                    <TableRow className="border-b border-slate-100 bg-slate-50/70 hover:bg-slate-50/70">
                        <TableHead className="h-12 pl-6 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            User
                        </TableHead>

                        <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Role
                        </TableHead>

                        <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Security
                        </TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {isTableLoading ? (
                        <TableRow>
                            <TableCell
                                colSpan={3}
                                className="h-[360px]"
                            >
                                <div className="flex h-full flex-col items-center justify-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                    </div>

                                    <div className="text-center">
                                        <p className="text-sm font-semibold text-slate-700">
                                            Updating users
                                        </p>
                                        <p className="mt-1 text-xs text-slate-400">
                                            Fetching the latest security status...
                                        </p>
                                    </div>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : users.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={3}
                                className="h-[320px]"
                            >
                                <div className="flex flex-col items-center justify-center text-center">
                                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                                        <Search className="h-6 w-6 text-slate-400" />
                                    </div>

                                    <p className="font-semibold text-slate-800">
                                        No users found
                                    </p>

                                    <p className="mt-1 text-sm text-slate-400">
                                        Try changing your search or filters.
                                    </p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        users.map((user) => (
                            <TableRow
                                key={user._id}
                                className="group border-b border-slate-100 transition-colors hover:bg-primary/[0.025]"
                            >
                                {/* USER */}
                                <TableCell className="py-4 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <Avatar className="h-11 w-11 border-2 border-white shadow-sm ring-1 ring-slate-200">
                                                <AvatarImage
                                                    src={
                                                        user.profileImage ||
                                                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                            user.name
                                                        )}&background=f1f5f9&color=334155`
                                                    }
                                                    alt={user.name}
                                                    className="object-cover"
                                                />

                                                <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                                                    {getInitials(
                                                        user.name
                                                    )}
                                                </AvatarFallback>
                                            </Avatar>

                                            {/* Online/security indicator */}
                                            {/* <span
                                                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                                                    user.twoFactorEnabled
                                                        ? "bg-emerald-500"
                                                        : "bg-slate-300"
                                                }`}
                                            /> */}
                                        </div>

                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-slate-800 transition-colors group-hover:text-primary">
                                                {user.name}
                                            </p>

                                            <p className="mt-0.5 truncate text-xs text-slate-400">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>

                                {/* ROLE */}
                                <TableCell>
                                    <RoleBadge role={user.role} />
                                </TableCell>

                                {/* SECURITY */}
                                <TableCell>
                                    <div className="flex items-center">
                                        {user.twoFactorEnabled ? (
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                                                    <ShieldLock className="h-4 w-4 text-emerald-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-emerald-700">
                                                        Protected
                                                    </p>

                                                   
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                                                    <ShieldAlert className="h-4 w-4 text-red-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-red-600">
                                                        At Risk
                                                    </p>

                                                    
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>

        {/* PAGINATION ONLY */}
        {!isTableLoading && users.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">
                    Showing{" "}
                    <span className="font-semibold text-slate-800">
                        {(currentPage - 1) * 10 + 1}
                    </span>
                    {" "}–{" "}
                    <span className="font-semibold text-slate-800">
                        {Math.min(
                            currentPage * 10,
                            totalRecords
                        )}
                    </span>
                    {" "}of{" "}
                    <span className="font-semibold text-slate-800">
                        {totalRecords}
                    </span>{" "}
                    users
                </p>

                <div className="flex items-center gap-1">
                    <Button
    variant="outline"
    size="sm"
    onClick={() =>
        setCurrentPage((prev) => Math.max(prev - 1, 1))
    }
    disabled={currentPage === 1 || isTableLoading}
    className="h-9 rounded-lg border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-none hover:bg-primary/10 hover:text-primary disabled:text-slate-400"
>
    Previous
</Button>


                    {/* Page numbers */}
                    <div className="hidden items-center gap-1 sm:flex">
                        {Array.from(
                            {
                                length: Math.min(
                                    totalPages,
                                    5
                                ),
                            },
                            (_, index) => {
                                const page = index + 1;

                                return (
                                    <Button
                                        key={page}
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            setCurrentPage(
                                                page
                                            )
                                        }
                                        disabled={
                                            isTableLoading
                                        }
                                        className={`h-9 w-9 rounded-lg p-0 text-xs ${
                                            currentPage === page
                                                ? "bg-primary text-white hover:bg-primary/90 hover:text-white"
                                                : "text-slate-500 hover:bg-primary/5 hover:text-primary"
                                        }`}
                                    >
                                        {page}
                                    </Button>
                                );
                            }
                        )}
                    </div>

                    <Button
    variant="outline"
    size="sm"
    onClick={() =>
        setCurrentPage((prev) =>
            Math.min(prev + 1, totalPages)
        )
    }
    disabled={
        currentPage >= totalPages || isTableLoading
    }
    className="h-9 rounded-lg border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-none hover:bg-primary/10 hover:text-primary disabled:text-slate-400"
>
    Next
</Button>

                </div>
            </div>
        )}
    </CardContent>
</Card>

            )}
        </div>
    );
}
