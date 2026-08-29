import { useState, useEffect } from "react";
import { apiFetch } from "@/config/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Users, Search, Mail, Phone, MapPin,
    Briefcase, GraduationCap, Building2, Download,
    Eye, CheckCircle2, Clock, XCircle,
    Star, ExternalLink, Calendar, Users2
} from "lucide-react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/context/ToastContext";

const STATUS_CONFIG = {
    "Under Review": { color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
    "Interview Scheduled": { color: "bg-blue-100 text-blue-700 border-blue-200", icon: Calendar },
    "Shortlisted": { color: "bg-cyan-100 text-cyan-700 border-cyan-200", icon: Star },
    "Selected": { color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
    "Rejected": { color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
    "Joined": { color: "bg-purple-100 text-purple-700 border-purple-200", icon: Building2 },
};

export default function AdminReferrals() {
    const { addToast } = useToast();

    const calculateDuration = (from: string, to: string) => {
        if (!from) return "";
        const startDate = new Date(from);
        const endDate = (to === 'Present' || !to) ? new Date() : new Date(to);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return "";

        let years = endDate.getFullYear() - startDate.getFullYear();
        let months = endDate.getMonth() - startDate.getMonth();

        if (months < 0) {
            years--;
            months += 12;
        }

        const yearsPart = years > 0 ? `${years} Year${years > 1 ? 's' : ''}` : "";
        const monthsPart = months > 0 ? `${months} Month${months > 1 ? 's' : ''}` : "";

        if (!yearsPart && !monthsPart) return "Less than 1 month";
        return [yearsPart, monthsPart].filter(Boolean).join(" ");
    };
    const [referrals, setReferrals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");

    const [selectedReferral, setSelectedReferral] = useState<any>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [updateStatus, setUpdateStatus] = useState("");
    const [remarks, setRemarks] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const referralsRes = await apiFetch(`/api/referrals?status=${filterStatus}&search=${searchTerm}`);
            if (referralsRes.ok) setReferrals(await referralsRes.json());
        } catch (error) {
            console.error("Fetch data error", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filterStatus]);

    const handleSearch = () => fetchData();

    const handleUpdateStatus = async () => {
        if (!updateStatus) return;
        setIsSaving(true);
        try {
            const res = await apiFetch(`/api/referrals/${selectedReferral._id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: updateStatus, remarks })
            });

            if (res.ok) {
                addToast("Status updated successfully", "success");
                setIsDetailsOpen(false);
                fetchData();
            }
        } catch (error) {
            addToast("Failed to update status", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* HEADER */}
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center shadow-lg">
                    <Users2 className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Employee Referrals</h1>
                    <p className="text-muted-foreground">Manage and track candidate referrals from employees.</p>
                </div>
            </div>

            {/* STATS CARDS */}
            {/* <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <MiniStatCard title="Total" value={stats?.total || 0} icon={Users} color="slate" />
                <MiniStatCard title="Under Review" value={stats?.underReview || 0} icon={Clock} color="yellow" />
                <MiniStatCard title="Interview" value={stats?.interview || 0} icon={Calendar} color="blue" />
                <MiniStatCard title="Selected" value={stats?.selected || 0} icon={UserCheck} color="green" />
                <MiniStatCard title="Joined" value={stats?.joined || 0} icon={Building2} color="purple" />
                <MiniStatCard title="Rejected" value={stats?.rejected || 0} icon={UserMinus} color="red" />
            </div> */}

            {/* FILTERS */}
            <Card className="border-none shadow-sm bg-slate-50/50">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search candidate, role or employee..."
                                className="pl-10 bg-white"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-full md:w-[180px] bg-white">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Status</SelectItem>
                                <SelectItem value="Under Review">Under Review</SelectItem>
                                <SelectItem value="Interview Scheduled">Interview</SelectItem>
                                <SelectItem value="Shortlisted">Shortlisted</SelectItem>
                                <SelectItem value="Selected">Selected</SelectItem>
                                <SelectItem value="Joined">Joined</SelectItem>
                                <SelectItem value="Rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
                            Apply Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* MAIN TABLE */}
            <Card className="border-none shadow-md overflow-hidden">
                <CardContent className="p-0">
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="bg-slate-50 border-b">
                                <tr className="text-slate-500 font-medium">
                                    <th className="h-12 px-6 align-middle">Candidate</th>
                                    <th className="h-12 px-6 align-middle">Experience</th>
                                    <th className="h-12 px-6 align-middle">Applied Role</th>
                                    <th className="h-12 px-6 align-middle">Referred By</th>
                                    {/* <th className="h-12 px-6 align-middle">Resume</th> */}
                                    <th className="h-12 px-6 align-middle">Status</th>
                                    <th className="h-12 px-6 align-middle text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan={6} className="h-32 text-center text-slate-400">Loading data...</td></tr>
                                ) : referrals.length === 0 ? (
                                    <tr><td colSpan={6} className="h-32 text-center text-slate-400">No referrals found</td></tr>
                                ) : (
                                    referrals.map((ref) => {
                                        const status = STATUS_CONFIG[ref.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG["Under Review"];
                                        const StatusIcon = status.icon;
                                        return (
                                            <tr key={ref._id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-6 align-middle">
                                                    <div className="font-medium text-slate-900">{ref.candidateName}</div>
                                                    <div className="text-xs text-slate-500">{ref.email}</div>
                                                </td>
                                                <td className="p-6 align-middle">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-slate-700">{ref.experienceType === 'Fresher' ? 'Fresher' : ref.totalExperience}</span>
                                                        {ref.experienceType !== 'Fresher' && (
                                                            <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase w-fit mt-1">Experienced</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-6 align-middle">
                                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-medium whitespace-nowrap">
                                                        {ref.role}
                                                    </Badge>
                                                </td>
                                                <td className="p-6 align-middle">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                            {ref.referredByName.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-slate-700 whitespace-nowrap">{ref.referredByName}</div>
                                                            <div className="text-[10px] text-slate-400 uppercase font-medium">{ref.referredByEmpId}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* <td className="p-6 align-middle">
                                                    {ref.resumeUrl ? (
                                                        <Button
                                                            variant="outline" size="sm" className="h-8 text-[10px] uppercase font-bold tracking-wider text-blue-600 border-blue-200 hover:bg-blue-50"
                                                            onClick={() => window.open(ref.resumeUrl, '_blank')}
                                                        >
                                                            <Download className="h-3 w-3 mr-1" /> Resume
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic">No Resume</span>
                                                    )}
                                                </td> */}
                                                <td className="p-6 align-middle">
                                                    <Badge variant="outline" className={`px-2.5 py-1 font-medium border gap-1 ${status.color}`}>
                                                        <StatusIcon className="h-3 w-3" />
                                                        {ref.status}
                                                    </Badge>
                                                </td>
                                                <td className="p-6 align-middle text-right">
                                                    <Button
                                                        onClick={() => {
                                                            setSelectedReferral(ref);
                                                            setUpdateStatus(ref.status);
                                                            setRemarks(ref.remarks || "");
                                                            setIsDetailsOpen(true);
                                                        }}
                                                        variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50"
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

            {/* DETAILS POPUP */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="border-b pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-2xl font-bold shadow-xl">
                                    {selectedReferral?.candidateName.charAt(0)}
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-bold text-slate-900">
                                        {selectedReferral?.candidateName}
                                    </DialogTitle>
                                    <p className="text-slate-500 flex items-center gap-1 mt-1">
                                        Applied for <span className="text-blue-600 font-semibold">{selectedReferral?.role}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Referral Date</p>
                                <p className="text-sm font-bold text-slate-900">
                                    {selectedReferral && new Date(selectedReferral.appliedOn).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-6">
                        {/* LEFT: Candidate Info */}
                        <div className="md:col-span-2 space-y-8">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                                    <Users className="h-4 w-4 text-blue-500" /> Candidate Information
                                </h3>
                                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                                    <InfoItem label="Email" value={selectedReferral?.email} icon={Mail} />
                                    <InfoItem label="Phone" value={selectedReferral?.phone} icon={Phone} />
                                    <InfoItem label="Location" value={selectedReferral?.location} icon={MapPin} />
                                    <InfoItem label="Role" value={selectedReferral?.role} icon={Briefcase} />
                                    <InfoItem label="Exp Type" value={selectedReferral?.experienceType} icon={ExternalLink} />
                                    <InfoItem label="Relationship" value={selectedReferral?.relationship} icon={Users2} />
                                </div>
                            </div>

                            {selectedReferral?.experienceType === 'Fresher' ? (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                                        <GraduationCap className="h-4 w-4 text-indigo-500" /> Education Details
                                    </h3>
                                    <div className="grid grid-cols-2 gap-y-6">
                                        <InfoItem label="Qualification" value={selectedReferral?.qualification} />
                                        <InfoItem label="College" value={selectedReferral?.college} />
                                        <InfoItem label="Passout Year" value={selectedReferral?.passoutYear} />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-orange-500" /> Professional Background
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-2 gap-6 mb-6">
                                        {/* <InfoItem label="Total Experience" value={selectedReferral?.totalExperience} /> */}
                                        <InfoItem label="Current Company" value={selectedReferral?.currentCompany} />
                                        <InfoItem label="Current CTC" value={selectedReferral?.currentCTC} />
                                        <InfoItem label="Expected Salary" value={selectedReferral?.expectedSalary} />
                                        <InfoItem label="Notice Period" value={selectedReferral?.noticePeriod} />
                                    </div>

                                    {selectedReferral?.companyHistory?.length > 0 && (
                                        <div className="bg-slate-50 p-4 rounded-xl space-y-4">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employment History</p>
                                            <div className="space-y-3">
                                                {selectedReferral.companyHistory.map((item: any, idx: number) => {
                                                    const isItemCurrent = item.isCurrent || item.isCurrent === "true";
                                                    return (
                                                        <div key={idx} className="flex justify-between items-start bg-white p-4 rounded-xl border-l-4 border-l-blue-500 shadow-sm">
                                                            <div>
                                                                <div className="font-bold text-slate-900 text-sm uppercase tracking-tight">{item.companyName}</div>
                                                                <div className="text-xs font-semibold text-blue-600 mt-0.5">{item.role}</div>
                                                                <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase">
                                                                    {item.from ? new Date(item.from).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'N/A'} - {isItemCurrent || item.to === 'Present' ? 'Present' : (item.to ? (item.to === 'Invalid Date' ? 'N/A' : new Date(item.to).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })) : 'N/A')}
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                {isItemCurrent && item.noticePeriod && (
                                                                    <Badge className="bg-amber-50 text-amber-700 border-amber-100 text-[9px] mb-1">Notice: {selectedReferral?.noticePeriod}</Badge>
                                                                )}
                                                                <div className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                                                    {calculateDuration(item.from, (isItemCurrent || item.to === 'Present') ? 'Present' : item.to) || item.duration || "Experience"}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                                    <Star className="h-4 w-4 text-yellow-500" /> Skills & Recommendations
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        {selectedReferral?.skills?.map((skill: string) => (
                                            <Badge key={skill} className="bg-blue-50 text-blue-700 border-blue-100">
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="bg-yellow-50/50 p-4 border border-yellow-100 rounded-xl">
                                        <p className="text-[10px] font-bold text-yellow-700 uppercase tracking-widest flex items-center gap-1 mb-2">
                                            <MessageSquare className="h-3 w-3" /> Referral Note
                                        </p>
                                        <p className="text-slate-700 italic text-sm italic">"{selectedReferral?.whyReferring || "No comments provided."}"</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Admin Actions */}
                        <div className="space-y-8">
                            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-400">
                                            <Link2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-xs">Referred By</p>
                                            <p className="font-bold">{selectedReferral?.referredByName}</p>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-slate-800 flex justify-between">
                                        <div>
                                            <p className="text-slate-400 text-[10px] uppercase">Employee ID</p>
                                            <p className="text-sm font-bold uppercase">{selectedReferral?.referredByEmpId}</p>
                                        </div>
                                        {/* <Button
                                            onClick={() => navigate(`/admin-employees?search=${selectedReferral?.referredByEmpId}`)}
                                            variant="ghost" size="sm" className="h-8 text-blue-400 hover:text-blue-300 hover:bg-slate-800"
                                        >
                                            View Profile
                                        </Button> */}
                                    </div>
                                </div>
                            </div>
                            <div className="pt-6 border-t">
                                <Button
                                    onClick={() => selectedReferral?.resumeUrl && window.open(selectedReferral.resumeUrl, '_blank')}
                                    disabled={!selectedReferral?.resumeUrl}
                                    variant="outline"
                                    className="w-full border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all font-bold"
                                >
                                    <Download className="mr-2 h-4 w-4" /> View Full Resume
                                </Button>
                            </div>

                            <div className="space-y-6 p-1">
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-blue-500" /> Update Status
                                </h3>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-slate-500">Current Status</Label>
                                        <Select value={updateStatus} onValueChange={setUpdateStatus}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Under Review">Under Review</SelectItem>
                                                <SelectItem value="Interview Scheduled">Interview Scheduled</SelectItem>
                                                <SelectItem value="Shortlisted">Shortlisted</SelectItem>
                                                <SelectItem value="Selected">Selected</SelectItem>
                                                <SelectItem value="Joined">Joined</SelectItem>
                                                <SelectItem value="Rejected">Rejected</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-slate-500">Admin Remarks</Label>
                                        <Textarea
                                            placeholder="Add recruitment notes or feedback..."
                                            className="min-h-[120px]"
                                            value={remarks}
                                            onChange={e => setRemarks(e.target.value)}
                                        />
                                    </div>

                                    <Button
                                        onClick={handleUpdateStatus}
                                        disabled={isSaving}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 shadow-lg shadow-blue-100"
                                    >
                                        {isSaving ? "Updating..." : (
                                            <>
                                                <CheckCircle2 className="mr-2 h-4 w-4" /> Save Update
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


function InfoItem({ label, value, icon: Icon }: any) {
    return (
        <div className="flex items-start gap-3">
            {Icon && (
                <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-slate-500" />
                </div>
            )}
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-slate-900">{value || "N/A"}</p>
            </div>
        </div>
    );
}

// Dummy links since I missed one icon
function Link2(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M9 17H7A5 5 0 0 1 7 7h2" />
            <path d="M15 7h2a5 5 0 0 1 0 10h-2" />
            <line x1="8" x2="16" y1="12" y2="12" />
        </svg>
    )
}

function MessageSquare(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    )
}
