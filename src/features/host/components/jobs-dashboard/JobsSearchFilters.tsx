import { /*Filter ,*/Briefcase, Search, X } from "lucide-react";
import Select from "@/common/components/ui/Select";

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "closed", label: "Closed" },
];

const EMPLOYMENT_TYPE_FILTER_OPTIONS = [
  { value: "", label: "All types" },
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "freelance", label: "Freelance" },
  { value: "internship", label: "Internship" },
];

interface JobsSearchFiltersProps {
  searchQuery: string;
  onSearchQueryChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  employmentTypeFilter: string;
  onEmploymentTypeFilterChange: (v: string) => void;
  isLoading: boolean;
  hasActiveFilters: boolean;
  totalJobs: number;
  loadedJobsCount: number;
}

export function JobsSearchFilters({
  searchQuery,
  onSearchQueryChange,
  statusFilter,
  onStatusFilterChange,
  employmentTypeFilter,
  onEmploymentTypeFilterChange,
  isLoading,
  hasActiveFilters,
  totalJobs,
  loadedJobsCount,
}: JobsSearchFiltersProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3 md:p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-full lg:flex-1 lg:min-w-[200px]">
          <label className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 px-1 mb-2 text-gray-900">
            <Search className="w-3.5 h-3.5 text-[#FF512F]" />
            Search by title
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Search job titles..."
              className="w-full pl-9 pr-9 py-2 text-sm font-medium text-gray-900 placeholder:text-gray-400 bg-gray-50/50 border border-gray-300 rounded-xl shadow-sm transition-all duration-200 hover:border-gray-400 hover:bg-white focus:outline-none focus:border-[#FF512F] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,81,47,0.1)]"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchQueryChange("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-700 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        </div>
        <div className="w-full sm:w-[calc(50%-0.5rem)] lg:w-44 lg:shrink-0">
          <Select
            label="Status"
            options={STATUS_FILTER_OPTIONS}
            value={statusFilter}
            onChange={onStatusFilterChange}
            placeholder="All statuses"
            className="[&_label]:mb-1"
          />
        </div>
        <div className="w-full sm:w-[calc(50%-0.5rem)] lg:w-44 lg:shrink-0">
          <Select
            label="Employment type"
            icon={Briefcase}
            options={EMPLOYMENT_TYPE_FILTER_OPTIONS}
            value={employmentTypeFilter}
            onChange={onEmploymentTypeFilterChange}
            placeholder="All types"
            className="[&_label]:mb-1"
          />
        </div>
      </div>
      <p
        className="text-xs text-gray-500 font-medium mt-1 min-h-[1.125rem]"
        aria-live="polite"
      >
        {hasActiveFilters && !isLoading
          ? totalJobs === 0
            ? "No jobs match the selected filters."
            : `Showing ${loadedJobsCount} of ${totalJobs} matching job${totalJobs === 1 ? "" : "s"}.`
          : "\u00a0"}
      </p>
    </div>
  );
}
