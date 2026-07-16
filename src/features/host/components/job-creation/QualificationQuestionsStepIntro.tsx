import { Shield } from "lucide-react";

export default function QualificationQuestionsStepIntro() {
  return (
    <div className="w-full space-y-4 md:space-y-5">
      <div className="space-y-2 md:space-y-3">
        <p className="text-[10px] md:text-xs uppercase tracking-widest text-gray-500 font-bold">
          Step 2 of 4
        </p>
        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold uppercase tracking-tight md:tracking-widest leading-tight">
          <span className="text-gray-900">Qualification </span>
          <span className="bg-gradient-to-r from-[#FF512F] to-[#FF7A00] bg-clip-text text-transparent">
            Questions
          </span>
        </h3>
        <p className="text-sm md:text-base text-gray-500 leading-relaxed">
          Build the questions participants must answer before entering your queue. Mark any answer
          as a <strong className="font-bold text-red-700">Deal-Breaker</strong> to automatically
          disqualify participants who select it. The AI will screen each question for legal
          compliance in real time.
        </p>
      </div>

      <article className="w-full rounded-2xl border border-[#FEF3C7] bg-[#FFFBEB] p-5 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0 mt-0.5" aria-hidden />
          <div className="flex-1 min-w-0 space-y-3">
            <p className="text-sm sm:text-[15px] leading-relaxed text-[#92400E]">
              <strong className="font-bold text-[#92400E]">AI Legal Assist is on.</strong> As you type
              each question, our AI will analyze it against federal and state employment law and flag
              anything that could create legal risk, with a suggested rewrite. <br /> Questions marked{" "}
              <strong className="font-bold text-red-600">BLOCKED</strong> cannot go live until
              rewritten.
            </p>
            <p className="text-xs sm:text-sm leading-relaxed text-[#92400E] border-t border-[#92400E]/20 pt-2">
              Note: AI suggestions are a compliance aid, not legal advice. Platform is not a law
              firm.
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
