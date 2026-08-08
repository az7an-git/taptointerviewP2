import { GripVertical, Trash2, Pencil, AlertCircle } from "lucide-react";
import { ScreeningQuestion } from "@/types/job";
import { ComplianceBadge } from "./ComplianceBadge";

interface DragHandleProps {
  draggable: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

interface ScreeningQuestionCardProps {
  question: ScreeningQuestion;
  index: number;
  disabled: boolean;
  isSaving: boolean;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  dragHandleProps?: DragHandleProps;
  isDragTarget?: boolean;
  isDragging?: boolean;
}

export function ScreeningQuestionCard({
  question: q,
  index,
  disabled,
  isSaving,
  onEdit,
  onDelete,
  dragHandleProps,
  isDragTarget = false,
  isDragging = false,
}: ScreeningQuestionCardProps) {
  return (
    <div
      className={`w-full bg-white border rounded-xl p-3 sm:p-4 shadow-sm flex items-start gap-2 sm:gap-3 group transition-all duration-150 ${isDragging
        ? "opacity-40 border-dashed border-[#FF512F]/60 bg-[#FF512F]/[0.02] scale-[0.99] shadow-none"
        : isDragTarget
          ? "border-[#FF512F] ring-2 ring-[#FF512F]/40 bg-[#FF512F]/[0.03] shadow-lg -translate-y-0.5"
          : "border-gray-100 hover:border-[#FF512F]/30"
        }`}
      onDragOver={dragHandleProps?.onDragOver}
      onDrop={dragHandleProps?.onDrop}
    >
      {dragHandleProps && (
        <button
          type="button"
          aria-label={`Reorder question ${index + 1}`}
          disabled={disabled}
          className={`mt-1 cursor-grab active:cursor-grabbing p-0.5 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${isDragging ? "text-[#FF512F]" : "text-gray-300 group-hover:text-gray-500 hover:text-[#FF512F]"
            }`}
          {...dragHandleProps}
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}

      <div className="flex-1 space-y-3 min-w-0">
        <div className="flex items-start justify-between gap-3 min-w-0">
          <p className="text-sm font-medium text-gray-800 break-all min-w-0 flex-1">{q.text}</p>
          {!disabled && (
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => onEdit(index)}
                disabled={isSaving}
                aria-label={`Edit question ${index + 1}`}
                className="text-gray-400 hover:text-[#FF512F] transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(index)}
                disabled={isSaving}
                aria-label={`Delete question ${index + 1}`}
                className="text-gray-400 hover:text-red-500 transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <ComplianceBadge status={q.complianceStatus} notes={q.complianceNotes} />

        <div className="flex flex-wrap gap-2">
          {q.options.map((opt, optIndex) => (
            <span
              key={`${q.id ?? index}-opt-${optIndex}`}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border max-w-full min-w-0 ${opt.isDealBreaker
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-gray-50 text-gray-700 border-gray-100"
                }`}
            >
              <span className="break-all min-w-0">{opt.text}</span>
              {opt.isDealBreaker && (
                <AlertCircle
                  className="w-3.5 h-3.5 shrink-0 text-red-500"
                  aria-label="Deal-breaker"
                />
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
