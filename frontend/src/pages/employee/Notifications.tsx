import { Card, CardContent } from "@/components/ui/card";
import { Info, CheckCircle2, AlertTriangle, BellRing, Check } from "lucide-react";

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect } from "react";
import { apiFetch } from "@/config/api";
import type { Notification } from "@/types";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function Notifications() {
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await apiFetch('/api/employee/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            // setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            const token = localStorage.getItem('token');
            const res = await apiFetch(`/api/employee/notifications/${id}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                // Update local state
                setNotifications(prev => prev.map(n =>
                    n._id === id ? { ...n, read: true } : n
                ));
                // Also update selected if it's the one open
                if (selectedNotification?._id === id) {
                    setSelectedNotification(prev => prev ? { ...prev, read: true } : null);
                }
            }
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const filteredNotifications = filter === 'all'
        ? notifications
        : notifications.filter(n => !n.read);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center shadow-lg">
                            <BellRing className="h-6 w-6 text-white" />
                        </div>

                        Notifications
                    </h1>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="relative grid grid-cols-2 bg-white rounded-lg border border-primary shadow-lg p-1 w-fit select-none">
                        {/* Sliding indicator */}
                        <span
                            className={cn(
                                "absolute inset-1 w-[calc(50%-0.25rem)] rounded-md bg-primary transition-transform duration-300 ease-in-out",
                                filter === "all" ? "translate-x-0" : "translate-x-full"
                            )}
                        />

                        {/* ALL */}
                        <button
                            type="button"
                            onClick={() => setFilter("all")}
                            className={cn(
                                "relative z-10 px-5 py-1.5 text-sm font-semibold rounded-md transition-colors duration-300",
                                filter === "all" ? "text-white" : "text-black"
                            )}
                        >
                            All
                        </button>

                        {/* UNREAD */}
                        <button
                            type="button"
                            onClick={() => setFilter("unread")}
                            className={cn(
                                "relative z-10 px-5 py-1.5 text-sm font-semibold rounded-md transition-colors duration-300",
                                filter === "unread" ? "text-white" : "text-black"
                            )}
                        >
                            Unread
                        </button>
                    </div>
                </div>


            </div>

            <div className="grid gap-4">
                {filteredNotifications.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/5">
                        <p className="text-muted-foreground">No notifications found.</p>
                    </div>
                ) : (
                    filteredNotifications.map((notif) => (
                        <Card
                            key={notif._id}
                            className={cn(
                                "group relative overflow-hidden border-l-4 cursor-pointer transition-all duration-300",
                                !notif.read
                                    ? "bg-primary/5 border-l-primary shadow-sm hover:shadow-md"
                                    : "bg-gray-50/50 border-l-gray-400 hover:shadow-sm"
                            )}
                            onClick={() => setSelectedNotification(notif)}
                        >
                            <CardContent className="p-5 flex gap-4 items-start">
                                {/* ICON */}
                                <div
                                    className={cn(
                                        "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110",
                                        !notif.read
                                            ? "bg-primary/15 text-primary"
                                            : "bg-gray-100 text-gray-500"
                                    )}
                                >
                                    {notif.type === "alert" ? (
                                        <AlertTriangle className="h-6 w-6" />
                                    ) : notif.type === "success" ? (
                                        <CheckCircle2 className="h-6 w-6" />
                                    ) : (
                                        <Info className="h-6 w-6" />
                                    )}
                                </div>

                                {/* CONTENT */}
                                <div className="flex-1 min-w-0">
                                    {/* TOP ROW */}
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <h4
                                                className={cn(
                                                    "text-base font-semibold truncate",
                                                    !notif.read
                                                        ? "text-foreground"
                                                        : "text-gray-700"
                                                )}
                                            >
                                                {notif.title}
                                            </h4>

                                            {!notif.read && (
                                                <Badge className="bg-primary/15 text-primary border-none text-[10px] px-2 py-0.5 uppercase tracking-wide">
                                                    New
                                                </Badge>
                                            )}
                                        </div>

                                        {/* META */}
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                                            <span
                                                className={cn(
                                                    !notif.read
                                                        ? "text-primary font-medium"
                                                        : "text-gray-500"
                                                )}
                                            >
                                                {formatDistanceToNow(new Date(notif.date), {
                                                    addSuffix: true,
                                                })}
                                            </span>

                                            {notif.source && (
                                                <>
                                                    <span className="text-muted-foreground">•</span>
                                                    <span className="text-muted-foreground">
                                                        From {notif.source}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* MESSAGE (SINGLE LINE ONLY) */}
                                    <p
                                        className={cn(
                                            "mt-1 text-sm leading-snug line-clamp-1",
                                            !notif.read
                                                ? "text-foreground/90"
                                                : "text-muted-foreground"
                                        )}
                                        title={notif.message}
                                    >
                                        {notif.message}
                                    </p>
                                </div>

                                {/* ACTION */}
                                {!notif.read && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                                        <button
                                            type="button"
                                            title="Mark as Read"
                                            onClick={(e) => handleMarkAsRead(notif._id, e)}
                                            className="h-10 w-10 rounded-lg flex items-center justify-center shadow-lg active:scale-95 text-white"
                                            style={{ background: 'var(--button-bg)' }}
                                        >
                                            <Check className="h-5 w-5 text-white" />
                                        </button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                    ))
                )}
            </div>

            <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between gap-3 text-xl w-full">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "h-10 w-10 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                    !selectedNotification?.read ? "bg-primary/15 text-primary" : "bg-gray-100 text-gray-500"
                                )}>
                                    {selectedNotification?.type === 'alert' ? <AlertTriangle className="h-5 w-5" /> :
                                        selectedNotification?.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> :
                                            <Info className="h-5 w-5" />}
                                </div>
                                <span>{selectedNotification?.title}</span>
                                {selectedNotification?.source && (
                                    <span className="text-[10px] font-medium text-muted-foreground">
                                        From {selectedNotification.source}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className={cn(
                                    "text-xs font-normal whitespace-nowrap shrink-0",
                                    !selectedNotification?.read ? "text-primary" : "text-gray-500"
                                )}>
                                    {selectedNotification?.date && formatDistanceToNow(new Date(selectedNotification.date), { addSuffix: true })}
                                </span>

                            </div>
                        </DialogTitle>
                        <DialogDescription className="pt-4">
                            <div className={cn(
                                "text-sm leading-relaxed p-4 rounded-lg border",
                                    !selectedNotification?.read
                                        ? "bg-primary/5 border-primary/20 text-foreground"
                                        : "bg-gray-50 border-gray-200 text-muted-foreground"
                            )}>
                                {selectedNotification?.message}
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2">
                        {/* <Button variant="outline" onClick={() => setSelectedNotification(null)}>Close</Button> */}
                        {!selectedNotification?.read && (
                            <Button className="text-white hover:opacity-90" style={{ background: 'var(--button-bg)' }} onClick={() => selectedNotification && handleMarkAsRead(selectedNotification._id)}>Mark as Read</Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
