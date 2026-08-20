import { Clock, Info } from "lucide-react";

export function QueueEmptyState({ variant }: { variant: "mobile" | "table" }) {
    if (variant === "table") {
        return (
            <tr>
                <td
                    colSpan={4}
                    className="px-4 sm:px-6 py-10 text-center text-gray-500 bg-gray-50/20"
                >
                    <Clock className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm font-semibold text-gray-700">No candidates currently waiting</p>
                    <div className="mt-3 inline-flex items-center gap-2 bg-blue-50 border border-blue-200/80 rounded-lg px-3.5 py-2 text-xs text-blue-700 max-w-md text-left">
                        <Info className="w-4 h-4 shrink-0 text-blue-500" />
                        <span><strong>Live Queue:</strong> Your job listing is live. Qualified candidates who complete screening will automatically appear on this dashboard in real time.</span>
                    </div>
                </td>
            </tr>
        );
    }

    return (
        <div className="px-4 py-8 text-center text-gray-500">
            <Clock className="w-6 h-6 mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-semibold text-gray-700">No candidates in queue</p>
            <div className="mt-3 inline-flex items-center gap-2 bg-blue-50 border border-blue-200/80 rounded-lg px-3.5 py-2 text-xs text-blue-700 text-left">
                <Info className="w-4 h-4 shrink-0 text-blue-500" />
                <span><strong>Live Queue:</strong> Your job listing is live. Qualified candidates will automatically appear when they join.</span>
            </div>
        </div>
    );
}
