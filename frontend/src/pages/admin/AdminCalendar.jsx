import React, { useState, useEffect, useMemo } from "react";
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
import ConfirmationModal from "../../components/popforms/eventComponents/ConfirmationModals";
import StatCard from "../../components/popforms/eventComponents/StatCard";
import DateModal from "../../components/popforms/eventComponents/DateModal";

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

      // show every activity received from the server (admins can view all barangay events)
      setEvents(res.data.activities || []);
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
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1),
    );
  const handleNextMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1),
    );

  const getEventsForDate = (date) =>
    events.filter((event) => {
      const start = new Date(event.startDate);
      return (
        start.getDate() === date.getDate() &&
        start.getMonth() === date.getMonth() &&
        start.getFullYear() === date.getFullYear()
      );
    });

  /* clear selections when events update */
  useEffect(() => {
    setSelectedEventIds(new Set());
  }, [events]);

  /* ===================== EVENT HANDLERS ===================== */
  const handleDeleteEvent = (eventId) => {
    // open confirmation modal with single id
    setConfirmationModal({
      isOpen: true,
      eventIds: [eventId],
      title: "Cancel Event",
      message: "Are you sure you want to cancel this event?",
    });
  };

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
    for (const id of ids) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`http://localhost:5000/api/messages/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("Failed to delete event", id, err);
      }
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
        setShowCreateEventForm(false);
        fetchEvents();

        // Clear success message after 3 seconds
        setTimeout(() => setCreateEventMessage(""), 3000);
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

  // sorted list for display and bulk selection
  const sortedEvents = useMemo(() => {
    return [...events].sort(
      (a, b) => new Date(a.startDate) - new Date(b.startDate),
    );
  }, [events]);

  /* ===================== CALENDAR RENDER ===================== */
  const renderCalendar = () => {
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
      const dayEvents = getEventsForDate(date);
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
              const barangayName = barangays.find(
                (b) => b._id === evt.attachedToBarangay,
              )?.barangayName;
              return (
                <div
                  key={evt._id}
                  className="text-xs bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-2 py-1 rounded-lg truncate border border-blue-200 font-semibold"
                  title={`${evt.subject}${barangayName ? ` \u2013 ${barangayName}` : ""}`}
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
  };

  /* ===================== RENDER ===================== */
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Page Header */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold">Event Calendar</h1>
            <p className="text-slate-600 mt-1 text-sm">
              View and create events for all barangays or specific barangays
            </p>
          </div>

          {/* Create Event Button */}
          <button
            onClick={() => setShowCreateEventForm(!showCreateEventForm)}
            className="mb-6 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Create Event
          </button>

          {/* Create Event Form */}
          {showCreateEventForm && (
            <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Create New Event
                </h3>
                <button
                  onClick={() => setShowCreateEventForm(false)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <X size={20} />
                </button>
              </div>

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

              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Event Title *
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
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
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
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    placeholder="Event details and description..."
                    rows="3"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Start Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={eventFormData.startDate}
                      onChange={(e) =>
                        setEventFormData({
                          ...eventFormData,
                          startDate: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      End Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={eventFormData.endDate}
                      onChange={(e) =>
                        setEventFormData({
                          ...eventFormData,
                          endDate: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Event Visibility
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 border-2 border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
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
                        className="w-4 h-4 bg-green-600 accent-green-600"
                      />
                      <span className="font-semibold text-slate-900">
                        All Barangays
                      </span>
                      <span className="text-sm text-slate-600">
                        Everyone can see this event
                      </span>
                    </label>
                    <label className="flex items-center gap-3 p-3 border-2 border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
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
                        className="w-4 h-4 bg-green-600 accent-green-600"
                      />
                      <span className="font-semibold text-slate-900">
                        Specific Barangay
                      </span>
                      <span className="text-sm text-slate-600">
                        Only selected barangay can see this event
                      </span>
                    </label>
                  </div>
                </div>

                {eventFormData.visibility === "specific" && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Select Barangay *
                    </label>
                    <select
                      value={eventFormData.barangayId}
                      onChange={(e) =>
                        setEventFormData({
                          ...eventFormData,
                          barangayId: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
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

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={creatingEvent}
                    className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
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
                    onClick={() => {
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
                    }}
                    className="flex-1 px-4 py-3 bg-slate-300 hover:bg-slate-400 text-slate-900 rounded-lg font-bold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

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
                {" "}
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
              </div>

              {/* Calendar */}
              <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden mb-8">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
                  <div className="flex justify-between items-center">
                    <button
                      onClick={handlePrevMonth}
                      className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <ChevronLeft size={18} />
                      <span className="font-semibold">Previous</span>
                    </button>
                    <h2 className="text-2xl font-bold text-white">
                      {renderCalendar().monthName}
                    </h2>
                    <button
                      onClick={handleNextMonth}
                      className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <span className="font-semibold">Next</span>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {[
                      "Sunday",
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                    ].map((day) => (
                      <div
                        key={day}
                        className="font-bold text-center text-slate-700 bg-gradient-to-br from-slate-100 to-slate-50 py-3 rounded-xl border-2 border-slate-200"
                      >
                        <span className="hidden md:inline">{day}</span>
                        <span className="md:hidden">{day.slice(0, 3)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {renderCalendar().days}
                  </div>
                </div>
              </div>

              {/* Events List */}
              {events.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-b-2 border-slate-200 flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={
                          sortedEvents.length > 0 &&
                          selectedEventIds.size === sortedEvents.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEventIds(
                              new Set(sortedEvents.map((ev) => ev._id)),
                            );
                          } else {
                            setSelectedEventIds(new Set());
                          }
                        }}
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
                        onClick={() => {
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
                        }}
                        className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-semibold text-sm transition-colors"
                        disabled={selectedEventIds.size === 0}
                      >
                        Cancel Selected
                      </button>
                    )}
                  </div>
                  <div className="p-6 space-y-4">
                    {[...events]
                      .sort(
                        (a, b) => new Date(a.startDate) - new Date(b.startDate),
                      )
                      .map((evt) => {
                        const isPast = new Date(evt.startDate) < new Date();
                        const barangayName = barangays.find(
                          (b) => b._id === evt.attachedToBarangay,
                        )?.barangayName;
                        return (
                          <div
                            key={evt._id}
                            className={`p-5 rounded-xl border-2 transition-all ${isPast ? "bg-slate-50 border-slate-200" : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:shadow-md"}`}
                          >
                            <div className="flex justify-between items-start gap-4">
                              <input
                                type="checkbox"
                                className="mt-2"
                                checked={selectedEventIds.has(evt._id)}
                                onChange={() => {
                                  const copy = new Set(selectedEventIds);
                                  if (copy.has(evt._id)) copy.delete(evt._id);
                                  else copy.add(evt._id);
                                  setSelectedEventIds(copy);
                                }}
                              />
                              <div className="flex-1">
                                <div className="flex items-start gap-3 mb-3">
                                  <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 ${isPast ? "bg-slate-400" : "bg-gradient-to-br from-blue-500 to-blue-600"}`}
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
                                      <span>
                                        Created by: {evt.sender?.username}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                    <span className="font-semibold text-slate-700">
                                      Start:{" "}
                                      {new Date(evt.startDate).toLocaleString()}
                                    </span>
                                  </div>
                                  {evt.endDate && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <Clock className="w-4 h-4 text-purple-600 flex-shrink-0" />
                                      <span className="font-semibold text-slate-700">
                                        End:{" "}
                                        {new Date(evt.endDate).toLocaleString()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                {barangayName && (
                                  <div className="flex items-center gap-2 mt-3 text-sm">
                                    <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                    <span className="font-semibold text-slate-700">
                                      Barangay: {barangayName}
                                    </span>
                                  </div>
                                )}
                                {!barangayName &&
                                  evt.sender?.barangay?.barangayName && (
                                    <div className="flex items-center gap-2 mt-3 text-sm">
                                      <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                      <span className="font-semibold text-slate-600">
                                        Barangay:{" "}
                                        {evt.sender.barangay.barangayName}
                                      </span>
                                    </div>
                                  )}
                              </div>
                              <button
                                onClick={() => handleDeleteEvent(evt._id)}
                                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2 flex-shrink-0"
                              >
                                <Trash2 size={16} />
                                <span>Cancel</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {/* ==================== DATE MODAL ==================== */}
      {showDateModal && selectedDate && (
        <DateModal
          date={selectedDate}
          events={getEventsForDate(selectedDate)}
          barangays={barangays}
          onClose={() => setShowDateModal(false)}
          onDelete={handleDeleteEvent}
        />
      )}
      {/* Confirmation modal for bulk actions */}
      {confirmationModal.isOpen && (
        <ConfirmationModal
          isOpen={confirmationModal.isOpen}
          title={confirmationModal.title}
          message={confirmationModal.message}
          onConfirm={handleConfirmAction}
          onClose={() =>
            setConfirmationModal({ ...confirmationModal, isOpen: false })
          }
        />
      )}
    </>
  );
};

/* ==================== STAT CARD ==================== */
<StatCard />;
export default AdminCalendar;
