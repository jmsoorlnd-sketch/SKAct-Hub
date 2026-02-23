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
  CalendarDays,
  TrendingUp,
  Save,
  AlignLeft,
  Tag,
} from "lucide-react";

/* ===================== MAIN COMPONENT ===================== */
const AdminCalendar = () => {
  /* ===================== STATE ===================== */
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDateModal, setShowDateModal] = useState(false);

  // Form
  const defaultForm = {
    subject: "",
    body: "",
    startDate: "",
    endDate: "",
    barangayId: "",
  };
  const [formData, setFormData] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});

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

      const filtered = (res.data.activities || []).filter(
        (a) => a.isAdminScheduled === true,
      );
      setEvents(filtered);
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

  /* ===================== FORM VALIDATION ===================== */
  const validateForm = () => {
    const errors = {};
    if (!formData.subject.trim()) errors.subject = "Event title is required";
    if (!formData.startDate) errors.startDate = "Start date is required";
    if (formData.endDate && formData.endDate < formData.startDate)
      errors.endDate = "End date cannot be before start date";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ===================== EVENT HANDLERS ===================== */
  const handleOpenCreateModal = () => {
    setFormData(defaultForm);
    setFormErrors({});
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setFormData(defaultForm);
    setFormErrors({});
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
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
          endDate: formData.endDate || null,
          attachedToBarangay: formData.barangayId || null,
          recipient: "admin",
          status: "approved",
          isAdminScheduled: true,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      handleCloseCreateModal();
      fetchEvents();
    } catch (error) {
      console.error("Failed to create event:", error);
      alert(
        error.response?.status === 401
          ? "Authentication failed. Please log in again."
          : "Failed to schedule event. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to cancel this event?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/messages/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowDateModal(false);
      fetchEvents();
    } catch (error) {
      console.error("Failed to delete event:", error);
      alert("Failed to cancel event. Please try again.");
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
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Page Header */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Event Calendar</h1>
              <p className="text-slate-600 mt-1 text-sm">
                Schedule and manage barangay events
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-blue-600  hover:bg-blue-700 text-white rounded-lg font-semibold text-sm shadow-md transition-all flex items-center gap-2"
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
                  <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-b-2 border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900">
                      All Scheduled Events
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Chronological event list
                    </p>
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
                              <div className="flex-1">
                                <div className="flex items-start gap-3 mb-3">
                                  <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 ${isPast ? "bg-slate-400" : "bg-gradient-to-br from-blue-500 to-blue-600"}`}
                                  >
                                    <CalendarIcon className="w-6 h-6 text-white" />
                                  </div>
                                  <div>
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

      {/* ==================== CREATE EVENT MODAL ==================== */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50  flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
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

            {/* Modal Body */}
            <form
              onSubmit={handleCreateEvent}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="p-6 overflow-y-auto flex-1 space-y-5">
                {/* Event Title */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
                    <Tag size={15} className="text-blue-600" />
                    Event Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => {
                      setFormData({ ...formData, subject: e.target.value });
                      if (formErrors.subject)
                        setFormErrors({ ...formErrors, subject: "" });
                    }}
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
                    onChange={(e) =>
                      setFormData({ ...formData, body: e.target.value })
                    }
                    placeholder="Describe the event, agenda, or any additional details..."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  />
                </div>

                {/* Connected Barangay */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
                    <MapPin size={15} className="text-emerald-600" />
                    Connected Barangay
                  </label>
                  <select
                    value={formData.barangayId}
                    onChange={(e) =>
                      setFormData({ ...formData, barangayId: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                  >
                    <option value="">— All Barangays (General Event) —</option>
                    {barangays.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.barangayName}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1.5">
                    Leave blank to create a general event for all barangays.
                  </p>
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
                      onChange={(e) => {
                        setFormData({ ...formData, startDate: e.target.value });
                        if (formErrors.startDate)
                          setFormErrors({ ...formErrors, startDate: "" });
                      }}
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
                      onChange={(e) => {
                        setFormData({ ...formData, endDate: e.target.value });
                        if (formErrors.endDate)
                          setFormErrors({ ...formErrors, endDate: "" });
                      }}
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
                        <div className="flex flex-wrap gap-3 mt-2">
                          {formData.startDate && (
                            <span className="inline-flex items-center gap-1 text-xs text-blue-700 font-semibold">
                              <Clock size={11} />
                              {new Date(formData.startDate).toLocaleString()}
                            </span>
                          )}
                          {formData.barangayId && (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold">
                              <MapPin size={11} />
                              {
                                barangays.find(
                                  (b) => b._id === formData.barangayId,
                                )?.barangayName
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t-2 border-slate-200 bg-slate-50 flex gap-3 flex-shrink-0">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-blue-600 to-indigo-600 hover:bg-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
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

      {/* ==================== DATE MODAL ==================== */}
      {showDateModal && selectedDate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex-shrink-0">
              <div className="flex justify-between items-start">
                <div className="text-white">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <CalendarIcon size={26} />
                    {selectedDate.toLocaleDateString("default", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    {getEventsForDate(selectedDate).length} event
                    {getEventsForDate(selectedDate).length !== 1
                      ? "s"
                      : ""}{" "}
                    scheduled
                  </p>
                </div>
                <button
                  onClick={() => setShowDateModal(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X size={24} className="text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
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
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon className="text-slate-400" size={40} />
                  </div>
                  <p className="text-slate-500 font-medium text-lg">
                    No events on this date
                  </p>
                  <p className="text-slate-400 text-sm mt-2">
                    Click below to schedule one
                  </p>
                  <button
                    onClick={() => {
                      setShowDateModal(false);
                      handleOpenCreateModal();
                    }}
                    className="mt-4 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg transition-all inline-flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Create Event
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ==================== STAT CARD ==================== */
const StatCard = ({ icon: Icon, title, value, color, subtitle, badge }) => {
  const colors = {
    blue: {
      bg: "from-blue-500 to-blue-600",
      badge: "bg-blue-100 text-blue-700",
      icon: "text-blue-500",
    },
    emerald: {
      bg: "from-emerald-500 to-emerald-600",
      badge: "bg-emerald-100 text-emerald-700",
      icon: "text-emerald-500",
    },
    purple: {
      bg: "from-purple-500 to-purple-600",
      badge: "bg-purple-100 text-purple-700",
      icon: "text-purple-500",
    },
    slate: {
      bg: "from-slate-500 to-slate-600",
      badge: "bg-slate-100 text-slate-700",
      icon: "text-slate-500",
    },
  };
  const c = colors[color];

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
          {badge}
        </span>
      </div>
      <h3 className="text-slate-500 text-xs font-semibold mb-0.5">{title}</h3>
      <p className="text-2xl font-bold text-slate-900 mb-2">{value}</p>
      <div className="flex items-center text-[11px] text-slate-500">
        <CalendarDays className={`w-3 h-3 mr-1 ${c.icon}`} />
        <span>{subtitle}</span>
      </div>
    </div>
  );
};
export default AdminCalendar;
