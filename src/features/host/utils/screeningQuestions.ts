import { ScreeningQuestion, ScreeningQuestionOption } from "@/types/job";

export const MAX_SCREENING_QUESTIONS = 10;
export const MIN_OPTIONS_PER_QUESTION = 2;
export const MAX_OPTIONS_PER_QUESTION = 6;

export function sortQuestionsByOrder(questions: ScreeningQuestion[]): ScreeningQuestion[] {
  return [...questions].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

/** Assigns contiguous sortOrder values matching list order (for API persistence). */
export function applySortOrders(questions: ScreeningQuestion[]): ScreeningQuestion[] {
  return questions.map((q, index) => ({ ...q, sortOrder: index }));
}

export function canAddScreeningQuestion(count: number): boolean {
  return count < MAX_SCREENING_QUESTIONS;
}

export function countDealBreakers(options: ScreeningQuestionOption[]): number {
  return options.filter((opt) => opt.isDealBreaker).length;
}

export function countCorrectAnswers(options: ScreeningQuestionOption[]): number {
  return options.filter((opt) => !opt.isDealBreaker).length;
}

/** With exactly two options, at most one may be a deal-breaker. */
export function isTwoOptionQuestion(options: ScreeningQuestionOption[]): boolean {
  return options.length === MIN_OPTIONS_PER_QUESTION;
}

/** When checking a deal-breaker with two options, only one can be selected. */
export function withExclusiveDealBreaker(
  options: ScreeningQuestionOption[],
  selectedIndex: number
): ScreeningQuestionOption[] {
  return options.map((opt, i) => ({
    ...opt,
    isDealBreaker: i === selectedIndex,
  }));
}

export function validateQuestionDealBreakers(options: ScreeningQuestionOption[]): string | null {
  const dealCount = countDealBreakers(options);
  const correctCount = countCorrectAnswers(options);

  if (correctCount < 1) {
    return "Not every answer can be a deal-breaker — leave at least one unmarked, or clear all deal-breakers if every choice is acceptable.";
  }
  if (isTwoOptionQuestion(options) && dealCount > 1) {
    return "With two answers, at most one can be a deal-breaker.";
  }
  return null;
}

/** Clamps invalid deal-breaker combinations (deal-breakers themselves are optional). */
export function normalizeQuestionDealBreakers(
  options: ScreeningQuestionOption[]
): ScreeningQuestionOption[] {
  const total = options.length;
  if (total < MIN_OPTIONS_PER_QUESTION) return options.map((opt) => ({ ...opt }));

  const normalized = options.map((opt) => ({ ...opt }));
  const dealCount = countDealBreakers(normalized);

  if (isTwoOptionQuestion(normalized) && dealCount > 1) {
    const firstDealIndex = normalized.findIndex((opt) => opt.isDealBreaker);
    return withExclusiveDealBreaker(normalized, firstDealIndex >= 0 ? firstDealIndex : 0);
  }

  if (dealCount >= total) {
    const lastDealIndex = normalized.map((opt) => opt.isDealBreaker).lastIndexOf(true);
    return normalized.map((opt, i) =>
      i === lastDealIndex ? { ...opt, isDealBreaker: false } : opt
    );
  }

  return normalized;
}

export function canToggleDealBreaker(
  options: ScreeningQuestionOption[],
  index: number,
  checked: boolean
): boolean {
  const total = options.length;
  const dealCount = countDealBreakers(options);
  const isCurrentlyDealBreaker = options[index]?.isDealBreaker ?? false;

  if (!checked) return true;

  if (isTwoOptionQuestion(options)) {
    return !isCurrentlyDealBreaker;
  }

  return dealCount < total - 1;
}

export function applyDealBreakerToggle(
  options: ScreeningQuestionOption[],
  index: number,
  checked: boolean
): ScreeningQuestionOption[] {
  if (!canToggleDealBreaker(options, index, checked)) {
    return options;
  }

  if (isTwoOptionQuestion(options)) {
    if (checked) {
      return withExclusiveDealBreaker(options, index);
    }
    return options.map((opt, i) => (i === index ? { ...opt, isDealBreaker: false } : opt));
  }

  return options.map((opt, i) => (i === index ? { ...opt, isDealBreaker: checked } : opt));
}

export function validateScreeningQuestions(questions: ScreeningQuestion[]): string | null {
  if (questions.length === 0) return null;

  if (questions.length > MAX_SCREENING_QUESTIONS) {
    return `A maximum of ${MAX_SCREENING_QUESTIONS} qualification questions is allowed.`;
  }

  for (const q of questions) {
    if (!q.text.trim()) return "Each question must have text.";
    if (q.options.length < MIN_OPTIONS_PER_QUESTION) {
      return "Each question needs at least two options.";
    }
    if (q.options.length > MAX_OPTIONS_PER_QUESTION) {
      return `Each question can have at most ${MAX_OPTIONS_PER_QUESTION} options.`;
    }
    for (const opt of q.options) {
      if (!opt.text.trim()) return "All options must have text.";
    }
    const dealBreakerError = validateQuestionDealBreakers(q.options);
    if (dealBreakerError) return dealBreakerError;
  }

  return null;
}
