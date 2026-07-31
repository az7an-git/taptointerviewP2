import { useState, useEffect } from "react";
import { JobApplicant } from "@/types/job";
import { jobsApi } from "@/api/jobsApi";
import { UserCircle, Search, Calendar } from "lucide-react";
import { ApplicantDetailsModal } from "../queue/ApplicantDetailsModal";
import { toast } from "sonner";
import { getParticipantDisplayName } from "../../utils/queueEntryStatus";

interface PastApplicantsPanelProps {
    jobId: string;
}

export function PastApplicantsPanel({ jobId }: PastApplicantsPanelProps) {
    const [applicants, setApplicants] = useState<JobApplicant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedApplicant, setSelectedApplicant] = useState<JobApplicant | null>(null);

    useEffect(() => {
        let active = true;
        const fetchPastApplicants = async () => {
            setIsLoading(true);
            try {
                const response = await jobsApi.getPastApplicants(jobId);
                if (active) {
                    setApplicants(response.data);
                }
            } catch (error) {
                console.error("Failed to load past applicants:", error);
                toast.error("Could not load past applicants.");
            } finally {
                if (active) setIsLoading(false);
            }
        };
        fetchPastApplicants();
        return () => { active = false; };
    }, [jobId]);

    const filteredApplicants = applicants.filter(app => {
        if (!searchQuery) return true;
        const name = getParticipantDisplayName(app.participant).toLowerCase();
        const email = (app.participant.email || "").toLowerCase();
        const query = searchQuery.toLowerCase();
        return name.includes(query) || email.includes(query);
    });

    const getOutcomeBadgeClass = (outcome: string | null) => {
        if (!outcome) return "bg-gray-50 text-gray-700 border-gray-200";
        const o = outcome.toLowerCase();
        if (o === "not_a_fit") return "bg-red-50 text-red-700 border-red-200";
        if (o === "hired") return "bg-emerald-50 text-emerald-700 border-emerald-200";
        if (o === "follow_up") return "bg-amber-50 text-amber-700 border-amber-200";
        return "bg-gray-50 text-gray-700 border-gray-200";
    };

    const getOutcomeLabel = (outcome: string | null) => {
        if (!outcome) return "N/A";
        const o = outcome.toLowerCase();
        if (o === "hired") return "Hired";
        if (o === "follow_up") return "Follow Up";
        if (o === "not_a_fit") return "Not a Fit";
        return outcome;
    };

    return (
        <div className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden flex flex-col">
            {/* Header & Search */}
            <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <UserCircle className="w-4 h-4 text-gray-500" />
                    Past Applicants
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                        {applicants.length}
                    </span>
                </h3>

                <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search candidates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full sm:w-64 pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF512F]/30 focus:border-[#FF512F] transition-shadow"
                    />
                </div>
            </div>

            {/* List */}
            <div className="overflow-x-auto min-h-[200px] max-h-[500px] overflow-y-auto">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-400 text-sm font-medium animate-pulse">
                        Loading past applicants...
                    </div>
                ) : filteredApplicants.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <UserCircle className="w-12 h-12 text-gray-200 mb-3" />
                        <p className="text-gray-500 font-medium text-sm">
                            {searchQuery ? "No candidates found matching your search." : "No past applicants found for this job."}
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 font-bold sticky top-0 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3 font-bold">Candidate</th>
                                <th className="px-4 py-3 font-bold">Applied</th>
                                <th className="px-4 py-3 font-bold">Outcome</th>
                                <th className="px-4 py-3 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredApplicants.map((app) => {
                                const name = getParticipantDisplayName(app.participant);
                                return (
                                    <tr key={app.queueEntryId} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-gray-900">{name}</div>
                                            <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                                {app.participant.email}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5 text-gray-600">
                                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                {new Date(app.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getOutcomeBadgeClass(app.outcome)}`}>
                                                {getOutcomeLabel(app.outcome)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => setSelectedApplicant(app)}
                                                className="text-xs font-bold text-[#FF512F] hover:text-[#E04020] hover:underline"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <ApplicantDetailsModal
                jobId={jobId}
                applicant={selectedApplicant}
                isOpen={!!selectedApplicant}
                onClose={() => setSelectedApplicant(null)}
                isHistorical={true}
            />
        </div>
    );
}
