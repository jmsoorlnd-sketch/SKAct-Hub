import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Clock,
  MapPin,
  FileText,
  Trash2,
  Edit2,
  Eye,
  CalendarDays,
  TrendingUp,
} from "lucide-react";

import Layout from "../../layout/Layout";

const AdminCalendar = () => {
  /* ===================== STATE ===================== */
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    body: "",
    startDate: "",
    endDate: "",
    barangayId: "",
  });

  /* ===================== DATA FETCH ===================== */
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
      if (!token) {
        console.warn("No token found when fetching events");
        return;
      }
      const res = await axios.get(
        "http://localhost:5000/api/messages/activities",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      // Filter to only show admin-scheduled events
      const filteredEvents = (res.data.activities || []).filter(
        (activity) => activity.isAdminScheduled === true,
      );
      setEvents(filteredEvents);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  };

  /* ===================== CALENDAR HELPERS ===================== */
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1),
    );
  };

  const getEventsForDate = (date) => {
    const eventDate = new Date(date);
    return events.filter((event) => {
      const eventStart = new Date(event.startDate);
      return (
        eventStart.getDate() === eventDate.getDate() &&
        eventStart.getMonth() === eventDate.getMonth() &&
        eventStart.getFullYear() === eventDate.getFullYear()
      );
    });
  };

  /* ===================== EVENT HANDLERS ===================== */
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.startDate) {
      alert("Please fill in required fields");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Authentication token not found. Please log in again.");
        return;
      }

      await axios.post(
        "http://localhost:5000/api/messages/send",
        {
          subject: formData.subject,
          body: formData.body,
          startDate: formData.startDate,
          endDate: formData.endDate,
          attachedToBarangay: formData.barangayId || null,
          recipient: "admin",
          status: "approved",
          isAdminScheduled: true,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      alert("Event scheduled successfully!");
      setFormData({
        subject: "",
        body: "",
        startDate: "",
        endDate: "",
        barangayId: "",
      });
      setShowForm(false);
      fetchEvents();
    } catch (error) {
      console.error("Failed to create event:", error);
      if (error.response?.status === 401) {
        alert("Authentication failed. Please log in again.");
      } else {
        alert("Failed to schedule event");
      }
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to cancel this event?")) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Authentication token not found. Please log in again.");
        return;
      }

      await axios.delete(`http://localhost:5000/api/messages/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchEvents();
      alert("Event cancelled successfully");
    } catch (error) {
      console.error("Failed to delete event:", error);
      alert("Failed to cancel event. Please try again.");
    }
  };

  /* ===================== STATISTICS ===================== */
  const statistics = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const upcoming = events.filter(
      (e) => new Date(e.startDate) >= today,
    ).length;
    const past = events.filter((e) => new Date(e.startDate) < today).length;
    const thisMonth = events.filter((e) => {
      const eventDate = new Date(e.startDate);
      return (
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear()
      );
    }).length;

    return {
      total: events.length,
      upcoming,
      past,
      thisMonth,
    };
  }, [events, currentDate]);

  /* ===================== CALENDAR RENDER ===================== */
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    const monthName = currentDate.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className="bg-slate-50 rounded-lg border-2 border-transparent"
        ></div>,
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day,
      );
      const dayEvents = getEventsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const isPast = date < new Date().setHours(0, 0, 0, 0);

      const handleDateClick = () => {
        setSelectedDate(date);
        setShowDateModal(true);
      };

      days.push(
        <div
          key={day}
          onClick={handleDateClick}
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
              className={`text-sm font-bold ${
                isToday
                  ? "text-blue-600 text-lg"
                  : isPast
                    ? "text-slate-400"
                    : "text-slate-900"
              }`}
            >
              {day}
            </span>
            {dayEvents.length > 0 && (
              <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs font-bold">
                {dayEvents.length}
              </span>
            )}
          </div>
          <div className="space-y-1 flex-1 overflow-y-auto">
            {dayEvents.slice(0, 3).map((evt) => (
              <div
                key={evt._id}
                className="text-xs bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-2 py-1 rounded-lg truncate border border-blue-200 font-semibold"
                title={evt.subject}
              >
                {evt.subject}
              </div>
            ))}
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
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Event Calendar
                </h1>
                <p className="text-slate-600 mt-2 text-lg">
                  Schedule and manage barangay events
                </p>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <Plus size={20} />
                <span>Create Event</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                <p className="text-slate-600 font-medium">
                  Loading calendar...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Events */}
                <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-6 hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <CalendarIcon className="w-7 h-7 text-white" />
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">
                      Total
                    </span>
                  </div>
                  <h3 className="text-slate-500 text-sm font-semibold mb-1">
                    Total Events
                  </h3>
                  <p className="text-3xl font-bold text-slate-900 mb-2">
                    {statistics.total}
                  </p>
                  <div className="flex items-center text-xs text-slate-500">
                    <CalendarDays className="w-4 h-4 text-blue-500 mr-1" />
                    <span>All scheduled events</span>
                  </div>
                </div>

                {/* Upcoming Events */}
                <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-6 hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                      <TrendingUp className="w-7 h-7 text-white" />
                    </div>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">
                      Active
                    </span>
                  </div>
                  <h3 className="text-slate-500 text-sm font-semibold mb-1">
                    Upcoming
                  </h3>
                  <p className="text-3xl font-bold text-slate-900 mb-2">
                    {statistics.upcoming}
                  </p>
                  <div className="flex items-center text-xs text-slate-500">
                    <Clock className="w-4 h-4 text-emerald-500 mr-1" />
                    <span>Future events</span>
                  </div>
                </div>

                {/* This Month */}
                <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-6 hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <CalendarDays className="w-7 h-7 text-white" />
                    </div>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold">
                      Current
                    </span>
                  </div>
                  <h3 className="text-slate-500 text-sm font-semibold mb-1">
                    This Month
                  </h3>
                  <p className="text-3xl font-bold text-slate-900 mb-2">
                    {statistics.thisMonth}
                  </p>
                  <div className="flex items-center text-xs text-slate-500">
                    <CalendarIcon className="w-4 h-4 text-purple-500 mr-1" />
                    <span>
                      {currentDate.toLocaleString("default", { month: "long" })}
                    </span>
                  </div>
                </div>

                {/* Past Events */}
                <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-6 hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center shadow-lg">
                      <FileText className="w-7 h-7 text-white" />
                    </div>
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">
                      Archive
                    </span>
                  </div>
                  <h3 className="text-slate-500 text-sm font-semibold mb-1">
                    Past Events
                  </h3>
                  <p className="text-3xl font-bold text-slate-900 mb-2">
                    {statistics.past}
                  </p>
                  <div className="flex items-center text-xs text-slate-500">
                    <FileText className="w-4 h-4 text-slate-500 mr-1" />
                    <span>Completed events</span>
                  </div>
                </div>
              </div>

              {/* Create Event Form */}
              {showForm && (
                <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-6 mb-8">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        Create New Event
                      </h2>
                      <p className="text-sm text-slate-600 mt-1">
                        Schedule a new calendar event
                      </p>
                    </div>
                    <button
                      onClick={() => setShowForm(false)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <X size={24} className="text-slate-500" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateEvent} className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-900 mb-2">
                        Event Title *
                      </label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) =>
                          setFormData({ ...formData, subject: e.target.value })
                        }
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="e.g., Community Meeting"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-900 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.body}
                        onChange={(e) =>
                          setFormData({ ...formData, body: e.target.value })
                        }
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                        placeholder="Event details..."
                        rows="4"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-900 mb-2">
                        Connected Barangay
                      </label>
                      <select
                        value={formData.barangayId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            barangayId: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                      >
                        <option value="">-- Select a Barangay --</option>
                        {barangays.map((barangay) => (
                          <option key={barangay._id} value={barangay._id}>
                            {barangay.barangayName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-bold text-slate-900 mb-2">
                          Start Date & Time *
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.startDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
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
                          value={formData.endDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              endDate: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
                      >
                        Create Event
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Calendar */}
              <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden mb-8">
                {/* Calendar Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
                  <div className="flex justify-between items-center">
                    <button
                      onClick={handlePrevMonth}
                      className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <ChevronLeft size={20} />
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
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {/* Weekday Headers */}
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

                  {/* Calendar Days Grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {renderCalendar().days}
                  </div>
                </div>
              </div>

              {/* Upcoming Events List */}
              {events.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-b-2 border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900">
                      All Scheduled Events
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Chronological event list
                    </p>
                  </div>

                  <div className="p-6">
                    <div className="space-y-4">
                      {events
                        .sort(
                          (a, b) =>
                            new Date(a.startDate) - new Date(b.startDate),
                        )
                        .map((evt) => {
                          const isPast = new Date(evt.startDate) < new Date();
                          const barangayName = barangays.find(
                            (b) => b._id === evt.attachedToBarangay,
                          )?.barangayName;

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
                                <div className="flex-1">
                                  <div className="flex items-start gap-3 mb-3">
                                    <div
                                      className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
                                        isPast
                                          ? "bg-slate-400"
                                          : "bg-gradient-to-br from-blue-500 to-blue-600"
                                      }`}
                                    >
                                      <CalendarIcon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-bold text-slate-900 text-lg">
                                        {evt.subject}
                                      </h4>
                                      {evt.body && (
                                        <p className="text-sm text-slate-600 mt-1">
                                          {evt.body}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2 text-sm">
                                      <Clock className="w-4 h-4 text-blue-600" />
                                      <span className="font-semibold text-slate-700">
                                        Start:{" "}
                                        {new Date(
                                          evt.startDate,
                                        ).toLocaleString()}
                                      </span>
                                    </div>
                                    {evt.endDate && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <Clock className="w-4 h-4 text-purple-600" />
                                        <span className="font-semibold text-slate-700">
                                          End:{" "}
                                          {new Date(
                                            evt.endDate,
                                          ).toLocaleString()}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {barangayName && (
                                    <div className="flex items-center gap-2 mt-3">
                                      <MapPin className="w-4 h-4 text-emerald-600" />
                                      <span className="text-sm font-semibold text-slate-700">
                                        Barangay: {barangayName}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <button
                                  onClick={() => handleDeleteEvent(evt._id)}
                                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
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
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Date Modal - Show events for selected date */}
      {showDateModal && selectedDate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
              <div className="flex justify-between items-center">
                <div className="text-white">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <CalendarIcon size={28} />
                    Events on {selectedDate.toLocaleDateString()}
                  </h2>
                  <p className="text-blue-100 mt-1 text-sm">
                    {getEventsForDate(selectedDate).length} event
                    {getEventsForDate(selectedDate).length !== 1
                      ? "s"
                      : ""}{" "}
                    scheduled
                  </p>
                </div>
                <button
                  onClick={() => setShowDateModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={24} className="text-white" />
                </button>
              </div>
            </div>

            <div
              className="p-6 overflow-y-auto"
              style={{ maxHeight: "calc(90vh - 140px)" }}
            >
              {getEventsForDate(selectedDate).length > 0 ? (
                <div className="space-y-4">
                  {getEventsForDate(selectedDate).map((evt) => {
                    const barangayName = barangays.find(
                      (b) => b._id === evt.attachedToBarangay,
                    )?.barangayName;

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

                            {evt.body && (
                              <p className="text-sm text-slate-700 mb-3 p-3 bg-white rounded-lg border border-blue-200">
                                {evt.body}
                              </p>
                            )}

                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-blue-600" />
                                <span className="font-semibold text-slate-700">
                                  Start:{" "}
                                  {new Date(evt.startDate).toLocaleString()}
                                </span>
                              </div>
                              {evt.endDate && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Clock className="w-4 h-4 text-purple-600" />
                                  <span className="font-semibold text-slate-700">
                                    End:{" "}
                                    {new Date(evt.endDate).toLocaleString()}
                                  </span>
                                </div>
                              )}
                              {barangayName && (
                                <div className="flex items-center gap-2 text-sm">
                                  <MapPin className="w-4 h-4 text-emerald-600" />
                                  <span className="font-semibold text-slate-700">
                                    Barangay: {barangayName}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              handleDeleteEvent(evt._id);
                              setShowDateModal(false);
                            }}
                            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
                          >
                            <Trash2 size={16} />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon className="text-slate-400" size={40} />
                  </div>
                  <p className="text-slate-500 font-medium text-lg">
                    No events on this date
                  </p>
                  <p className="text-slate-400 text-sm mt-2">
                    Schedule an event to get started
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminCalendar;
