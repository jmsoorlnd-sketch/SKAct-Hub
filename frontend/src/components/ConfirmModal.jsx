import React from "react";
import { createPortal } from "react-dom";

const ConfirmModal = ({
  isOpen,
  title,
  message,
  icon: Icon,
  iconBgClass = "bg-blue-100",
  iconColorClass = "text-blue-600",
  confirmText = "Confirm",
  confirmIcon: ConfirmIcon,
  confirmClass = "bg-blue-600 hover:bg-blue-700 text-white",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  children, // optional custom content
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex items-center gap-4">
          {Icon && (
            <div
              className={`w-12 h-12 ${iconBgClass} rounded-full flex items-center justify-center flex-shrink-0`}
            >
              <Icon className={`${iconColorClass} w-6 h-6`} />
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold">{title}</h2>
            {message && (
              <p className="text-sm text-slate-700 mt-1">{message}</p>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {children || <p className="text-sm text-slate-700">{message}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-slate-900 font-semibold rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2 px-4 ${confirmClass} font-semibold rounded-lg transition-colors flex items-center justify-center gap-2`}
          >
            {ConfirmIcon && <ConfirmIcon size={16} />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ConfirmModal;
