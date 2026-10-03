import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useAuth } from "@/context/AuthContext";
import { Login } from "@/pages/Login";
import { BirthdayPopup } from "../BirthdayPopup";
import { ChangePasswordPopup } from "../ChangePasswordPopup";
import Customize from "@/pages/admin/Customize";
import { Palette } from "lucide-react";

export function MainLayout() {
    const { user } = useAuth();
    const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

    if (!user) {
        return <Login />;
    }

    const isAdmin = user.role === "ADMIN";

    return (
        <div className="flex h-screen bg-white overflow-hidden relative">
            <ChangePasswordPopup />
            <BirthdayPopup />
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Topbar />
                <main className="flex-1 overflow-auto p-6 scroll-smooth">
                    <Outlet />
                </main>
            </div>

            {/* Floating Customizer Button for Admin */}
            {isAdmin && (
                <button
                  onClick={() => setIsCustomizerOpen(true)}
                  className="fixed right-6 bottom-6 z-40 flex items-center justify-center w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-2xl hover:shadow-indigo-600/30 hover:scale-110 active:scale-95 transition-all duration-300 group"
                  title="Customize Theme"
                >
                  <Palette className="w-6 h-6 transition-transform group-hover:rotate-12" />
                </button>
            )}

            {/* Pop-up Overlay Modal for Customizer */}
            {isAdmin && isCustomizerOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div 
                      className="bg-white border border-slate-200 w-[95vw] h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                        <Customize onClose={() => setIsCustomizerOpen(false)} />
                    </div>
                </div>
            )}
        </div>
    );
}
