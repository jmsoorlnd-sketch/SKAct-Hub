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

  // Event creation form state
  const [eventFormData, setEventFormData] = useState({
    subject: "",
    body: "",
    startDate: "",
    endDate: "",
    visibility: "all", // "all" or "specific"
    barangayId: "",
  });

  /* ===================== DATA FETCHING ===================== */
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

  const { user } = useContext(AuthContext);

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

      if (!evt || !user || String(evt.sender?._id) !== String(user._id)) {
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

    setCreatingEvent(true);
    setCreateEventMessage("");

    try {
      const token = localStorage.getItem("token");

      const payload = {
        subject: eventFormData.subject,
        body: eventFormData.body,
        startDate: eventFormData.startDate,
        endDate: eventFormData.endDate,
        recipient: "admin",
        barangayId:
          eventFormData.visibility === "specific"
            ? eventFormData.barangayId
            : null,
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
          <div className="space-y-1 flex-1">
            {dayEvents.slice(0, 3).map((evt) => {
              const barangayName = barangayMap[evt.attachedToBarangay];
              return (
                <div
                  key={evt._id}
                  className="text-xs bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-2 py-1 rounded-lg truncate border border-blue-200 font-semibold"
                  title={`${evt.subject}${barangayName ? ` – ${barangayName}` : ""}`}
                >
                  {evt.subject}
                  {barangayName && (
                    <span className="block text-[8px] text-slate-600 truncate">
                      {barangayName}
                    </span>
                  )}
                </div>
              );
            })}
            {dayEvents.length > 3 && (
              <div className="text-xs text-blue-600 font-bold text-center">
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </div>,
      );
    }

    return { days, monthName };
  }, [currentDate, eventsByDate, barangayMap]);
  /* ===================== RENDER ===================== */
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Page Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-2xl font-bold">Event Calendar</h1>
                <p className="text-slate-600 mt-1 text-sm">
                  View and create events for all barangays or specific barangays
                </p>
              </div>
              <button
                onClick={() => setShowCreateEventForm(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm shadow-md transition-all flex items-center gap-2"
              >
                <Plus size={18} />
                <span> Create Event </span>
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
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center py-10">
                      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                  }
                >
                  <StatCard
                    icon={CalendarIcon}
                    title="Total Events"
                    value={statistics.total}
                    color="blue"
                    subtitle="All scheduled"
                    badge="Total"
                  />
                  <StatCard
                    icon={TrendingUp}
                    title="Upcoming"
                    value={statistics.upcoming}
                    color="emerald"
                    subtitle="Future events"
                    badge="Active"
                  />
                  <StatCard
                    icon={CalendarDays}
                    title="This Month"
                    value={statistics.thisMonth}
                    color="purple"
                    subtitle={currentDate.toLocaleString("default", {
                      month: "long",
                    })}
                    badge="Current"
                  />

                  <StatCard
                    icon={FileText}
                    title="Past Events"
                    value={statistics.past}
                    color="slate"
                    subtitle="Completed events"
                    badge="Archive"
                  />
                </Suspense>
              </div>

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
              {/* Events List */}

              {events.length > 0 && (
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center py-10">
                      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                  }
                >
                  <EventList
                    user={user}
                    selectedEventIds={selectedEventIds}
                    events={events}
                    sortedEvents={sortedEvents}
                    setConfirmationModal={setConfirmationModal}
                    setSelectedEventIds={setSelectedEventIds}
                    handleDeleteEvent={handleDeleteEvent}
                    barangays={barangays}
                  />
                </Suspense>
              )}
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
