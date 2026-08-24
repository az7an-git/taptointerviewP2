import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { billingApi, PurchaseItem } from "@/api/billingApi";
import TablePagination from "@/common/ui/TablePagination";
import { formatDate } from "@/lib/utils";

let globalPurchaseCache: { [page: number]: PurchaseItem[] } = {};
let globalPurchasePaginationCache: { [page: number]: any } = {};

export default function PurchaseHistoryTable() {
  const [page, setPage] = useState(1);
  const [purchases, setPurchases] = useState<PurchaseItem[]>(globalPurchaseCache[1] || []);
  const [loading, setLoading] = useState(!globalPurchaseCache[1]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: globalPurchasePaginationCache[1]?.totalPages || 1,
    totalCount: globalPurchasePaginationCache[1]?.totalCount || 0,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchPurchases = async () => {
      try {
        if (!globalPurchaseCache[page]) setLoading(true);

        // If we have cache, set it immediately so UI updates instantly when changing pages
        if (globalPurchaseCache[page]) {
          setPurchases(globalPurchaseCache[page]);
          setPagination(prev => ({
            ...prev,
            page,
            totalPages: globalPurchasePaginationCache[page]?.totalPages || prev.totalPages,
            totalCount: globalPurchasePaginationCache[page]?.totalCount || prev.totalCount,
          }));
        }

        const response = await billingApi.getPurchaseHistory(page, 10);
        if (isMounted) {
          setPurchases(response.purchases);
          setPagination({
            page: response.pagination.current_page,
            limit: response.pagination.limit,
            totalPages: response.pagination.total_pages,
            totalCount: response.pagination.total_count,
          });

          globalPurchaseCache[page] = response.purchases;
          globalPurchasePaginationCache[page] = {
            totalPages: response.pagination.total_pages,
            totalCount: response.pagination.total_count,
          };
        }
      } catch (error) {
        console.error("Failed to fetch purchase history:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPurchases();

    return () => {
      isMounted = false;
    };
  }, [page]);

  const showSkeleton = loading && purchases.length === 0;
  const isRefreshing = loading && purchases.length > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Purchase History</h3>

      {showSkeleton ? (
        <div className="flex-1 overflow-x-auto pb-2">
          <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                <th className="pb-3 font-semibold text-left">Date</th>
                <th className="pb-3 px-6 font-semibold text-center">Credits Purchased</th>
                <th className="pb-3 px-4 font-semibold text-center">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3.5 flex items-center gap-2">
                    <div className="w-3.5 h-3.5 bg-gray-200 rounded-sm"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-4 bg-gray-200 rounded w-12 mx-auto"></div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : purchases.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-gray-500">
          <ShieldCheck className="w-10 h-10 text-gray-300 mb-2" />
          <p className="text-sm font-medium">No transactions yet.</p>
          <p className="text-xs text-gray-400 mt-1">Purchases you make will show up here.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between">
          <div
            className={`overflow-x-auto pb-2 transition-opacity duration-200 ${isRefreshing ? "opacity-50 pointer-events-none" : ""}`}
            aria-busy={isRefreshing}
          >
            <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                  <th className="pb-3 font-semibold text-left">Date</th>
                  <th className="pb-3 px-6 font-semibold text-center">Credits Purchased</th>
                  <th className="pb-3 px-4 font-semibold text-center">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {purchases.map((purchase) => (
                  <tr key={purchase.id} className="group hover:bg-[#FFF5F2]/60 transition-colors">
                    <td className="py-3.5 px-2 font-medium text-gray-600 group-hover:text-[#FF512F] transition-colors flex items-center gap-2">
                      {formatDate(purchase.created_at)}
                    </td>
                    <td className="py-3.5 px-6 text-center font-bold text-emerald-600">
                      +{purchase.credits}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-gray-900">
                      {purchase.balance_after}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <TablePagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
