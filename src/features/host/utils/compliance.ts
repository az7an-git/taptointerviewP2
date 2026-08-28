export type ComplianceTier = "approved" | "flagged" | "blocked" | "pending" | "unknown";

export interface CompliancePresentation {
  tier: ComplianceTier;
  label: string;
  badgeClass: string;
  notes?: string | null;
}

const TIER_PRESENTATION: Record<
  Exclude<ComplianceTier, "unknown">,
  Omit<CompliancePresentation, "tier" | "notes">
> = {
  approved: {
    label: "Pass",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  flagged: {
    label: "Caution",
    badgeClass: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  blocked: {
    label: "Blocked",
    badgeClass: "bg-red-50 text-red-600 border-red-200",
  },
  pending: {
    label: "Pending review",
    badgeClass: "bg-gray-100 text-gray-700 border-gray-300",
  },
};

/** Maps API `compliance_status` values to a display tier and optional label override. */
const COMPLIANCE_STATUS_ALIASES: Record<
  string,
  { tier: Exclude<ComplianceTier, "unknown">; label?: string }
> = {
  pass: { tier: "approved", label: "Pass" },
  passed: { tier: "approved", label: "Pass" },
  approved: { tier: "approved", label: "Pass" },
  approve: { tier: "approved", label: "Pass" },
  clear: { tier: "approved", label: "Pass" },
  fail: { tier: "blocked", label: "Blocked" },
  failed: { tier: "blocked", label: "Blocked" },
  blocked: { tier: "blocked", label: "Blocked" },
  reject: { tier: "blocked", label: "Blocked" },
  rejected: { tier: "blocked", label: "Blocked" },
  flag: { tier: "flagged", label: "Caution" },
  flagged: { tier: "flagged", label: "Caution" },
  caution: { tier: "flagged", label: "Caution" },
  warn: { tier: "flagged", label: "Caution" },
  warning: { tier: "flagged", label: "Caution" },
  pending: { tier: "pending", label: "Pending review" },
  "pending review": { tier: "pending", label: "Pending review" },
};

export function normalizeComplianceStatus(status?: string | null): string {
  return status?.trim().toLowerCase().replace(/[_-]+/g, " ") ?? "";
}

/** Title-case API status for display (e.g. `pass` → `Pass`, `pending_review` → `Pending Review`). */
export function formatComplianceStatusLabel(status?: string | null): string {
  const raw = status?.trim();
  if (!raw) return "Not reviewed yet";

  const alias = COMPLIANCE_STATUS_ALIASES[normalizeComplianceStatus(raw)];
  if (alias?.label) return alias.label;

  return raw
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function parseComplianceTier(status?: string | null): ComplianceTier {
  const normalized = normalizeComplianceStatus(status);
  if (!normalized) return "unknown";

  const alias = COMPLIANCE_STATUS_ALIASES[normalized];
  if (alias) return alias.tier;

  return "unknown";
}

export function getCompliancePresentation(
  status?: string | null,
  notes?: string | null
): CompliancePresentation | null {
  const normalized = normalizeComplianceStatus(status);
  if (!normalized) return null;

  const alias = COMPLIANCE_STATUS_ALIASES[normalized];
  if (alias) {
    const base = TIER_PRESENTATION[alias.tier];
    return {
      tier: alias.tier,
      label: alias.label ?? base.label,
      badgeClass: base.badgeClass,
      notes: notes?.trim() || null,
    };
  }

  return {
    tier: "unknown",
    label: formatComplianceStatusLabel(status),
    badgeClass: "bg-slate-50 text-slate-600 border-slate-200",
    notes: notes?.trim() || null,
  };
}

export function countComplianceByTier(
  questions: { complianceStatus?: string | null }[]
): Record<Exclude<ComplianceTier, "unknown">, number> {
  return questions.reduce(
    (acc, q) => {
      const tier = parseComplianceTier(q.complianceStatus);
      if (tier !== "unknown") acc[tier] += 1;
      return acc;
    },
    { approved: 0, flagged: 0, blocked: 0, pending: 0 }
  );
}

export function formatComplianceSummary(
  counts: Record<Exclude<ComplianceTier, "unknown">, number>
): string | null {
  const parts: string[] = [];
  if (counts.pending > 0) parts.push(`${counts.pending} pending`);
  if (counts.approved > 0) parts.push(`${counts.approved} pass`);
  if (counts.flagged > 0) parts.push(`${counts.flagged} caution`);
  if (counts.blocked > 0) parts.push(`${counts.blocked} blocked`);
  return parts.length > 0 ? parts.join(", ") : null;
}

export function hasBlockedCompliance(
  questions: { complianceStatus?: string | null }[]
): boolean {
  return questions.some((q) => parseComplianceTier(q.complianceStatus) === "blocked");
}

export interface ComplianceReviewState {
  counts: Record<Exclude<ComplianceTier, "unknown">, number>;
  summary: string | null;
  hasBlocked: boolean;
  hasPending: boolean;
  /** Client-side gate: blocked questions cannot be published. */
  allowsPublish: boolean;
  requirementMet: boolean;
  requirementDetail: string;
}

export function getComplianceReviewState(
  questions: { complianceStatus?: string | null }[]
): ComplianceReviewState {
  const counts = countComplianceByTier(questions);
  const summary = formatComplianceSummary(counts);
  const hasBlocked = counts.blocked > 0;
  const hasPending = counts.pending > 0;
  const allowsPublish = !hasBlocked;
  const requirementMet = questions.length > 0 && allowsPublish;

  let requirementDetail: string;
  if (questions.length === 0) {
    requirementDetail = "Add qualification questions first";
  } else if (hasBlocked) {
    requirementDetail = `${counts.blocked} blocked question, please rephrase before publishing`;
  } else if (summary) {
    requirementDetail = summary;
  } else {
    requirementDetail = `${questions.length} question${questions.length === 1 ? "" : "s"}, compliance not reviewed yet`;
  }

  return {
    counts,
    summary,
    hasBlocked,
    hasPending,
    allowsPublish,
    requirementMet,
    requirementDetail,
  };
}
