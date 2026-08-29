import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/config/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Shield,
    ShieldCheck,
    ShieldAlert,
    KeyRound,
    Copy,
    Check,
    Loader2,
    LockKeyhole,
    AlertTriangle,
    ArrowRight,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

export default function Security() {
    const { addToast } = useToast();

    const [isEnabled, setIsEnabled] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

    const [setupData, setSetupData] = useState<{
        secret: string;
        qrCodeDataUrl: string;
    } | null>(null);

    const [verificationDigits, setVerificationDigits] = useState<string[]>(
        Array(6).fill("")
    );

    const [verificationStatus, setVerificationStatus] = useState<
        "idle" | "verifying" | "success" | "error"
    >("idle");

    const [copied, setCopied] = useState<boolean>(false);

    const [showDisableConfirm, setShowDisableConfirm] =
        useState<boolean>(false);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    /* =========================
       FETCH 2FA STATUS
    ========================= */

    const fetch2FAStatus = async () => {
        setIsLoading(true);

        try {
            const res = await apiFetch("/api/auth/2fa/status");

            if (res.ok) {
                const data = await res.json();
                setIsEnabled(data.twoFactorEnabled);
            }
        } catch (error) {
            console.error("Failed to fetch 2FA status:", error);
            addToast("Failed to load security status.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetch2FAStatus();
    }, []);

    /* =========================
       START 2FA SETUP
    ========================= */

    const handleStartSetup = async () => {
        setIsActionLoading(true);
        setVerificationStatus("idle");

        try {
            const res = await apiFetch("/api/auth/2fa/setup", {
                method: "POST",
            });

            if (res.ok) {
                const data = await res.json();

                setSetupData({
                    secret: data.secret,
                    qrCodeDataUrl: data.qrCodeDataUrl,
                });

                setVerificationDigits(Array(6).fill(""));

                setTimeout(() => {
                    inputRefs.current[0]?.focus();
                }, 100);
            } else {
                addToast("Failed to initialize 2FA setup.", "error");
            }
        } catch (error) {
            console.error(error);
            addToast("An error occurred during 2FA setup.", "error");
        } finally {
            setIsActionLoading(false);
        }
    };

    /* =========================
       OTP INPUT CHANGE
    ========================= */

    const handleVerificationDigitChange = (
        index: number,
        value: string
    ) => {
        const digits = value.replace(/\D/g, "");

        // If user pastes multiple digits
        if (digits.length > 1) {
            const newDigits = [...verificationDigits];

            digits
                .slice(0, 6 - index)
                .split("")
                .forEach((digit, offset) => {
                    newDigits[index + offset] = digit;
                });

            setVerificationDigits(newDigits);

            const nextIndex = Math.min(index + digits.length, 5);

            setTimeout(() => {
                inputRefs.current[nextIndex]?.focus();
            }, 0);

            return;
        }

        const newDigits = [...verificationDigits];
        newDigits[index] = digits;

        setVerificationDigits(newDigits);

        // Clear previous status when user edits the code
        if (verificationStatus !== "idle") {
            setVerificationStatus("idle");
        }

        // Automatically move to next box
        if (digits && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    /* =========================
       OTP KEYBOARD NAVIGATION
    ========================= */

    const handleVerificationKeyDown = (
        index: number,
        e: React.KeyboardEvent<HTMLInputElement>
    ) => {
        if (e.key === "Backspace") {
            if (verificationDigits[index]) {
                const newDigits = [...verificationDigits];
                newDigits[index] = "";
                setVerificationDigits(newDigits);
            } else if (index > 0) {
                const newDigits = [...verificationDigits];
                newDigits[index - 1] = "";

                setVerificationDigits(newDigits);

                inputRefs.current[index - 1]?.focus();
            }
        }

        if (e.key === "ArrowLeft" && index > 0) {
            e.preventDefault();
            inputRefs.current[index - 1]?.focus();
        }

        if (e.key === "ArrowRight" && index < 5) {
            e.preventDefault();
            inputRefs.current[index + 1]?.focus();
        }
    };

    /* =========================
       OTP PASTE
    ========================= */

    const handleVerificationPaste = (
        e: React.ClipboardEvent<HTMLInputElement>
    ) => {
        e.preventDefault();

        const pasted = e.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, 6);

        if (!pasted) return;

        const newDigits = Array(6).fill("");

        pasted.split("").forEach((digit, index) => {
            newDigits[index] = digit;
        });

        setVerificationDigits(newDigits);

        setVerificationStatus("idle");

        const focusIndex = Math.min(pasted.length, 5);

        setTimeout(() => {
            inputRefs.current[focusIndex]?.focus();
        }, 0);
    };

    /* =========================
       VERIFY 2FA
    ========================= */

    const handleVerifySetup = async (e: React.FormEvent) => {
        e.preventDefault();

        const code = verificationDigits.join("");

        if (code.length !== 6) {
            addToast(
                "Please enter the complete 6-digit code.",
                "warning"
            );

            return;
        }

        setVerificationStatus("verifying");
        setIsActionLoading(true);

        try {
            const res = await apiFetch("/api/auth/2fa/verify", {
                method: "POST",
                body: JSON.stringify({
                    code,
                }),
            });

            if (res.ok) {
                setVerificationStatus("success");

                addToast(
                    "Two-Factor Authentication enabled successfully!",
                    "success"
                );

                /*
                 * Keep the success state visible briefly
                 * so the user can see the green animation.
                 */
                setTimeout(() => {
                    setIsEnabled(true);
                    setSetupData(null);
                    setVerificationDigits(Array(6).fill(""));
                    setVerificationStatus("idle");
                }, 900);
            } else {
                const data = await res.json();

                setVerificationStatus("error");

                addToast(
                    data.message || "Invalid verification code.",
                    "error"
                );
            }
        } catch (error) {
            console.error(error);

            setVerificationStatus("error");

            addToast(
                "An error occurred during verification.",
                "error"
            );
        } finally {
            setIsActionLoading(false);
        }
    };

    /* =========================
       DISABLE 2FA
    ========================= */

    const handleDisable2FA = () => {
        setShowDisableConfirm(true);
    };

    const executeDisable2FA = async () => {
        setIsActionLoading(true);
        setShowDisableConfirm(false);

        try {
            const res = await apiFetch("/api/auth/2fa/disable", {
                method: "POST",
            });

            if (res.ok) {
                addToast(
                    "Two-Factor Authentication disabled successfully.",
                    "success"
                );

                setIsEnabled(false);
                setSetupData(null);
                setVerificationDigits(Array(6).fill(""));
                setVerificationStatus("idle");
            } else {
                addToast(
                    "Failed to disable authentication.",
                    "error"
                );
            }
        } catch (error) {
            console.error(error);

            addToast(
                "An error occurred while disabling authentication.",
                "error"
            );
        } finally {
            setIsActionLoading(false);
        }
    };

    /* =========================
       COPY SECRET
    ========================= */

    const copyToClipboard = async () => {
        if (!setupData) return;

        try {
            await navigator.clipboard.writeText(setupData.secret);

            setCopied(true);

            addToast(
                "Secret key copied to clipboard.",
                "success"
            );

            setTimeout(() => {
                setCopied(false);
            }, 2000);
        } catch (error) {
            console.error(error);

            addToast(
                "Unable to copy secret key.",
                "error"
            );
        }
    };

    /* =========================
       CANCEL SETUP
    ========================= */

    const cancelSetup = () => {
        setSetupData(null);
        setVerificationDigits(Array(6).fill(""));
        setVerificationStatus("idle");
        setCopied(false);
    };

    /* =========================
       OTP BOX STYLING
    ========================= */

    const getOtpBoxClass = () => {
        if (verificationStatus === "verifying") {
            return `
                border-primary
                ring-2
                ring-primary/20
                animate-pulse
            `;
        }

        if (verificationStatus === "success") {
            return `
                border-emerald-500
                bg-emerald-50
                text-emerald-700
                ring-2
                ring-emerald-500/20
            `;
        }

        if (verificationStatus === "error") {
            return `
                border-red-500
                bg-red-50
                text-red-600
                ring-2
                ring-red-500/20
            `;
        }

        return `
            border-slate-200
            bg-white
            focus-visible:border-primary
            focus-visible:ring-2
            focus-visible:ring-primary/20
        `;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* =========================================
                HEADER
            ========================================= */}

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                <div className="flex items-center gap-4">

                    <div
                        className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-lg ${
                            isEnabled
                                ? "bg-emerald-600 shadow-emerald-200"
                                : "bg-primary shadow-primary/20"
                        }`}
                    >
                        {isEnabled ? (
                            <ShieldCheck className="h-6 w-6 text-white" />
                        ) : (
                            <Shield className="h-6 w-6 text-white" />
                        )}
                    </div>

                    <div>

                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            Security Settings
                        </h1>

                        <p className="text-sm text-muted-foreground mt-1">
                            Manage your account authentication and security preferences.
                        </p>

                    </div>

                </div>

                {!isLoading && (
                    <div
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold w-fit ${
                            isEnabled
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-orange-50 text-orange-700 border-orange-200"
                        }`}
                    >

                        <span
                            className={`h-2 w-2 rounded-full ${
                                isEnabled
                                    ? "bg-emerald-500"
                                    : "bg-orange-500"
                            }`}
                        />

                        {isEnabled
                            ? "Account Protected"
                            : "Protection Not Enabled"}

                    </div>
                )}

            </div>

            {/* =========================================
                LOADING
            ========================================= */}

            {isLoading ? (

                <div className="flex flex-col items-center justify-center py-24 gap-4">

                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Loader2 className="h-7 w-7 animate-spin text-primary" />
                    </div>

                    <div className="text-center">

                        <p className="font-semibold text-slate-800">
                            Loading security details
                        </p>

                        <p className="text-sm text-muted-foreground mt-1">
                            Checking your authentication status...
                        </p>

                    </div>

                </div>

            ) : (

                <>
                    {/* =========================================
                        MAIN 2FA CARD
                    ========================================= */}

                    <Card
                        className={`overflow-hidden shadow-sm transition-all duration-300 ${
                            isEnabled
                                ? "border-emerald-200"
                                : "border-slate-200"
                        }`}
                    >

                        {/* CARD HEADER */}

                        <CardHeader
                            className={`border-b ${
                                isEnabled
                                    ? "bg-emerald-50/40"
                                    : "bg-slate-50/60"
                            }`}
                        >

                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                                <div className="flex items-center gap-3">

                                    <div
                                        className={`h-11 w-11 rounded-xl flex items-center justify-center ${
                                            isEnabled
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-primary/10 text-primary"
                                        }`}
                                    >
                                        <KeyRound className="h-5 w-5" />
                                    </div>

                                    <div>

                                        <CardTitle className="text-xl font-bold text-slate-800">
                                            Two-Factor Authentication
                                        </CardTitle>

                                     

                                    </div>

                                </div>

                                {/* STATUS */}

                                <div
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold w-fit ${
                                        isEnabled
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : "bg-slate-50 text-slate-600 border-slate-200"
                                    }`}
                                >

                                    {isEnabled ? (
                                        <>
                                            <ShieldCheck className="h-4 w-4" />
                                            ENABLED
                                        </>
                                    ) : (
                                        <>
                                            <ShieldAlert className="h-4 w-4" />
                                            DISABLED
                                        </>
                                    )}

                                </div>

                            </div>

                        </CardHeader>

                        <CardContent className="p-6 md:p-8">

                            {/* =====================================
                                ENABLED STATE
                            ===================================== */}

                          {isEnabled ? (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6">

        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-100/50" />

        <div className="relative flex items-center justify-between gap-5">

            {/* LEFT: ICON + TEXT */}

            <div className="flex items-center gap-5">

                <div className="h-14 w-14 shrink-0 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                    <ShieldCheck className="h-7 w-7 text-white" />
                </div>

                <div className="flex items-center gap-2">

                    <h3 className="text-lg font-bold text-emerald-950">
                        Your account is protected
                    </h3>

                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />

                </div>

            </div>

            {/* RIGHT: DISABLE BUTTON */}

            <Button
                onClick={handleDisable2FA}
                variant="outline"
                disabled={isActionLoading}
                className="h-10 shrink-0 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
                <ShieldAlert className="mr-2 h-4 w-4" />

                {isActionLoading ? "Processing..." : "Disable 2FA"}
            </Button>

        </div>

    </div>
) : (

                                /* =====================================
                                   DISABLED STATE
                                ===================================== */

                                <div className="space-y-7">

                                    {/* INTRO */}

                                    <div className="flex items-start gap-5">

                                        <div className="h-14 w-14 shrink-0 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center">

                                            <ShieldAlert className="h-7 w-7 text-orange-500" />

                                        </div>

                                        <div>

                                            <h3 className="text-lg font-bold text-slate-900">
                                                Protect your account with 2FA
                                            </h3>

                                            <p className="text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                                                Add an extra layer of security to your
                                                account using an authenticator app.
                                                Once enabled, you will need a temporary
                                                6-digit verification code during login.
                                            </p>

                                        </div>

                                    </div>

                                    {/* =====================================
                                        SETUP BUTTON
                                    ===================================== */}

                                    {!setupData ? (

                                        <div className="pt-2">

                                            <Button
                                                onClick={handleStartSetup}
                                                disabled={isActionLoading}
                                                className="h-11 px-6 bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/20"
                                            >

                                                {isActionLoading ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Preparing Setup...
                                                    </>
                                                ) : (
                                                    <>
                                                        <ShieldCheck className="mr-2 h-4 w-4" />
                                                        Setup Authenticator
                                                        <ArrowRight className="ml-2 h-4 w-4" />
                                                    </>
                                                )}

                                            </Button>

                                        </div>

                                    ) : (

                                        /* =====================================
                                           SETUP PANEL
                                        ===================================== */

                                        <div className="rounded-2xl border border-primary/20 bg-primary/[0.025] overflow-hidden animate-in slide-in-from-top-2 duration-300">

                                            {/* SETUP HEADER */}

                                            <div className="px-5 py-4 border-b bg-white/70">

                                                <div className="flex items-center gap-3">

                                                    <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">

                                                        <KeyRound className="h-4 w-4" />

                                                    </div>

                                                    <div>

                                                        <h3 className="font-bold text-slate-800 text-sm">
                                                            Complete Authenticator Setup
                                                        </h3>

                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            Scan the QR code and verify your authenticator.
                                                        </p>

                                                    </div>

                                                </div>

                                            </div>

                                            <div className="p-5 md:p-7">

                                                <div className="grid lg:grid-cols-[280px_1fr] gap-8">

                                                    {/* =================================
                                                        QR CODE
                                                    ================================= */}

                                                    <div className="flex flex-col items-center">

                                                        <div className="rounded-2xl border bg-white p-4 shadow-sm">

                                                            <img
                                                                src={setupData.qrCodeDataUrl}
                                                                alt="2FA QR Code"
                                                                className="w-52 h-52"
                                                            />

                                                        </div>

                                                        <p className="text-xs font-semibold text-slate-700 mt-4">
                                                            Scan this QR code
                                                        </p>

                                                        <p className="text-[11px] text-muted-foreground text-center mt-1 max-w-[220px]">
                                                            Open your authenticator app
                                                            and scan the code to link
                                                            your account.
                                                        </p>

                                                    </div>

                                                    {/* =================================
                                                        RIGHT SIDE
                                                    ================================= */}

                                                    <div className="space-y-6">

                                                        {/* MANUAL KEY */}

                                                        <div>

                                                            <Label className="text-xs font-bold text-slate-700">
                                                                Manual setup key
                                                            </Label>

                                                            <p className="text-xs text-muted-foreground mt-1 mb-2">
                                                                If you cannot scan the QR code,
                                                                enter this key manually.
                                                            </p>

                                                            <div className="flex items-center gap-2 rounded-xl border bg-white p-2">

                                                                <code className="flex-1 min-w-0 px-2 text-xs font-mono font-bold text-primary break-all select-all">
                                                                    {setupData.secret}
                                                                </code>

                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={copyToClipboard}
                                                                    className="shrink-0 h-8 w-8"
                                                                >

                                                                    {copied ? (
                                                                        <Check className="h-4 w-4 text-emerald-600" />
                                                                    ) : (
                                                                        <Copy className="h-4 w-4 text-slate-500" />
                                                                    )}

                                                                </Button>

                                                            </div>

                                                        </div>

                                                        <div className="border-t" />

                                                        {/* =================================
                                                            VERIFICATION FORM
                                                        ================================= */}

                                                        <form
                                                            onSubmit={handleVerifySetup}
                                                            className="space-y-5"
                                                        >

                                                            <div>

                                                                <Label
                                                                    htmlFor="verification-0"
                                                                    className="text-sm font-bold text-slate-800"
                                                                >
                                                                    Verification code
                                                                </Label>

                                                                <p className="text-xs text-muted-foreground mt-1 mb-4">
                                                                    Enter the 6-digit code
                                                                    shown in your authenticator app.
                                                                </p>

                                                                {/* =================================
                                                                    SIX OTP BOXES
                                                                ================================= */}

                                                                <div className="flex items-center justify-center gap-2 sm:gap-3">

                                                                    {verificationDigits.map(
                                                                        (digit, index) => (
                                                                            <Input
                                                                                key={index}
                                                                                ref={(element) => {
                                                                                    inputRefs.current[index] =
                                                                                        element;
                                                                                }}
                                                                                id={`verification-${index}`}
                                                                                type="text"
                                                                                inputMode="numeric"
                                                                                autoComplete={
                                                                                    index === 0
                                                                                        ? "one-time-code"
                                                                                        : "off"
                                                                                }
                                                                                maxLength={1}
                                                                                value={digit}
                                                                                disabled={
                                                                                    isActionLoading
                                                                                }
                                                                                onChange={(e) =>
                                                                                    handleVerificationDigitChange(
                                                                                        index,
                                                                                        e.target.value
                                                                                    )
                                                                                }
                                                                                onKeyDown={(e) =>
                                                                                    handleVerificationKeyDown(
                                                                                        index,
                                                                                        e
                                                                                    )
                                                                                }
                                                                                onPaste={
                                                                                    index === 0
                                                                                        ? handleVerificationPaste
                                                                                        : undefined
                                                                                }
                                                                                className={`
                                                                                    h-12 w-11
                                                                                    sm:h-14 sm:w-14
                                                                                    rounded-xl
                                                                                    text-center
                                                                                    text-xl
                                                                                    sm:text-2xl
                                                                                    font-bold
                                                                                    transition-all
                                                                                    duration-300
                                                                                    ${getOtpBoxClass()}
                                                                                `}
                                                                            />
                                                                        )
                                                                    )}

                                                                </div>

                                                                {/* =================================
                                                                    VERIFICATION STATUS
                                                                ================================= */}

                                                                {/* <div className="h-6 mt-3 flex items-center justify-center">

                                                                    {verificationStatus ===
                                                                        "verifying" && (
                                                                        <div className="flex items-center gap-2 text-xs font-semibold text-primary">

                                                                            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />

                                                                            Verifying code...

                                                                        </div>
                                                                    )}

                                                                    {verificationStatus ===
                                                                        "success" && (
                                                                        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">

                                                                            <Check className="h-4 w-4" />

                                                                            Verification successful

                                                                        </div>
                                                                    )}

                                                                    {verificationStatus ===
                                                                        "error" && (
                                                                        <div className="flex items-center gap-2 text-xs font-semibold text-red-600">

                                                                            <ShieldAlert className="h-4 w-4" />

                                                                            Invalid verification code

                                                                        </div>
                                                                    )}

                                                                </div> */}

                                                            </div>

                                                            {/* =================================
                                                                BUTTONS
                                                            ================================= */}

                                                            <div className="flex flex-col-reverse sm:flex-row gap-3">

                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    onClick={cancelSetup}
                                                                    className="h-11 sm:w-auto"
                                                                    disabled={isActionLoading}
                                                                >
                                                                    Cancel
                                                                </Button>

                                                                <Button
                                                                    type="submit"
                                                                    disabled={
                                                                        isActionLoading ||
                                                                        verificationDigits.join(
                                                                            ""
                                                                        ).length !== 6
                                                                    }
                                                                    className={`
                                                                        h-11
                                                                        flex-1
                                                                        text-white
                                                                        font-semibold
                                                                        transition-all
                                                                        duration-300
                                                                        ${
                                                                            verificationStatus ===
                                                                            "success"
                                                                                ? "bg-emerald-600 hover:bg-emerald-600"
                                                                                : verificationStatus ===
                                                                                  "error"
                                                                                ? "bg-red-600 hover:bg-red-600"
                                                                                : "bg-primary hover:bg-primary/90"
                                                                        }
                                                                    `}
                                                                >

                                                                    {verificationStatus ===
                                                                    "verifying" ? (
                                                                        <>
                                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                            Verifying...
                                                                        </>
                                                                    ) : verificationStatus ===
                                                                      "success" ? (
                                                                        <>
                                                                            <Check className="mr-2 h-4 w-4" />
                                                                            Verified
                                                                        </>
                                                                    ) : verificationStatus ===
                                                                      "error" ? (
                                                                        <>
                                                                            <ShieldAlert className="mr-2 h-4 w-4" />
                                                                            Try Again
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <ShieldCheck className="mr-2 h-4 w-4" />
                                                                            Verify & Enable
                                                                        </>
                                                                    )}

                                                                </Button>

                                                            </div>

                                                        </form>

                                                    </div>

                                                </div>

                                            </div>

                                        </div>

                                    )}

                                </div>
                            )}

                        </CardContent>

                    </Card>

                   
                </>
            )}

            {/* =========================================
                DISABLE CONFIRMATION DIALOG
            ========================================= */}

            <Dialog
                open={showDisableConfirm}
                onOpenChange={setShowDisableConfirm}
            >

                <DialogContent className="sm:max-w-[430px] p-0 overflow-hidden">

                    {/* HEADER */}

                    <div className="bg-red-50 border-b border-red-100 px-6 py-5">

                        <DialogHeader>

                            <div className="flex items-center gap-3">

                                <div className="h-11 w-11 rounded-xl bg-red-100 flex items-center justify-center">

                                    <AlertTriangle className="h-5 w-5 text-red-600" />

                                </div>

                                <div>

                                    <DialogTitle className="text-lg font-bold text-slate-900">
                                        Disable Two-Factor Authentication?
                                    </DialogTitle>

                                    <DialogDescription className="text-xs text-red-700 mt-1">
                                        This will reduce your account's security.
                                    </DialogDescription>

                                </div>

                            </div>

                        </DialogHeader>

                    </div>

                    {/* BODY */}

                    <div className="px-6 py-5 space-y-4">

                        <p className="text-sm text-slate-600 leading-relaxed">
                            Are you sure you want to remove authenticator-based
                            two-factor authentication from your account?
                        </p>

                        <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4">

                            <ShieldAlert className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />

                            <p className="text-xs font-medium text-orange-800 leading-relaxed">
                                After disabling 2FA, your account will no longer
                                require an authenticator verification code during login.
                            </p>

                        </div>

                    </div>

                    {/* FOOTER */}

                    <DialogFooter className="px-6 py-4 bg-slate-50 border-t">

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowDisableConfirm(false)}
                            className="h-10"
                            disabled={isActionLoading}
                        >
                            Keep Protection
                        </Button>

                        <Button
                            type="button"
                            variant="destructive"
                            onClick={executeDisable2FA}
                            disabled={isActionLoading}
                            className="h-10 font-semibold"
                        >

                            {isActionLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Disabling...
                                </>
                            ) : (
                                "Disable 2FA"
                            )}

                        </Button>

                    </DialogFooter>

                </DialogContent>

            </Dialog>

        </div>
    );
}