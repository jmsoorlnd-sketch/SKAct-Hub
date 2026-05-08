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
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetailModal, setShowEventDetailModal] = useState(false);
  const [showCompletedEventsModal, setShowCompletedEventsModal] =
    useState(false);
  const [showUpcomingEventsModal, setShowUpcomingEventsModal] = useState(false);
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
      const res = await axios.get(`${window.API_BASE}/barangays/all-barangays`);
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

      const res = await axios.get(`${window.API_BASE}/messages/activities`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setEvents(res.data.activities || []);
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
        const res = await axios.get(`${window.API_BASE}/users/all`, {
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
          `${window.API_BASE}/barangays/${barangayId}/users`,
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
        `${window.API_BASE}/messages/${eventId}/status`,
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
          axios.delete(`${window.API_BASE}/messages/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ),
      );
    } catch (err) {
      console.error("Failed to delete events", err);
    }

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
        `${window.API_BASE}/messages/send`,
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

  const completedEvents = useMemo(
    () => events.filter((e) => String(e.status).toLowerCase() === "completed"),
    [events],
  );

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return events
      .filter((e) => new Date(e.startDate) >= today)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
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
          className={`border-2 rounded-3xl p-4 min-h-[130px] cursor-pointer transition-all duration-200 flex flex-col ${
            isToday
              ? "bg-linear-to-br from-sky-50 to-indigo-50 border-blue-300 shadow-lg"
              : isPast
                ? "bg-slate-50 border-slate-200 hover:border-slate-300"
                : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-xl"
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
      <div className="min-h-screen bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
          {/* Page Header */}
          <div className="mb-6 rounded-[30px] border border-slate-200 bg-white/95 shadow-[0_30px_60px_-30px_rgba(15,23,42,0.3)] p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.32em] text-slate-400 mb-3">
                  Admin dashboard
                </p>
                <h1 className="text-3xl lg:text-4xl font-semibold text-slate-900">
                  Event Calendar
                </h1>
                <p className="mt-3 text-slate-600 text-sm lg:text-base leading-relaxed">
                  Manage events, view schedules, and track completed and
                  upcoming activities for all barangays from one polished
                  workspace.
                </p>
              </div>
              <button
                onClick={() => setShowCreateEventForm(true)}
                className="inline-flex items-center justify-center gap-2 rounded-3xl bg-linear-to-r from-sky-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                <Plus size={18} />
                <span>Create Event</span>
              </button>
            </div>
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
              {/* Two-Column Layout: Calendar + Today's Events + Completed/Upcoming Events */}
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

                {/* Today's Events + Completed + Upcoming Events - 1 column */}
                <div className="lg:col-span-1 space-y-3 flex flex-col">
                  <div className="grid grid-cols-2 gap-2">
                    <StatCard
                      compact
                      icon={CalendarIcon}
                      title="Total Events"
                      value={statistics.total}
                      color="blue"
                      subtitle="All barangays"
                      badge="Total"
                    />
                    <StatCard
                      compact
                      icon={TrendingUp}
                      title="Upcoming"
                      value={statistics.upcoming}
                      color="emerald"
                      subtitle="Future activities"
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
                      title="Past Events"
                      value={statistics.past}
                      color="slate"
                      subtitle="Completed"
                      badge="Archive"
                    />
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden max-h-[400px] flex flex-col">
                    <div className="bg-linear-to-r from-blue-50 to-indigo-50 px-3 py-2 border-b-2 border-slate-200">
                      <h3 className="text-sm font-bold text-slate-900">
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
                    <div className="p-3 overflow-y-auto flex-1">
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
                            <div className="text-center py-6">
                              <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                              <p className="text-xs text-slate-500 font-medium">
                                No events today
                              </p>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-2">
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
                                  className="p-2 bg-linear-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:shadow-md transition-all text-xs"
                                >
                                  <div className="flex items-start justify-between gap-1 mb-0.5">
                                    <h4 className="font-bold text-slate-900 mb-0.5 truncate line-clamp-1">
                                      {evt.subject}
                                    </h4>
                                    <span
                                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border whitespace-nowrap ${getStatusClasses(
                                        evt.status,
                                      )}`}
                                    >
                                      {evt.status || "pending"}
                                    </span>
                                  </div>

                                  {evt.body && (
                                    <p className="text-xs text-slate-600 mb-1 line-clamp-1">
                                      {evt.body}
                                    </p>
                                  )}

                                  <div className="flex items-center gap-1 text-xs text-blue-600 font-semibold mb-0.5">
                                    <Clock size={10} />
                                    {new Date(evt.startDate).toLocaleTimeString(
                                      "default",
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      },
                                    )}
                                  </div>
                                  {barangayName && (
                                    <div className="flex items-center gap-1 text-xs text-slate-600 mb-0.5">
                                      <MapPin size={10} />
                                      <span className="truncate">
                                        {barangayName}
                                      </span>
                                    </div>
                                  )}

                                  {evt.participants &&
                                    evt.participants.length > 0 && (
                                      <div className="flex flex-wrap gap-1 text-xs text-slate-700 mb-0.5">
                                        <span className="font-semibold">
                                          Participants:
                                        </span>
                                        <span className="italic line-clamp-1">
                                          {Array.isArray(evt.participants)
                                            ? evt.participants.join(", ")
                                            : String(evt.participants)}
                                        </span>
                                      </div>
                                    )}

                                  {isOwner && (
                                    <div className="mt-1">
                                      <label className="text-xs font-semibold text-slate-700 mr-1">
                                        Status:
                                      </label>
                                      <select
                                        value={evt.status || "pending"}
                                        onChange={(e) =>
                                          handleUpdateEventStatus(
                                            evt._id,
                                            e.target.value,
                                          )
                                        }
                                        className="text-xs px-1.5 py-0.5 rounded border border-slate-300"
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

                                  <div className="text-xs text-slate-500 font-medium px-1.5 py-0.5 bg-slate-200 rounded mt-1">
                                    By:{" "}
                                    <span className="font-semibold text-slate-700 line-clamp-1">
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

                  {/* Completed Events Count Card */}
                  <button
                    onClick={() => setShowCompletedEventsModal(true)}
                    className="bg-white rounded-[28px] border border-slate-200 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="text-center">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400 mb-3">
                        Completed Events
                      </p>
                      <p className="text-4xl font-bold text-emerald-600 mb-2">
                        {completedEvents.length}
                      </p>
                      <p className="text-sm text-slate-500">
                        View completed activity logs
                      </p>
                    </div>
                  </button>

                  {/* Upcoming Events Count Card */}
                  <button
                    onClick={() => setShowUpcomingEventsModal(true)}
                    className="bg-white rounded-[28px] border border-slate-200 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="text-center">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400 mb-3">
                        Upcoming Events
                      </p>
                      <p className="text-4xl font-bold text-blue-600 mb-2">
                        {upcomingEvents.length}
                      </p>
                      <p className="text-sm text-slate-500">
                        See scheduled events ahead
                      </p>
                    </div>
                  </button>
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

      {/* Event Detail Modal */}
      {showEventDetailModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-linear-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center">
              <div>
                <h2 className="text-white text-xl font-bold">
                  {selectedEvent.subject}
                </h2>
                <p className="text-white text-sm">
                  {new Date(selectedEvent.startDate).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setShowEventDetailModal(false)}
                className="text-white p-2 hover:bg-white/20 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <span className="font-semibold">Status:</span>{" "}
                <span className="text-slate-700">{selectedEvent.status}</span>
              </div>
              {selectedEvent.body && (
                <div>
                  <span className="font-semibold">Description:</span>
                  <p className="text-slate-700 mt-1">{selectedEvent.body}</p>
                </div>
              )}
              <div>
                <span className="font-semibold">Barangay:</span>{" "}
                <span className="text-slate-700">
                  {barangays.find(
                    (b) => b._id === selectedEvent.attachedToBarangay,
                  )?.barangayName || "All Barangays"}
                </span>
              </div>
              <div>
                <span className="font-semibold">Participants:</span>
                <p className="text-slate-700 mt-1">
                  {Array.isArray(selectedEvent.participants)
                    ? selectedEvent.participants.join(", ")
                    : selectedEvent.participants || "None"}
                </p>
              </div>
              <div className="text-xs text-slate-500">
                Created by: {selectedEvent.sender?.username || "Unknown"}
              </div>
            </div>
          </div>
        </div>
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

      {/* Completed Events Modal */}
      {showCompletedEventsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-linear-to-r from-emerald-600 to-teal-600 p-4 flex justify-between items-center">
              <h2 className="text-white text-xl font-bold">
                Completed Events ({completedEvents.length})
              </h2>
              <button
                onClick={() => setShowCompletedEventsModal(false)}
                className="text-white p-2 hover:bg-white/20 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              {completedEvents.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">
                    No completed events yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {completedEvents.map((evt) => {
                    const barangayName = barangayMap[evt.attachedToBarangay];
                    return (
                      <button
                        key={evt._id}
                        onClick={() => {
                          setSelectedEvent(evt);
                          setShowEventDetailModal(true);
                          setShowCompletedEventsModal(false);
                        }}
                        className="w-full text-left p-3 rounded-lg border border-emerald-200 bg-emerald-50 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-900 truncate">
                              {evt.subject}
                            </h4>
                            <p className="text-sm text-slate-600 mt-0.5">
                              {new Date(evt.startDate).toLocaleString()}
                            </p>
                            {barangayName && (
                              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                <MapPin size={12} />
                                {barangayName}
                              </p>
                            )}
                          </div>
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold text-emerald-700 bg-emerald-100 border border-emerald-200 whitespace-nowrap">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Completed
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Events Modal */}
      {showUpcomingEventsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-linear-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center">
              <h2 className="text-white text-xl font-bold">
                Upcoming Events ({upcomingEvents.length})
              </h2>
              <button
                onClick={() => setShowUpcomingEventsModal(false)}
                className="text-white p-2 hover:bg-white/20 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">
                    No upcoming events.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((evt) => {
                    const barangayName = barangayMap[evt.attachedToBarangay];
                    return (
                      <button
                        key={evt._id}
                        onClick={() => {
                          setSelectedEvent(evt);
                          setShowEventDetailModal(true);
                          setShowUpcomingEventsModal(false);
                        }}
                        className="w-full text-left p-3 rounded-lg border border-blue-200 bg-blue-50 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-900 truncate">
                              {evt.subject}
                            </h4>
                            <p className="text-sm text-slate-600 mt-0.5">
                              {new Date(evt.startDate).toLocaleString()}
                            </p>
                            {barangayName && (
                              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                <MapPin size={12} />
                                {barangayName}
                              </p>
                            )}
                          </div>
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold text-blue-700 bg-blue-100 border border-blue-200 whitespace-nowrap">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            {String(evt.status || "Scheduled")
                              .charAt(0)
                              .toUpperCase() +
                              String(evt.status || "Scheduled").slice(1)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminCalendar;
