import { useState, useEffect } from "react";
import { apiFetch } from "@/config/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    Search,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    GraduationCap,
    Building2,
    Download,
    Eye,
    CheckCircle2,
    Clock,
    XCircle,
    Star,
    ExternalLink,
    Calendar,
    Users2,
    Loader2,
    MessageSquare,
    Link2,
} from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";

/* =========================
   STATUS CONFIG
========================= */

const STATUS_CONFIG = {
    "Under Review": {
        label: "Review",
        color: "bg-yellow-100 text-yellow-700 border-yellow-200",
        icon: Clock,
    },
    "Interview Scheduled": {
        label: "Interview",
        color: "bg-blue-100 text-blue-700 border-blue-200",
        icon: Calendar,
    },
    Shortlisted: {
        label: "Shortlisted",
        color: "bg-cyan-100 text-cyan-700 border-cyan-200",
        icon: Star,
    },
    Selected: {
        label: "Selected",
        color: "bg-green-100 text-green-700 border-green-200",
        icon: CheckCircle2,
    },
    Rejected: {
        label: "Rejected",
        color: "bg-red-100 text-red-700 border-red-200",
        icon: XCircle,
    },
    Joined: {
        label: "Joined",
        color: "bg-purple-100 text-purple-700 border-purple-200",
        icon: Building2,
    },
};

const getStatusConfig = (status: string) => {
    return (
        STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ||
        STATUS_CONFIG["Under Review"]
    );
};

/* =========================
   CUSTOM SELECT ITEM
========================= */

const selectItemClass =
    "cursor-pointer rounded-md px-3 py-2 text-sm " +
    "focus:bg-primary focus:text-primary-foreground " +
    "data-[highlighted]:bg-primary data-[highlighted]:text-primary-foreground";

/* =========================
   COMPONENT
========================= */

