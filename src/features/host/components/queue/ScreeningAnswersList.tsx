import type { ScreeningAnswer } from "@/types/job";

interface ScreeningAnswersListProps {
    answers: ScreeningAnswer[];
    className?: string;
}

export function ScreeningAnswersList({ answers, className = "" }: ScreeningAnswersListProps) {
    if (answers.length === 0) return null;

    return (
        <div className={`space-y-3 ${className}`}>
            {answers.map((answer) => (
                <div key={answer.questionId} className="space-y-0.5 min-w-0">
                    <p className="text-xs text-gray-600 leading-snug">
                        <span className="font-semibold text-gray-700">Question: </span>
                        <span className="break-words">{answer.question}</span>
                    </p>
                    <p className="text-xs text-gray-600 leading-snug">
                        <span className="font-semibold text-gray-700">Answer: </span>
                        <span className="break-words">{answer.selectedOptionText}</span>
                    </p>
                </div>
            ))}
        </div>
    );
}
