import { useState, useEffect } from "react";
import { apiFetch } from "@/config/api";
import { Card, CardContent } from "@/components/ui/card";
import { Cake, Users, Calendar, Search } from "lucide-react";
// import { format } from "date-fns";
import { Input } from "@/components/ui/input";

interface BirthdayUser {
    id: string;
    name: string;
    designation: string;
    department: string;
    profileImage: string;
    dob: string;
}

export default function Birthdays() {
    const [birthdays, setBirthdays] = useState<BirthdayUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchBirthdays = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await apiFetch('/api/birthdays', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setBirthdays(data);
                }
            } catch (error) {
                console.error("Fetch Birthdays Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBirthdays();
    }, []);

    const filteredBirthdays = birthdays.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <Cake className="h-8 w-8 text-black-500" />
                        Today's Birthdays
                    </h1>
                    <p className="text-muted-foreground mt-1">Celebrate with your colleagues!</p>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search colleagues..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* BIRTHDAY LIST */}
            {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="animate-pulse border-none shadow-sm">
                            <CardContent className="p-6 h-32 bg-gray-100/50 rounded-xl" />
                        </Card>
                    ))}
                </div>
            ) : filteredBirthdays.length === 0 ? (
                <Card className="border-dashed border-2 bg-slate-50/50 p-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <Calendar className="h-10 w-10 text-slate-300" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-slate-900">No Birthdays Today</h3>
                            <p className="text-slate-500 mt-1 max-w-xs mx-auto">
                                There are no colleagues celebrating their birthday today. Check back tomorrow!
                            </p>
                        </div>
                    </div>
                </Card>
            ) : (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-1">
                    {filteredBirthdays.map((user) => (
                        <Card key={user.id} className="group relative overflow-hidden border border-yellow-500 shadow-xl bg-white ring-1 ring-black/5 hover:shadow-2xl transition-all duration-300">
                            
                            <CardContent className="p-8">
                                <div className="flex flex-col md:flex-row items-center gap-8">
                                    <div className="relative shrink-0">
                                        <div className="h-28 w-28 rounded-full border-2 border-yellow-500 shadow-2xl shadow-black-100 p-1 bg-white overflow-hidden group-hover:scale-105 transition-transform duration-300">
                                            {user.profileImage ? (
                                                <img src={user.profileImage} alt={user.name} className="h-full w-full object-cover rounded-full" />
                                            ) : (
                                                <div className="h-full w-full bg-gradient-to-br from-black-500 to-rose-400 flex items-center justify-center text-white text-3xl font-bold rounded-full">
                                                    {user.name.charAt(0)} 
                                                </div>
                                            )}
                                        </div>
                                        {/* <div className="absolute -bottom-1 -right-1 bg-black-500 h-6 w-6 rounded-full border-4 border-white shadow-sm" /> */}
                                    </div>

                                    <div className="flex-1 text-center md:text-left">
                                        <div className="mb-3">
                                            <h3 className="text-2xl font-bold text-slate-900 group-hover:text-black-600 transition-colors uppercase tracking-tight">
                                                {user.name} ({user.id})
                                            </h3>
                                            <p className="text-muted-foreground font-semibold flex items-center justify-center md:justify-start gap-2 text-base mt-2">
                                                <Users className="h-4 w-4 text-black-500" />
                                                {user.designation}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                                            <div className="px-4 py-1.5 bg-black-50 text-black-700 text-xs font-bold rounded-full border border-black-100 uppercase tracking-widest shadow-sm">
                                                {user.department}
                                            </div>
                                         
                                        </div>
                                    </div>
                                </div>

                                {/* <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-black bg-gradient-to-r from-black-600 to-rose-500 bg-clip-text text-transparent">
                                            HAPPY BIRTHDAY! 🎂
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee ID</p>
                                        <p className="text-sm font-bold text-slate-900">{user.id}</p>
                                    </div>
                                </div> */}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

           
        </div>
    );
}
