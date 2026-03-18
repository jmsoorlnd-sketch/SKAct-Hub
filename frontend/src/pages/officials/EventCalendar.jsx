import React, {
  useState,
  useEffect,
  useMemo,
  useContext,
  useCallback,
} from "react";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Clock,
  FileText,
  AlertCircle,
  TrendingUp,
  CalendarDays,
  Shield,
  Tag,
  AlignLeft,
  Save,
  Trash2,
} from "lucide-react";

const API_BASE = "http://localhost:5000/api";

const DEFAULT_FORM = { subject: "", body: "", startDate: "", endDate: "" };
const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const getToken = () => localStorage.getItem("token");
const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

/* ==================== STAT CARD ==================== */
const STAT_COLORS = {
  blue: { bg: "from-blue-500 to-blue-600", badge: "bg-blue-100 text-blue-700" },
  emerald: {
    bg: "from-emerald-500 to-emerald-600",
    badge: "bg-emerald-100 text-emerald-700",
  },
  purple: {
    bg: "from-purple-500 to-purple-600",
    badge: "bg-purple-100 text-purple-700",
  },
  slate: {
    bg: "from-slate-500 to-slate-600",
    badge: "bg-slate-100 text-slate-700",
  },
};

const StatCard = ({ icon: Icon, title, value, color, subtitle }) => {
  const c = STAT_COLORS[color];
  return (
    <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-11 h-11 bg-gradient-to-br ${c.bg} rounded-lg flex items-center justify-center shadow-md`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span
          className={`px-2 py-0.5 ${c.badge} rounded-md text-[11px] font-bold`}
        >
          {subtitle}
        </span>
      </div>
      <h3 className="text-slate-500 text-xs font-semibold mb-0.5">{title}</h3>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
};

/* ==================== EVENT CARD ==================== */
const EventCard = ({ evt, user, onDelete, onToggleSelect, isSelected }) => {
  const isOwner = user && String(evt.sender?._id) === String(user._id);
  return (
    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg hover:shadow-md transition-all">
      {isOwner && (
        <input
          type="checkbox"
          className="mr-2 mb-2"
          checked={isSelected}
          onChange={() => onToggleSelect(evt._id)}
        />
      )}
      <div className="flex items-start gap-2.5 mb-2.5">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
          <CalendarIcon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-slate-900 text-base">{evt.subject}</h4>
          {evt.body && (
            <p className="text-xs text-slate-700 mt-0.5">{evt.body}</p>
          )}
          {isOwner && (
            <button
              onClick={() => onDelete(evt._id)}
              className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-semibold text-xs transition-colors flex items-center gap-2"
            >
              <Trash2 size={14} /> Cancel
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="flex items-center gap-1.5 text-xs">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-semibold text-slate-700">
            Start: {new Date(evt.startDate).toLocaleString()}
          </span>
        </div>
        {evt.endDate && (
          <div className="flex items-center gap-1.5 text-xs">
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            <span className="font-semibold text-slate-700">
              End: {new Date(evt.endDate).toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

/* ==================== MAIN COMPONENT ==================== */
const EventCalendar = () => {
  const { user } = useContext(AuthContext);
  const [userBarangay, setUserBarangay] = useState(null);
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState(new Set());
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    eventIds: [],
    message: "",
    title: "",
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState({});

  /* ---- Data Fetching ---- */
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE}/messages/activities`, {
        headers: authHeaders(),
      });
      setEvents(data.activities ?? []);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchUserBarangay = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/barangays/me/barangay`, {
          headers: authHeaders(),
        });
        setUserBarangay(data.barangay);
      } catch (err) {
        console.error("Failed to fetch user barangay:", err);
      }
    };
    fetchUserBarangay();
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    setSelectedEventIds(new Set());
  }, [events]);

  /* ---- Visibility helper (single source of truth) ---- */
  const isVisibleEvent = useCallback(
    (e) => {
      if (user && String(e.sender?._id) === String(user._id)) return true;
      if (
        userBarangay &&
        String(e.attachedToBarangay) === String(userBarangay._id)
      )
        return true;
      return false;
    },
    [user, userBarangay],
  );

  /* ---- Derived lists ---- */
  const visibleEvents = useMemo(
    () => events.filter(isVisibleEvent),
    [events, isVisibleEvent],
  );

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return visibleEvents
      .filter((e) => new Date(e.startDate) >= now)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  }, [visibleEvents]);

  const deletableEvents = useMemo(() => {
    if (!user) return [];
    return upcomingEvents.filter(
      (e) => String(e.sender?._id) === String(user._id),
    );
  }, [upcomingEvents, user]);

  /* ---- Statistics ---- */
  const statistics = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return {
      total: visibleEvents.length,
      upcoming: visibleEvents.filter((e) => new Date(e.startDate) >= today)
        .length,
      past: visibleEvents.filter((e) => new Date(e.startDate) < today).length,
      thisMonth: visibleEvents.filter((e) => {
        const d = new Date(e.startDate);
        return (
          d.getMonth() === currentDate.getMonth() &&
          d.getFullYear() === currentDate.getFullYear()
        );
      }).length,
    };
  }, [visibleEvents, currentDate]);

  /* ---- Calendar helpers ---- */
  const getEventsForDate = useCallback(
    (date) => {
      return visibleEvents.filter((e) => {
        const d = new Date(e.startDate);
        return (
          d.getDate() === date.getDate() &&
          d.getMonth() === date.getMonth() &&
          d.getFullYear() === date.getFullYear()
        );
      });
    },
    [visibleEvents],
  );

  const handlePrevMonth = () =>
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1));
  const handleNextMonth = () =>
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1));

  /* ---- Calendar grid (memoized to avoid rebuilding on every render) ---- */
  const { calendarDays, monthName } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const today = new Date();
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className="bg-slate-50 rounded-lg border-2 border-transparent"
        />,
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = getEventsForDate(date);
      const isToday = date.toDateString() === today.toDateString();
      const isPast =
        date < new Date(today.getFullYear(), today.getMonth(), today.getDate());

      days.push(
        <div
          key={day}
          onClick={() => {
            setSelectedDate(date);
            setShowDateModal(true);
          }}
          className={`border-2 rounded-lg p-2.5 min-h-[100px] cursor-pointer transition-all duration-200 flex flex-col ${
            isToday
              ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-400 shadow-md"
              : isPast
                ? "bg-slate-50 border-slate-200 hover:border-slate-300"
                : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-lg"
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span
              className={`text-xs font-bold ${isToday ? "text-blue-600 text-base" : isPast ? "text-slate-400" : "text-slate-900"}`}
            >
              {day}
            </span>
            {dayEvents.length > 0 && (
              <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded-full text-[10px] font-bold">
                {dayEvents.length}
              </span>
            )}
          </div>
          <div className="space-y-1 flex-1 overflow-y-auto">
            {dayEvents.slice(0, 2).map((evt) => (
              <div
                key={evt._id}
                className="text-[10px] bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-1.5 py-0.5 rounded truncate border border-blue-200 font-semibold"
                title={evt.subject}
              >
                {evt.subject}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-[10px] text-blue-600 font-bold text-center">
                +{dayEvents.length - 2}
              </div>
            )}
          </div>
        </div>,
      );
    }

    return {
      calendarDays: days,
      monthName: currentDate.toLocaleString("default", {
        month: "long",
        year: "numeric",
      }),
    };
  }, [currentDate, getEventsForDate]);

  /* ---- Selection helpers ---- */
  const toggleSelectEvent = useCallback((id) => {
    setSelectedEventIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(
    (checked) => {
      setSelectedEventIds(
        checked ? new Set(deletableEvents.map((e) => e._id)) : new Set(),
      );
    },
    [deletableEvents],
  );

  /* ---- Confirmation modal ---- */
  const openConfirmationModal = (ids) =>
    setConfirmationModal({
      isOpen: true,
      eventIds: ids,
      title: "Cancel Events",
      message: `Cancel ${ids.length} selected event${ids.length !== 1 ? "s" : ""}?`,
    });

  const closeConfirmationModal = () =>
    setConfirmationModal({
      isOpen: false,
      eventIds: [],
      message: "",
      title: "",
    });

  const handleDeleteEvent = (eventId) => {
    const evt = events.find((e) => e._id === eventId);
    if (!evt || !user || String(evt.sender?._id) !== String(user._id)) return;
    openConfirmationModal([eventId]);
  };

  const handleConfirmAction = async () => {
    await Promise.all(
      confirmationModal.eventIds.map((id) =>
        axios
          .delete(`${API_BASE}/messages/${id}`, { headers: authHeaders() })
          .catch((err) => console.error("Failed to delete event", id, err)),
      ),
    );
    setSelectedEventIds(new Set());
    fetchEvents();
    closeConfirmationModal();
  };

  /* ---- Form ---- */
  const validateForm = () => {
    const errors = {};
    if (!formData.subject.trim()) errors.subject = "Event title is required";
    if (!formData.startDate) errors.startDate = "Start date is required";
    if (formData.endDate && formData.endDate < formData.startDate)
      errors.endDate = "End date cannot be before start date";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenCreateModal = () => {
    setFormData(DEFAULT_FORM);
    setFormErrors({});
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setFormData(DEFAULT_FORM);
    setFormErrors({});
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append("subject", formData.subject);
      fd.append("body", formData.body);
      fd.append("startDate", formData.startDate);
      if (formData.endDate) fd.append("endDate", formData.endDate);
      if (userBarangay?._id) fd.append("barangayId", userBarangay._id);
      fd.append("recipientId", user._id);
      await axios.post(`${API_BASE}/messages/send`, fd, {
        headers: authHeaders(),
      });
      handleCloseCreateModal();
      fetchEvents();
    } catch (error) {
      console.error("Failed to create event:", error);
      alert(
        error.response?.status === 401
          ? "Authentication failed. Please log in again."
          : "Failed to create event. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const updateForm = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    setFormErrors((prev) => ({ ...prev, [field]: "" }));
  };

  /* ---- Date modal events (memoized to avoid calling getEventsForDate in render) ---- */
  const selectedDateEvents = useMemo(
    () => (selectedDate ? getEventsForDate(selectedDate) : []),
    [selectedDate, getEventsForDate],
  );

  /* ==================== RENDER ==================== */
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Page Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Event Calendar</h1>
              <p className="text-slate-600 mt-1 text-sm">
                Create events and see all your scheduled activities
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm shadow-md transition-all flex items-center gap-2"
            >
              <Plus size={18} /> <span>Create Event</span>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-3" />
                <p className="text-slate-600 font-medium">
                  Loading calendar...
                </p>
              </div>
            </div>
          ) : !userBarangay ? (
            <div className="bg-white rounded-xl shadow-md border-2 border-amber-200 p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-amber-900 mb-1">
                    No Barangay Assigned
                  </h3>
                  <p className="text-sm text-amber-700">
                    You are not assigned to any barangay yet. Please contact
                    your administrator.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Barangay Banner */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-md p-5 mb-6">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-5 h-5" />
                      <h2 className="text-lg font-bold">
                        Barangay {userBarangay.barangayName}
                      </h2>
                    </div>
                    <p className="text-blue-100 text-sm">
                      Events for your barangay or ones you created
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <CalendarIcon className="w-7 h-7 text-white" />
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                  icon={CalendarIcon}
                  title="Total Events"
                  value={statistics.total}
                  color="blue"
                  subtitle="All scheduled"
                />
                <StatCard
                  icon={TrendingUp}
                  title="Upcoming"
                  value={statistics.upcoming}
                  color="emerald"
                  subtitle="Future events"
                />
                <StatCard
                  icon={CalendarDays}
                  title="This Month"
                  value={statistics.thisMonth}
                  color="purple"
                  subtitle={currentDate.toLocaleString("default", {
                    month: "long",
                  })}
                />
                <StatCard
                  icon={FileText}
                  title="Past Events"
                  value={statistics.past}
                  color="slate"
                  subtitle="Completed"
                />
              </div>

              {/* Calendar */}
              <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 overflow-hidden mb-6">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4">
                  <div className="flex justify-between items-center">
                    <button
                      onClick={handlePrevMonth}
                      className="p-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg transition-colors flex items-center gap-1.5 text-sm font-semibold"
                    >
                      <ChevronLeft size={18} /> <span>Previous</span>
                    </button>
                    <h2 className="text-xl font-bold text-white">
                      {monthName}
                    </h2>
                    <button
                      onClick={handleNextMonth}
                      className="p-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg transition-colors flex items-center gap-1.5 text-sm font-semibold"
                    >
                      <span>Next</span> <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {WEEKDAYS.map((day) => (
                      <div
                        key={day}
                        className="font-bold text-center text-slate-700 text-xs bg-gradient-to-br from-slate-100 to-slate-50 py-2.5 rounded-lg border-2 border-slate-200"
                      >
                        <span className="hidden md:inline">{day}</span>
                        <span className="md:hidden">{day.slice(0, 3)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">{calendarDays}</div>
                </div>
              </div>

              {/* Upcoming Events */}
              {statistics.upcoming > 0 && (
                <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-5 py-3 border-b-2 border-slate-200 flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={
                          user &&
                          selectedEventIds.size === deletableEvents.length &&
                          deletableEvents.length > 0
                        }
                        onChange={(e) => toggleSelectAll(e.target.checked)}
                      />
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          Upcoming Events
                        </h3>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Events scheduled for Barangay{" "}
                          {userBarangay.barangayName}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        selectedEventIds.size > 0 &&
                        openConfirmationModal(Array.from(selectedEventIds))
                      }
                      disabled={selectedEventIds.size === 0}
                      className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
                    >
                      Cancel Selected
                    </button>
                  </div>
                  <div className="p-5 space-y-3">
                    {upcomingEvents.map((evt) => (
                      <EventCard
                        key={evt._id}
                        evt={evt}
                        user={user}
                        onDelete={handleDeleteEvent}
                        onToggleSelect={toggleSelectEvent}
                        isSelected={selectedEventIds.has(evt._id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {statistics.total === 0 && (
                <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 p-10">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CalendarIcon className="text-slate-400" size={32} />
                    </div>
                    <p className="text-base font-bold text-slate-900 mb-1">
                      No events scheduled
                    </p>
                    <p className="text-sm text-slate-500">
                      There are no events scheduled for Barangay{" "}
                      {userBarangay.barangayName} yet.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Confirmation Modal */}
          {confirmationModal.isOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-2xl">
                  <h3 className="text-xl font-bold text-white">
                    {confirmationModal.title}
                  </h3>
                </div>
                <div className="p-6">
                  <p className="text-slate-700 text-base mb-6">
                    {confirmationModal.message}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleConfirmAction}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={closeConfirmationModal}
                      className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Date Modal */}
      {showDateModal && selectedDate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5">
              <div className="flex justify-between items-center">
                <div className="text-white">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <CalendarIcon size={24} />
                    Events on {selectedDate.toLocaleDateString()}
                  </h2>
                  <p className="text-blue-100 mt-0.5 text-xs">
                    {selectedDateEvents.length} event
                    {selectedDateEvents.length !== 1 ? "s" : ""} scheduled
                  </p>
                </div>
                <button
                  onClick={() => setShowDateModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <span className="text-white text-2xl">×</span>
                </button>
              </div>
            </div>
            <div
              className="p-5 overflow-y-auto"
              style={{ maxHeight: "calc(90vh - 120px)" }}
            >
              {selectedDateEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateEvents.map((evt) => (
                    <div
                      key={evt._id}
                      className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg"
                    >
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                          <CalendarIcon className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-bold text-slate-900 text-base">
                          {evt.subject}
                        </h3>
                      </div>
                      {evt.body && (
                        <p className="text-xs text-slate-700 mb-2.5 p-2.5 bg-white rounded-lg border border-blue-200">
                          {evt.body}
                        </p>
                      )}
                      {user && String(evt.sender?._id) === String(user._id) && (
                        <button
                          onClick={() => handleDeleteEvent(evt._id)}
                          className="mb-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-semibold text-xs transition-colors flex items-center gap-2"
                        >
                          <Trash2 size={14} /> Cancel
                        </button>
                      )}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span className="font-semibold text-slate-700">
                            Start: {new Date(evt.startDate).toLocaleString()}
                          </span>
                        </div>
                        {evt.endDate && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <Clock className="w-3.5 h-3.5 text-purple-600" />
                            <span className="font-semibold text-slate-700">
                              End: {new Date(evt.endDate).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CalendarIcon className="text-slate-400" size={32} />
                  </div>
                  <p className="text-slate-500 font-medium text-base">
                    No events on this date
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    Check other dates for scheduled events
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden">
            <div className="bg-blue-600 px-6 py-5 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-white">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <CalendarIcon size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Create New Event</h2>
                    <p className="text-blue-100 text-sm">
                      Schedule a barangay event
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseCreateModal}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X size={22} className="text-white" />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleCreateEvent}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="p-6 overflow-y-auto flex-1 space-y-5">
                {/* Title */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
                    <Tag size={15} className="text-blue-600" />
                    Event Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={updateForm("subject")}
                    placeholder="e.g., Community General Assembly"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      formErrors.subject
                        ? "border-red-400 bg-red-50"
                        : "border-slate-200 focus:border-blue-500"
                    }`}
                  />
                  {formErrors.subject && (
                    <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                      <X size={11} /> {formErrors.subject}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
                    <AlignLeft size={15} className="text-blue-600" />
                    Description
                  </label>
                  <textarea
                    value={formData.body}
                    onChange={updateForm("body")}
                    placeholder="Describe the event, agenda, or any additional details..."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
                      <Clock size={15} className="text-blue-600" />
                      Start Date & Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={updateForm("startDate")}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        formErrors.startDate
                          ? "border-red-400 bg-red-50"
                          : "border-slate-200 focus:border-blue-500"
                      }`}
                    />
                    {formErrors.startDate && (
                      <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                        <X size={11} /> {formErrors.startDate}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
                      <Clock size={15} className="text-purple-600" />
                      End Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={updateForm("endDate")}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                        formErrors.endDate
                          ? "border-red-400 bg-red-50"
                          : "border-slate-200 focus:border-purple-500"
                      }`}
                    />
                    {formErrors.endDate && (
                      <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                        <X size={11} /> {formErrors.endDate}
                      </p>
                    )}
                  </div>
                </div>

                {/* Live Preview */}
                {formData.subject && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">
                      Preview
                    </p>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                        <CalendarIcon size={18} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 truncate">
                          {formData.subject}
                        </h4>
                        {formData.body && (
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                            {formData.body}
                          </p>
                        )}
                        {formData.startDate && (
                          <div className="flex flex-wrap gap-3 mt-2">
                            <span className="inline-flex items-center gap-1 text-xs text-blue-700 font-semibold">
                              <Clock size={11} />{" "}
                              {new Date(formData.startDate).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t-2 border-slate-200 bg-slate-50 flex gap-3 flex-shrink-0">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      <span>Create Event</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="px-6 py-3 bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-300 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default EventCalendar;
