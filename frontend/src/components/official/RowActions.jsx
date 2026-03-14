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
        <MoreVertical size={18} />
      </button>

      {isOpen &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] ">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {official.firstname} {official.lastname}
                  </h2>
                  <p className="text-sm text-slate-600">@{official.username}</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X size={20} className="text-slate-600" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="p-4 space-y-2">
                {/* Edit Button */}
                <button
                  onClick={() => handleAction(onEdit)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 text-left transition-colors border border-transparent hover:border-blue-200 group"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Edit size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Edit</p>
                    <p className="text-xs text-slate-500">Update details</p>
                  </div>
                </button>

                {/* View Button */}
                <button
                  onClick={() => handleAction(onView)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-purple-50 text-left transition-colors border border-transparent hover:border-purple-200 group"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Eye size={18} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">View</p>
                    <p className="text-xs text-slate-500">View profile</p>
                  </div>
                </button>

                {/* Toggle Status Button */}
                <button
                  onClick={() => handleAction(onToggleStatus)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors border border-transparent group ${
                    official.status === "Active"
                      ? "hover:bg-red-50 hover:border-red-200"
                      : "hover:bg-emerald-50 hover:border-emerald-200"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center group-hover:opacity-80 transition-opacity ${
                      official.status === "Active"
                        ? "bg-red-100"
                        : "bg-emerald-100"
                    }`}
                  >
                    {official.status === "Active" ? (
                      <UserX size={18} className="text-red-600" />
                    ) : (
                      <UserCheck size={18} className="text-emerald-600" />
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

                {/* Delete Button */}
                <button
                  onClick={() => handleAction(onDelete)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 text-left transition-colors border border-transparent hover:border-red-200 group"
                >
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                    <Trash2 size={18} className="text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Delete</p>
                    <p className="text-xs text-slate-500">Remove permanently</p>
                  </div>
                </button>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-slate-900 font-semibold rounded-lg transition-colors"
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
