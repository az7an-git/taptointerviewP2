export const getStatusColors = (status?: string): string => {
    switch (status?.toLowerCase()) {
        case "admitted":
        case "confirmed":
        case "hired":
            return "text-emerald-700 bg-emerald-50 border-emerald-200"; // Green
        case "in_session":
        case "interviewing":
            return "text-orange-700 bg-orange-50 border-orange-200"; // Orange
        case "pending_outcome":
            return "text-gray-700 bg-gray-100 border-gray-300"; // Gray
        case "resolved":
        case "completed":
            return "text-gray-500 bg-gray-50 border-gray-200 opacity-80"; // Gray, faded
        case "declined":
        case "rejected":
        case "removed":
        case "not_a_fit":
            return "text-red-600 bg-red-50 border-red-200";
        case "pending":
        case "waiting":
        case "follow_up":
            return "text-yellow-700 bg-yellow-50 border-yellow-200";
        default:
            return "text-gray-700 bg-gray-100 border-gray-200";
    }
};

export const getOutcomeColors = (outcome?: string): string => {
    switch (outcome?.toLowerCase()) {
        case "hired":
            return "text-emerald-700 bg-emerald-50 border-emerald-200";
        case "follow_up":
            return "text-yellow-700 bg-yellow-50 border-yellow-200";
        case "not_a_fit":
            return "text-red-600 bg-red-50 border-red-200";
        default:
            return "text-gray-700 bg-gray-50 border-gray-200";
    }
};
