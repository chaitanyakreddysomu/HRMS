import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    User,
    FileText,
    Clock,
    Calendar,
    Coffee,
    Receipt,
    BookOpen,
    Bell,
    Cake,

    Users,
    AlertCircle,
    Command,
    ClipboardList,
    Wallet,
    CreditCard,
    Calculator,
    Shield,
    ShieldAlert,
} from "lucide-react";

export function Sidebar() {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) return null;

    const employeeLinks = [
        { name: "Dashboard", href: "/", icon: LayoutDashboard, color: "blue" },
        { name: "Profile", href: "/profile", icon: User, color: "orange" },
        { name: "Documents", href: "/documents", icon: FileText, color: "yellow" },
        { name: "Attendance", href: "/attendance", icon: Clock, color: "lime" },
        { name: "Leaves", href: "/leaves", icon: Coffee, color: "violet" },
        { name: "Holidays", href: "/holidays", icon: Calendar, color: "sky" },
        { name: "Payslips", href: "/payslips", icon: Receipt, color: "green" },
        { name: "Company Policies", href: "/policies", icon: BookOpen, color: "fuchsia" },
        { name: "Notifications", href: "/notifications", icon: Bell, color: "amber" },
        { name: "Referrals", href: "/referrals", icon: Users, color: "blue" },
        { name: "Complaints", href: "/complaints", icon: AlertCircle, color: "red" },
        { name: "Security", href: "/security", icon: Shield, color: "red" },
    ];

    const adminLinks = [
        { name: "Dashboard", href: "/", icon: LayoutDashboard, color: "blue" },
        { name: "Profile", href: "/admin-profile", icon: User, color: "orange" },
        { name: "Pending Requests", href: "/admin-requests", icon: ClipboardList, color: "pink" },
        { name: "Employees", href: "/admin-employees", icon: Users, color: "indigo" },
        { name: "Documents", href: "/admin-documents", icon: FileText, color: "yellow" },
        { name: "Attendance", href: "/admin-attendance", icon: Clock, color: "lime" },
        { name: "Leaves", href: "/admin-leaves", icon: Coffee, color: "green" },
        { name: "Holidays", href: "/admin-holidays", icon: Calendar, color: "sky" },
        { name: "Birthdays", href: "/admin-birthdays", icon: Cake, color: "pink" },
        { name: "Payslips", href: "/admin-payslips", icon: Wallet, color: "emerald" },
        { name: "Salary Structure", href: "/admin-salary-structure", icon: Calculator, color: "emerald" },
        { name: "Bank Details", href: "/admin-bank-details", icon: CreditCard, color: "purple" },
        { name: "Policies", href: "/admin-policies", icon: BookOpen, color: "fuchsia" },
        { name: "Notifications", href: "/admin-notifications", icon: Bell, color: "rose" },
        { name: "Referrals", href: "/admin-referrals", icon: Users, color: "blue" },
        { name: "Complaints", href: "/admin-complaints", icon: AlertCircle, color: "amber" },
        { name: "Logs", href: "/admin-logs", icon: FileText, color: "gray" },
        { name: "Security", href: "/security", icon: Shield, color: "red" },
        { name: "2FA Users", href: "/admin-2fa", icon: ShieldAlert, color: "indigo" },
    ];

    const hrLinks = [
        { name: "Dashboard", href: "/", icon: LayoutDashboard, color: "blue" },
        { name: "Profile", href: "/hr-profile", icon: User, color: "orange" },
        { name: "New Requests", href: "/hr-requests", icon: ClipboardList, color: "pink" },
        { name: "Employees", href: "/hr-employees", icon: Users, color: "indigo" },
        { name: "Documents", href: "/hr-documents", icon: FileText, color: "yellow" },
        { name: "Attendance", href: "/hr-attendance", icon: Clock, color: "lime" },
        { name: "Leaves", href: "/hr-leaves", icon: Coffee, color: "green" },
        { name: "Holidays", href: "/hr-holidays", icon: Calendar, color: "sky" },
        { name: "Birthdays", href: "/hr-birthdays", icon: Cake, color: "pink" },
        { name: "Payslips", href: "/hr-payslips", icon: Wallet, color: "emerald" },
        { name: "Policies", href: "/hr-policies", icon: BookOpen, color: "fuchsia" },
        { name: "Notifications", href: "/hr-notifications", icon: Bell, color: "rose" },
        { name: "Referrals", href: "/admin-referrals", icon: Users, color: "blue" },
        { name: "Complaints", href: "/hr-complaints", icon: AlertCircle, color: "amber" },
        { name: "Security", href: "/security", icon: Shield, color: "red" },
    ];

    const links = user.role === "EMPLOYEE"
        ? employeeLinks
        : user.role === "ADMIN"
            ? adminLinks
            : hrLinks;


    return (
        <div className="hidden h-screen w-72 flex-col border-r bg-white/60 backdrop-blur-xl md:flex shadow-xl z-10">
            <div className="flex h-20 items-center px-6 border-b gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg">
                    <Command className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground">HRMS</h1>
                    <p className="text-xs text-muted-foreground font-medium">Employee Portal</p>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-6 px-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]">
                <ul className="space-y-1">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname === link.href;

                        return (
                            <li key={link.name}>
                                <Link
                                    to={link.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                                        isActive
                                            ? "text-primary-foreground shadow-md"
                                            : "text-foreground/70 hover:bg-primary/10 hover:text-primary"
                                    )}
                                    style={isActive ? { background: 'var(--sidebar-active-bg)' } : undefined}
                                >
                                    <Icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-current")} />
                                    <span className="text-base">{link.name}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </div>
    );
}
