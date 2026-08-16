import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useAuth } from "@/context/AuthContext";
import { Login } from "@/pages/Login";
import { BirthdayPopup } from "../BirthdayPopup";

export function MainLayout() {
    const { user } = useAuth();

    if (!user) {
        return <Login />;
    }

    return (
        <div className="flex h-screen bg-white overflow-hidden">
            <BirthdayPopup />
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Topbar />
                <main className="flex-1 overflow-auto p-6 scroll-smooth">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
