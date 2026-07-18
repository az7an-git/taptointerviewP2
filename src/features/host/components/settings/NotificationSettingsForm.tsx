import { useState, useEffect } from "react";
import { PhoneInput } from "@/common/ui/PhoneInput";
import { isValidPhoneNumber } from "@/common/utils/phone";
import { authService } from "@/services/authService";
import { toast } from "sonner";
import { Spinner } from "@/common/ui/Spinner";
import { Check, ShieldAlert, AlertCircle, Bell, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/common/ui/button";
import ConfirmationModal from "@/common/ui/ConfirmationModal";
import NotificationSettingsSkeleton from "./NotificationSettingsSkeleton";
// import NotificationAttemptsLog from "./NotificationAttemptsLog";
import { OtpInput } from "@/common/ui/OtpInput";

interface NotificationSettingsFormProps {
    user: any;
    refreshUser: () => Promise<boolean>;
}

export default function NotificationSettingsForm({ refreshUser }: NotificationSettingsFormProps) {
    const [phone, setPhone] = useState("");
    const [smsConsent, setSmsConsent] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isSubmittingOtp, setIsSubmittingOtp] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [, setAttempts] = useState(0);
    const [isLockedOut, setIsLockedOut] = useState(false);
    const [verificationError, setVerificationError] = useState("");
    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
    const [isRemovingPhone, setIsRemovingPhone] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Preference states
    const [followMe, setFollowMe] = useState(false);
    const [savedFollowMe, setSavedFollowMe] = useState(false);
    const [emailChannelActive, setEmailChannelActive] = useState(false);
    const [smsChannelActive, setSmsChannelActive] = useState(false);
    const [isSavingPreferences, setIsSavingPreferences] = useState(false);
    const [isPhoneVerified, setIsPhoneVerified] = useState(false);

    const fetchSettings = async () => {
        try {
            const data = await authService.getNotificationSettings();
            setPhone(data.mobile_phone || "");
            setSmsConsent(Boolean(data.mobile_phone && data.sms_consent_active));
            setFollowMe(data.follow_me_enabled || false);
            setSavedFollowMe(data.follow_me_enabled || false);

            const verified = Boolean(data.phone_verified_at);
            setIsPhoneVerified(verified);
            setIsVerifying(Boolean(data.phone_verification_pending && !verified));

            setEmailChannelActive(Boolean(data.active_channels?.email));
            setSmsChannelActive(Boolean(data.active_channels?.sms));
            setAttempts(data.verification_attempts_remaining !== undefined ? 5 - data.verification_attempts_remaining : 0);
            if (data.phone_verification_locked || data.verification_attempts_remaining === 0) {
                setIsLockedOut(true);
            }
            setIsLoaded(true);
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to load notification settings.");
        }
    };

    // Sync state on load
    useEffect(() => {
        fetchSettings();
    }, []);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => {
                setResendCooldown((prev) => prev - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const hasPhoneInput = Boolean(phone && !/^\+\d{1,3}$/.test(phone.replace(/\s/g, "")));

    // Reset SMS consent if phone is cleared
    useEffect(() => {
        if (!hasPhoneInput) {
            setSmsConsent(false);
        }
    }, [phone, hasPhoneInput]);

    const handleSendOtp = async () => {
        if (!phone || !isValidPhoneNumber(phone)) {
            toast.error("Please enter a valid mobile phone number.");
            return;
        }
        if (!smsConsent) {
            toast.error("You must agree to the SMS consent policy to verify your phone.");
            return;
        }

        setIsSendingOtp(true);
        setVerificationError("");
        try {
            // Request verification code directly
            await authService.requestPhoneOtp(phone, smsConsent);
            toast.success("Verification code sent via SMS!");
            setIsVerifying(true);
            setResendCooldown(30);
            setAttempts(0);
            setIsLockedOut(false);
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.data || err.response?.data?.message || "Failed to send verification code.");
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otpCode.length !== 6) {
            toast.error("Please enter a 6-digit verification code.");
            return;
        }
        if (isLockedOut) {
            toast.error("Verification locked due to five failed attempts. Please use a corrected/different number.");
            return;
        }

        setIsSubmittingOtp(true);
        try {
            await authService.verifyPhoneOtp(otpCode);
            toast.success("Phone number verified successfully!");
            setIsVerifying(false);
            setOtpCode("");
            setVerificationError("");
            await fetchSettings();
            await refreshUser();
        } catch (err: any) {
            console.error(err);
            const errMsg = err.response?.data?.data || err.response?.data?.message || "Invalid code.";
            setVerificationError(errMsg);
            toast.error(errMsg);

            // Update state details (attempts count/lockout status) from the server
            await fetchSettings();
        } finally {
            setIsSubmittingOtp(false);
        }
    };

    const handleResendOtp = async () => {
        setIsSendingOtp(true);
        setVerificationError("");
        try {
            await authService.resendPhoneOtp();
            toast.success("Verification code resent successfully!");
            setResendCooldown(30);
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to resend verification code.");
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleRemovePhone = async () => {
        setIsRemovingPhone(true);
        try {
            // Call the new DELETE /auth/phone endpoint
            await authService.deletePhone();

            toast.success("Phone number removed successfully.");
            setIsVerifying(false);
            setPhone("");
            setSmsConsent(false);
            await fetchSettings();
            await refreshUser();
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to remove phone number.");
        } finally {
            setIsRemovingPhone(false);
            setIsRemoveModalOpen(false);
        }
    };

    const handleSavePreferences = async () => {
        setIsSavingPreferences(true);
        try {
            await authService.updateNotificationSettings({
                follow_me_enabled: followMe,
            });
            toast.success("Notification preferences updated!");
            await fetchSettings();
            await refreshUser();
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to update preferences.");
        } finally {
            setIsSavingPreferences(false);
        }
    };

    if (!isLoaded) {
        return <NotificationSettingsSkeleton />;
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold text-gray-900">Notification Settings</h3>
                <p className="text-xs text-gray-500 font-medium">Manage alert channels and notification preferences.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
                {/* Left Card: Mobile Phone Verification */}
                <div className="bg-gray-50/50 border border-gray-100 p-4 sm:p-5 rounded-xl space-y-4">
                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-start gap-1.5">
                        <MessageSquare className="w-4 h-4 text-[#FF512F] mt-0.5 flex-shrink-0" />
                        <span>SMS Mobile Verification</span>
                    </h4>

                    {isPhoneVerified ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-3 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <div className="bg-emerald-500 text-white rounded-full p-1">
                                        <Check className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-emerald-800">Phone Verified</p>
                                        <p className="text-xs text-emerald-600 font-medium">{phone}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsRemoveModalOpen(true)}
                                    className="text-xs text-red-500 hover:text-red-700 font-bold hover:underline cursor-pointer"
                                >
                                    Remove
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 leading-normal">
                                Your mobile phone number is linked and verified. SMS notification channels are unlocked.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {!isVerifying ? (
                                <>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Mobile Number</label>
                                        <PhoneInput
                                            value={phone}
                                            onChange={setPhone}
                                            className="bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus-within:border-[#FF512F] focus-within:ring-1 focus-within:ring-[#FF512F]"
                                        />
                                    </div>

                                    <div className="flex items-start gap-2 pt-1">
                                        <input
                                            id="settings-sms-consent"
                                            type="checkbox"
                                            checked={smsConsent}
                                            onChange={(e) => setSmsConsent(e.target.checked)}
                                            disabled={!hasPhoneInput}
                                            className="mt-0.5 rounded border-gray-300 bg-white text-[#FF512F] focus:ring-[#FF512F] h-4 w-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                        <label
                                            htmlFor="settings-sms-consent"
                                            className={`text-[11px] text-gray-500 leading-normal select-none ${!hasPhoneInput ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                                                }`}
                                        >
                                            I agree to receive SMS text message alerts when candidates join the waiting room.
                                        </label>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleSendOtp}
                                        disabled={isSendingOtp || !hasPhoneInput || !smsConsent}
                                        className="w-full bg-gradient-to-r from-[#FF512F] to-[#FF7A00] hover:from-[#E04020] hover:to-[#FF512F] text-white font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        {isSendingOtp ? (
                                            <>
                                                <Spinner className="h-3.5 w-3.5 border-white" />
                                                <span>Sending Code...</span>
                                            </>
                                        ) : (
                                            <span>Verify Phone Number</span>
                                        )}
                                    </button>
                                </>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg space-y-1">
                                        <div className="flex items-start gap-1.5 text-amber-800 text-xs font-bold">
                                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                            <span className="break-all sm:break-normal flex-1 min-w-0">Code Sent to {phone}</span>
                                        </div>
                                        <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                                            Enter the 6-digit code. Valid for 10 minutes. 5 verification attempts permitted before lockout.
                                        </p>
                                    </div>

                                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">6-Digit Verification Code</label>
                                            <OtpInput
                                                value={otpCode}
                                                onChange={setOtpCode}
                                                disabled={isSubmittingOtp || isLockedOut}
                                                inputClassName="w-full min-w-0 h-10 sm:h-11 text-center text-base sm:text-lg font-bold text-gray-800 bg-white border border-gray-200 rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:border-[#FF512F] focus:ring-1 focus:ring-[#FF512F] disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                            <div className="h-4 mt-1">
                                                {verificationError ? (
                                                    <p className="text-[11px] text-red-500 font-bold">
                                                        {verificationError}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>

                                        {isLockedOut && (
                                            <div className="flex items-center gap-1.5 text-red-650 text-xs font-bold">
                                                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                                                <span>Lockout Active (5 failed attempts).</span>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-end text-xs font-medium">
                                            {resendCooldown > 0 ? (
                                                <span className="text-gray-400">Resend in {resendCooldown}s</span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={handleResendOtp}
                                                    disabled={isSendingOtp}
                                                    className="text-[#FF512F] hover:text-[#FF7A00] font-bold cursor-pointer hover:underline"
                                                >
                                                    Resend Code
                                                </button>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isSubmittingOtp || otpCode.length !== 6 || isLockedOut}
                                            className="w-full bg-gradient-to-r from-[#FF512F] to-[#FF7A00] hover:from-[#E04020] hover:to-[#FF512F] text-white font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            {isSubmittingOtp ? (
                                                <>
                                                    <Spinner className="h-3.5 w-3.5 border-white" />
                                                    <span>Verifying...</span>
                                                </>
                                            ) : (
                                                <span>Verify Code</span>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Card: Channels & Preferences */}
                <div className="bg-gray-50/50 border border-gray-100 p-4 sm:p-5 rounded-xl space-y-5 flex flex-col justify-between">
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-start gap-1.5">
                            <Bell className="w-4 h-4 text-[#FF512F] mt-0.5 flex-shrink-0" />
                            <span>Preferences & Alert Channels</span>
                        </h4>

                        {/* Channels List */}
                        <div className="space-y-2">
                            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Active Channels</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="flex items-center justify-between gap-2 p-2 bg-white border border-gray-150 rounded-lg">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Mail className="w-4 h-4 text-[#FF512F] flex-shrink-0" />
                                        <span className="text-xs font-bold text-gray-700 truncate">Email</span>
                                    </div>
                                    {emailChannelActive ? (
                                        <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">Active</span>
                                    ) : (
                                        <span className="text-[10px] bg-gray-100 text-gray-500 font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">Inactive</span>
                                    )}
                                </div>
                                <div className={`flex items-center justify-between gap-2 p-2 bg-white border border-gray-150 rounded-lg ${!isPhoneVerified ? 'opacity-60' : ''}`}>
                                    <div className="flex items-center gap-2 min-w-0">
                                        <MessageSquare className="w-4 h-4 text-[#FF512F] flex-shrink-0" />
                                        <span className="text-xs font-bold text-gray-700 truncate">SMS / Text</span>
                                    </div>
                                    {!isPhoneVerified ? (
                                        <span className="text-[10px] bg-gray-100 text-gray-500 font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">Locked</span>
                                    ) : smsChannelActive ? (
                                        <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">Active</span>
                                    ) : (
                                        <span className="text-[10px] bg-gray-100 text-gray-500 font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">Inactive</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Alert Preferences */}
                        <div className="space-y-3 pt-2">
                            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Alert Preferences</div>

                            <label className="flex items-center justify-between gap-4 p-2.5 bg-white border border-gray-150 rounded-lg cursor-pointer select-none">
                                <div className="flex-1 min-w-0">
                                    <span className="text-xs font-bold text-gray-800 block">Follow Me Alerts</span>
                                    <p className="text-[10px] text-gray-500 font-medium leading-tight">Get join alerts when candidates enter the waiting room</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={followMe}
                                    onChange={(e) => setFollowMe(e.target.checked)}
                                    className="rounded border-gray-300 bg-white text-[#FF512F] focus:ring-[#FF512F] h-4 w-4 cursor-pointer flex-shrink-0"
                                />
                            </label>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleSavePreferences}
                        disabled={isSavingPreferences || followMe === savedFollowMe}
                        className="w-full justify-center gap-1.5 text-xs py-2 h-9 cursor-pointer font-bold"
                    >
                        {isSavingPreferences ? (
                            <>
                                <Spinner className="h-3.5 w-3.5 border-current" />
                                <span>Saving Preferences...</span>
                            </>
                        ) : (
                            <span>Save Alert Preferences</span>
                        )}
                    </Button>
                </div>
            </div>

            {/* Delivery Log
      <div className="bg-gray-50/50 border border-gray-100 p-4 sm:p-5 rounded-xl max-w-4xl">
        <NotificationAttemptsLog />
      </div>
      */}

            <ConfirmationModal
                isOpen={isRemoveModalOpen}
                onClose={() => setIsRemoveModalOpen(false)}
                onConfirm={handleRemovePhone}
                title="Remove Phone Number"
                description="Are you sure you want to remove your phone number? This will disable SMS text message alerts."
                confirmText="Remove"
                cancelText="Cancel"
                isLoading={isRemovingPhone}
                variant="danger"
            />
        </div>
    );
}
