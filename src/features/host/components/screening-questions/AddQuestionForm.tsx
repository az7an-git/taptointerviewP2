import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ScreeningQuestion, ScreeningQuestionOption } from "@/types/job";
import { Spinner } from "@/common/ui/Spinner";
import {
  applyDealBreakerToggle,
  canToggleDealBreaker,
  isTwoOptionQuestion,
  MAX_OPTIONS_PER_QUESTION,
  MIN_OPTIONS_PER_QUESTION,
  normalizeQuestionDealBreakers,
  validateQuestionDealBreakers,
} from "../../utils/screeningQuestions";
import { DealBreakerQueueNote } from "./DealBreakerQueueNote";

interface AddQuestionFormProps {
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (question: ScreeningQuestion) => void;
  /** When set, form is prefilled for editing an existing question. */
  initialQuestion?: ScreeningQuestion;
  submitLabel?: string;
  /** Job details (and similar) pages re-run compliance automatically after save. */
  runComplianceOnSave?: boolean;
}

const createOption = (text = "", isDealBreaker = false): ScreeningQuestionOption => ({
  text,
  isDealBreaker,
});

const createEmptyQuestion = (): ScreeningQuestion => ({
  text: "",
  options: [createOption(), createOption()],
});

const cloneQuestionForDraft = (question: ScreeningQuestion): ScreeningQuestion => ({
  ...question,
  text: question.text,
  options: normalizeQuestionDealBreakers(question.options.map((opt) => ({ ...opt }))),
});

