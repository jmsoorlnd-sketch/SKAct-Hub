import { memo } from "react";
import { X, Plus, AlertCircle } from "lucide-react";

const EventCreationModal = ({
  isOpen,
  onClose,
  eventFormData,
  setEventFormData,
  barangays,
  onSubmit,
  creatingEvent,
  createEventMessage,
}) => {
  if (!isOpen) return null;

  const now = new Date();
  now.setSeconds(0, 0);
  const minDateTime = now.toISOString().slice(0, 16);

  return (
    <div className="fixed inset-0 bg-black/50  flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
          <div className="flex justify-between items-center">
            <div className="text-white">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Plus size={28} />
                Add New Event
              </h3>
              <p className="text-blue-100 mt-2 text-sm">
                Schedule an event for all or specific barangays
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

        {/* Modal Body */}
        <div
          className="p-6 overflow-y-auto flex-1"
          style={{ maxHeight: "calc(90vh - 160px)" }}
        >
          {createEventMessage && (
            <div
              className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                createEventMessage.includes("successfully")
                  ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-200"
                  : "bg-red-100 text-red-700 border-2 border-red-200"
              }`}
            >
              <AlertCircle size={18} />
              {createEventMessage}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Event Title */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Event Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={eventFormData.subject}
                onChange={(e) =>
                  setEventFormData({
                    ...eventFormData,
                    subject: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="e.g., Youth Leadership Summit"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Description
              </label>
              <textarea
                value={eventFormData.body}
                onChange={(e) =>
                  setEventFormData({
                    ...eventFormData,
                    body: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                placeholder="Event details and description..."
                rows="3"
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Start Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={eventFormData.startDate}
                  min={minDateTime}
                  onChange={(e) =>
                    setEventFormData({
                      ...eventFormData,
                      startDate: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={eventFormData.endDate}
                  min={minDateTime}
                  onChange={(e) =>
                    setEventFormData({
                      ...eventFormData,
                      endDate: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Event Visibility */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Event Visibility
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border-2 border-slate-200 rounded-xl hover:bg-blue-50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="visibility"
                    value="all"
                    checked={eventFormData.visibility === "all"}
                    onChange={(e) =>
                      setEventFormData({
                        ...eventFormData,
                        visibility: e.target.value,
                        barangayId: "",
                      })
                    }
                    className="w-4 h-4 accent-blue-600"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-slate-900 block">
                      All Barangays
                    </span>
                    <span className="text-xs text-slate-600">
                      Everyone can see this event
                    </span>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border-2 border-slate-200 rounded-xl hover:bg-blue-50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="visibility"
                    value="specific"
                    checked={eventFormData.visibility === "specific"}
                    onChange={(e) =>
                      setEventFormData({
                        ...eventFormData,
                        visibility: e.target.value,
                      })
                    }
                    className="w-4 h-4 accent-blue-600"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-slate-900 block">
                      Specific Barangay
                    </span>
                    <span className="text-xs text-slate-600">
                      Only selected barangay can see this event
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Barangay Selection */}
            {eventFormData.visibility === "specific" && (
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Select Barangay <span className="text-red-500">*</span>
                </label>
                <select
                  value={eventFormData.barangayId}
                  onChange={(e) =>
                    setEventFormData({
                      ...eventFormData,
                      barangayId: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">Choose a barangay...</option>
                  {barangays.map((barangay) => (
                    <option key={barangay._id} value={barangay._id}>
                      {barangay.barangayName}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </form>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t-2 border-slate-200 bg-slate-50 flex gap-3">
          <button
            onClick={onSubmit}
            disabled={creatingEvent}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            {creatingEvent ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus size={18} />
                Create Event
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-300 rounded-xl font-bold transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(EventCreationModal);
