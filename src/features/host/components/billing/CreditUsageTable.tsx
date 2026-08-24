import { useEffect, useState } from "react";
import { ShieldCheck, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { billingApi, CreditUsageEntry } from "@/api/billingApi";
import TablePagination from "@/common/ui/TablePagination";
import { formatDate } from "@/lib/utils";

let globalUsageCache: { [page: number]: CreditUsageEntry[] } = {};
let globalUsagePaginationCache: { [page: number]: any } = {};

export default function CreditUsageTable() {
  const [usagePage, setUsagePage] = useState(1);
  const [usageEntries, setUsageEntries] = useState<CreditUsageEntry[]>(globalUsageCache[1] || []);
  const [usageLoading, setUsageLoading] = useState(!globalUsageCache[1]);
  const [usagePagination, setUsagePagination] = useState({
    page: 1,
    limit: 10,
    totalPages: globalUsagePaginationCache[1]?.totalPages || 1,
    totalCount: globalUsagePaginationCache[1]?.totalCount || 0,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchUsage = async () => {
      try {
        if (!globalUsageCache[usagePage]) setUsageLoading(true);

        // If we have cache, set it immediately so UI updates instantly
        if (globalUsageCache[usagePage]) {
          setUsageEntries(globalUsageCache[usagePage]);
          setUsagePagination(prev => ({
            ...prev,
            page: usagePage,
            totalPages: globalUsagePaginationCache[usagePage]?.totalPages || prev.totalPages,
            totalCount: globalUsagePaginationCache[usagePage]?.totalCount || prev.totalCount,
          }));
        }

        const response = await billingApi.getCreditUsage(usagePage, 10);
        if (isMounted) {
          setUsageEntries(response.entries);
          setUsagePagination({
            page: response.pagination.current_page,
            limit: response.pagination.limit,
            totalPages: response.pagination.total_pages,
            totalCount: response.pagination.total_count,
          });

          globalUsageCache[usagePage] = response.entries;
          globalUsagePaginationCache[usagePage] = {
            totalPages: response.pagination.total_pages,
            totalCount: response.pagination.total_count,
          };
        }
      } catch (error) {
        console.error("Failed to fetch credit usage history:", error);
      } finally {
        if (isMounted) {
          setUsageLoading(false);
        }
      }
    };

    fetchUsage();

    return () => {
      isMounted = false;
    };
  }, [usagePage]);

  const showUsageSkeleton = usageLoading && usageEntries.length === 0;
  const isUsageRefreshing = usageLoading && usageEntries.length > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Credit Usage</h3>

      {showUsageSkeleton ? (
        <div className="flex-1 overflow-x-auto pb-2">
          <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                <th className="pb-3 font-semibold text-left">Date</th>
                <th className="pb-3 px-4 font-semibold text-left">Participant</th>
                <th className="pb-3 px-4 font-semibold text-left">Job</th>
                <th className="pb-3 px-4 font-semibold text-center">Type</th>
                <th className="pb-3 px-4 font-semibold text-center">Amount</th>
                <th className="pb-3 px-4 font-semibold text-center">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3.5 flex items-center gap-2">
                    <div className="w-3.5 h-3.5 bg-gray-200 rounded-sm"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </td>
                  <td className="py-3.5 px-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                  <td className="py-3.5 px-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                  <td className="py-3.5 px-4"><div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div></td>
                  <td className="py-3.5 px-4"><div className="h-4 bg-gray-200 rounded w-8 mx-auto"></div></td>
                  <td className="py-3.5 px-4"><div className="h-4 bg-gray-200 rounded w-12 mx-auto"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : usageEntries.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-gray-500">
          <ShieldCheck className="w-10 h-10 text-gray-300 mb-2" />
          <p className="text-sm font-medium">No credit usage yet.</p>
          <p className="text-xs text-gray-400 mt-1">Interviews that consume credits will appear here.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between">
          <div
            className={`overflow-x-auto pb-2 transition-opacity duration-200 ${isUsageRefreshing ? "opacity-50 pointer-events-none" : ""}`}
            aria-busy={isUsageRefreshing}
          >
            <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                  <th className="pb-3 font-semibold text-left">Date</th>
                  <th className="pb-3 px-4 font-semibold text-left">Participant</th>
                  <th className="pb-3 px-4 font-semibold text-left">Job</th>
                  <th className="pb-3 px-4 font-semibold text-center">Type</th>
                  <th className="pb-3 px-4 font-semibold text-center">Amount</th>
                  <th className="pb-3 px-4 font-semibold text-center">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usageEntries.map((entry) => (
                  <tr key={entry.id} className="group hover:bg-[#FFF5F2]/60 transition-colors">
                    <td className="py-3.5 px-2 font-medium text-gray-600 group-hover:text-[#FF512F] transition-colors flex items-center gap-2">
                      {formatDate(entry.created_at)}
                    </td>
                    <td
                      className="py-3.5 px-4 text-gray-800 group-hover:text-[#FF512F] transition-colors max-w-[170px] truncate"
                      title={`${entry.participant?.first_name} ${entry.participant?.last_name}`}
                    >
                      {entry.participant?.first_name} {entry.participant?.last_name}
                    </td>
                    <td
                      className="py-3.5 px-4 text-gray-800 max-w-[180px] truncate"
                      title={entry.job?.title}
                    >
                      {entry.job?.title}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {entry.type === "return" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 text-xs font-bold">
                          <ArrowUpRight className="w-3 h-3" />
                          Return
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-rose-50 text-rose-600 text-xs font-bold">
                          <ArrowDownRight className="w-3 h-3" />
                          Deduction
                        </span>
                      )}
                    </td>
                    <td className={`py-3.5 px-4 text-center font-bold ${entry.amount > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {entry.amount > 0 ? `+${entry.amount}` : entry.amount}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-gray-900">
                      {entry.balance_after}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Usage Pagination Controls */}
          <TablePagination
            page={usagePagination.page}
            totalPages={usagePagination.totalPages}
            onPageChange={setUsagePage}
          />
        </div>
      )}
    </div>
  );
}