export function AddQuestionForm({
  isSaving,
  onCancel,
  onSubmit,
  initialQuestion,
  submitLabel = initialQuestion ? "Save changes" : "Save Question",
  runComplianceOnSave = false,
}: AddQuestionFormProps) {
  const isEditMode = Boolean(initialQuestion);
  const [draft, setDraft] = React.useState<ScreeningQuestion>(() =>
    initialQuestion ? cloneQuestionForDraft(initialQuestion) : createEmptyQuestion()
  );
  const [emptyOptionIndexes, setEmptyOptionIndexes] = React.useState<Set<number>>(new Set());

  React.useEffect(() => {
    setDraft(initialQuestion ? cloneQuestionForDraft(initialQuestion) : createEmptyQuestion());
    setEmptyOptionIndexes(new Set());
  }, [initialQuestion]);

  const updateDraftOption = (index: number, patch: Partial<ScreeningQuestionOption>) => {
    if (patch.isDealBreaker !== undefined) {
      setDraft((prev) => ({
        ...prev,
        options: applyDealBreakerToggle(prev.options, index, patch.isDealBreaker === true),
      }));
      return;
    }

    setDraft((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) => (i === index ? { ...opt, ...patch } : opt)),
    }));

    if (patch.text !== undefined && patch.text.trim()) {
      setEmptyOptionIndexes((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  const addDraftOption = () => {
    if (draft.options.length >= MAX_OPTIONS_PER_QUESTION) {
      toast.error(`Each question can have at most ${MAX_OPTIONS_PER_QUESTION} options.`);
      return;
    }
    setDraft((prev) => ({
      ...prev,
      options: [...prev.options, createOption()],
    }));
  };

  const removeDraftOption = (index: number) => {
    setDraft((prev) => {
      if (prev.options.length <= MIN_OPTIONS_PER_QUESTION) {
        toast.error(`Each question needs at least ${MIN_OPTIONS_PER_QUESTION} options.`);
        return prev;
      }
      const options = normalizeQuestionDealBreakers(prev.options.filter((_, i) => i !== index));
      return { ...prev, options };
    });
    setEmptyOptionIndexes((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i !== index) next.add(i > index ? i - 1 : i);
      });
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.text.trim()) {
      toast.error("Each question must have text.");
      return;
    }

    const emptyIndexes = new Set<number>();
    draft.options.forEach((opt, i) => {
      if (!opt.text.trim()) emptyIndexes.add(i);
    });

    if (emptyIndexes.size > 0) {
      setEmptyOptionIndexes(emptyIndexes);
      toast.error("Fill in every option or remove empty rows.");
      return;
    }

    const dealBreakerError = validateQuestionDealBreakers(draft.options);
    if (dealBreakerError) {
      toast.error(dealBreakerError);
      return;
    }

    onSubmit({
      ...draft,
      text: draft.text.trim(),
      options: draft.options.map((opt) => ({ ...opt, text: opt.text.trim() })),
    });
  };

  const atOptionLimit = draft.options.length >= MAX_OPTIONS_PER_QUESTION;
  const hasDealBreaker = draft.options.some((opt) => opt.isDealBreaker);

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full bg-[#FFF5F2] border border-[#FF512F]/20 rounded-xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <textarea
        value={draft.text}
        onChange={(e) => setDraft((prev) => ({ ...prev, text: e.target.value }))}
        placeholder="Enter your qualification question..."
        className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#FF512F]/60 focus:ring-1 focus:ring-[#FF512F]/30 resize-none transition-all"
        rows={2}
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
            Answer options
          </span>
          <span className="text-[10px] font-bold text-gray-500">
            {draft.options.length} / {MAX_OPTIONS_PER_QUESTION} (min {MIN_OPTIONS_PER_QUESTION})
          </span>
        </div>

        <div className="max-h-[240px] overflow-y-auto pr-3 space-y-2.5 [scrollbar-width:thin]">
          {draft.options.map((opt, index) => {
            const dealBreakerDisabled = !canToggleDealBreaker(
              draft.options,
              index,
              !opt.isDealBreaker
            );

            return (
              <div
                key={index}
                className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 sm:p-0 bg-white/80 sm:bg-transparent rounded-xl border border-gray-200/80 sm:border-0 shadow-2xs sm:shadow-none min-w-0"
              >
                <input
                  type="text"
                  value={opt.text}
                  onChange={(e) => updateDraftOption(index, { text: e.target.value })}
                  placeholder={`Option ${index + 1}`}
                  className={`w-full sm:flex-1 min-w-0 bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FF512F]/60 focus:ring-1 focus:ring-[#FF512F]/30 transition-all ${emptyOptionIndexes.has(index)
                    ? "border-red-400 ring-1 ring-red-100"
                    : "border-gray-200"
                    }`}
                />
                <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0 w-full sm:w-auto pt-0.5 sm:pt-0">
                  <label
                    className={`flex items-center gap-2 shrink-0 ${dealBreakerDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={opt.isDealBreaker}
                      disabled={dealBreakerDisabled}
                      onChange={(e) =>
                        updateDraftOption(index, { isDealBreaker: e.target.checked })
                      }
                      className="rounded border-gray-300 text-[#FF512F] focus:ring-[#FF512F]/20 disabled:cursor-not-allowed w-4 h-4"
                    />
                    <span className="text-xs font-bold text-gray-600 select-none">Deal-breaker</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => removeDraftOption(index)}
                    className="text-gray-400 hover:text-red-500 p-1.5 shrink-0 cursor-pointer rounded-lg hover:bg-red-50 transition-colors"
                    aria-label="Remove option"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addDraftOption}
          disabled={atOptionLimit}
          className="text-xs font-bold text-[#FF512F] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
        >
          <Plus className="w-3.5 h-3.5" />
          Add option
        </button>

        {hasDealBreaker && <DealBreakerQueueNote />}
      </div>

      <p className="text-[10px] text-gray-500 leading-relaxed">
        Deal-breakers are optional. Leave all unchecked if every answer is acceptable to candidates.
        {isTwoOptionQuestion(draft.options)
          ? " With two answers, at most one can be a deal-breaker."
          : " Mark every disqualifying answer; unmarked options are what candidates see (e.g. UK and Pakistan as deal-breakers, US and Mexico shown to candidates). "}
        {isEditMode
          ? runComplianceOnSave
            ? "Saving updates this question and re-runs AI compliance review automatically."
            : "Saving updates this question and clears its compliance badge until review runs again (on Next Step)."
          : runComplianceOnSave
            ? "After you save, AI compliance review runs automatically and badges update on the cards below."
            : "After you save, questions appear as cards below — use the grip icon to reorder. Compliance badges appear once the server has reviewed a question."}
      </p>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#FF512F]/10">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-1.5 bg-[#FF512F] text-white text-xs font-bold rounded-lg hover:bg-[#E04020] shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving && <Spinner className="w-3.5 h-3.5 border-t-2 border-b-2 border-white" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
