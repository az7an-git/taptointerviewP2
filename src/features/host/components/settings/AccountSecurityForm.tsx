import { Eye, EyeOff } from "lucide-react";
import Select from "@/common/components/ui/Select";

interface AccountSecurityFormProps {
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  email: string;
  selectedTimezone: string;
  setSelectedTimezone: (v: string) => void;
  selectOptions: Array<{ value: string; label: string }>;
  currentPassword: string;
  setCurrentPassword: (v: string) => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  showCurrentPassword: boolean;
  setShowCurrentPassword: (v: boolean) => void;
  showNewPassword: boolean;
  setShowNewPassword: (v: boolean) => void;
}

export function AccountSecurityForm({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  email,
  selectedTimezone,
  setSelectedTimezone,
  selectOptions,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  showCurrentPassword,
  setShowCurrentPassword,
  showNewPassword,
  setShowNewPassword,
}: AccountSecurityFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900">Account & Security</h3>
        <p className="text-xs text-gray-500 font-medium">Manage your account credentials.</p>
      </div>

      <div className="space-y-4 max-w-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">First Name</label>
            <input
              type="text"
              name="given-name"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF512F] focus:ring-1 focus:ring-[#FF512F] transition-all"
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Last Name</label>
            <input
              type="text"
              name="family-name"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF512F] focus:ring-1 focus:ring-[#FF512F] transition-all"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Email Address</label>
          <input
            type="email"
            value={email}
            className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 focus:outline-none cursor-not-allowed transition-all"
            disabled
          />
        </div>

        <Select
          label="Timezone"
          value={selectedTimezone}
          options={selectOptions}
          onChange={(tz) => setSelectedTimezone(tz)}
        />

        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Current Password</label>
          <div className="relative">
            <input
              type={showCurrentPassword ? "text" : "password"}
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value.replace(/\s/g, ""))}
              className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF512F] focus:ring-1 focus:ring-[#FF512F] transition-all pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">New Password</label>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value.replace(/\s/g, ""))}
              className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF512F] focus:ring-1 focus:ring-[#FF512F] transition-all pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
