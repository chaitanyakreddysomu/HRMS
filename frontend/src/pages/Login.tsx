import { useState, useRef } from "react";
import { apiFetch } from "@/config/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Eye, EyeOff, Mail, Lock, ArrowRight, User, Phone, Building, Briefcase, CheckCircle2, Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import icsLogo from "../assets/ics_logo.jpeg";

export function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [view, setView] = useState<"login" | "register">("login");
    const [isLoading, setIsLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    // Login State
    const [showPassword, setShowPassword] = useState(false);

    const [loginData, setLoginData] = useState({
        email: "",
        password: ""
    });

    // Register State
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // 2FA State
    const [step, setStep] = useState<"credentials" | "2fa">("credentials");

    const [tempToken, setTempToken] = useState<string | null>(null);

    // Authenticator OTP
    const [twoFactorDigits, setTwoFactorDigits] = useState<string[]>(
        Array(6).fill("")
    );

    const [twoFactorStatus, setTwoFactorStatus] = useState<"idle" | "success" | "error">("idle");

    const twoFactorInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Clear messages when switching views
    const handleSetView = (newView: "login" | "register") => {
        setView(newView);
        setErrorMsg(null);
        setSuccessMsg(null);
    };

    /* =========================================================
       LOGIN
    ========================================================= */

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsLoading(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        try {
            const res = await apiFetch("/api/auth/login", {
                method: "POST",
                body: JSON.stringify(loginData)
            });

            const data = await res.json();

            if (res.ok) {
                if (data.twoFactorRequired) {
                    setTempToken(data.tempToken);

                    setTwoFactorDigits(Array(6).fill(""));
                    setTwoFactorStatus("idle");

                    setStep("2fa");

                    // Focus first OTP box after UI renders
                    setTimeout(() => {
                        twoFactorInputRefs.current[0]?.focus();
                    }, 100);
                } else {
                    localStorage.setItem("token", data.accessToken);
                    localStorage.setItem("refresh_token", data.refreshToken);
                    login(data.user.role || "EMPLOYEE", data.user);
                    navigate("/");
                }
            } else {
                setErrorMsg(data.message || "Login failed");
            }
        } catch (error) {
            console.error("Login Error:", error);
            setErrorMsg(
                "Something went wrong. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    };

    /* =========================================================
       2FA OTP INPUT
    ========================================================= */

    const handleTwoFactorDigitChange = (index: number, value: string) => {
        const digitsOnly = value.replace(/\D/g, "");

        // If user starts editing after a failed verification,
        // return the boxes to their normal state.
        setTwoFactorStatus("idle");
        setErrorMsg(null);

        // Handle paste / multiple digits
        if (digitsOnly.length > 1) {
            const newDigits = [...twoFactorDigits];

            digitsOnly
                .slice(0, 6 - index)
                .split("")
                .forEach((digit, offset) => {
                    newDigits[index + offset] = digit;
                });

            setTwoFactorDigits(newDigits);

            const nextIndex = Math.min(index + digitsOnly.length, 5);

            setTimeout(() => {
                twoFactorInputRefs.current[nextIndex]?.focus();
            }, 0);

            return;
        }

        const newDigits = [...twoFactorDigits];

        newDigits[index] = digitsOnly;

        setTwoFactorDigits(newDigits);

        // Automatically jump to next box
        if (digitsOnly && index < 5) {
            twoFactorInputRefs.current[index + 1]?.focus();
        }
    };

    const handleTwoFactorKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace") {
            setTwoFactorStatus("idle");
            setErrorMsg(null);

            if (twoFactorDigits[index]) {
                const newDigits = [...twoFactorDigits];

                newDigits[index] = "";

                setTwoFactorDigits(newDigits);
            } else if (index > 0) {
                const newDigits = [...twoFactorDigits];

                newDigits[index - 1] = "";

                setTwoFactorDigits(newDigits);

                twoFactorInputRefs.current[index - 1]?.focus();
            }
        }

        if (e.key === "ArrowLeft" && index > 0) {
            e.preventDefault();

            twoFactorInputRefs.current[index - 1]?.focus();
        }

        if (e.key === "ArrowRight" && index < 5) {
            e.preventDefault();

            twoFactorInputRefs.current[index + 1]?.focus();
        }
    };

    const handleTwoFactorPaste = (
        e: React.ClipboardEvent<HTMLInputElement>
    ) => {
        e.preventDefault();

        const pastedCode = e.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, 6);

        if (!pastedCode) return;

        const newDigits = Array(6).fill("");

        pastedCode
            .split("")
            .forEach((digit, index) => {
                newDigits[index] = digit;
            });

        setTwoFactorDigits(newDigits);
        setTwoFactorStatus("idle");
        setErrorMsg(null);

        const nextIndex = Math.min(
            pastedCode.length,
            5
        );

        setTimeout(() => {
            twoFactorInputRefs.current[nextIndex]?.focus();
        }, 0);
    };

    /* =========================================================
       VERIFY 2FA
    ========================================================= */

    const handleVerify2FA = async (e: React.FormEvent) => {
        e.preventDefault();

        const twoFactorCode = twoFactorDigits.join("");

        if (twoFactorCode.length !== 6) {
            setTwoFactorStatus("error");

            setErrorMsg(
                "Please enter a valid 6-digit code"
            );

            return;
        }

        setIsLoading(true);
        setErrorMsg(null);
        setTwoFactorStatus("idle");

        try {
            const res = await apiFetch(
                "/api/auth/login/2fa",
                {
                    method: "POST",
                    body: JSON.stringify({
                        tempToken,
                        code: twoFactorCode
                    })
                }
            );

            const data = await res.json();

            if (res.ok) {
                // All 6 boxes become GREEN
                setTwoFactorStatus("success");

                // Let the user see the green state briefly
                setTimeout(() => {
                    localStorage.setItem("token", data.accessToken);

                    localStorage.setItem("refresh_token", data.refreshToken);

                    login(data.user.role || "EMPLOYEE", data.user);

                    navigate("/");
                }, 500);
            } else {
                // All 6 boxes become RED
                setTwoFactorStatus("error");

                // Keep the existing error message
                setErrorMsg(data.message || "2FA Verification failed");

                // IMPORTANT:
                // Do NOT clear the six entered digits.
                // They remain visible inside the red boxes.
            }
        } catch (error) {
            console.error("2FA Login Error:", error);

            // All 6 boxes become RED
            setTwoFactorStatus("error");

            // Keep the existing error message
            setErrorMsg("Something went wrong. Please try again.");

            // Keep entered digits visible.
        } finally {
            setIsLoading(false);
        }
    };

    /* =========================================================
       BACK TO SIGN IN
    ========================================================= */

    const handleBackToSignIn = () => {
        setStep("credentials");
        setTempToken(null);
        setTwoFactorDigits(Array(6).fill(""));
        setTwoFactorStatus("idle");
        setErrorMsg(null);
    };

    /* =========================================================
       REGISTER
    ========================================================= */

    const handleRegister = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        setIsLoading(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        if (data.password !== data.confirmPassword) {
            setErrorMsg("Passwords do not match");
            setIsLoading(false);
            return;
        }

        try {
            const res = await apiFetch(
                "/api/auth/register",
                {
                    method: "POST",
                    body: JSON.stringify({
                        name: data.fullname,
                        email: data.email,
                        phone: data.phone,
                        department: data.department,
                        designation: data.designation,
                        role: data.role
                            .toString()
                            .toUpperCase(),
                        password: data.password
                    })
                }
            );

            const result = await res.json();

            if (res.ok) {
                setSuccessMsg("Registration successful! Please sign in.");
                handleSetView("login");
            } else {
                setErrorMsg(result.message || "Registration failed");
            }
        } catch (error) {

            console.error("Register Error:", error);
            setErrorMsg("Something went wrong. Please try again.");

        } finally {

            setIsLoading(false);

        }
    };

    return (
        <div className="flex h-screen overflow-hidden w-full font-sans bg-gray-50">

            <div
                className="hidden lg:flex w-[45%] h-full flex-col justify-center items-center text-white p-12 relative overflow-hidden"
                style={{ background: "var(--button-bg)" }}
            >

                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">

                    <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white blur-3xl" />
                    <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-white blur-3xl" />

                </div>

                <div className="relative z-10 flex flex-col items-center text-center max-w-md">

                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm mb-8 shadow-2xl">
                        <img
                            src={icsLogo}
                            alt="ICS Logo"
                            className="w-24 h-24 object-contain rounded-lg"
                        />

                    </div>

                    <h1 className="text-3xl font-bold mb-4 tracking-tight">
                        Inner Circle Softech PVT LTD
                    </h1>

                    <p className="text-lg text-blue-100 mb-10 font-medium">
                        Human Resource Management System
                    </p>

                    <div className="space-y-4 text-left w-full pl-4">

                        <div className="flex items-center gap-3 text-blue-50">

                            <span className="bg-blue-500/30 p-1.5 rounded-full">

                                <div className="w-2 h-2 bg-white rounded-full" />

                            </span>

                            <span className="text-base font-medium">
                                Streamlined Employee Management
                            </span>

                        </div>

                        <div className="flex items-center gap-3 text-blue-50">

                            <span className="bg-blue-500/30 p-1.5 rounded-full">

                                <div className="w-2 h-2 bg-white rounded-full" />

                            </span>

                            <span className="text-base font-medium">
                                Real-time Attendance Tracking
                            </span>

                        </div>

                        <div className="flex items-center gap-3 text-blue-50">

                            <span className="bg-blue-500/30 p-1.5 rounded-full">

                                <div className="w-2 h-2 bg-white rounded-full" />

                            </span>

                            <span className="text-base font-medium">
                                Comprehensive HR Analytics
                            </span>

                        </div>

                    </div>

                </div>

            </div>

            {/* =====================================================
                RIGHT PANEL
            ===================================================== */}

            <div className="flex-1 h-full overflow-y-auto bg-gray-50">

                <div className="min-h-full flex flex-col justify-center items-center p-6 md:p-12 relative animate-in fade-in duration-500">

                    <Card
                        className={`w-full shadow-lg border border-blue-100 bg-white transition-all duration-300 ${view === "register"
                            ? "max-w-[600px]"
                            : "max-w-[500px]"
                            }`}
                    >

                        <CardContent className="p-8 md:p-10">

                            {/* =================================================
                                TAB SWITCHER
                            ================================================= */}

                            {step !== "2fa" && (

                                <div className="flex bg-gray-100/80 p-1.5 rounded-xl mb-8 w-full max-w-sm mx-auto">

                                    <button
                                        onClick={() =>
                                            handleSetView(
                                                "login"
                                            )
                                        }
                                        className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${view === "login"
                                            ? "bg-white shadow-sm text-gray-900"
                                            : "text-gray-500 hover:text-gray-700"
                                            }`}
                                    >
                                        Sign In
                                    </button>

                                    <button
                                        onClick={() =>
                                            handleSetView(
                                                "register"
                                            )
                                        }
                                        className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${view === "register"
                                            ? "bg-white shadow-sm text-gray-900"
                                            : "text-gray-500 hover:text-gray-700"
                                            }`}
                                    >
                                        Sign Up
                                    </button>

                                </div>
                            )}

                            {/* =================================================
                                MESSAGES
                            ================================================= */}

                            {errorMsg && (

                                <div
                                    className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-2 flex items-center gap-2"
                                    id="loginErrorMsg"
                                >

                                    <CheckCircle2 className="h-4 w-4 text-red-500 rotate-45" />

                                    {errorMsg}

                                </div>
                            )}

                            {successMsg && (

                                <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-600 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-2 flex items-center gap-2">

                                    <CheckCircle2 className="h-4 w-4 text-green-500" />

                                    {successMsg}

                                </div>
                            )}

                            {/* =================================================
                                AUTHENTICATOR 2FA
                            ================================================= */}

                            {step === "2fa" ? (

                                <form
                                    onSubmit={
                                        handleVerify2FA
                                    }
                                    className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300"
                                >

                                    {/* Header */}

                                    <div className="text-center mb-5">

                                        <div className="relative inline-flex mb-3">

                                            <div
                                                className={`
                                                    h-14 w-14 rounded-2xl flex items-center justify-center
                                                    ${twoFactorStatus === "success"
                                                        ? "bg-green-50"
                                                        : twoFactorStatus === "error"
                                                            ? "bg-red-50"
                                                            : "bg-indigo-50"
                                                    }
                                                `}
                                            >

                                                {twoFactorStatus === "success" ? (
                                                    <ShieldCheck className="h-7 w-7 text-green-600" />
                                                ) : twoFactorStatus === "error" ? (
                                                    <ShieldAlert className="h-7 w-7 text-red-600" />
                                                ) : (
                                                    <ShieldCheck className="h-7 w-7 text-indigo-600" />
                                                )}

                                            </div>

                                            <span
                                                className={`
                                                    absolute -right-1 -bottom-1 h-4 w-4 rounded-full border-2 border-white
                                                    ${twoFactorStatus === "success"
                                                        ? "bg-green-500"
                                                        : twoFactorStatus === "error"
                                                            ? "bg-red-500"
                                                            : "bg-emerald-500"
                                                    }
                                                `}
                                            />

                                        </div>

                                        <h3 className="text-xl font-bold text-gray-900">
                                            Two-Factor Authentication
                                        </h3>

                                        <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                                            Enter the 6-digit verification
                                            code from your authenticator app.
                                        </p>

                                    </div>

                                    {/* =================================================
                                        AUTHENTICATOR CODE
                                    ================================================= */}

                                    <div className="space-y-3">

                                        <Label
                                            htmlFor="two-factor-0"
                                            className="text-gray-700 font-semibold text-sm"
                                        >
                                            Authenticator Code
                                        </Label>

                                        <div className="flex justify-center gap-2 sm:gap-3">

                                            {twoFactorDigits.map(
                                                (
                                                    digit,
                                                    index
                                                ) => (

                                                    <Input
                                                        key={
                                                            index
                                                        }
                                                        ref={(
                                                            element
                                                        ) => {
                                                            twoFactorInputRefs.current[
                                                                index
                                                            ] =
                                                                element;
                                                        }}
                                                        id={`two-factor-${index}`}
                                                        type="text"
                                                        inputMode="numeric"
                                                        autoComplete={
                                                            index ===
                                                                0
                                                                ? "one-time-code"
                                                                : "off"
                                                        }
                                                        maxLength={
                                                            1
                                                        }
                                                        value={
                                                            digit
                                                        }
                                                        autoFocus={
                                                            index ===
                                                            0
                                                        }
                                                        disabled={
                                                            isLoading
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            handleTwoFactorDigitChange(
                                                                index,
                                                                e
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        onKeyDown={(
                                                            e
                                                        ) =>
                                                            handleTwoFactorKeyDown(
                                                                index,
                                                                e
                                                            )
                                                        }
                                                        onPaste={
                                                            index ===
                                                                0
                                                                ? handleTwoFactorPaste
                                                                : undefined
                                                        }
                                                        className={`
                                                            h-12
                                                            w-10
                                                            sm:h-14
                                                            sm:w-12
                                                            text-center
                                                            text-xl
                                                            sm:text-2xl
                                                            font-bold
                                                            tracking-normal
                                                            rounded-xl
                                                            transition-all
                                                            duration-200
                                                            ${twoFactorStatus === "success"
                                                                ? "bg-green-50 border-green-500 text-green-700 ring-2 ring-green-500/20 focus:border-green-500 focus:ring-green-500"
                                                                : twoFactorStatus === "error"
                                                                    ? "bg-red-50 border-red-500 text-red-600 ring-2 ring-red-500/20 focus:border-red-500 focus:ring-red-500"
                                                                    : "bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                            }
                                                        `}
                                                    />

                                                )
                                            )}

                                        </div>



                                    </div>

                                    {/* =================================================
                                        BUTTONS
                                    ================================================= */}

                                    <div className="space-y-3 pt-2">

                                        <Button
                                            className={`
                                                w-full h-12 text-white font-bold text-base transition-all rounded-lg
                                                ${twoFactorStatus === "success"
                                                    ? "bg-green-600 hover:bg-green-600"
                                                    : twoFactorStatus === "error"
                                                        ? "bg-red-600 hover:bg-red-500"
                                                        : "bg-indigo-600 hover:bg-indigo-500"
                                                }
                                            `}
                                            type="submit"
                                            disabled={
                                                isLoading ||
                                                twoFactorDigits.join(
                                                    ""
                                                ).length !== 6
                                            }
                                        >

                                            {isLoading ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                                    Verifying...
                                                </span>
                                            ) : twoFactorStatus === "success" ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    Verified
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-center gap-2">
                                                    Verify & Sign In
                                                    <ArrowRight className="h-4 w-4" />
                                                </span>
                                            )}

                                        </Button>

                                        <button
                                            type="button"
                                            onClick={
                                                handleBackToSignIn
                                            }
                                            disabled={
                                                isLoading
                                            }
                                            className="w-full text-center text-sm font-semibold text-slate-500 hover:text-slate-700 hover:underline py-1"
                                        >
                                            Back to Sign In
                                        </button>

                                    </div>

                                </form>

                            ) : view === "login" ? (

                                /* =================================================
                                   LOGIN FORM
                                ================================================= */

                                <form
                                    onSubmit={handleLogin}
                                    className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300"
                                >

                                    <div className="space-y-2">

                                        <Label
                                            htmlFor="SignInEmail"
                                            className="text-gray-700 font-semibold text-sm"
                                        >
                                            Email
                                        </Label>

                                        <div className="relative group">

                                            <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />

                                            <Input
                                                id="SignInEmail"
                                                name="SignInEmail"
                                                placeholder="youremail@gmail.com"
                                                className="pl-10 h-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500 transition-all"
                                                value={
                                                    loginData.email
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    setLoginData(
                                                        {
                                                            ...loginData,
                                                            email: e
                                                                .target
                                                                .value
                                                        }
                                                    )
                                                }
                                            />

                                        </div>

                                    </div>

                                    <div className="space-y-2">

                                        <Label
                                            htmlFor="SignInPassword"
                                            className="text-gray-700 font-semibold text-sm"
                                        >
                                            Password
                                        </Label>

                                        <div className="relative group">

                                            <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />

                                            <Input
                                                id="SignInPassword"
                                                type={
                                                    showPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                placeholder="••••••••••••"
                                                className="pl-10 pr-10 h-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500 transition-all"
                                                value={
                                                    loginData.password
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    setLoginData(
                                                        {
                                                            ...loginData,
                                                            password:
                                                                e
                                                                    .target
                                                                    .value
                                                        }
                                                    )
                                                }
                                            />

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowPassword(
                                                        !showPassword
                                                    )
                                                }
                                                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </button>

                                        </div>

                                    </div>

                                    <div className="flex justify-end pt-1">

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowForgotPassword(true)
                                            }
                                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                                        >
                                            Forgot Password?
                                        </button>

                                    </div>

                                    <div className="space-y-4 pt-2">

                                        <Button
                                            className="w-full h-12 text-white font-bold text-base transition-all rounded-lg"
                                            type="submit"
                                            id="signInBTN"
                                            disabled={
                                                isLoading
                                            }
                                        >

                                            {isLoading ? (
                                                "Signing In..."
                                            ) : (
                                                <span className="flex items-center gap-2">
                                                    Sign In
                                                    <ArrowRight className="h-4 w-4" />
                                                </span>
                                            )}

                                        </Button>

                                    </div>

                                </form>

                            ) : (

                                /* =================================================
                                   REGISTER FORM
                                ================================================= */

                                <div className="animate-in fade-in slide-in-from-right-4 duration-300">

                                    <div className="mb-6 text-center">

                                        <h2 className="text-xl font-bold text-gray-900">
                                            Create Account
                                        </h2>

                                        <p className="text-sm text-muted-foreground">
                                            Enter your details to register
                                        </p>

                                    </div>

                                    <form
                                        onSubmit={
                                            handleRegister
                                        }
                                        className="space-y-4"
                                    >

                                        <div className="space-y-1.5">

                                            <Label
                                                htmlFor="fullname"
                                                className="text-gray-700 font-medium text-sm"
                                            >
                                                Full Name *
                                            </Label>

                                            <div className="relative">

                                                <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />

                                                <Input
                                                    id="fullname"
                                                    name="fullname"
                                                    placeholder="Your Full Name"
                                                    className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white"
                                                    required
                                                />

                                            </div>

                                        </div>

                                        <div className="space-y-1.5">

                                            <Label
                                                htmlFor="SignUpEmail"
                                                className="text-gray-700 font-medium text-sm"
                                            >
                                                Email *
                                            </Label>

                                            <div className="relative">

                                                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />

                                                <Input
                                                    id="SignUpEmail"
                                                    name="email"
                                                    placeholder="yourname@gmail.com"
                                                    type="email"
                                                    className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white"
                                                    required
                                                />

                                            </div>

                                        </div>

                                        <div className="grid grid-cols-2 gap-4">

                                            <div className="space-y-1.5">

                                                <Label
                                                    htmlFor="phone"
                                                    className="text-gray-700 font-medium text-sm"
                                                >
                                                    Phone *
                                                </Label>

                                                <div className="relative">

                                                    <Phone className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />

                                                    <Input
                                                        id="phone"
                                                        name="phone"
                                                        placeholder="9876543210"
                                                        type="tel"
                                                        className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white"
                                                        required
                                                    />

                                                </div>

                                            </div>

                                            <div className="space-y-1.5">

                                                <Label
                                                    htmlFor="designation"
                                                    className="text-gray-700 font-medium text-sm"
                                                >
                                                    Designation *
                                                </Label>

                                                <div className="relative">

                                                    <Briefcase className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />

                                                    <Input
                                                        id="designation"
                                                        name="designation"
                                                        placeholder="Software Engineer"
                                                        className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white"
                                                        required
                                                    />

                                                </div>

                                            </div>

                                        </div>

                                        <div className="grid grid-cols-2 gap-4">

                                            <div className="space-y-1.5">

                                                <Label className="text-gray-700 font-medium text-sm">
                                                    Department *
                                                </Label>

                                                <div className="relative">

                                                    <Building className="absolute left-3 top-3.5 h-4 w-4 text-gray-400 z-10 pointer-events-none" />

                                                    <select
                                                        name="department"
                                                        className="appearance-none pl-10 h-11 w-full bg-gray-50/50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
                                                        required
                                                    >
                                                        <option
                                                            value=""
                                                            disabled
                                                            selected
                                                        >
                                                            Department
                                                        </option>

                                                        <option value="Engineering">
                                                            Engineering
                                                        </option>

                                                        <option value="HR">
                                                            HR
                                                        </option>

                                                        <option value="Sales">
                                                            Sales
                                                        </option>

                                                    </select>

                                                </div>

                                            </div>

                                            <div className="space-y-1.5">

                                                <Label className="text-gray-700 font-medium text-sm">
                                                    Role *
                                                </Label>

                                                <div className="relative">

                                                    <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-400 z-10 pointer-events-none" />

                                                    <select
                                                        name="role"
                                                        className="appearance-none pl-10 h-11 w-full bg-gray-50/50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
                                                        required
                                                    >

                                                        <option value="EMPLOYEE">
                                                            Employee
                                                        </option>

                                                        <option value="HR">
                                                            HR
                                                        </option>

                                                    </select>

                                                </div>

                                            </div>

                                        </div>

                                        <div className="space-y-1.5">

                                            <Label
                                                htmlFor="SignUpPassword"
                                                className="text-gray-700 font-medium text-sm"
                                            >
                                                Password *
                                            </Label>

                                            <div className="relative">

                                                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />

                                                <Input
                                                    id="SignUpPassword"
                                                    name="password"
                                                    type={
                                                        showRegisterPassword
                                                            ? "text"
                                                            : "password"
                                                    }
                                                    placeholder="••••••••••••"
                                                    className="pl-10 pr-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white"
                                                    required
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowRegisterPassword(
                                                            !showRegisterPassword
                                                        )
                                                    }
                                                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                                                >

                                                    {showRegisterPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}

                                                </button>

                                            </div>

                                        </div>

                                        <div className="space-y-1.5">

                                            <Label
                                                htmlFor="SignUpConfirmPassword"
                                                className="text-gray-700 font-medium text-sm"
                                            >
                                                Confirm Password *
                                            </Label>

                                            <div className="relative">

                                                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />

                                                <Input
                                                    id="SignUpConfirmPassword"
                                                    name="confirmPassword"
                                                    type={
                                                        showConfirmPassword
                                                            ? "text"
                                                            : "password"
                                                    }
                                                    placeholder="••••••••••••"
                                                    className="pl-10 pr-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white"
                                                    required
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowConfirmPassword(
                                                            !showConfirmPassword
                                                        )
                                                    }
                                                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                                                >

                                                    {showConfirmPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}

                                                </button>

                                            </div>

                                        </div>

                                        <div className="pt-4 flex gap-3">

                                            <Button
                                                className="flex-1 h-11 text-white font-bold rounded-lg"
                                                type="submit"
                                                disabled={
                                                    isLoading
                                                }
                                            >
                                                {isLoading
                                                    ? "Signing Up..."
                                                    : "Create Account"}
                                            </Button>

                                        </div>

                                    </form>

                                </div>
                            )}

                        </CardContent>

                    </Card>

                    {/* Footer */}

                    <div className="mt-8 text-center text-xs text-gray-400 font-medium pb-4">
                        © Inner Circle Softech PVT LTD 2025
                    </div>

                </div>

            </div>

            {/* =====================================================
                FORGOT PASSWORD DIALOG
            ===================================================== */}

            <Dialog
                open={showForgotPassword}
                onOpenChange={
                    setShowForgotPassword
                }
            >

                <DialogContent className="sm:max-w-[400px] p-6">

                    <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">

                        <DialogTitle className="text-lg font-bold text-gray-900">
                            Forgot Password?
                        </DialogTitle>

                    </DialogHeader>

                    <div className="flex flex-col items-center justify-center py-4 text-center">

                        <div className="mb-4">

                            <Lock
                                className="h-16 w-16 text-gray-300"
                                strokeWidth={1.5}
                            />

                        </div>

                        <h3 className="text-base font-bold text-gray-900 mb-2">
                            Contact Admin
                        </h3>

                        <div className="space-y-3 mb-6">

                            <p className="text-gray-500 text-sm px-4 leading-relaxed">
                                To reset your password,
                                please contact your system
                                administrator.
                            </p>

                            <p className="text-gray-500 text-sm">
                                They will help you recover
                                your account access.
                            </p>

                        </div>

                        <DialogClose asChild>

                            <Button
                                type="button"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10 rounded-lg"
                            >
                                Got it
                            </Button>

                        </DialogClose>

                    </div>

                </DialogContent>

            </Dialog>

        </div>
    );
}