interface ParticipantHeaderProps {
  companyName: string;
}

export function ParticipantHeader({ companyName }: ParticipantHeaderProps) {
  return (
    <header className="border-b border-white/5 bg-black/20 backdrop-blur-md relative z-10 w-full flex-shrink-0">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-[#FF512F] to-[#E04020] rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-[#FF512F]/20">
            {companyName.charAt(0).toUpperCase()}
          </div>
          <span className="font-black text-base sm:text-lg text-white tracking-tighter uppercase truncate max-w-[160px] sm:max-w-[200px] md:max-w-none">
            {companyName}
          </span>
        </div>
        <div className="text-[10px] text-gray-500 font-medium flex flex-col items-end sm:flex-row sm:items-center sm:gap-1 flex-shrink-0">
          <span className="whitespace-nowrap">Powered by</span>
          <span className="font-bold text-white/80 whitespace-nowrap">
            Tap To Interview
          </span>
        </div>
      </div>
    </header>
  );
}
