import { memo, useState } from "react";
import { X, Plus, AlertCircle } from "lucide-react";

const EventCreationModal = ({
  isOpen,
  onClose,
  eventFormData,
  setEventFormData,
  barangays,
  users = [],
  onSubmit,
  creatingEvent,
  createEventMessage,
  user,
}) => {
  const [customParticipant, setCustomParticipant] = useState("");

  const selectedParticipants = eventFormData.participants
    ? eventFormData.participants
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  const onParticipantsChange = (e) => {
    const selected = Array.from(e.target.selectedOptions).map(
      (opt) => opt.value,
    );
    const combined = Array.from(
      new Set([...selected, ...selectedParticipants]),
    );
    setEventFormData({
      ...eventFormData,
      participants: combined.join(", "),
    });
  };

  const addCustomParticipant = () => {
    const name = customParticipant.trim();
    if (!name) return;
    const combined = Array.from(new Set([...selectedParticipants, name]));
    setEventFormData({
      ...eventFormData,
      participants: combined.join(", "),
    });
    setCustomParticipant("");
  };

  const removeParticipant = (name) => {
    const updated = selectedParticipants.filter((p) => p !== name);
    setEventFormData({
      ...eventFormData,
      participants: updated.join(", "),
    });
  };
  if (!isOpen) return null;

  const isAdmin = user?.role === "Admin";
  const userBarangayName =
    user?.barangay?.barangayName || user?.barangayName || "Your barangay";

  const now = new Date();
  now.setSeconds(0, 0);
  const minDateTime = now.toISOString().slice(0, 16);

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[28px] shadow-[0_30px_80px_rgba(15,23,42,0.18)] max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-linear-to-r from-blue-600 to-indigo-600 px-6 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-white">
              <div className="inline-flex items-center gap-3 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold tracking-wide">
                <Plus size={18} />
                Add New Event
              </div>
              <p className="mt-3 max-w-2xl text-sm text-slate-100">
                {isAdmin
                  ? "Schedule an event for all barangays or a specific barangay with clarity and modern styling."
                  : "Schedule an event for your barangay with clear date, participant, and visibility controls."}
              </p>
            </div>
            <button
              onClick={onClose}
              className="h-11 w-11 rounded-2xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div
          className="p-6 overflow-y-auto flex-1"
          style={{ maxHeight: "calc(90vh - 170px)" }}
        >
          {createEventMessage && (
            <div
              className={`mb-5 rounded-2xl border p-4 flex items-start gap-3 ${
                createEventMessage.includes("successfully")
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-rose-800"
              }`}
            >
              <AlertCircle className="mt-0.5" size={20} />
              <p className="text-sm leading-6">{createEventMessage}</p>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Event Title <span className="text-rose-500">*</span>
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
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                    placeholder="e.g., Youth Leadership Summit"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
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
                    rows="4"
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 resize-none"
                    placeholder="Event details and description..."
                  />
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Start Date & Time <span className="text-rose-500">*</span>
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
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      End Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={eventFormData.endDate}
                      min={eventFormData.startDate || minDateTime}
                      onChange={(e) =>
                        setEventFormData({
                          ...eventFormData,
                          endDate: e.target.value,
                        })
                      }
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Participants
                  </label>
                  <select
                    multiple
                    value={selectedParticipants}
                    onChange={onParticipantsChange}
                    className="w-full h-40 rounded-3xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                  >
                    {users.map((u) => {
                      const name =
                        `${u.firstname || ""} ${u.lastname || ""}`.trim();
                      return (
                        <option key={u._id || name} value={name}>
                          {name || u.username || u.email}
                        </option>
                      );
                    })}
                  </select>
                  <p className="mt-2 text-xs text-slate-500">
                    Hold Ctrl/Cmd to select multiple participants.
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                    <input
                      type="text"
                      value={customParticipant}
                      onChange={(e) => setCustomParticipant(e.target.value)}
                      className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                      placeholder="Add custom participant"
                    />
                    <button
                      type="button"
                      onClick={addCustomParticipant}
                      className="inline-flex items-center justify-center gap-2 rounded-3xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      <Plus size={16} />
                      Add
                    </button>
                  </div>

                  {selectedParticipants.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedParticipants.map((name) => (
                        <span
                          key={name}
                          className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700 border border-slate-200"
                        >
                          {name}
                          <button
                            type="button"
                            onClick={() => removeParticipant(name)}
                            className="text-slate-500 hover:text-slate-900"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isAdmin ? (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-3">
                    Event Visibility
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="group cursor-pointer rounded-3xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50">
                      <div className="flex items-start gap-3">
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
                          className="mt-1 accent-blue-600"
                        />
                        <div>
                          <div className="font-semibold text-slate-900">
                            All Barangays
                          </div>
                          <p className="mt-1 text-sm text-slate-500">
                            Visible to every barangay recipient.
                          </p>
                        </div>
                      </div>
                    </label>
                    <label className="group cursor-pointer rounded-3xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50">
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="visibility"
                          value="specific"
                          checked={eventFormData.visibility === "specific"}
                          onChange={(e) =>
                            setEventFormData({
                              ...eventFormData,
                              visibility: e.target.value,
                              barangayId: "",
                            })
                          }
                          className="mt-1 accent-blue-600"
                        />
                        <div>
                          <div className="font-semibold text-slate-900">
                            Specific Barangay
                          </div>
                          <p className="mt-1 text-sm text-slate-500">
                            Target one barangay only.
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {eventFormData.visibility === "specific" && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Select Barangay <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={eventFormData.barangayId}
                      onChange={(e) =>
                        setEventFormData({
                          ...eventFormData,
                          barangayId: e.target.value,
                        })
                      }
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
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
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                Events you create are for your barangay only:{" "}
                <span className="font-semibold text-slate-900">
                  {userBarangayName}
                </span>
              </div>
            )}
            {eventFormData.visibility === "specific" && !isAdmin && (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                This event will be created for your barangay: {userBarangayName}
              </div>
            )}
          </form>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            onClick={onSubmit}
            disabled={creatingEvent}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-3xl bg-linear-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creatingEvent ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
            className="w-full sm:w-auto rounded-3xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(EventCreationModal);
