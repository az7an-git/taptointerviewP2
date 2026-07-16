import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface CompanyProfileFormProps {
  companyName: string;
  setCompanyName: (v: string) => void;
  companySlug: string;
  companyUrl: string;
}

export function CompanyProfileForm({
  companyName,
  setCompanyName,
  companySlug,
  companyUrl,
}: CompanyProfileFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900">Company Profile</h3>
        <p className="text-xs text-gray-500 font-medium">Update your company details and branding.</p>
      </div>

      <div className="space-y-4 max-w-lg">
        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Company Name</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF512F] focus:ring-1 focus:ring-[#FF512F] transition-all"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Company Slug</label>
          <input
            type="text"
            value={companySlug}
            className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 focus:outline-none cursor-not-allowed transition-all"
            disabled
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Company URL</label>
          <div className="flex gap-2 mt-1">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 truncate select-all">
              {companyUrl}
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(companyUrl);
                toast.success("Company URL copied to clipboard!");
              }}
              className="px-3 bg-white border border-gray-200 hover:border-[#FF512F] hover:text-[#FF512F] rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center"
              title="Copy to clipboard"
            >
              <Copy className="w-4 h-4" />
            </button>
            <a
              href={`${window.location.origin}/company/${companySlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 bg-gradient-to-r from-[#FF512F] to-[#FF7A00] hover:from-[#E04020] hover:to-[#FF512F] text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 justify-center shadow-sm"
              title="Open local preview"
            >
              <span>Preview</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
