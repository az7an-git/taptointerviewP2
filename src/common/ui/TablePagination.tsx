import { ChevronLeft, ChevronRight } from "lucide-react";

interface TablePaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

export default function TablePagination({ page, totalPages, onPageChange }: TablePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm mt-4">
      <p className="text-xs text-gray-500 font-medium whitespace-nowrap text-center sm:text-left">
        Page {page} of {totalPages}
      </p>
      <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto sm:items-center sm:gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="h-9 min-w-0 px-2 sm:px-3 flex items-center justify-center gap-1.5 border border-gray-200 rounded-lg text-xs font-bold transition-colors text-gray-800 bg-white hover:bg-gray-50 hover:border-gray-300 disabled:text-gray-400 disabled:bg-gray-50 disabled:border-gray-100 disabled:hover:bg-gray-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 shrink-0" />
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="h-9 min-w-0 px-2 sm:px-3 flex items-center justify-center gap-1.5 border border-gray-200 rounded-lg text-xs font-bold transition-colors text-gray-800 bg-white hover:bg-gray-50 hover:border-gray-300 disabled:text-gray-400 disabled:bg-gray-50 disabled:border-gray-100 disabled:hover:bg-gray-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Next
          <ChevronRight className="w-4 h-4 shrink-0" />
        </button>
      </div>
    </div>
  );
}
