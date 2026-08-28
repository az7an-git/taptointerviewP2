import type { RefObject } from "react";
import { Briefcase, Search, X } from "lucide-react";
import Select from "@/common/components/ui/Select";

const EMPLOYMENT_TYPE_FILTER_OPTIONS = [
  { value: "", label: "All types" },
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "freelance", label: "Freelance" },
  { value: "internship", label: "Internship" },
];

interface CompanyJobsFiltersProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  searchInputRef?: RefObject<HTMLInputElement | null>;
  employmentTypeFilter: string;
  onEmploymentTypeFilterChange: (value: string) => void;
  isLoading: boolean;
  hasActiveFilters: boolean;
  totalJobs: number;
  loadedJobsCount: number;
}

export function CompanyJobsFilters({
  searchQuery,
  onSearchQueryChange,
  searchInputRef,
  employmentTypeFilter,
  onEmploymentTypeFilterChange,
  isLoading,
  hasActiveFilters,
  totalJobs,
  loadedJobsCount,
}: CompanyJobsFiltersProps) {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative group flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#FF512F] transition-colors pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder='Search positions... (Press "/" to focus)'
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full h-[42px] pl-9 pr-9 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FF512F]/60 focus:ring-1 focus:ring-[#FF512F]/40 focus:bg-white/10 transition-all duration-300 shadow-sm"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchQueryChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-500 hover:text-white rounded-md hover:bg-white/10 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] text-gray-500 font-bold uppercase pointer-events-none group-focus-within:opacity-0 transition-opacity">
              /
            </div>
          )}
        </div>

        <div className="w-full sm:w-44 shrink-0">
          <Select
            label="Employment type"
            icon={Briefcase}
            variant="ghost"
            hideLabel
            buttonClassName="h-[42px] py-2.5"
            options={EMPLOYMENT_TYPE_FILTER_OPTIONS}
            value={employmentTypeFilter}
            onChange={onEmploymentTypeFilterChange}
            placeholder="All types"
            disabled={isLoading}
          />
        </div>
      </div>

      {hasActiveFilters && !isLoading && (
        <p className="text-xs text-gray-500 font-medium text-center sm:text-left">
          {totalJobs === 0
            ? "No positions match the selected filters."
            : `Showing ${loadedJobsCount} of ${totalJobs} matching position${totalJobs === 1 ? "" : "s"}.`}
        </p>
      )}
    </div>
  );
}
