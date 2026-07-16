import { ShieldCheck } from "lucide-react";

export function ParticipantFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-6 border-t border-white/5 bg-black/20 backdrop-blur-md w-full flex-shrink-0 relative z-10 px-4">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        {/* Security / Compliance Tag */}
        <div className="flex items-center gap-2 text-gray-500 font-medium order-2 md:order-1">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="leading-none">
            Your data is processed securely.
          </span>
        </div>

        {/* Brand*/}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-gray-500 font-medium order-1 md:order-2">
          <span>&copy; {currentYear} Tap To Interview</span>
        </div>
      </div>
    </footer>
  );
}
