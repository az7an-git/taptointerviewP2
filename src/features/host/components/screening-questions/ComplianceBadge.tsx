import { ChevronDown, ChevronUp } from "lucide-react";
import React from "react";
import {
  CompliancePresentation,
  formatComplianceStatusLabel,
  getCompliancePresentation,
} from "../../utils/compliance";

interface ComplianceBadgeProps {
  status?: string | null;
  notes?: string | null;
  compact?: boolean;
}

export function ComplianceBadge({ status, notes, compact = false }: ComplianceBadgeProps) {
  const presentation = getCompliancePresentation(status, notes);
  const [expanded, setExpanded] = React.useState(true);

  if (!presentation) {
    return (
      <span className="inline-flex text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full border bg-gray-50 text-gray-500 border-gray-200">
        {formatComplianceStatusLabel(status)}
      </span>
    );
  }

  const showNotes = Boolean(presentation.notes) && !compact;

  return (
    <div className="w-full space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full border ${presentation.badgeClass}`}
        >
          {presentation.label}
        </span>
        {showNotes && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-[10px] font-bold text-[#FF512F] hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            {expanded ? "Hide notes" : "View notes"}
            {expanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        )}
      </div>
      {showNotes && expanded && (
        <ComplianceNotesPanel presentation={presentation} />
      )}
    </div>
  );
}

function ComplianceNotesPanel({ presentation }: { presentation: CompliancePresentation }) {
  return (
    <div
      className={`w-full text-left rounded-lg border px-3 py-2 text-xs leading-relaxed ${presentation.tier === "blocked"
        ? "bg-red-50/80 border-red-100 text-red-800"
        : presentation.tier === "flagged"
          ? "bg-amber-50/80 border-amber-100 text-amber-800"
          : "bg-green-50/80 border-green-100 text-green-800"
        }`}
    >
      <p className="font-bold uppercase tracking-wider text-[10px] mb-1">
        {presentation.tier === "blocked" ? "Suggested rewrite" : "Compliance notes"}
      </p>
      <p>{presentation.notes}</p>
    </div>
  );
}
