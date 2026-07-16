import { useOutletContext } from "react-router-dom";
import { CreditCard, Plus } from "lucide-react";
import PageHeader from "@/common/ui/PageHeader";
import PurchaseHistoryTable from "../components/billing/PurchaseHistoryTable";
import CreditUsageTable from "../components/billing/CreditUsageTable";

export default function CreditsPage() {
  const { credits, openCreditsModal } = useOutletContext<{ credits: number; openCreditsModal: () => void }>();

  return (
    <div className="space-y-6">
      <PageHeader
        tag="Billing"
        title={<><span className="bg-gradient-to-r from-[#FF512F] to-[#FF7A00] bg-clip-text text-transparent">CREDITS & BILLING</span></>}
      />
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl p-4 shadow-md flex flex-col justify-between min-h-[120px]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Current Balance</p>
                <h3 className="text-2xl font-bold mt-1">{credits}</h3>
              </div>
              <div className="bg-white/10 p-2 rounded-lg">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-[10px] text-gray-400 font-medium mt-4">Equivalent to approx. {credits} full interview sessions.</p>
          </div>

          <div
            onClick={openCreditsModal}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-md flex flex-col justify-between min-h-[120px] group cursor-pointer hover:border-[#FF512F]/30 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Quick Top Up</p>
                <h3 className="text-lg sm:text-xl font-bold mt-1 text-gray-900">Add Credits</h3>
              </div>
              <div className="bg-[#FFEBEB] p-2 rounded-lg group-hover:bg-[#FF512F] transition-colors duration-300">
                <Plus className="w-5 h-5 text-[#FF512F] group-hover:text-white transition-colors duration-300" />
              </div>
            </div>

            <div className="flex items-end justify-between mt-4">
              <p className="text-[10px] text-gray-500 font-medium">
                Securely top up your balance for more interviews.
              </p>
            </div>
          </div>
        </div>

        <PurchaseHistoryTable />

        <CreditUsageTable />
      </div>
    </div>
  );
}
