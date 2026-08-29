import { useState, useEffect } from "react";
import { apiFetch } from "@/config/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Search, Loader2 } from "lucide-react";

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
                <Card className="border-1 border-blue-200 border">
                    <CardHeader className="pb-4">
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <div className="relative flex-1 w-full md:max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search users..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0">
                                <Select
                                    value={roleFilter}
                                    onValueChange={setRoleFilter}
                                >
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue placeholder="Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All Roles</SelectItem>
                                        <SelectItem value="EMPLOYEE">Employees</SelectItem>
                                        <SelectItem value="HR">HR Team</SelectItem>
                                        <SelectItem value="ADMIN">Admins</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={statusFilter}
                                    onValueChange={setStatusFilter}
                                >
                                    <SelectTrigger className="w-[130px]">
                                        <SelectValue placeholder="2FA Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All Statuses</SelectItem>
                                        <SelectItem value="Enabled">Enabled</SelectItem>
                                        <SelectItem value="Disabled">Disabled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto min-h-[400px]">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead className="pl-6 font-semibold text-slate-700">Name</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Role</TableHead>
                                        <TableHead className="font-semibold text-slate-700">2FA Security Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isTableLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-64 text-center">
                                                <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                    <p>Updating...</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : users.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                                No users found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        users.map((user) => (
                                            <TableRow key={user._id} className="hover:bg-slate-50/50">
                                                <TableCell className="pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9 border border-indigo-100">
                                                            <AvatarImage className="object-cover" src={user.profileImage || `https://ui-avatars.com/api/?name=${user.name}&background=random`} alt={user.name} />
                                                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-slate-900">{user.name}</span>
                                                            <span className="text-xs text-muted-foreground">{user.email}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={
                                                        user.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                            user.role === 'HR' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                'bg-slate-50 text-slate-700 border-slate-200'
                                                    }>
                                                        {user.role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={
                                                        user.twoFactorEnabled ? "bg-green-100 text-green-700 border-green-200 font-bold" :
                                                            "bg-red-100 text-red-700 border-red-200 font-bold"
                                                    }>
                                                        {user.twoFactorEnabled ? "Enabled" : "Disabled"}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination Controls */}
                        <div className="flex items-center justify-between p-4 border-t bg-slate-50/50">
                            <div className="text-sm text-muted-foreground">
                                Page <span className="font-medium text-slate-900">{currentPage}</span> of <span className="font-medium text-slate-900">{totalPages === 0 ? 1 : totalPages}</span> (Total: {totalRecords})
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1 || isTableLoading}
                                    className="h-8"
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage >= totalPages || isTableLoading}
                                    className="h-8"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
