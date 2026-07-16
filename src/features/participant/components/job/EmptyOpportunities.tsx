import { Briefcase } from "lucide-react";

interface EmptyOpportunitiesProps {
  hasActiveFilters?: boolean;
}

export function EmptyOpportunities({ hasActiveFilters = false }: EmptyOpportunitiesProps) {
  return (
    <div className="text-center px-6 py-12 sm:px-8 bg-white/[0.02] border border-white/5 rounded-xl max-w-md mx-auto space-y-4 shadow-2xl backdrop-blur-md">
      <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto text-gray-500 shadow-inner">
        <Briefcase className="w-5 h-5" />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-white tracking-tight">No opportunities found</h4>
        <p className="text-xs text-gray-500 max-w-[280px] sm:max-w-[200px] mx-auto leading-relaxed">
          {hasActiveFilters
            ? "No open positions match your filters. Try a different employment type or search term."
            : "There are no open positions at the moment. Check back soon."}
        </p>
      </div>
    </div>
  );
}