export default function AdminReferrals() {
    const { addToast } = useToast();

    const [referrals, setReferrals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");

    const [selectedReferral, setSelectedReferral] = useState<any>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const [updateStatus, setUpdateStatus] = useState("");
    const [remarks, setRemarks] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    /* =========================
       DURATION
    ========================= */

    const calculateDuration = (from: string, to: string) => {
        if (!from) return "";

        const startDate = new Date(from);
        const endDate =
            to === "Present" || !to ? new Date() : new Date(to);

        if (
            isNaN(startDate.getTime()) ||
            isNaN(endDate.getTime())
        ) {
            return "";
        }

        let years =
            endDate.getFullYear() - startDate.getFullYear();

        let months =
            endDate.getMonth() - startDate.getMonth();

        if (months < 0) {
            years--;
            months += 12;
        }

        const yearsPart =
            years > 0
                ? `${years} Year${years > 1 ? "s" : ""}`
                : "";

        const monthsPart =
            months > 0
                ? `${months} Month${months > 1 ? "s" : ""}`
                : "";

        if (!yearsPart && !monthsPart) {
            return "Less than 1 month";
        }

        return [yearsPart, monthsPart]
            .filter(Boolean)
            .join(" ");
    };

    /* =========================
       FETCH DATA
    ========================= */

    const fetchData = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams();

            params.append("status", filterStatus);

            if (searchTerm.trim()) {
                params.append(
                    "search",
                    searchTerm.trim()
                );
            }

            const referralsRes = await apiFetch(
                `/api/referrals?${params.toString()}`
            );

            if (referralsRes.ok) {
                setReferrals(await referralsRes.json());
            } else {
                setReferrals([]);
            }
        } catch (error) {
            console.error("Fetch data error", error);
            setReferrals([]);
        } finally {
            setLoading(false);
        }
    };

    /* =========================
       AUTO SEARCH
    ========================= */

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm, filterStatus]);

    /* =========================
       UPDATE STATUS
    ========================= */

    const handleUpdateStatus = async () => {
        if (!selectedReferral || !updateStatus) return;

        setIsSaving(true);

        try {
            const res = await apiFetch(
                `/api/referrals/${selectedReferral._id}`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        status: updateStatus,
                        remarks,
                    }),
                }
            );

            if (res.ok) {
                addToast(
                    "Status updated successfully",
                    "success"
                );

                setIsDetailsOpen(false);

                fetchData();
            } else {
                addToast(
                    "Failed to update status",
                    "error"
                );
            }
        } catch (error) {
            console.error(error);

            addToast(
                "Failed to update status",
                "error"
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* =========================
                HEADER
            ========================= */}

            <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center shadow-lg">
                    <Users2 className="h-6 w-6 text-white" />
                </div>

                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Employee Referrals
                    </h1>
                </div>
            </div>

            {/* =========================
                FILTERS
            ========================= */}

           {/* =========================
    SEARCH + TABLE
========================= */}

<Card className="border shadow-md overflow-hidden">
    {/* SEARCH / FILTER BAR */}
    <div className="bg-slate-50/50 border-b p-4">
        <div className="flex flex-col md:flex-row gap-3 items-center">

            {/* SEARCH */}
            <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />

                <Input
                    placeholder="Search candidate, role or employee..."
                    className={cn(
                        "h-10 w-full rounded-md",
                        "border-slate-200 bg-white pl-10",
                        "shadow-none",
                        "focus-visible:ring-0",
                        "focus-visible:ring-offset-0",
                        "focus-visible:border-slate-200"
                    )}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* STATUS DROPDOWN */}
            <Select
                value={filterStatus}
                onValueChange={setFilterStatus}
            >
                <SelectTrigger
                    className={cn(
                        "h-10 w-full md:w-[180px]",
                        "bg-white border-slate-200",
                        "shadow-none",
                        "focus:ring-0 focus:ring-offset-0"
                    )}
                >
                    <SelectValue placeholder="All Status" />
                </SelectTrigger>

                <SelectContent>
                    <SelectItem
                        value="All"
                        className={selectItemClass}
                    >
                        All Status
                    </SelectItem>

                    <SelectItem
                        value="Under Review"
                        className={selectItemClass}
                    >
                        Review
                    </SelectItem>

                    <SelectItem
                        value="Interview Scheduled"
                        className={selectItemClass}
                    >
                        Interview
                    </SelectItem>

                    <SelectItem
                        value="Shortlisted"
                        className={selectItemClass}
                    >
                        Shortlisted
                    </SelectItem>

                    <SelectItem
                        value="Selected"
                        className={selectItemClass}
                    >
                        Selected
                    </SelectItem>

                    <SelectItem
                        value="Joined"
                        className={selectItemClass}
                    >
                        Joined
                    </SelectItem>

                    <SelectItem
                        value="Rejected"
                        className={selectItemClass}
                    >
                        Rejected
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>
    </div>

    {/* TABLE */}
    <CardContent className="p-0">
        <div className="relative w-full overflow-auto">

            <table className="w-full caption-bottom text-sm text-left">

                {/* HEADER */}
                <thead className="bg-slate-50 border-b">
                    <tr className="text-slate-500 font-medium">

                        <th className="h-12 px-6 align-middle">
                            Candidate
                        </th>

                        <th className="h-12 px-6 align-middle">
                            Experience
                        </th>

                        <th className="h-12 px-6 align-middle">
                            Applied Role
                        </th>

                        <th className="h-12 px-6 align-middle">
                            Referred By
                        </th>

                        <th className="h-12 px-6 align-middle">
                            Status
                        </th>

                        <th className="h-12 px-6 align-middle text-right">
                            Action
                        </th>

                    </tr>
                </thead>

                {/* BODY */}
                <tbody className="divide-y divide-slate-100">

                    {loading ? (
                        <tr>
                            <td
                                colSpan={6}
                                className="h-32 text-center"
                            >
                                <div className="flex items-center justify-center gap-2 text-slate-400">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading data...
                                </div>
                            </td>
                        </tr>
                    ) : referrals.length === 0 ? (
                        <tr>
                            <td
                                colSpan={6}
                                className="h-32 text-center text-slate-400"
                            >
                                No referrals found
                            </td>
                        </tr>
                    ) : (
                        referrals.map((ref) => {
                            const status = getStatusConfig(ref.status);
                            const StatusIcon = status.icon;

                            return (
                                <tr
                                    key={ref._id}
                                    className="hover:bg-slate-50/50 transition-colors"
                                >

                                    {/* CANDIDATE */}
                                    <td className="p-6 align-middle">
                                        <div className="font-medium text-slate-900">
                                            {ref.candidateName}
                                        </div>

                                        <div className="text-xs text-slate-500">
                                            {ref.email}
                                        </div>
                                    </td>

                                    {/* EXPERIENCE */}
                                    <td className="p-6 align-middle">

                                        {ref.experienceType === "Fresher" ? (
                                            <Badge
                                                variant="outline"
                                                className="bg-blue-100 text-blue-700 border-blue-200 font-normal"
                                            >
                                                Fresher
                                            </Badge>
                                        ) : (
                                            <div className="flex flex-col items-start gap-1">
                                                <Badge
                                                    variant="outline"
                                                    className="bg-violet-100 text-violet-700 border-violet-200 font-normal"
                                                >
                                                    Experienced
                                                </Badge>

                                                {ref.totalExperience && (
                                                    <span className="text-xs text-slate-500">
                                                        {ref.totalExperience}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                    </td>

                                    {/* ROLE */}
                                    <td className="p-6 align-middle">
                                        <span className="font-medium text-slate-700">
                                            {ref.role || "N/A"}
                                        </span>
                                    </td>

                                    {/* REFERRED BY */}
                                    <td className="p-6 align-middle">

                                        <div className="flex items-center gap-2">

                                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                {ref.referredByName
                                                    ?.charAt(0)
                                                    ?.toUpperCase() || "?"}
                                            </div>

                                            <div>
                                                <div className="font-medium text-slate-700 whitespace-nowrap">
                                                    {ref.referredByName}
                                                </div>

                                                <div className="text-[10px] text-slate-400 uppercase font-medium">
                                                    {ref.referredByEmpId}
                                                </div>
                                            </div>

                                        </div>

                                    </td>

                                    {/* STATUS */}
                                    <td className="p-6 align-middle">

                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "gap-1 px-2.5 py-1",
                                                "font-normal",
                                                status.color
                                            )}
                                        >
                                            <StatusIcon className="h-3 w-3" />
                                            {status.label}
                                        </Badge>

                                    </td>

                                    {/* ACTION */}
                                    <td className="p-6 align-middle text-right">

                                        <Button
                                            onClick={() => {
                                                setSelectedReferral(ref);
                                                setUpdateStatus(ref.status);
                                                setRemarks(ref.remarks || "");
                                                setIsDetailsOpen(true);
                                            }}
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-primary hover:bg-primary/10"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>

                                    </td>

                                </tr>
                            );
                        })
                    )}

                </tbody>

            </table>

        </div>
    </CardContent>
</Card>


            {/* =========================
                DETAILS MODAL
            ========================= */}

            <Dialog
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
            >
                <DialogContent
                    className={cn(
                        "sm:max-w-4xl",
                        "max-h-[90vh]",
                        "overflow-y-auto",
                        "rounded-2xl",
                        "p-6"
                    )}
                >

                    <DialogHeader className="border-b pb-4">

                        <div className="flex items-center justify-between">

                            <div className="flex items-center gap-4">

                                <div className="h-16 w-16 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-2xl font-bold shadow-xl">
                                    {selectedReferral?.candidateName
                                        ?.charAt(0)
                                        ?.toUpperCase()}
                                </div>

                                <div>

                                    <DialogTitle className="text-2xl font-bold text-slate-900">
                                        {selectedReferral?.candidateName}
                                    </DialogTitle>

                                    <p className="text-slate-500 flex items-center gap-1 mt-1">
                                        Applied for{" "}
                                        <span className="text-blue-600 font-semibold">
                                            {selectedReferral?.role}
                                        </span>
                                    </p>

                                </div>

                            </div>

                            <div className="text-right">

                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Referral Date
                                </p>

                                <p className="text-sm font-bold text-slate-900">
                                    {selectedReferral &&
                                        new Date(
                                            selectedReferral.appliedOn
                                        ).toLocaleDateString()}
                                </p>

                            </div>

                        </div>

                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-6">

                        {/* =========================
                            LEFT SIDE
                        ========================= */}

                        <div className="md:col-span-2 space-y-8">

                            {/* CANDIDATE INFORMATION */}

                            <div>

                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                                    <Users className="h-4 w-4 text-blue-500" />
                                    Candidate Information
                                </h3>

                                <div className="grid grid-cols-2 gap-y-6 gap-x-4">

                                    <InfoItem
                                        label="Email"
                                        value={selectedReferral?.email}
                                        icon={Mail}
                                    />

                                    <InfoItem
                                        label="Phone"
                                        value={selectedReferral?.phone}
                                        icon={Phone}
                                    />

                                    <InfoItem
                                        label="Location"
                                        value={selectedReferral?.location}
                                        icon={MapPin}
                                    />

                                    <InfoItem
                                        label="Role"
                                        value={selectedReferral?.role}
                                        icon={Briefcase}
                                    />

                                    <InfoItem
                                        label="Exp Type"
                                        value={selectedReferral?.experienceType}
                                        icon={ExternalLink}
                                    />

                                    <InfoItem
                                        label="Relationship"
                                        value={selectedReferral?.relationship}
                                        icon={Users2}
                                    />

                                </div>

                            </div>

                            {/* FRESHER */}

                            {selectedReferral?.experienceType ===
                            "Fresher" ? (

                                <div>

                                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                                        <GraduationCap className="h-4 w-4 text-indigo-500" />
                                        Education Details
                                    </h3>

                                    <div className="grid grid-cols-2 gap-y-6">

                                        <InfoItem
                                            label="Qualification"
                                            value={
                                                selectedReferral?.qualification
                                            }
                                        />

                                        <InfoItem
                                            label="College"
                                            value={
                                                selectedReferral?.college
                                            }
                                        />

                                        <InfoItem
                                            label="Passout Year"
                                            value={
                                                selectedReferral?.passoutYear
                                            }
                                        />

                                    </div>

                                </div>

                            ) : (

                                /* EXPERIENCED */

                                <div>

                                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-orange-500" />
                                        Professional Background
                                    </h3>

                                    <div className="grid grid-cols-2 gap-6 mb-6">

                                        <InfoItem
                                            label="Current Company"
                                            value={
                                                selectedReferral?.currentCompany
                                            }
                                        />

                                        <InfoItem
                                            label="Current CTC"
                                            value={
                                                selectedReferral?.currentCTC
                                            }
                                        />

                                        <InfoItem
                                            label="Expected Salary"
                                            value={
                                                selectedReferral?.expectedSalary
                                            }
                                        />

                                        <InfoItem
                                            label="Notice Period"
                                            value={
                                                selectedReferral?.noticePeriod
                                            }
                                        />

                                    </div>

                                    {selectedReferral?.companyHistory
                                        ?.length > 0 && (

                                        <div className="bg-slate-50 p-4 rounded-xl space-y-4">

                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                Employment History
                                            </p>

                                            <div className="space-y-3">

                                                {selectedReferral.companyHistory.map(
                                                    (
                                                        item: any,
                                                        idx: number
                                                    ) => {

                                                        const isItemCurrent =
                                                            item.isCurrent ||
                                                            item.isCurrent ===
                                                                "true";

                                                        return (
                                                            <div
                                                                key={idx}
                                                                className="flex justify-between items-start bg-white p-4 rounded-xl border-l-4 border-l-blue-500 shadow-sm"
                                                            >

                                                                <div>

                                                                    <div className="font-bold text-slate-900 text-sm uppercase tracking-tight">
                                                                        {
                                                                            item.companyName
                                                                        }
                                                                    </div>

                                                                    <div className="text-xs font-semibold text-blue-600 mt-0.5">
                                                                        {
                                                                            item.role
                                                                        }
                                                                    </div>

                                                                    <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase">

                                                                        {item.from
                                                                            ? new Date(
                                                                                  item.from
                                                                              ).toLocaleDateString(
                                                                                  undefined,
                                                                                  {
                                                                                      month: "short",
                                                                                      year: "numeric",
                                                                                  }
                                                                              )
                                                                            : "N/A"}

                                                                        {" - "}

                                                                        {isItemCurrent ||
                                                                        item.to ===
                                                                            "Present"
                                                                            ? "Present"
                                                                            : item.to
                                                                            ? new Date(
                                                                                  item.to
                                                                              ).toLocaleDateString(
                                                                                  undefined,
                                                                                  {
                                                                                      month: "short",
                                                                                      year: "numeric",
                                                                                  }
                                                                              )
                                                                            : "N/A"}

                                                                    </div>

                                                                </div>

                                                                <div className="text-right">

                                                                    {isItemCurrent &&
                                                                        item.noticePeriod && (
                                                                            <Badge className="bg-amber-50 text-amber-700 border border-amber-100 text-[9px] mb-1">
                                                                                Notice:{" "}
                                                                                {
                                                                                    selectedReferral?.noticePeriod
                                                                                }
                                                                            </Badge>
                                                                        )}

                                                                    <div className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                                                        {calculateDuration(
                                                                            item.from,
                                                                            isItemCurrent ||
                                                                                item.to ===
                                                                                    "Present"
                                                                                ? "Present"
                                                                                : item.to
                                                                        ) ||
                                                                            item.duration ||
                                                                            "Experience"}
                                                                    </div>

                                                                </div>

                                                            </div>
                                                        );
                                                    }
                                                )}

                                            </div>

                                        </div>
                                    )}

                                </div>
                            )}

                            {/* SKILLS */}

                            <div>

                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                                    <Star className="h-4 w-4 text-yellow-500" />
                                    Skills & Recommendations
                                </h3>

                                <div className="space-y-4">

                                    <div className="flex flex-wrap gap-2">

                                        {selectedReferral?.skills?.map(
                                            (skill: string) => (
                                                <Badge
                                                    key={skill}
                                                    className="bg-blue-50 text-blue-700 border border-blue-100"
                                                >
                                                    {skill}
                                                </Badge>
                                            )
                                        )}

                                    </div>

                                    <div className="bg-yellow-50/50 p-4 border border-yellow-100 rounded-xl">

                                        <p className="text-[10px] font-bold text-yellow-700 uppercase tracking-widest flex items-center gap-1 mb-2">
                                            <MessageSquare className="h-3 w-3" />
                                            Referral Note
                                        </p>

                                        <p className="text-slate-700 italic text-sm">
                                            "
                                            {selectedReferral?.whyReferring ||
                                                "No comments provided."}
                                            "
                                        </p>

                                    </div>

                                </div>

                            </div>

                        </div>

                        {/* =========================
                            RIGHT SIDE
                        ========================= */}

                        <div className="space-y-8">

                            {/* REFERRED BY */}

                            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl">

                                <div className="space-y-4">

                                    <div className="flex items-center gap-3">

                                        <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-400">
                                            <Link2 className="h-5 w-5" />
                                        </div>

                                        <div>

                                            <p className="text-slate-400 text-xs">
                                                Referred By
                                            </p>

                                            <p className="font-bold">
                                                {
                                                    selectedReferral?.referredByName
                                                }
                                            </p>

                                        </div>

                                    </div>

                                    <div className="pt-4 border-t border-slate-800">

                                        <p className="text-slate-400 text-[10px] uppercase">
                                            Employee ID
                                        </p>

                                        <p className="text-sm font-bold uppercase">
                                            {
                                                selectedReferral?.referredByEmpId
                                            }
                                        </p>

                                    </div>

                                </div>

                            </div>

                            {/* RESUME */}

                            <div className="pt-6 border-t">

                                <Button
                                    onClick={() =>
                                        selectedReferral?.resumeUrl &&
                                        window.open(
                                            selectedReferral.resumeUrl,
                                            "_blank"
                                        )
                                    }
                                    disabled={
                                        !selectedReferral?.resumeUrl
                                    }
                                    variant="outline"
                                    className="w-full border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all font-bold"
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    View Full Resume
                                </Button>

                            </div>

                            {/* UPDATE STATUS */}

                            <div className="space-y-6 p-1">

                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-blue-500" />
                                    Update Status
                                </h3>

                                <div className="space-y-4">

                                    {/* MODAL DROPDOWN */}

                                    <div className="space-y-2">

                                        <Label className="text-xs font-semibold text-slate-500">
                                            Current Status
                                        </Label>

                                        <Select
                                            value={updateStatus}
                                            onValueChange={
                                                setUpdateStatus
                                            }
                                        >

                                            <SelectTrigger
                                                className={cn(
                                                    "w-full",
                                                    "focus:ring-0",
                                                    "focus:ring-offset-0"
                                                )}
                                            >
                                                <SelectValue />
                                            </SelectTrigger>

                                            <SelectContent>

                                                <SelectItem
                                                    value="Under Review"
                                                    className={selectItemClass}
                                                >
                                                    Review
                                                </SelectItem>

                                                <SelectItem
                                                    value="Interview Scheduled"
                                                    className={selectItemClass}
                                                >
                                                    Interview
                                                </SelectItem>

                                                <SelectItem
                                                    value="Shortlisted"
                                                    className={selectItemClass}
                                                >
                                                    Shortlisted
                                                </SelectItem>

                                                <SelectItem
                                                    value="Selected"
                                                    className={selectItemClass}
                                                >
                                                    Selected
                                                </SelectItem>

                                                <SelectItem
                                                    value="Joined"
                                                    className={selectItemClass}
                                                >
                                                    Joined
                                                </SelectItem>

                                                <SelectItem
                                                    value="Rejected"
                                                    className={selectItemClass}
                                                >
                                                    Rejected
                                                </SelectItem>

                                            </SelectContent>

                                        </Select>

                                    </div>

                                    {/* REMARKS */}

                                    <div className="space-y-2">

                                        <Label className="text-xs font-semibold text-slate-500">
                                            Admin Remarks
                                        </Label>

                                        <Textarea
                                            placeholder="Add recruitment notes or feedback..."
                                            className="min-h-[120px]"
                                            value={remarks}
                                            onChange={(e) =>
                                                setRemarks(
                                                    e.target.value
                                                )
                                            }
                                        />

                                    </div>

                                    {/* SAVE */}

                                    <Button
                                        onClick={
                                            handleUpdateStatus
                                        }
                                        disabled={isSaving}
                                        className="w-full bg-primary hover:bg-primary/90 text-white h-11 shadow-lg"
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                Save Update
                                            </>
                                        )}
                                    </Button>

                                </div>

                            </div>

                        </div>

                    </div>

                </DialogContent>
            </Dialog>
        </div>
    );
}

/* =========================
   INFO ITEM
========================= */

function InfoItem({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value?: any;
    icon?: any;
}) {
    return (
        <div className="flex items-start gap-3">

            {Icon && (
                <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-slate-500" />
                </div>
            )}

            <div>

                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                    {label}
                </p>

                <p className="text-sm font-semibold text-slate-900">
                    {value || "N/A"}
                </p>

            </div>

        </div>
    );
}
