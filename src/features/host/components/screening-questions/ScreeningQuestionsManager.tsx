import React from "react";
import { ScreeningQuestion } from "@/types/job";
import { jobsApi } from "@/api/jobsApi";
import { reorderList, useListReorder } from "@/common/hooks/useListReorder";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { countComplianceByTier, formatComplianceSummary } from "../../utils/compliance";
import {
  applySortOrders,
  canAddScreeningQuestion,
  MAX_SCREENING_QUESTIONS,
  sortQuestionsByOrder,
  validateScreeningQuestions,
} from "../../utils/screeningQuestions";
import { ScreeningQuestionCard } from "./ScreeningQuestionCard";
import { AddQuestionForm } from "./AddQuestionForm";

interface Props {
  jobId: string;
  initialQuestions?: ScreeningQuestion[];
  onQuestionsChange?: (questions: ScreeningQuestion[]) => void;
  /** When true, saves to API after add, delete, or reorder */
  persistToApi?: boolean;
  /**
   * When true (wizard mode), runs AI compliance review after each question
   * add/edit so employers see Pass/Caution/Blocked feedback in real time.
   */
  runComplianceInWizard?: boolean;
  disabled?: boolean;
  /** When false, hides the add-question control (e.g. read-only job details). Defaults to true. */
  showAddButton?: boolean;
  /** When false, hides drag-to-reorder handles. Defaults to true. */
  showDragHandles?: boolean;
  /** Callback fired when the compliance review state changes */
  onReviewingChange?: (isReviewing: boolean) => void;
}

