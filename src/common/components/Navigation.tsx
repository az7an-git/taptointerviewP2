import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Briefcase, Users, Settings, Plus, CreditCard } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useMemo } from "react";
import { POST_JOB_NEW_INTENT } from "@/features/host/utils/postJobWizardStorage";
import { canManageTeam } from "@/common/utils/permissions";

interface NavigationProps {
  onItemClick?: () => void;
}

export default function Navigation({ onItemClick }: NavigationProps) {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => {
    if (location.pathname === path) return true;
    if (path.endsWith('/jobs') && location.pathname.includes('/jobs/post')) return false;
    return path !== "/" && location.pathname.startsWith(path);
  };

  const basePath = user?.role === 'interviewer' ? '/interviewer' : '/admin';

  const items = useMemo(() => [
    { path: `${basePath}/dashboard`, label: "Dashboard", icon: LayoutDashboard },
    { path: `${basePath}/queue`, label: "My Queue", icon: Users },
    { path: `${basePath}/jobs`, label: "My Jobs", icon: Briefcase },
    { path: `${basePath}/jobs/post`, label: "Post Job", icon: Plus, linkState: POST_JOB_NEW_INTENT, condition: user?.role !== 'interviewer' },
    { path: `${basePath}/team`, label: "Team", icon: Users, condition: canManageTeam(user?.role) },
    { path: `${basePath}/settings`, label: "Settings", icon: Settings },
    { path: `${basePath}/credits`, label: "Credits", icon: CreditCard, condition: user?.role !== 'interviewer' },
  ].filter(item => item.condition !== false), [user?.role, basePath]);

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = isActive(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            state={"linkState" in item ? item.linkState : undefined}
            onClick={(e) => {
              e.preventDefault();
              window.dispatchEvent(
                new CustomEvent("trigger-navigation", {
                  detail: {
                    path: item.path,
                    state: "linkState" in item ? item.linkState : undefined,
                  },
                })
              );
              onItemClick?.();
            }}
            className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 ${active
              ? "text-[#FF512F]"
              : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
          >
            {/* Active Background */}
            <div
              className={`absolute inset-0 rounded-lg transition-opacity duration-200 ${active ? "opacity-100" : "opacity-0"}`}
              style={{ zIndex: 0, background: "rgba(255, 81, 47, 0.12)" }}
            />

            {/* Left Accent Bar */}
            <div
              className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full transition-all duration-200 ${active ? "opacity-100 h-[60%]" : "opacity-0 h-0"}`}
              style={{ zIndex: 1, background: "#FF512F" }}
            />

            {/* Content */}
            <div className="relative z-10 flex items-center gap-3">
              <item.icon className="w-5 h-5" />
              {item.label}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

