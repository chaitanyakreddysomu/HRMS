import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/config/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Eye, EyeOff, Loader2 } from "lucide-react";

/**
 * ============================================================
 * CHANGE PASSWORD (FORCED)
 * ============================================================
 *
 * Shown instead of letting the app through when the signed-in
 * account is still on its default password (set by an admin who
 * just added the employee). There is no way out of this one: no
 * close button, escape and outside clicks are swallowed, and the
 * dialog only closes itself once the change succeeds.
 */
export function ChangePasswordPopup() {
    const { user, patchUser } = useAuth();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const open = !!user?.mustChangePassword;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (newPassword.length < 4) {
            setError("Password must be at least 4 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setIsSaving(true);

        try {
            const token = localStorage.getItem("token");
            const res = await apiFetch("/api/auth/change-password", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    currentPassword: "1234",
                    newPassword,
                }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data?.message || "Could not update your password.");
                return;
            }

            patchUser({ mustChangePassword: false });
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            console.error("Change password error:", err);
            setError("Could not reach the server. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={() => {}}>
            <DialogContent
                className="sm:max-w-[440px] [&>button]:hidden"
                onEscapeKeyDown={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                        <KeyRound className="h-6 w-6 text-blue-600" />
                    </div>
                    <DialogTitle className="text-center text-xl font-bold">
                        Set a New Password
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        Your account is still using the default password. Choose a new
                        one to continue.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <Label>New Password</Label>
                        <div className="relative">
                            <Input
                                type={showPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                autoFocus
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Confirm Password</Label>
                        <Input
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    {!!error && (
                        <p className="text-sm text-red-600 font-medium">{error}</p>
                    )}

                    <Button
                        type="submit"
                        disabled={isSaving}
                        className="w-full h-11 text-white font-semibold"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            "Update Password"
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
