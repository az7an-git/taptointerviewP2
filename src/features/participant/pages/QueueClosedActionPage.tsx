import { useState, useEffect, type ReactNode } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Bookmark,
  LogOut,
} from "lucide-react";
import { participantApi } from "@/api/participantApi";
import type { ReserveResult } from "@/api/participantApi";
import { formatWindowIso, parseWindowIso } from "@/common/utils/queueWindowDatetime";
import { ParticipantHeader, ParticipantFooter } from "../components";
import { Spinner } from "@/common/ui/Spinner";

function formatNextWindowNote(startsAt: string, endsAt: string): string {
  const startParts = parseWindowIso(startsAt);
  if (!startParts) return "You'll be moved back to the waiting queue when the next window opens.";
  const dateStr = new Date(startParts.year, startParts.month - 1, startParts.day).toLocaleDateString(
    undefined,
    { weekday: "short", month: "short", day: "numeric" }
  );
  const { time: startTime } = formatWindowIso(startsAt);
  const { time: endTime } = formatWindowIso(endsAt);
  return `Next window: ${dateStr}, ${startTime} – ${endTime}. You'll rejoin the queue automatically when it opens.`;
}

type QueueClosedAction = "reserve" | "release";

const ACTION_CONFIG: Record<
  QueueClosedAction,
  {
    label: string;
    processing: string;
    successTitle: string;
    successMessage: string;
    successNote?: string;
    errorFallback: string;
    icon: typeof Bookmark;
    call: (token: string) => ReturnType<typeof participantApi.reserveSpot>;
  }
> = {
  reserve: {
    label: "Reserve My Spot",
    processing: "Reserving your spot...",
    successTitle: "Spot Reserved",
    successMessage:
      "Your position has been reserved for the next available interview window.",
    successNote:
      "If we don't hear from you within 24 hours, your position will be released automatically.",
    errorFallback: "Unable to reserve your spot. The link may be invalid or expired.",
    icon: Bookmark,
    call: participantApi.reserveSpot,
  },
  release: {
    label: "Release My Position",
    processing: "Releasing your position...",
    successTitle: "Position Released",
    successMessage: "You've been removed from the interview queue.",
    successNote: "You can re-apply when the next interview window opens.",
    errorFallback: "Unable to release your position. The link may be invalid or expired.",
    icon: LogOut,
    call: participantApi.releasePosition,
  },
};

interface QueueClosedActionPageProps {
  action: QueueClosedAction;
}

export default function QueueClosedActionPage({ action }: QueueClosedActionPageProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [isProcessing, setIsProcessing] = useState(Boolean(token));
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  const config = ACTION_CONFIG[action];
  const ActionIcon = config.icon;

  useEffect(() => {
    if (!token) {
      setError("No token found in this link. Please use the link from your email.");
      setIsProcessing(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        const response = await config.call(token);
        if (cancelled) return;

        if (response.status === "success" && response.data) {
          setSucceeded(true);
          setSuccessMessage(response.data.message ?? config.successMessage);
          if (action === "reserve") {
            const data = response.data as ReserveResult;
            setSuccessNote(
              data.next_window
                ? formatNextWindowNote(data.next_window.starts_at, data.next_window.ends_at)
                : config.successNote ?? null
            );
          } else {
            setSuccessNote(config.successNote ?? null);
          }
        } else {
          const msg =
            typeof response.data === "string"
              ? response.data
              : response.data?.message;
          setError(msg ?? config.errorFallback);
        }
      } catch (err: any) {
        if (cancelled) return;
        const msg: string | undefined = err.response?.data?.data;
        setError(msg ?? config.errorFallback);
      } finally {
        if (!cancelled) setIsProcessing(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [token, action]);

  return (
    <div className="fixed inset-0 bg-[#0B0F19] text-white font-sans flex flex-col antialiased overflow-y-auto overflow-x-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FF512F] opacity-[0.06] blur-3xl rounded-full pointer-events-none" />

      <ParticipantHeader companyName="Tap To Interview" />

      <div className="flex-1 flex justify-center p-6 pt-20 sm:pt-32 relative z-10">
        <div className="w-full max-w-md">
          {isProcessing && (
            <StatusCard
              icon={<Spinner className="w-8 h-8 border-t-2 border-b-2 border-[#FF512F]" />}
              eyebrow="Processing"
              title={config.processing}
              message={`Confirming your request: ${config.label}`}
              pulse
            />
          )}

          {!isProcessing && !token && error && (
            <StatusCard
              icon={<XCircle className="w-8 h-8 text-red-400" />}
              eyebrow="Invalid Link"
              title="Action Unavailable"
              message={error}
              variant="error"
              onAction={() => navigate("/")}
              actionLabel="Return to Home"
            />
          )}

          {!isProcessing && token && error && (
            <StatusCard
              icon={<XCircle className="w-8 h-8 text-red-400" />}
              eyebrow="Unable to Complete"
              title="Something Went Wrong"
              message={error}
              variant="error"
              onAction={() => navigate("/")}
              actionLabel="Return to Home"
            />
          )}

          {!isProcessing && succeeded && (
            <StatusCard
              icon={<CheckCircle className="w-8 h-8 text-emerald-400" />}
              eyebrow="Success"
              title={config.successTitle}
              message={successMessage ?? config.successMessage}
              note={successNote ?? config.successNote}
              variant="success"
              onAction={() => navigate("/")}
              actionLabel="Return to Home"
              secondaryIcon={<ActionIcon className="w-4 h-4" />}
            />
          )}
        </div>
      </div>

      <ParticipantFooter />
    </div>
  );
}

function StatusCard({
  icon,
  eyebrow,
  title,
  message,
  note,
  variant,
  pulse,
  onAction,
  actionLabel,
  secondaryIcon,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  message: string;
  note?: string;
  variant?: "error" | "success";
  pulse?: boolean;
  onAction?: () => void;
  actionLabel?: string;
  secondaryIcon?: ReactNode;
}) {
  const iconWrapClass =
    variant === "error"
      ? "bg-red-500/20 border-red-500/30"
      : variant === "success"
        ? "bg-emerald-500/20 border-emerald-500/30"
        : "bg-[#FF512F]/10 border-[#FF512F]/20";

  const eyebrowClass =
    variant === "error"
      ? "text-red-400"
      : variant === "success"
        ? "text-emerald-400"
        : "text-[#FF512F]";

  return (
    <div
      className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center space-y-6 ${pulse ? "animate-pulse" : ""}`}
    >
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto border ${iconWrapClass}`}
      >
        {icon}
      </div>
      <div className="space-y-2">
        <p className={`text-[10px] font-bold uppercase tracking-widest ${eyebrowClass}`}>
          {eyebrow}
        </p>
        <h1 className="text-2xl font-black text-white tracking-tight">{title}</h1>
        <p className="text-sm text-gray-400 font-medium leading-relaxed max-w-sm mx-auto">
          {message}
        </p>
        {note && (
          <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-sm mx-auto pt-1">
            {note}
          </p>
        )}
      </div>
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="w-full bg-gradient-to-r from-[#FF512F] to-[#FF7A00] hover:from-[#E04020] hover:to-[#FF512F] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-[#FF512F]/20 hover:shadow-[#FF512F]/40 flex items-center justify-center gap-2 transform hover:scale-[1.01] cursor-pointer text-sm"
        >
          {secondaryIcon}
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}

export function QueueReservePage() {
  return <QueueClosedActionPage action="reserve" />;
}

export function QueueReleasePage() {
  return <QueueClosedActionPage action="release" />;
}
