import React from "react";
import { CalendarIcon, Clock, MapPin, Trash2, X } from "lucide-react";

const STATUS_OPTIONS = [
  "pending",
  "approved",
  "ongoing",
  "rejected",
  "completed",
  "cancelled",
];

const getStatusClasses = (status) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    case "approved":
      return "bg-emerald-100 text-emerald-700 border-emerald-300";
    case "ongoing":
      return "bg-blue-100 text-blue-700 border-blue-300";
    case "rejected":
      return "bg-red-100 text-red-700 border-red-300";
    case "completed":
      return "bg-slate-100 text-slate-700 border-slate-300";
    case "cancelled":
      return "bg-rose-100 text-rose-700 border-rose-300";
    default:
      return "bg-slate-100 text-slate-700 border-slate-300";
  }
};

const DateModal = ({
  date,
  events,
  barangays,
  onClose,
  onDelete,
  onStatusUpdate,
  user,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50  flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div className="text-white">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <CalendarIcon size={26} />
                {date.toLocaleDateString("default", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                {events.length} event{events.length !== 1 ? "s" : ""} scheduled
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X size={24} className="text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {events.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarIcon className="text-slate-400" size={40} />
              </div>
              <p className="text-slate-500 font-medium text-lg">
                No events on this date
              </p>
              <p className="text-slate-400 text-sm mt-2">
                Officials can schedule events
              </p>
            </div>
          )}

          {events.map((evt) => {
            const barangayName = barangays.find(
              (b) => b._id === evt.attachedToBarangay,
            )?.barangayName;
            const endTime = evt.endDate
              ? new Date(evt.endDate).toLocaleTimeString()
              : null;
            const startTime = evt.startDate
              ? new Date(evt.startDate).toLocaleTimeString()
              : null;
            return (
              <div
                key={evt._id}
                className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                        <CalendarIcon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-lg">
                        {evt.subject}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-full border ${getStatusClasses(
                          evt.status,
                        )}`}
                      >
                        {evt.status || "pending"}
                      </span>
                      {user &&
                        evt.sender &&
                        String(user._id) === String(evt.sender._id) && (
                          <select
                            value={evt.status || "pending"}
                            onChange={(e) =>
                              onStatusUpdate(evt._id, e.target.value)
                            }
                            className="text-xs px-2 py-1 rounded border border-slate-300"
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {status.charAt(0).toUpperCase() +
                                  status.slice(1)}
                              </option>
                            ))}
                          </select>
                        )}
                    </div>

                    {evt.body && (
                      <p className="text-sm text-slate-700 mb-3 p-3 bg-white rounded-lg border border-blue-200">
                        {evt.body}
                      </p>
                    )}

                    {/* Time Information */}
                    {startTime && (
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock
                            size={16}
                            className="text-blue-600 flex-shrink-0"
                          />
                          <span className="font-semibold text-slate-700">
                            Start:{" "}
                            <span className="text-blue-600">{startTime}</span>
                          </span>
                        </div>
                        {endTime && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock
                              size={16}
                              className="text-purple-600 flex-shrink-0"
                            />
                            <span className="font-semibold text-slate-700">
                              End:{" "}
                              <span className="text-purple-600">{endTime}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Barangay Information */}
                    <div className="flex items-center gap-2 text-sm p-2.5 bg-white rounded-lg border border-slate-200">
                      <MapPin
                        size={16}
                        className="text-emerald-600 flex-shrink-0"
                      />
                      <span className="font-semibold text-slate-700">
                        {evt.attachedToBarangay === null ||
                        evt.attachedToBarangay === undefined
                          ? "All Barangays"
                          : `Barangay: ${barangayName}`}
                      </span>
                    </div>
                  </div>
                  {user &&
                    evt.sender &&
                    String(user._id) === String(evt.sender._id) && (
                      <button
                        onClick={() => onDelete(evt._id)}
                        className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2 flex-shrink-0"
                      >
                        <X size={16} />
                        <span>Cancel</span>
                      </button>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DateModal;
