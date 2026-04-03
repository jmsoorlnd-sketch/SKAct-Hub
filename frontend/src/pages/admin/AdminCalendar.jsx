import {
  useState,
  useEffect,
  useMemo,
  useContext,
  useCallback,
  lazy,
  Suspense,
} from "react";
import axios from "axios";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  MapPin,
  FileText,
  Trash2,
  CalendarDays,
  TrendingUp,
  Plus,
  AlertCircle,
} from "lucide-react";
import ConfirmationModal from "../../components/eventComponents/ConfirmationModals";
import { AuthContext } from "../../context/AuthContext";
import DateModal from "../../components/eventComponents/DateModal";
const StatCard = lazy(
  () => import("../../components/eventComponents/StatCard"),
);
const Calendar = lazy(
  () => import("../../components/eventComponents/Calendar"),
);
const EventList = lazy(
  () => import("../../components/eventComponents/EventList"),
);

const EventCreationModal = lazy(
  () => import("../../components/eventComponents/EventCreateModal"),
);

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

/* ===================== MAIN COMPONENT ===================== */
const AdminCalendar = () => {
  /* ===================== STATE ===================== */
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventIds, setSelectedEventIds] = useState(new Set());
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    eventIds: [],
    message: "",
    title: "",
  });

  // Modals
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showCreateEventForm, setShowCreateEventForm] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [createEventMessage, setCreateEventMessage] = useState("");
  const [availableParticipants, setAvailableParticipants] = useState([]);

  // Event creation form state
  const [eventFormData, setEventFormData] = useState({
    subject: "",
    body: "",
    startDate: "",
    endDate: "",
    visibility: "all", // "all" or "specific"
    barangayId: "",
    participants: "",
  });

  /* ===================== DATA FETCHING ===================== */
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchEvents();
    fetchBarangays();
  }, []);

  const fetchBarangays = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/barangays/all-barangays",
      );
      setBarangays(res.data.barangays || []);
    } catch (error) {
      console.error("Failed to fetch barangays:", error);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get(
        "http://localhost:5000/api/messages/activities",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setEvents(res.data.activities || []);
      setSelectedEventIds(new Set());
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      if (user?.role === "Admin") {
        const res = await axios.get("http://localhost:5000/api/users/all", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const users = res.data.users || [];
        setAvailableParticipants(users);
      } else {
        const barangayId =
          user?.barangay?._id || user?.barangay || user?.barangayId;
        if (!barangayId) {
          setAvailableParticipants([]);
          return;
        }
        const res = await axios.get(
          `http://localhost:5000/api/barangays/${barangayId}/users`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setAvailableParticipants(res.data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch participants:", error);
      setAvailableParticipants([]);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchParticipants();
    }
  }, [user, fetchParticipants]);

  /* ===================== CALENDAR HELPERS ===================== */
  const getDaysInMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const getFirstDayOfMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const handlePrevMonth = () =>
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1));
  const handleNextMonth = () =>
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1));

  const eventsByDate = useMemo(() => {
    const map = new Map();

    events.forEach((event) => {
      const date = new Date(event.startDate).toDateString();

      if (!map.has(date)) map.set(date, []);
      map.get(date).push(event);
    });

    return map;
  }, [events]);

  useEffect(() => {
    setSelectedEventIds(new Set());
  }, [events]);

  /* ===================== EVENT HANDLERS ===================== */
  const handleDeleteEvent = useCallback(
    (eventId) => {
      const evt = events.find((e) => e._id === eventId);

      if (
        !evt ||
        !user ||
        (user.role !== "Admin" && String(evt.sender?._id) !== String(user._id))
      ) {
        return;
      }

      setConfirmationModal({
        isOpen: true,
        eventIds: [eventId],
        title: "Cancel Event",
        message: "Are you sure you want to cancel this event?",
      });
    },
    [events, user],
  );
  const openConfirmationModal = (ids) => {
    setConfirmationModal({
      isOpen: true,
      eventIds: ids,
      title: "Cancel Events",
      message: `Cancel ${ids.length} selected event${ids.length !== 1 ? "s" : ""}?`,
    });
  };

  const closeConfirmationModal = () => {
    setConfirmationModal({
      isOpen: false,
      eventIds: [],
      message: "",
      title: "",
    });
  };

  const handleUpdateEventStatus = async (eventId, status) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      await axios.put(
        `http://localhost:5000/api/messages/${eventId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchEvents();
    } catch (err) {
      console.error("Failed to update event status", err);
    }
  };

  const handleConfirmAction = async () => {
    const ids = confirmationModal.eventIds || [];

    try {
      const token = localStorage.getItem("token");

      await Promise.all(
        ids.map((id) =>
          axios.delete(`http://localhost:5000/api/messages/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ),
      );
    } catch (err) {
      console.error("Failed to delete events", err);
    }

    setSelectedEventIds(new Set());
    setShowDateModal(false);
    fetchEvents();
    closeConfirmationModal();
  };
  /* ===================== EVENT CREATION ===================== */
  const handleCreateEvent = async (e) => {
    e.preventDefault();

    if (!eventFormData.subject || !eventFormData.startDate) {
      setCreateEventMessage("Please fill in required fields");
      return;
    }

    const now = new Date();
    const start = new Date(eventFormData.startDate);
    const end = eventFormData.endDate ? new Date(eventFormData.endDate) : null;

    if (start < now) {
      setCreateEventMessage("Start date/time cannot be in the past");
      return;
    }
    if (end && end < now) {
      setCreateEventMessage("End date/time cannot be in the past");
      return;
    }
    if (end && end < start) {
      setCreateEventMessage("End date/time cannot be before start date/time");
      return;
    }

    const selectedParticipantNames = eventFormData.participants
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    const overlappingEvents = events.filter((event) => {
      if (!event.startDate) return false;
      const existingStart = new Date(event.startDate);
      const existingEnd = event.endDate ? new Date(event.endDate) : null;

      // exact same start date/time conflict or overlapping window
      const overlap =
        existingStart.getTime() === start.getTime() ||
        (end && existingEnd && existingStart <= end && existingEnd >= start) ||
        (end && !existingEnd && existingStart.getTime() === start.getTime()) ||
        (!end && existingEnd && start >= existingStart && start <= existingEnd);

      return overlap;
    });

    if (overlappingEvents.length > 0 && selectedParticipantNames.length === 0) {
      setCreateEventMessage(
        "Conflicting event exists. Provide participant names to continue.",
      );
      return;
    }

    if (overlappingEvents.length > 0 && selectedParticipantNames.length > 0) {
      const busy = new Set();

      overlappingEvents.forEach((event) => {
        const existingParticipants = Array.isArray(event.participants)
          ? event.participants
          : typeof event.participants === "string"
            ? event.participants.split(",").map((p) => p.trim())
            : [];

        existingParticipants.forEach((p) => {
          const normalized = p.trim().toLowerCase();
          if (
            normalized &&
            selectedParticipantNames.some(
              (sel) => sel.toLowerCase() === normalized,
            )
          ) {
            busy.add(p.trim());
          }
        });
      });

      if (busy.size > 0) {
        setCreateEventMessage(
          `Participant(s) ${Array.from(busy).join(", ")} already have a meeting at this time. Please select different participants.`,
        );
        return;
      }
    }

    setCreatingEvent(true);
    setCreateEventMessage("");

    try {
      const token = localStorage.getItem("token");

      const effectiveBarangayId =
        user?.role === "Admin"
          ? eventFormData.visibility === "specific"
            ? eventFormData.barangayId
            : null
          : user?.barangay?._id || user?.barangay || user?.barangayId || null;

      const payload = {
        subject: eventFormData.subject,
        body: eventFormData.body,
        startDate: eventFormData.startDate,
        endDate: eventFormData.endDate,
        recipient: "admin",
        barangayId: effectiveBarangayId,
        participants: eventFormData.participants
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean),
      };

      const response = await axios.post(
        "http://localhost:5000/api/messages/send",
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.status === 201) {
        setCreateEventMessage("Event created successfully!");
        setEventFormData({
          subject: "",
          body: "",
          startDate: "",
          endDate: "",
          visibility: "all",
          barangayId: "",
          participants: "",
        });
        fetchEvents();

        setTimeout(() => {
          setShowCreateEventForm(false);
          setCreateEventMessage("");
        }, 1500);
      }
    } catch (error) {
      console.error("Failed to create event:", error);
      setCreateEventMessage(
        error.response?.data?.message ||
          "Failed to create event. Please try again.",
      );
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleCloseCreateModal = () => {
    setShowCreateEventForm(false);
    setCreateEventMessage("");
    setEventFormData({
      subject: "",
      body: "",
      startDate: "",
      endDate: "",
      visibility: "all",
      barangayId: "",
    });
  };

  const barangayMap = useMemo(() => {
    const map = {};
    barangays.forEach((b) => {
      map[b._id] = b.barangayName;
    });
    return map;
  }, [barangays]);

  /* ===================== STATISTICS ===================== */
  const statistics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
      total: events.length,
      upcoming: events.filter((e) => new Date(e.startDate) >= today).length,
      past: events.filter((e) => new Date(e.startDate) < today).length,
      thisMonth: events.filter((e) => {
        const d = new Date(e.startDate);
        return (
          d.getMonth() === currentDate.getMonth() &&
          d.getFullYear() === currentDate.getFullYear()
        );
      }).length,
    };
  }, [events, currentDate]);

  const sortedEvents = useMemo(() => {
    return [...events].sort(
      (a, b) => new Date(a.startDate) - new Date(b.startDate),
    );
  }, [events]);

  /* ===================== CALENDAR RENDER ===================== */
  const renderCalendar = useCallback(() => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);

    const days = [];
    const monthName = currentDate.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className="bg-slate-50 rounded-xl border-2 border-transparent min-h-[120px]"
        />,
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day,
      );

      const dayEvents = eventsByDate.get(date.toDateString()) || [];
      const isToday = date.toDateString() === new Date().toDateString();
      const isPast = date < new Date().setHours(0, 0, 0, 0);

      days.push(
        <div
          key={day}
          onClick={() => {
            setSelectedDate(date);
            setShowDateModal(true);
          }}
          className={`border-2 rounded-xl p-3 min-h-[120px] cursor-pointer transition-all duration-200 flex flex-col ${
            isToday
              ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-400 shadow-md"
              : isPast
                ? "bg-slate-50 border-slate-200 hover:border-slate-300"
                : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-lg"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className={`font-bold ${isToday ? "text-blue-600 text-lg" : isPast ? "text-slate-400 text-sm" : "text-slate-900 text-sm"}`}
            >
              {day}
            </span>
            {dayEvents.length > 0 && (
              <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs font-bold">
                {dayEvents.length}
              </span>
            )}
          </div>
          <div className="flex-1 flex items-center justify-center">
            {dayEvents.length > 0 ? (
              <span className="text-xs font-semibold text-blue-700">
                {dayEvents.length} event{dayEvents.length > 1 ? "s" : ""}
              </span>
            ) : (
              <span className="text-xs text-slate-400">No events</span>
            )}
          </div>
        </div>,
      );
    }

    return { days, monthName };
  }, [currentDate, eventsByDate]);
  /* ===================== RENDER ===================== */
  return (
    <>
      <div className="min-h-screen bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Page Header */}
          <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Event Calendar</h1>
              <p className="text-slate-600 mt-1 text-sm">
                View and create events for all barangays or specific barangays
              </p>
            </div>
            <button
              onClick={() => setShowCreateEventForm(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm shadow-md transition-all flex items-center gap-2"
            >
              <Plus size={18} />
              <span>Create Event</span>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
                <p className="text-slate-600 font-medium">
                  Loading calendar...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Two-Column Layout: Calendar + Today's Events */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar - 2 columns */}
                <div className="lg:col-span-2">
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center py-10">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                      </div>
                    }
                  >
                    {/* Calendar */}
                    <Calendar
                      renderCalendar={renderCalendar}
                      handleNextMonth={handleNextMonth}
                      handlePrevMonth={handlePrevMonth}
                    />
                  </Suspense>
                </div>

                {/* Today's Events + Stats - 1 column */}
                <div className="lg:col-span-1 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <StatCard
                      compact
                      icon={CalendarIcon}
                      title="Total"
                      value={statistics.total}
                      color="blue"
                      subtitle="All"
                      badge="Total"
                    />
                    <StatCard
                      compact
                      icon={TrendingUp}
                      title="Upcoming"
                      value={statistics.upcoming}
                      color="emerald"
                      subtitle="Future"
                      badge="Active"
                    />
                    <StatCard
                      compact
                      icon={CalendarDays}
                      title="This Month"
                      value={statistics.thisMonth}
                      color="purple"
                      subtitle={currentDate.toLocaleString("default", {
                        month: "short",
                      })}
                      badge="Current"
                    />
                    <StatCard
                      compact
                      icon={FileText}
                      title="Past"
                      value={statistics.past}
                      color="slate"
                      subtitle="Completed"
                      badge="Archive"
                    />
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden sticky top-6 max-h-[600px] flex flex-col">
                    <div className="bg-linear-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b-2 border-slate-200">
                      <h3 className="text-lg font-bold text-slate-900">
                        Today's Events
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {new Date().toLocaleDateString("default", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="p-4 overflow-y-auto flex-1">
                      {(() => {
                        const today = new Date();
                        const todayEvents = events.filter((e) => {
                          const eDate = new Date(e.startDate);
                          return (
                            eDate.getDate() === today.getDate() &&
                            eDate.getMonth() === today.getMonth() &&
                            eDate.getFullYear() === today.getFullYear()
                          );
                        });

                        if (todayEvents.length === 0) {
                          return (
                            <div className="text-center py-8">
                              <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                              <p className="text-sm text-slate-500 font-medium">
                                No events today
                              </p>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-2.5">
                            {todayEvents.map((evt) => {
                              const barangayName =
                                barangayMap[evt.attachedToBarangay];
                              const creatorName =
                                evt.sender?.username || "Unknown";
                              const isOwner =
                                user &&
                                String(evt.sender?._id) === String(user._id);
                              return (
                                <div
                                  key={evt._id}
                                  className="p-3 bg-linear-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg hover:shadow-md transition-all"
                                >
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <h4 className="font-bold text-sm text-slate-900 mb-1 truncate">
                                      {evt.subject}
                                    </h4>
                                    <span
                                      className={`text-[10px] font-bold px-2 py-1 rounded-full border ${getStatusClasses(
                                        evt.status,
                                      )}`}
                                    >
                                      {evt.status || "pending"}
                                    </span>
                                  </div>

                                  {evt.body && (
                                    <p className="text-xs text-slate-600 mb-2 line-clamp-2">
                                      {evt.body}
                                    </p>
                                  )}

                                  <div className="flex items-center gap-1 text-xs text-blue-600 font-semibold mb-1">
                                    <Clock size={12} />
                                    {new Date(evt.startDate).toLocaleTimeString(
                                      "default",
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      },
                                    )}
                                  </div>
                                  {barangayName && (
                                    <div className="flex items-center gap-1 text-xs text-slate-600 mb-1">
                                      <MapPin size={12} />
                                      {barangayName}
                                    </div>
                                  )}

                                  {evt.participants &&
                                    evt.participants.length > 0 && (
                                      <div className="flex flex-wrap gap-1 text-xs text-slate-700 mb-1">
                                        <span className="font-semibold">
                                          Participants:
                                        </span>
                                        <span className="italic">
                                          {Array.isArray(evt.participants)
                                            ? evt.participants.join(", ")
                                            : String(evt.participants)}
                                        </span>
                                      </div>
                                    )}

                                  {isOwner && (
                                    <div className="mt-2">
                                      <label className="text-xs font-semibold text-slate-700 mr-2">
                                        Set status:
                                      </label>
                                      <select
                                        value={evt.status || "pending"}
                                        onChange={(e) =>
                                          handleUpdateEventStatus(
                                            evt._id,
                                            e.target.value,
                                          )
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
                                    </div>
                                  )}

                                  <div className="text-xs text-slate-500 font-medium px-2 py-1 bg-slate-200 rounded mt-2">
                                    Created by:{" "}
                                    <span className="font-semibold text-slate-700">
                                      {creatorName}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        }
      >
        {/* Event Creation Modal */}
        <EventCreationModal
          user={user}
          users={availableParticipants}
          isOpen={showCreateEventForm}
          onClose={handleCloseCreateModal}
          eventFormData={eventFormData}
          setEventFormData={setEventFormData}
          barangays={barangays}
          onSubmit={handleCreateEvent}
          creatingEvent={creatingEvent}
          createEventMessage={createEventMessage}
        />
      </Suspense>

      {/* Date Modal */}
      {showDateModal && selectedDate && (
        <DateModal
          date={selectedDate}
          events={eventsByDate.get(selectedDate?.toDateString()) || []}
          barangays={barangays}
          onClose={() => setShowDateModal(false)}
          onDelete={handleDeleteEvent}
          onStatusUpdate={handleUpdateEventStatus}
          user={user}
        />
      )}

      {/* Confirmation Modal */}
      {confirmationModal.isOpen && (
        <ConfirmationModal
          isOpen={confirmationModal.isOpen}
          title={confirmationModal.title}
          message={confirmationModal.message}
          onConfirm={handleConfirmAction}
          onClose={closeConfirmationModal}
        />
      )}
    </>
  );
};

export default AdminCalendar;
