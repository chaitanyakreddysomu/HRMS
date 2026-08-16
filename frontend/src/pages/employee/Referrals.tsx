import { useState, useEffect } from "react";
import { apiFetch } from "@/config/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Users, Plus, Briefcase, Building2, Upload,
    Trash2, ChevronRight, CheckCircle2, Clock, XCircle,
    Star, MapPin, Mail, Phone, Timer, Quote, FileText, GraduationCap
} from "lucide-react";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const STATUS_CONFIG = {
    "Under Review": { color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
    "Interview Scheduled": { color: "bg-blue-100 text-blue-700 border-blue-200", icon: Calendar },
    "Shortlisted": { color: "bg-teal-100 text-teal-700 border-teal-200", icon: Star },
    "Selected": { color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
    "Rejected": { color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
    "Joined": { color: "bg-purple-100 text-purple-700 border-purple-200", icon: Building2 },
};

export default function ReferralsSection() {
    const [referrals, setReferrals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState<any>({
        candidateName: "",
        email: "",
        phone: "",
        location: "",
        role: "",
        expectedSalary: "",
        noticePeriod: "",
        experienceType: "Fresher",
        qualification: "",
        college: "",
        passoutYear: "",
        totalExperience: "",
        currentCompany: "",
        currentCTC: "",
        skills: [],
        resumeUrl: "",
        relationship: "Friend",
        whyReferring: "",
        companyHistory: []
    });

    const [skillInput, setSkillInput] = useState("");
    const [uploading, setUploading] = useState(false);
    const [localFile, setLocalFile] = useState<File | null>(null);
    const [selectedReferral, setSelectedReferral] = useState<any | null>(null);

    const fetchMyReferrals = async () => {
        try {
            const res = await apiFetch('/api/referrals/my');
            if (res.ok) {
                const data = await res.json();
                setReferrals(data);
            }
        } catch (error) {
            console.error("Fetch referrals error", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLocalFile(file);
        }
    };

    useEffect(() => {
        fetchMyReferrals();
    }, []);

    const addCompany = () => {
        setFormData({
            ...formData,
            companyHistory: [...formData.companyHistory, {
                companyName: "",
                role: "",
                from: "", // This will be used for Joined Date
                to: "",   // This will be used for Relieving Date
                isCurrent: false,
                noticePeriod: "",
                currentCTC: "",
                expectedCTC: ""
            }]
        });
    };

    const removeCompany = (index: number) => {
        const newHistory = [...formData.companyHistory];
        newHistory.splice(index, 1);
        setFormData({ ...formData, companyHistory: newHistory });
    };

    const updateCompany = (index: number, field: string, value: any) => {
        const newHistory = [...formData.companyHistory];

        // Single Current Company Logic
        if (field === 'isCurrent' && value === true) {
            newHistory.forEach((item, i) => {
                if (i !== index) item.isCurrent = false;
            });
        }

        newHistory[index] = { ...newHistory[index], [field]: value };

        // Auto calculate duration if from and to are provided
        if (field === 'from' || field === 'to') {
            // Simplified duration calculation
            newHistory[index].duration = "Auto-calculated";
        }

        setFormData({ ...formData, companyHistory: newHistory });
    };

    const addSkill = () => {
        if (skillInput && !formData.skills.includes(skillInput)) {
            setFormData({ ...formData, skills: [...formData.skills, skillInput] });
            setSkillInput("");
        }
    };

    const removeSkill = (skill: string) => {
        setFormData({ ...formData, skills: formData.skills.filter((s: string) => s !== skill) });
    };

    const handleSubmit = async () => {
        try {
            setUploading(true);
            let finalResumeUrl = formData.resumeUrl;

            // 1. Upload file if it exists localy
            if (localFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('document', localFile);

                const uploadRes = await apiFetch('/api/referrals/upload', {
                    method: 'POST',
                    body: uploadFormData
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    finalResumeUrl = uploadData.resumeUrl;
                } else {
                    alert("Resume upload failed. Please try again.");
                    setUploading(false);
                    return;
                }
            } else if (!formData.resumeUrl) {
                alert("Please select a resume to upload.");
                setUploading(false);
                return;
            }

            // 2. Map current company details to top-level fields for backend compatibility
            const currentJob = formData.companyHistory.find((c: any) => c.isCurrent);
            const referralData = {
                ...formData,
                resumeUrl: finalResumeUrl,
                currentCompany: currentJob?.companyName || "",
                currentCTC: currentJob?.currentCTC || "",
                expectedSalary: currentJob?.expectedCTC || "", // mapping expectedCTC from form to expectedSalary in schema
                noticePeriod: currentJob?.noticePeriod || "",
                companyHistory: formData.companyHistory.map((item: any) => ({
                    ...item,
                    to: item.isCurrent ? "Present" : item.to
                }))
            };

            // 3. Submit Referral Data
            const res = await apiFetch('/api/referrals', {
                method: 'POST',
                body: JSON.stringify(referralData)
            });

            if (res.ok) {
                setIsFormOpen(false);
                fetchMyReferrals();
                setLocalFile(null);
                setFormData({
                    candidateName: "", email: "", phone: "", location: "", role: "",
                    expectedSalary: "", noticePeriod: "", experienceType: "Fresher",
                    qualification: "", college: "", passoutYear: "", totalExperience: "",
                    currentCompany: "", currentCTC: "", skills: [], resumeUrl: "",
                    relationship: "Friend", whyReferring: "", companyHistory: []
                });
            } else {
                alert("Failed to submit referral details.");
            }
        } catch (error) {
            console.error("Submit referral error", error);
            alert("An error occurred during submission.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Users className="h-8 w-8 text-blue-600" />
                        Refer an Employee
                    </h2>
                    <p className="text-slate-500 mt-1">Grow the team by referring talented people to our network.</p>
                </div>
                <Button
                    onClick={() => setIsFormOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 h-11 px-6 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Plus className="mr-2 h-5 w-5" /> Refer New Employee
                </Button>
            </div>
            {/* ...(Rest of the component content)... */}

            {loading ? (
                <div className="py-10 text-center text-slate-400">Loading referrals...</div>
            ) : referrals.length === 0 ? (
                <Card className="border-dashed border-2 bg-slate-50/50 py-12 text-center">
                    <CardContent className="flex flex-col items-center gap-4">
                        <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <Users className="h-8 w-8 text-slate-300" />
                        </div>
                        <div className="max-w-xs mx-auto">
                            <h3 className="text-lg font-semibold text-slate-900">No Referrals Yet</h3>
                            <p className="text-slate-500 mt-1 text-sm">
                                You have not referred any employee yet. Start referring talented people and help grow the team.
                            </p>
                        </div>
                        <Button variant="outline" onClick={() => setIsFormOpen(true)} className="mt-2">
                            + New Referral
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {referrals.map((ref) => {
                        const status = STATUS_CONFIG[ref.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG["Under Review"];
                        const StatusIcon = status.icon;
                        return (
                            <Card key={ref._id} className="group relative overflow-hidden border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 bg-white/80 backdrop-blur-sm hover:border-blue-200">
                                <div className={cn("absolute left-0 top-0 bottom-0 w-1 transition-all duration-300",
                                    ref.status === 'Selected' || ref.status === 'Joined' ? "bg-green-500" :
                                        ref.status === 'Rejected' ? "bg-red-500" : "bg-blue-500"
                                )} />
                                <CardContent className="p-0">
                                    <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-5">
                                            <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xl shadow-inner border border-white">
                                                {ref.candidateName.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors uppercase tracking-tight">{ref.candidateName}</h4>
                                                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1.5 font-medium">
                                                    <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md"><Briefcase className="h-3.5 w-3.5 text-blue-500" /> {ref.role}</span>
                                                    <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md"><Clock className="h-3.5 w-3.5 text-indigo-500" /> {new Date(ref.appliedOn).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                    <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md"><MapPin className="h-3.5 w-3.5 text-red-400" /> {ref.location || 'Remote'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 md:gap-8 ml-auto md:ml-0">
                                            <div className="hidden lg:block text-right">
                                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Experience</p>
                                                <div className="flex flex-col items-end">
                                                    <p className="text-sm font-semibold text-slate-700">{ref.experienceType === 'Fresher' ? 'Fresher' : ref.totalExperience}</p>
                                                    {ref.experienceType !== 'Fresher' && (
                                                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase mt-0.5">Experienced</span>
                                                    )}
                                                </div>
                                            </div>
                                            <Badge variant="outline" className={cn("px-4 py-1.5 font-bold rounded-lg border-2 gap-2 shadow-sm uppercase text-[10px] tracking-widest", status.color)}>
                                                <StatusIcon className="h-3.5 w-3.5" />
                                                {ref.status}
                                            </Badge>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedReferral(ref)}
                                                className="h-10 px-4 rounded-xl text-blue-600 border-blue-100 hover:bg-blue-50 hover:border-blue-200 shadow-sm font-bold"
                                            >
                                                Details <ChevronRight className="ml-1 h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* REFERRAL FORM DIALOG */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <Users className="h-6 w-6 text-blue-600" />
                            Refer New Employee
                        </DialogTitle>
                        <DialogDescription>
                            Submit details of a potential candidate for internal hiring.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-8 py-4">
                        {/* Basic Details */}
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-semibold">Full Name *</Label>
                                <Input placeholder="Candidate Name" value={formData.candidateName} onChange={e => setFormData({ ...formData, candidateName: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-semibold">Email *</Label>
                                <Input type="email" placeholder="email@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-semibold">Mobile Number *</Label>
                                <Input placeholder="10 Digit Mobile" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-semibold">Location</Label>
                                <Input placeholder="e.g. Hyderabad" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-semibold">Applied Role *</Label>
                                <Input placeholder="e.g. React Developer" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-semibold">Experience Type</Label>
                                <Select value={formData.experienceType} onValueChange={v => setFormData({ ...formData, experienceType: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Fresher">Fresher</SelectItem>
                                        <SelectItem value="Experienced">Experienced</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Conditional Section */}
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-6">
                            {formData.experienceType === "Fresher" ? (
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 font-semibold">Highest Qualification</Label>
                                        <Input placeholder="e.g. B.Tech CSE" value={formData.qualification} onChange={e => setFormData({ ...formData, qualification: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 font-semibold">College Name</Label>
                                        <Input placeholder="University Unit" value={formData.college} onChange={e => setFormData({ ...formData, college: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 font-semibold">Passout Year</Label>
                                        <Input placeholder="2024" value={formData.passoutYear} onChange={e => setFormData({ ...formData, passoutYear: e.target.value })} />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-slate-700 font-bold flex items-center gap-2">
                                                <Building2 className="h-4 w-4" /> Professional Background
                                            </Label>
                                            <Button type="button" variant="outline" size="sm" onClick={addCompany} className="text-blue-600 border-blue-200">
                                                + Add Company
                                            </Button>
                                        </div>

                                        {formData.companyHistory.map((item: any, idx: number) => (
                                            <div key={idx} className="p-5 bg-white rounded-2xl border relative shadow-sm space-y-5 animate-in slide-in-from-right-2 duration-300">
                                                <button onClick={() => removeCompany(idx)} className="absolute top-5 right-5 text-slate-400 hover:text-red-500 transition-colors">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>

                                                <div className="flex items-center gap-2 mb-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`isCurrent-${idx}`}
                                                        checked={item.isCurrent}
                                                        onChange={e => updateCompany(idx, 'isCurrent', e.target.checked)}
                                                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <Label htmlFor={`isCurrent-${idx}`} className="text-sm font-semibold text-slate-700 cursor-pointer">Is this your current company?</Label>
                                                </div>

                                                <div className="grid gap-4 md:grid-cols-2">
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Company Name</Label>
                                                        <Input placeholder="e.g. Google" value={item.companyName} onChange={e => updateCompany(idx, 'companyName', e.target.value)} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Role / Designation</Label>
                                                        <Input placeholder="e.g. Senior Developer" value={item.role} onChange={e => updateCompany(idx, 'role', e.target.value)} />
                                                    </div>

                                                    {item.isCurrent ? (
                                                        <>
                                                            <div className="space-y-1">
                                                                <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider text-blue-600">Joined Date</Label>
                                                                <Input type="month" value={item.from} onChange={e => updateCompany(idx, 'from', e.target.value)} />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">Notice Period</Label>
                                                                <Input placeholder="e.g. 3 Months" value={item.noticePeriod || ""} onChange={e => updateCompany(idx, 'noticePeriod', e.target.value)} />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-[10px] uppercase font-bold text-green-600 tracking-wider">Current CTC</Label>
                                                                <Input placeholder="e.g. 12LPA" value={item.currentCTC || ""} onChange={e => updateCompany(idx, 'currentCTC', e.target.value)} />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-[10px] uppercase font-bold text-orange-600 tracking-wider">Expected CTC</Label>
                                                                <Input placeholder="e.g. 12LPA" value={item.expectedCTC || ""} onChange={e => updateCompany(idx, 'expectedCTC', e.target.value)} />
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="col-span-2 grid grid-cols-2 gap-6">
                                                            <div className="space-y-1">
                                                                <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Joined</Label>
                                                                <Input type="month" value={item.from} onChange={e => updateCompany(idx, 'from', e.target.value)} />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Relieving</Label>
                                                                <Input type="month" value={item.to} onChange={e => updateCompany(idx, 'to', e.target.value)} />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {formData.companyHistory.length === 0 && (
                                            <div className="text-center py-8 border-2 border-dashed rounded-2xl bg-slate-50/50">
                                                <p className="text-sm text-slate-500 italic">No company details added. Click "+ Add Company" to begin.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Common Extra Fields */}
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-semibold">Skills (Type & Enter)</Label>
                                <div className="flex gap-2">
                                    <Input placeholder="e.g. React" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSkill()} />
                                    <Button type="button" onClick={addSkill} size="icon" variant="secondary"><Plus className="h-4 w-4" /></Button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.skills.map((s: string) => (
                                        <Badge key={s} className="bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200" onClick={() => removeSkill(s)}>
                                            {s} <Trash2 className="ml-1 h-3 w-3 cursor-pointer" />
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-semibold">Relationship</Label>
                                <Select value={formData.relationship} onValueChange={v => setFormData({ ...formData, relationship: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Friend">Friend</SelectItem>
                                        <SelectItem value="Colleague">Colleague</SelectItem>
                                        <SelectItem value="Relative">Relative</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label className="text-slate-700 font-semibold">Why are you referring?</Label>
                                <Textarea placeholder="Explain briefly..." value={formData.whyReferring} onChange={e => setFormData({ ...formData, whyReferring: e.target.value })} />
                            </div>
                        </div>

                        {/* Resume Section */}
                        <div className="space-y-4">
                            <Label className="text-slate-700 font-bold block">Resume Upload (PDF/DOCX)</Label>

                            <input
                                type="file"
                                id="resume-upload"
                                className="hidden"
                                accept=".pdf,.docx"
                                onChange={handleFileSelection}
                            />

                            <label
                                htmlFor="resume-upload"
                                className={`
                                    border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer block
                                    ${localFile
                                        ? "bg-green-50 border-green-200"
                                        : "bg-slate-50 border-slate-200 group hover:border-blue-400"
                                    }
                                `}
                            >
                                {uploading ? (
                                    <div className="space-y-2">
                                        <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                        <p className="text-sm font-medium text-slate-600">Uploading...</p>
                                    </div>
                                ) : localFile ? (
                                    <div className="space-y-2">
                                        <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
                                        <p className="text-sm font-bold text-green-700">File Selected Successfully!</p>
                                        <p className="text-xs text-green-600">{localFile.name}</p>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="h-10 w-10 text-slate-300 mx-auto group-hover:text-blue-500 transition-colors mb-2" />
                                        <p className="text-sm font-medium text-slate-600">Click to Select Resume</p>
                                        <p className="text-xs text-slate-400 mt-1">Accept PDF, DOCX (Max 5MB)</p>
                                    </>
                                )}
                            </label>
                        </div>
                    </div>

                    <DialogFooter className="bg-slate-50 p-6 rounded-b-lg border-t gap-3">
                        <Button variant="outline" onClick={() => { setIsFormOpen(false); setLocalFile(null); }}>Cancel</Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={uploading || !formData.candidateName || !formData.email || (!localFile && !formData.resumeUrl)}
                            className="bg-blue-600 hover:bg-blue-700 px-8"
                        >
                            {uploading ? "Submitting..." : "Submit Referral"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* REFERRAL DETAILS DIALOG */}
            <Dialog open={!!selectedReferral} onOpenChange={() => setSelectedReferral(null)}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
                    {selectedReferral && (
                        <>
                            <DialogHeader className="p-8 bg-slate-900 text-white rounded-t-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <Users className="h-32 w-32" />
                                </div>
                                <div className="relative z-10 flex items-center gap-6">
                                    <div className="h-20 w-20 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl font-bold border border-white/20">
                                        {selectedReferral.candidateName.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <DialogTitle className="text-3xl font-extrabold uppercase tracking-tight">{selectedReferral.candidateName}</DialogTitle>
                                            <div className="flex gap-2">
                                                {selectedReferral.experienceType !== 'Fresher' && (
                                                    <Badge className="bg-blue-600 text-white border-none text-[9px] font-black tracking-widest px-2 py-0.5 shadow-sm">EXPERIENCED</Badge>
                                                )}
                                                <Badge className={cn("px-3 py-0.5 rounded-full text-[10px] font-black tracking-widest border-none shadow-sm",
                                                    STATUS_CONFIG[selectedReferral.status as keyof typeof STATUS_CONFIG]?.color || "bg-blue-500"
                                                )}>
                                                    {selectedReferral.status}
                                                </Badge>
                                            </div>
                                        </div>
                                        <p className="text-slate-300 font-medium flex items-center gap-2">
                                            <Briefcase className="h-4 w-4" /> {selectedReferral.role}
                                        </p>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="p-8 space-y-8 bg-slate-50/50">
                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Contact Information</p>
                                        <p className="font-semibold text-slate-900 flex items-center gap-2 mt-1">
                                            <Mail className="h-4 w-4 text-blue-500" /> {selectedReferral.email}
                                        </p>
                                        <p className="font-semibold text-slate-900 flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-green-500" /> {selectedReferral.phone}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Experience & Location</p>
                                        <p className="font-semibold text-slate-900 flex items-center gap-2 mt-1">
                                            <MapPin className="h-4 w-4 text-red-500" /> {selectedReferral.location || 'Remote'}
                                        </p>
                                        <p className="font-semibold text-slate-900 flex items-center gap-2">
                                            <Timer className="h-4 w-4 text-amber-500" />
                                            {selectedReferral.experienceType === 'Fresher' ? 'Fresher' : `Experienced ${selectedReferral.totalExperience || ''}`}
                                        </p>
                                    </div>
                                </div>

                                {/* Skills */}
                                {selectedReferral.skills?.length > 0 && (
                                    <div className="space-y-3">
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Technical Skills</p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedReferral.skills.map((skill: string, idx: number) => (
                                                <Badge key={idx} variant="secondary" className="bg-white border border-slate-200 text-slate-700 px-3 py-1 font-semibold">
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Professional & Educational History */}
                                {selectedReferral.experienceType === 'Fresher' ? (
                                    <div className="space-y-4">
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Educational Background</p>
                                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                            <div className="flex items-start gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                                    <GraduationCap className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h5 className="font-bold text-slate-900">{selectedReferral.qualification}</h5>
                                                    <p className="text-sm text-slate-500 font-medium">{selectedReferral.college}</p>
                                                    <Badge variant="secondary" className="mt-2 bg-slate-100 text-slate-600 border-none px-3">
                                                        Class of {selectedReferral.passoutYear}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    selectedReferral.companyHistory?.length > 0 && (
                                        <div className="space-y-4">
                                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Professional History</p>
                                            <div className="space-y-3">
                                                {selectedReferral.companyHistory.map((comp: any, idx: number) => (
                                                    <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between group/comp hover:border-blue-200 transition-colors">
                                                        <div className="flex gap-4 w-full">
                                                            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                                                                <Building2 className="h-5 w-5 text-slate-400 group-hover/comp:text-blue-500 transition-colors" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center justify-between">
                                                                    <h5 className="font-bold text-slate-900 group-hover/comp:text-blue-600 transition-colors">{comp.companyName}</h5>
                                                                    {comp.isCurrent ? (
                                                                        <Badge className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200 shadow-sm px-3 font-bold text-[10px] uppercase tracking-tighter">Current Employer</Badge>
                                                                    ) : (
                                                                        <div className="text-right">
                                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Tenure</span>
                                                                            <span className="text-xs font-semibold text-slate-600">
                                                                                {comp.from ? new Date(comp.from).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'N/A'} - {comp.to ? new Date(comp.to).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Present'}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-slate-500 font-medium mt-0.5">
                                                                    {comp.designation}
                                                                </p>

                                                                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4">
                                                                    <div className="space-y-1">
                                                                        <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Joined</p>
                                                                        <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                                                            <Calendar className="h-3 w-3 text-blue-400" />
                                                                            {comp.from ? new Date(comp.from).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'Not Specified'}
                                                                        </p>
                                                                    </div>
                                                                    {!comp.isCurrent ? (
                                                                        <div className="space-y-1">
                                                                            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Relieving</p>
                                                                            <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                                                                <Building2 className="h-3 w-3 text-red-300" />
                                                                                {comp.to ? new Date(comp.to).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'Current'}
                                                                            </p>
                                                                        </div>
                                                                    ) : (
                                                                        <>
                                                                            <div className="space-y-1">
                                                                                <p className="text-[9px] uppercase font-bold text-amber-500 tracking-widest">Notice</p>
                                                                                <p className="text-xs font-black text-amber-600 flex items-center gap-1.5">
                                                                                    <Clock className="h-3 w-3" />
                                                                                    {comp.noticePeriod || 'Standard'}
                                                                                </p>
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <p className="text-[9px] uppercase font-bold text-green-600 tracking-widest">Curr. CTC</p>
                                                                                <p className="text-xs font-bold text-green-700">{comp.currentCTC || 'N/A'}</p>
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <p className="text-[9px] uppercase font-bold text-orange-600 tracking-widest">Exp. CTC</p>
                                                                                <p className="text-xs font-bold text-orange-700">{comp.expectedCTC || 'N/A'}</p>
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                )}

                                {/* Reason */}
                                {selectedReferral.whyReferring && (
                                    <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 italic text-slate-700 relative">
                                        <Quote className="absolute -top-3 -left-1 h-8 w-8 text-blue-200" />
                                        <p className="relative z-10 leading-relaxed font-medium">"{selectedReferral.whyReferring}"</p>
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="p-6 bg-white border-t sticky bottom-0 z-20">
                                <Button variant="outline" onClick={() => setSelectedReferral(null)} className="px-8 rounded-xl font-bold">Close</Button>
                                {selectedReferral.resumeUrl && (
                                    <Button
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-xl font-bold shadow-lg shadow-blue-200"
                                        onClick={() => window.open(selectedReferral.resumeUrl, '_blank')}
                                    >
                                        <FileText className="mr-2 h-4 w-4" /> View Resume
                                    </Button>
                                )}
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Dummy standard icons since I might have missed some in imports
function Calendar(props: any) {
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
            <path d="M8 2v4" />
            <path d="M16 2v4" />
            <rect width="18" height="18" x="3" y="4" rx="2" />
            <path d="M3 10h18" />
        </svg>
    )
}
