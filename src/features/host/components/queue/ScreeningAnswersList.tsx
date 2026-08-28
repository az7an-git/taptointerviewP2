import type { ScreeningAnswer } from "@/types/job";

interface ScreeningAnswersListProps {
    answers: ScreeningAnswer[];
    className?: string;
}

export function ScreeningAnswersList({ answers, className = "" }: ScreeningAnswersListProps) {
    if (answers.length === 0) return null;

    return (
        <div className={`space-y-2 ${className}`}>
            {answers.map((answer) => (
                <div
                    key={answer.questionId}
                    className="bg-gray-50/90 p-2.5 rounded-xl border border-gray-200/70 text-xs space-y-1.5 shadow-2xs"
                >
                    <div className="flex items-start gap-2 min-w-0">
                        <span className="font-extrabold text-gray-500 text-[10px] uppercase tracking-wider bg-gray-200/70 px-1.5 py-0.5 rounded shrink-0 mt-0.5 select-none">
                            Q
                        </span>
                        <p className="m-0 font-semibold text-gray-800 leading-snug break-words min-w-0 flex-1">
                            {answer.question}
                        </p>
                    </div>
                    <div className="flex items-start gap-2 min-w-0 bg-white p-2 rounded-lg border border-[#FF512F]/20">
                        <span className="font-extrabold text-[#FF512F] text-[10px] uppercase tracking-wider bg-[#FF512F]/10 px-1.5 py-0.5 rounded shrink-0 mt-0.5 select-none">
                            A
                        </span>
                        <span className="font-bold text-gray-900 leading-snug break-words min-w-0 flex-1">
                            {answer.selectedOptionText}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}
