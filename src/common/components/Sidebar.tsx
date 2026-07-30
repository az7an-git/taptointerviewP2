import Navigation from "./Navigation";
import { X, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { displayRoleLabel, initialsFromDisplayName } from "@/common/utils/userDisplayName";

interface SidebarProps {
  onLogout?: () => void;
  fullName?: string;
  isOpen: boolean;
  onClose: () => void;
  role?: string;
}

function Sidebar({ onLogout, fullName, isOpen, onClose, role }: SidebarProps) {
  const displayName = fullName?.trim() || "User";
  const initials = initialsFromDisplayName(displayName);
  const roleLabel = displayRoleLabel(role);

  return (
    <>
      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-60 bg-[#111827] text-white flex flex-col
        transform ${isOpen ? "translate-x-0" : "-translate-x-full"}
        transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:flex
      `}>
        {/* Brand & Close Button */}
        <div className="h-14 flex items-center justify-between px-3 border-b border-gray-800/50 shrink-0">
          <Link
            onClick={(e) => {
              e.preventDefault();
              const targetPath = role === 'interviewer' ? "/interviewer/dashboard" : "/admin/dashboard";
              window.dispatchEvent(
                new CustomEvent("trigger-navigation", {
                  detail: { path: targetPath },
                })
              );
              onClose();
            }}
            to={role === 'interviewer' ? "/interviewer/dashboard" : "/admin/dashboard"}
            className="text-xl font-black tracking-tight whitespace-nowrap hover:opacity-90 transition-opacity"
          >
            TAP TO <span className="text-[#FF512F]">INTERVIEW</span>
          </Link>
          {/* Close button on mobile */}
          <button
            className="lg:hidden text-gray-300 hover:text-[#FF512F] cursor-pointer"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="p-4 flex-1 overflow-y-auto min-h-0">
          {/* Nav */}
          <Navigation onItemClick={onClose} />
        </div>

        {/* Bottom Profile & Logout */}
        <div className="bg-[#0B0F19] shrink-0 border-t border-gray-800/40">
          <div className="py-3 px-3 items-center gap-2 border-b border-gray-800/40 flex">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#FF512F] rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-white text-sm">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm text-white truncate" title={displayName}>
                {displayName}
              </div>
              {roleLabel && (
                <div className="text-xs text-gray-400 font-medium truncate">{roleLabel}</div>
              )}
            </div>
          </div>

          {/* Logout Button (Mobile only) */}
          <button
            className="w-full py-3 px-4 gap-2 text-sm font-medium text-gray-400 hover:text-[#FF3B30] hover:bg-[#111827]/40 transition-colors cursor-pointer flex items-center justify-center lg:hidden"
            onClick={onLogout}
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
