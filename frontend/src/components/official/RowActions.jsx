import { useState } from "react";
import { createPortal } from "react-dom";
import {
  MoreVertical,
  Edit,
  Eye,
  UserCheck,
  UserX,
  Trash2,
  X,
} from "lucide-react";

const RowActions = ({ official, onEdit, onView, onToggleStatus, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (callback) => {
    callback(official);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-1 rounded hover:bg-gray-100 transition-colors"
      >
        <MoreVertical size={16} className="sm:w-4.5 sm:h-4.5" />
      </button>

      {isOpen &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-2000 p-3 sm:p-0">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-sm w-full mx-auto overflow-hidden animate-in fade-in zoom-in duration-200">
              {/* Header */}
              <div className="bg-linear-to-r from-slate-50 to-blue-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    {official.firstname} {official.lastname}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600">
                    @{official.username}
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-200 rounded-lg transition-colors shrink-0"
                >
                  <X size={18} className="text-slate-600 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="p-3 sm:p-4 space-y-2">
                {/* Edit Button */}
                <button
                  onClick={() => handleAction(onEdit)}
                  className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-blue-50 text-left transition-colors border border-transparent hover:border-blue-200 group"
                >
                  <div className="w-9 sm:w-10 h-9 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors shrink-0">
                    <Edit
                      size={16}
                      className="text-blue-600 sm:w-4.5 sm:h-4.5"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm sm:text-base">
                      Edit
                    </p>
                    <p className="text-xs text-slate-500">Update details</p>
                  </div>
                </button>

                {/* View Button */}
                <button
                  onClick={() => handleAction(onView)}
                  className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-purple-50 text-left transition-colors border border-transparent hover:border-purple-200 group"
                >
                  <div className="w-9 sm:w-10 h-9 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors shrink-0">
                    <Eye
                      size={16}
                      className="text-purple-600 sm:w-4.5 sm:h-4.5"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm sm:text-base">
                      View
                    </p>
                    <p className="text-xs text-slate-500">View profile</p>
                  </div>
                </button>

                {/* Toggle Status Button */}
                <button
                  onClick={() => handleAction(onToggleStatus)}
                  className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-left transition-colors border border-transparent group ${
                    official.status === "Active"
                      ? "hover:bg-red-50 hover:border-red-200"
                      : "hover:bg-emerald-50 hover:border-emerald-200"
                  }`}
                >
                  <div
                    className={`w-9 sm:w-10 h-9 sm:h-10 rounded-lg flex items-center justify-center group-hover:opacity-80 transition-opacity shrink-0 ${
                      official.status === "Active"
                        ? "bg-red-100"
                        : "bg-emerald-100"
                    }`}
                  >
                    {official.status === "Active" ? (
                      <UserX
                        size={16}
                        className="text-red-600 sm:w-4.5 sm:h-4.5"
                      />
                    ) : (
                      <UserCheck
                        size={16}
                        className="text-emerald-600 sm:w-4.5 sm:h-4.5"
                      />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {official.status === "Active" ? "Deactivate" : "Activate"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {official.status === "Active"
                        ? "Deactivate this official"
                        : "Activate this official"}
                    </p>
                  </div>
                </button>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-4 sm:px-6 py-2 sm:py-3 border-t border-gray-200">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full py-1.5 sm:py-2 px-3 sm:px-4 bg-gray-200 hover:bg-gray-300 text-slate-900 font-semibold text-sm sm:text-base rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default RowActions;
