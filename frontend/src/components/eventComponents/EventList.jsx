import { memo, useMemo } from "react";
import { Calendar as CalendarIcon, Clock, MapPin, Trash2 } from "lucide-react";

const EventList = ({
  user,
  selectedEventIds,
  sortedEvents,
  events,
  setConfirmationModal,
  setSelectedEventIds,
  handleDeleteEvent,
  barangays,
}) => {
  /* ===================== MEMOIZED DATA ===================== */

  const ownedEventIds = useMemo(() => {
    if (!user) return [];
    return sortedEvents
      .filter((ev) => String(ev.sender?._id) === String(user._id))
      .map((ev) => ev._id);
  }, [user, sortedEvents]);

  const barangayMap = useMemo(() => {
    const map = new Map();
    barangays.forEach((b) => map.set(b._id, b.barangayName));
    return map;
  }, [barangays]);

  const allOwnedSelected =
    user && selectedEventIds.size === ownedEventIds.length;

  /* ===================== HANDLERS ===================== */

  const toggleSelectAll = (checked) => {
    if (!user) return;

    if (checked) {
      setSelectedEventIds(new Set(ownedEventIds));
    } else {
      setSelectedEventIds(new Set());
    }
  };

  const toggleEventSelection = (eventId) => {
    setSelectedEventIds((prev) => {
      const copy = new Set(prev);

      if (copy.has(eventId)) copy.delete(eventId);
      else copy.add(eventId);

      return copy;
    });
  };

  const handleCancelSelected = () => {
    if (selectedEventIds.size === 0) return;

    const ids = Array.from(selectedEventIds);

    setConfirmationModal({
      isOpen: true,
      eventIds: ids,
      title: "Cancel Events",
      message: `Cancel ${ids.length} selected event${
        ids.length !== 1 ? "s" : ""
      }?`,
    });
  };

  /* ===================== RENDER ===================== */

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-b-2 border-slate-200 flex items-center justify-between">
        <div className="flex items-center">
          <input
            type="checkbox"
            className="mr-2"
            checked={allOwnedSelected}
            onChange={(e) => toggleSelectAll(e.target.checked)}
          />

          <div>
            <h3 className="text-lg font-bold text-slate-900">
              All Scheduled Events
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Chronological event list
            </p>
          </div>
        </div>

        {events.length > 0 && (
          <button
            onClick={handleCancelSelected}
            disabled={selectedEventIds.size === 0}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
          >
            Cancel Selected
          </button>
        )}
      </div>

      {/* Event List */}
      <div className="p-6 space-y-4">
        {sortedEvents.map((evt) => {
          const isPast = new Date(evt.startDate) < new Date();

          const barangayName =
            barangayMap.get(evt.attachedToBarangay) ||
            evt.sender?.barangay?.barangayName;

          const isOwner = user && String(user._id) === String(evt.sender?._id);

          return (
            <div
              key={evt._id}
              className={`p-5 rounded-xl border-2 transition-all ${
                isPast
                  ? "bg-slate-50 border-slate-200"
                  : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:shadow-md"
              }`}
            >
              <div className="flex justify-between items-start gap-4">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  className="mt-2"
                  checked={selectedEventIds.has(evt._id)}
                  onChange={() => toggleEventSelection(evt._id)}
                  disabled={!isOwner}
                />

                {/* Event Info */}
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 ${
                        isPast
                          ? "bg-slate-400"
                          : "bg-gradient-to-br from-blue-500 to-blue-600"
                      }`}
                    >
                      <CalendarIcon className="w-6 h-6 text-white" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-slate-900 text-lg">
                          {evt.subject}
                        </h4>

                        {evt.isAdminScheduled && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                            Admin Event
                          </span>
                        )}
                      </div>

                      {evt.body && (
                        <p className="text-sm text-slate-600 mt-1">
                          {evt.body}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                        <span>Created by: {evt.sender?.username}</span>
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span className="font-semibold text-slate-700">
                        Start: {new Date(evt.startDate).toLocaleString()}
                      </span>
                    </div>

                    {evt.endDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <span className="font-semibold text-slate-700">
                          End: {new Date(evt.endDate).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Barangay */}
                  {barangayName && (
                    <div className="flex items-center gap-2 mt-3 text-sm">
                      <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="font-semibold text-slate-700">
                        Barangay: {barangayName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Cancel Button */}
                {isOwner && (
                  <button
                    onClick={() => handleDeleteEvent(evt._id)}
                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2 flex-shrink-0"
                  >
                    <Trash2 size={16} />
                    <span>Cancel</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default memo(EventList);