export default function ScreeningQuestionsManager({
  jobId,
  initialQuestions = [],
  onQuestionsChange,
  persistToApi = false,
  runComplianceInWizard = false,
  disabled = false,
  showAddButton = true,
  showDragHandles = true,
  onReviewingChange,
}: Props) {
  const [questions, setQuestions] = React.useState<ScreeningQuestion[]>(() =>
    sortQuestionsByOrder(initialQuestions)
  );
  const [isAdding, setIsAdding] = React.useState(false);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isRunningCompliance, setIsRunningCompliance] = React.useState(false);
  const [dropTargetIndex, setDropTargetIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    onReviewingChange?.(isRunningCompliance);
  }, [isRunningCompliance, onReviewingChange]);

  React.useEffect(() => {
    setQuestions(sortQuestionsByOrder(initialQuestions));
  }, [initialQuestions]);

  const updateQuestions = (updated: ScreeningQuestion[]) => {
    const ordered = applySortOrders(updated);
    setQuestions(ordered);
    onQuestionsChange?.(ordered);
  };

  const complianceCounts = React.useMemo(() => countComplianceByTier(questions), [questions]);
  const complianceSummary = React.useMemo(
    () => formatComplianceSummary(complianceCounts),
    [complianceCounts]
  );

  const applySavedQuestions = (saved: ScreeningQuestion[]) => {
    setQuestions(saved);
    onQuestionsChange?.(saved);
  };

  /** In wizard mode: save questions to the API first (so the server has them), then run compliance. */
  const runWizardCompliance = React.useCallback(async (currentQuestions: ScreeningQuestion[]) => {
    if (!runComplianceInWizard || !jobId || jobId === "new") return;
    if (currentQuestions.length === 0) return; // nothing to review
    setIsRunningCompliance(true);
    try {
      // Save questions first so the compliance API can see them
      await jobsApi.saveScreeningQuestions(jobId, currentQuestions);
      const compliance = await jobsApi.runComplianceReview(jobId);
      const reviewed = compliance.data.reviewedCount ?? 0;
      const saved = sortQuestionsByOrder(compliance.data.screeningQuestions || []);
      setQuestions(saved);
      onQuestionsChange?.(saved);
      if (reviewed > 0) {
        toast.success(
          `${reviewed} question${reviewed === 1 ? "" : "s"} reviewed for compliance.`
        );
      }
    } catch {
      // Non-blocking — compliance failure shouldn't block the employer
    } finally {
      setIsRunningCompliance(false);
    }
  }, [runComplianceInWizard, jobId, onQuestionsChange]);

  const runComplianceReviewAfterSave = async () => {
    const compliance = await jobsApi.runComplianceReview(jobId);
    const reviewed = compliance.data.reviewedCount;
    const saved = sortQuestionsByOrder(compliance.data.screeningQuestions || []);
    applySavedQuestions(saved);
    if (reviewed > 0) {
      toast.success(
        `Qualification questions saved. ${reviewed} question${reviewed === 1 ? "" : "s"} reviewed for compliance.`
      );
    } else {
      toast.success("Qualification questions saved.");
    }
  };

  const handleSaveToApi = async (questionsToSave: ScreeningQuestion[]) => {
    if (!jobId || jobId === "new") {
      toast.error("Save the job details first before adding qualification questions.");
      return;
    }

    const validationError = validateScreeningQuestions(questionsToSave);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSaving(true);
    try {
      const response = await jobsApi.saveScreeningQuestions(jobId, questionsToSave);
      const saved = sortQuestionsByOrder(response.data.screeningQuestions || []);
      applySavedQuestions(saved);

      if (persistToApi && saved.length > 0) {
        try {
          await runComplianceReviewAfterSave();
        } catch (reviewError) {
          console.error("Failed to run compliance review:", reviewError);
          toast.error(
            "Questions saved, but compliance review failed. Try editing and saving again in a moment."
          );
        }
      } else {
        toast.success("Qualification questions saved.");
      }
    } catch (error) {
      console.error("Failed to save qualification questions:", error);
      toast.error("Failed to save qualification questions.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    const ordered = applySortOrders(reorderList(questions, fromIndex, toIndex));
    updateQuestions(ordered);

    if (persistToApi && jobId !== "new") {
      await handleSaveToApi(ordered);
    }
  };

  const { getDragHandleProps } = useListReorder({ onReorder: handleReorder });

  const closeQuestionForm = () => {
    setIsAdding(false);
    setEditingIndex(null);
  };

  const handleAddQuestion = async (newQuestion: ScreeningQuestion) => {
    if (!canAddScreeningQuestion(questions.length)) {
      toast.error(`You can add up to ${MAX_SCREENING_QUESTIONS} qualification questions per job.`);
      return;
    }

    const updated = applySortOrders([...questions, newQuestion]);
    updateQuestions(updated);
    closeQuestionForm();

    if (persistToApi) {
      await handleSaveToApi(updated);
    } else {
      toast.success("Question added");
      await runWizardCompliance(updated);
    }
  };

  const handleEditQuestion = async (index: number, edited: ScreeningQuestion) => {
    const existing = questions[index];
    if (!existing) return;

    const merged: ScreeningQuestion = {
      ...edited,
      id: existing.id,
      sortOrder: existing.sortOrder ?? index,
      complianceStatus: undefined,
      complianceNotes: null,
    };

    const updated = applySortOrders(questions.map((q, i) => (i === index ? merged : q)));
    updateQuestions(updated);
    closeQuestionForm();

    if (persistToApi) {
      await handleSaveToApi(updated);
    } else {
      toast.success("Question updated");
      await runWizardCompliance(updated);
    }
  };

  const handleDeleteQuestion = async (index: number) => {
    const updated = applySortOrders(questions.filter((_, i) => i !== index));
    updateQuestions(updated);
    if (editingIndex === index) closeQuestionForm();
    else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }

    if (persistToApi && jobId !== "new") {
      await handleSaveToApi(updated);
    } else {
      toast.success("Question removed");
      await runWizardCompliance(updated);
    }
  };

  const interactionsLocked = disabled || isSaving || isRunningCompliance;

  const buildCardDragProps = (index: number) => {
    const base = getDragHandleProps(index, interactionsLocked);
    return {
      ...base,
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        setDropTargetIndex(index);
        base.onDragOver(e);
      },
      onDrop: (e: React.DragEvent) => {
        setDropTargetIndex(null);
        base.onDrop(e);
      },
      onDragEnd: () => {
        setDropTargetIndex(null);
        base.onDragEnd();
      },
    };
  };

  const atQuestionLimit = !canAddScreeningQuestion(questions.length);

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            Qualification Questions
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-gray-500 font-medium">
              {questions.length} / {MAX_SCREENING_QUESTIONS} questions
              {complianceSummary && (
                <span className="text-gray-400"> · {complianceSummary}</span>
              )}
            </p>
            {isRunningCompliance && (
              <span className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100/50">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-[10px] uppercase tracking-wider font-bold">Reviewing</span>
              </span>
            )}
          </div>
        </div>
        {showAddButton && (
          <button
            type="button"
            onClick={() => {
              if (interactionsLocked) return;
              if (atQuestionLimit) {
                toast.error(`Maximum of ${MAX_SCREENING_QUESTIONS} questions reached.`);
                return;
              }
              closeQuestionForm();
              setIsAdding(true);
            }}
            disabled={interactionsLocked || atQuestionLimit || editingIndex !== null}
            className="bg-[#FF512F]/10 text-[#FF512F] hover:bg-[#FF512F] hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer w-fit shadow-sm shadow-[#FF512F]/5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </button>
        )}
      </div>

      <div className="space-y-3">
        {isAdding && !interactionsLocked && (
          <AddQuestionForm
            isSaving={isSaving}
            runComplianceOnSave={persistToApi}
            onCancel={closeQuestionForm}
            onSubmit={handleAddQuestion}
          />
        )}

        {questions.length > 0 && (
          <div className="w-full space-y-3">
            {questions.map((q, qIndex) =>
              editingIndex === qIndex ? (
                <AddQuestionForm
                  key={q.id ?? `edit-${qIndex}`}
                  isSaving={isSaving}
                  initialQuestion={q}
                  runComplianceOnSave={persistToApi}
                  onCancel={closeQuestionForm}
                  onSubmit={(edited) => handleEditQuestion(qIndex, edited)}
                />
              ) : (
                <ScreeningQuestionCard
                  key={q.id ?? `q-${qIndex}-${q.text.slice(0, 12)}`}
                  question={q}
                  index={qIndex}
                  disabled={interactionsLocked || isAdding || editingIndex !== null}
                  isSaving={isSaving}
                  onEdit={(idx) => {
                    closeQuestionForm();
                    setEditingIndex(idx);
                  }}
                  onDelete={handleDeleteQuestion}
                  isDragTarget={dropTargetIndex === qIndex}
                  dragHandleProps={(!showDragHandles || interactionsLocked) ? undefined : buildCardDragProps(qIndex)}
                />
              )
            )}
          </div>
        )}

        {questions.length === 0 && !isAdding && (
          <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-xl">
            <p className="text-xs text-gray-400 font-medium italic">
              No qualification questions added yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
