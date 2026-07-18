import { useState, useEffect } from "react";
import { Building2, Lock, Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/authService";
import { toast } from "sonner";
import { Spinner } from "@/common/ui/Spinner";
import { canUpdateCompany } from "@/common/utils/permissions";
import { TIMEZONE_OPTIONS } from "@/common/utils/timezone";
import { initialNameFieldsFromUser } from "@/common/utils/userDisplayName";
import { CompanyProfileForm, AccountSecurityForm, NotificationSettingsForm } from "../components";
import PageHeader from "@/common/ui/PageHeader";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem("settingsActiveTab") || "profile");
  const [selectedTimezone, setSelectedTimezone] = useState(user?.timezone || "");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companySlug, setCompanySlug] = useState(user?.company?.company_slug || "");
  const [companyName, setCompanyName] = useState(user?.company?.company_name || "");
  const [companyUrl, setCompanyUrl] = useState(user?.company?.company_url || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const canEditCompanyProfile = canUpdateCompany(user);

  const savedNames = user ? initialNameFieldsFromUser(user) : { firstName: "", lastName: "" };
  const isDirty =
    firstName !== savedNames.firstName ||
    lastName !== savedNames.lastName ||
    companyName !== (user?.company?.company_name || "") ||
    selectedTimezone !== (user?.timezone || "") ||
    currentPassword !== "" ||
    newPassword !== "";

  useEffect(() => {
    if (user) {
      const { firstName: f, lastName: l } = initialNameFieldsFromUser(user);
      setFirstName(f);
      setLastName(l);
      setCompanySlug(user.company?.company_slug || "");
      setCompanyName(user.company?.company_name || "");
      setCompanyUrl(user.company?.company_url || "");
      setEmail(user.email || "");
      setSelectedTimezone(user.timezone || "");
    }
  }, [user]);

  useEffect(() => {
    if (user && !canEditCompanyProfile && activeTab === "profile") {
      setActiveTab("account");
      localStorage.setItem("settingsActiveTab", "account");
    }
  }, [user, canEditCompanyProfile, activeTab]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (activeTab === "profile" && canEditCompanyProfile) {
        await authService.updateCompany({
          company_name: companyName,
        });
        await refreshUser();
        toast.success("Profile updated successfully!");
      } else if (activeTab === "account") {
        if (!firstName.trim() || !lastName.trim()) {
          toast.error("First name and last name are required.");
          setIsSaving(false);
          return;
        }
        let passwordUpdated = false;
        const isChangingPassword = Boolean(currentPassword || newPassword);
        const namesChanged =
          firstName.trim() !== savedNames.firstName ||
          lastName.trim() !== savedNames.lastName;
        const timezoneChanged = selectedTimezone !== (user?.timezone || "");

        const profilePayload: {
          first_name?: string;
          last_name?: string;
          timezone?: string;
        } = {};
        if (namesChanged) {
          profilePayload.first_name = firstName.trim();
          profilePayload.last_name = lastName.trim();
        }
        if (timezoneChanged && !isChangingPassword) {
          profilePayload.timezone = selectedTimezone;
        }
        if (Object.keys(profilePayload).length > 0) {
          await authService.updateProfile(profilePayload);
        }

        // Update password if fields are filled
        if (isChangingPassword) {
          if (!currentPassword || !newPassword) {
            toast.error("Please fill both password fields.");
            setIsSaving(false);
            return;
          }
          await authService.changePassword({
            current_password: currentPassword,
            new_password: newPassword,
          });
          passwordUpdated = true;
          setCurrentPassword("");
          setNewPassword("");
        }

        await refreshUser();

        if (passwordUpdated) {
          toast.success("Account settings and password updated!");
        } else {
          toast.success("Account settings updated!");
        }
      }
    } catch (error: any) {
      console.error("Failed to update settings", error);
      toast.error(error.response?.data?.data || "Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  const selectOptions = TIMEZONE_OPTIONS.some((tz) => tz.value === selectedTimezone)
    ? TIMEZONE_OPTIONS
    : selectedTimezone
      ? [{ value: selectedTimezone, label: selectedTimezone }, ...TIMEZONE_OPTIONS]
      : TIMEZONE_OPTIONS;

  return (
    <div className="space-y-6 animate-page-fade-in">
      {/* CSS for custom scrollbar */}
      <style>{`
        .scrollbar-custom::-webkit-scrollbar {
          width: 4px;
          height: 2px;
        }
        .scrollbar-custom::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: #E5E7EB;
          border-radius: 2px;
        }
        @keyframes customFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-tab-content {
          animation: customFadeIn 0.2s ease-in-out forwards;
        }
      `}</style>

      {/* Header */}
      <PageHeader
        tag="Preferences"
        title={
          <span className="bg-gradient-to-r from-[#FF512F] to-[#FF7A00] bg-clip-text text-transparent">
            SETTINGS
          </span>
        }
      />

      <div className="bg-white border border-[#FF2602]/30 shadow-[0_12px_30px_-5px_rgba(0,0,0,0.1)] rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 min-h-[350px]">
          {/* Sidebar Tabs */}
          <div className="flex flex-row md:flex-col border-b md:border-b-0 md:border-r border-[#FF2602]/10 bg-gray-50/50 p-2 md:p-4 gap-1 overflow-x-auto scrollbar-custom rounded-t-xl md:rounded-l-xl md:rounded-tr-none">
            {canEditCompanyProfile && (
              <button
                onClick={() => {
                  setActiveTab("profile");
                  localStorage.setItem("settingsActiveTab", "profile");
                }}
                className={`flex items-center gap-2 px-3 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap md:whitespace-normal w-auto md:w-full flex-shrink-0 md:flex-shrink ${activeTab === "profile"
                  ? "bg-gradient-to-r from-[#FF512F]/10 to-[#FF7A00]/10 border border-[#FF512F]/20 shadow-sm text-[#FF512F]"
                  : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
                  }`}
              >
                <Building2 className="w-4 h-4 flex-shrink-0" />
                <span>Company Profile</span>
              </button>
            )}
            <button
              onClick={() => {
                setActiveTab("account");
                localStorage.setItem("settingsActiveTab", "account");
              }}
              className={`flex items-center gap-2 px-3 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap md:whitespace-normal w-auto md:w-full flex-shrink-0 md:flex-shrink ${activeTab === "account"
                ? "bg-gradient-to-r from-[#FF512F]/10 to-[#FF7A00]/10 border border-[#FF512F]/20 shadow-sm text-[#FF512F]"
                : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
                }`}
            >
              <Lock className="w-4 h-4 flex-shrink-0" />
              <span>Account & Security</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("notifications");
                localStorage.setItem("settingsActiveTab", "notifications");
              }}
              className={`flex items-center gap-2 px-3 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap md:whitespace-normal w-auto md:w-full flex-shrink-0 md:flex-shrink ${activeTab === "notifications"
                ? "bg-gradient-to-r from-[#FF512F]/10 to-[#FF7A00]/10 border border-[#FF512F]/20 shadow-sm text-[#FF512F]"
                : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
                }`}
            >
              <Bell className="w-4 h-4 flex-shrink-0" />
              <span>Notifications</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="md:col-span-2 p-4 md:p-6 flex flex-col">
            <div key={activeTab} className="animate-tab-content flex-1 relative z-10">
              {activeTab === "profile" && canEditCompanyProfile && (
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                  <CompanyProfileForm
                    companyName={companyName}
                    setCompanyName={setCompanyName}
                    companySlug={companySlug}
                    companyUrl={companyUrl}
                  />
                  <div className="mt-8 pt-4 border-t border-gray-100 flex justify-start max-w-lg">
                    <button
                      type="submit"
                      className="w-full md:w-auto md:min-w-[140px] bg-gradient-to-r from-[#FF512F] to-[#FF7A00] hover:from-[#E04020] hover:to-[#FF512F] text-white font-bold px-5 py-2 rounded-lg transition-all flex items-center gap-2 text-sm shadow-sm hover:shadow-md cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center"
                      disabled={isSaving || !isDirty}
                    >
                      {isSaving ? (
                        <>
                          <Spinner className="h-4 w-4 border-t-2 border-b-2 border-white" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Save Changes</span>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {activeTab === "account" && (
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                  <AccountSecurityForm
                    firstName={firstName}
                    setFirstName={setFirstName}
                    lastName={lastName}
                    setLastName={setLastName}
                    email={email}
                    selectedTimezone={selectedTimezone}
                    setSelectedTimezone={setSelectedTimezone}
                    selectOptions={selectOptions}
                    currentPassword={currentPassword}
                    setCurrentPassword={setCurrentPassword}
                    newPassword={newPassword}
                    setNewPassword={setNewPassword}
                    showCurrentPassword={showCurrentPassword}
                    setShowCurrentPassword={setShowCurrentPassword}
                    showNewPassword={showNewPassword}
                    setShowNewPassword={setShowNewPassword}
                  />
                  <div className="mt-8 pt-4 border-t border-gray-100 flex justify-start max-w-lg">
                    <button
                      type="submit"
                      className="w-full md:w-auto md:min-w-[140px] bg-gradient-to-r from-[#FF512F] to-[#FF7A00] hover:from-[#E04020] hover:to-[#FF512F] text-white font-bold px-5 py-2 rounded-lg transition-all flex items-center gap-2 text-sm shadow-sm hover:shadow-md cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center"
                      disabled={isSaving || !isDirty}
                    >
                      {isSaving ? (
                        <>
                          <Spinner className="h-4 w-4 border-t-2 border-b-2 border-white" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Save Changes</span>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {activeTab === "notifications" && (
                <NotificationSettingsForm user={user} refreshUser={refreshUser} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
