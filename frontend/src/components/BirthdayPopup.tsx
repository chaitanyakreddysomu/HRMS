import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Crown, Sparkles, Gift, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BirthdayPopup() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!user || !user.dob) return;

        const today = new Date();
        const dob = new Date(user.dob);

        const isBirthday =
            today.getDate() === dob.getDate() &&
            today.getMonth() === dob.getMonth();

        if (isBirthday) {
            const todayStr = today.toISOString().split("T")[0];
            const lastShown = localStorage.getItem(`birthday_popup_${user.id}`);

            if (lastShown !== todayStr) {
                setTimeout(() => {
                    setIsOpen(true);
                    localStorage.setItem(`birthday_popup_${user.id}`, todayStr);
                }, 1200);
            }
        }
    }, [user]);

    if (!user) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[560px] p-0 border-none bg-transparent shadow-none [&>button]:hidden">                <div className="relative overflow-hidden rounded-3xl shadow-2xl bg-gradient-to-br from-[#0f0f0f] via-[#1a1a1a] to-[#111111] border border-yellow-500/20">

                    {/* Golden Glow */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,215,0,0.18),transparent_40%)]"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.06),transparent_35%)]"></div>

                    {/* Close */}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute top-4 right-4 z-20 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    {/* Header */}
                    {/* Header */}
<div className="relative pt-8 pb-6 flex flex-col items-center justify-center text-center px-6">

    {/* Sparkle Left */}
    <div className="absolute top-6 left-6 text-yellow-400 opacity-80 animate-pulse">
        <Sparkles className="h-7 w-7" />
    </div>

    {/* Gift Right */}
    <div className="absolute top-10 right-8 text-yellow-300 opacity-80 animate-bounce">
        <Gift className="h-8 w-8" />
    </div>

    {/* Perfect Round Profile with Top Space */}
    <div className="mt-3 mb-5 relative">
        <div className="h-28 w-28 rounded-full overflow-hidden border-[3px] border-yellow-400 shadow-[0_0_25px_rgba(255,215,0,0.45)] bg-black p-[2px]">
            
            <div className="h-full w-full rounded-full overflow-hidden bg-zinc-900">
                {user.profileImage ? (
                    <img
                        src={user.profileImage}
                        alt={user.name}
                        className="h-full w-full rounded-full object-cover"
                    />
                ) : (
                    <div className="h-full w-full rounded-full flex items-center justify-center text-3xl font-bold text-yellow-400 uppercase">
                        {user.name.charAt(0)}
                    </div>
                )}
            </div>

        </div>
    </div>

    {/* Tag */}
    <div className="flex items-center gap-2 text-yellow-400">
        <Crown className="h-5 w-5" />
        <span className="uppercase tracking-[4px] text-[11px] font-semibold">
            Exclusive Celebration
        </span>
    </div>

    {/* Title */}
    <h1 className="text-4xl md:text-5xl font-black text-white mt-4 tracking-tight">
        HAPPY BIRTHDAY
    </h1>

    {/* Name */}
    <h2 className="text-2xl font-semibold italic text-yellow-400 mt-2">
        {user.name}
    </h2>

</div>

                    {/* Body */}
                    <div className="px-8 pb-10 text-center">
                        <p className="text-gray-300 leading-relaxed text-sm max-w-md mx-auto">
                            Wishing you a year filled with success, luxury,
                            happiness, and remarkable achievements.
                            <span className="text-yellow-400 font-semibold">
                                {" "}You are truly valued.
                            </span>
                        </p>

                        <div className="mt-8">
                            <Button
                                onClick={() => setIsOpen(false)}
                                className="w-full h-12 rounded-xl bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 text-black font-bold hover:scale-[1.02] transition-all shadow-lg"
                            >
                                Celebrate Your Day ✨
                            </Button>
                        </div>

                        <p className="mt-4 text-xs tracking-[3px] uppercase text-gray-500">
                            Inner Circle Softech
                        </p>
                    </div>

                    {/* Floating particles */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {Array.from({ length: 15 }).map((_, i) => (
                            <div
                                key={i}
                                className="absolute h-1.5 w-1.5 rounded-full bg-yellow-400 opacity-60 animate-pulse"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    animationDelay: `${i * 0.3}s`,
                                }}
                            />
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}