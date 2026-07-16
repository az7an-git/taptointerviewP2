import { createPortal } from "react-dom";
import { Spinner } from "./Spinner";
import { useBodyScrollLock } from "@/common/hooks/useBodyScrollLock";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: "danger" | "warning" | "primary";
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
  variant = "danger",
}: ConfirmationModalProps) {
  useBodyScrollLock(isOpen);
  if (!isOpen) return null;

  const confirmBtnStyles = {
    danger: "bg-[#FF3B30] hover:bg-[#E0342B] text-white",
    warning: "bg-amber-500 hover:bg-amber-600 text-white",
    primary: "bg-gradient-to-r from-[#FF512F] to-[#FF7A00] hover:from-[#E04020] hover:to-[#FF512F] text-white",
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full mx-4 animate-scale-up">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">{description}</p>
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 shadow-sm ${confirmBtnStyles[variant]
              } ${isLoading ? "opacity-75 cursor-not-allowed" : "cursor-pointer"}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner className="w-4 h-4 border-t-2 border-b-2 border-white" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
