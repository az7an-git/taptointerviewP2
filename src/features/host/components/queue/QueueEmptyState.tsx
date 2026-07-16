import { Clock } from "lucide-react";

export function QueueEmptyState({ variant }: { variant: "mobile" | "table" }) {
    if (variant === "table") {
        return (
            <tr>
                <td
                    colSpan={4}
                    className="px-4 sm:px-6 py-12 text-center text-gray-500 bg-gray-50/20"
                >
                    <Clock className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                    No candidates in queue
                </td>
            </tr>
        );
    }

    return (
        <div className="px-4 py-10 text-center text-gray-500">
            <Clock className="w-6 h-6 mx-auto mb-2 text-gray-300" />
            <p className="text-sm font-medium">No candidates in queue</p>
        </div>
    );
}
