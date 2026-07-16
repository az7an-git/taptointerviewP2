import React from "react";

interface PageHeaderProps {
  tag: string;
  title: string | React.ReactNode;
  actions?: React.ReactNode;
  truncateTitle?: boolean;
}

export default function PageHeader({ tag, title, actions, truncateTitle }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="w-5 h-1 bg-gradient-to-r from-[#FF512F] to-[#E04020] rounded-full shrink-0"></span>
          <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">{tag}</span>
        </div>
        <h2 className={`text-2xl md:text-3xl font-bold text-gray-900 tracking-tight ${truncateTitle ? "truncate" : "break-words whitespace-normal"}`}>
          {title}
        </h2>
      </div>
      {actions && (
        <div className="shrink-0 flex items-center gap-3 self-end md:self-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
