import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  FileText,
  AlertCircle,
  TrendingUp,
  CalendarDays,
  Shield,
} from "lucide-react";

const EventCalendar = () => {
  /* ===================== STATE ===================== */
  const [userBarangay, setUserBarangay] = useState(null);
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDateModal, setShowDateModal] = useState(false);

  /* ===================== DATA FETCHING ===================== */
  useEffect(() => {
    fetchUserBarangay();
    fetchEvents();
  }, []);

  const fetchUserBarangay = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "http://localhost:5000/api/barangays/me/barangay",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setUserBarangay(res.data.barangay);
    } catch (err) {
      console.error("Failed to fetch user barangay:", err);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "http://localhost:5000/api/messages/activities",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setEvents(res.data.activities || []);
    } catch (err) {
      console.error("Failed to fetch events:", err);
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
    return events.filter((event) => {
      if (!userBarangay) return false;

      // Only show events if the official's barangay matches
      if (event.attachedToBarangay !== userBarangay._id) {
        return false;
      }

      const eventDate = new Date(event.startDate);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  /* ===================== STATISTICS ===================== */
  const statistics = useMemo(() => {
    if (!userBarangay) return { total: 0, upcoming: 0, past: 0, thisMonth: 0 };

    const barangayEvents = events.filter(
      (e) => e.attachedToBarangay === userBarangay._id,
    );
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const total = barangayEvents.length;
    const upcoming = barangayEvents.filter(
      (e) => new Date(e.startDate) >= today,
    ).length;
    const past = barangayEvents.filter(
      (e) => new Date(e.startDate) < today,
    ).length;
    const thisMonth = barangayEvents.filter((e) => {
      const eventDate = new Date(e.startDate);
      return (
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear()
      );
    }).length;

    return { total, upcoming, past, thisMonth };
  }, [events, userBarangay, currentDate]);

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
              className={`text-xs font-bold ${
                isToday
                  ? "text-blue-600 text-base"
                  : isPast
                    ? "text-slate-400"
                    : "text-slate-900"
              }`}
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

    return { days, monthName };
  };

  /* ===================== RENDER ===================== */
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Event Calendar</h1>
            <p className="text-slate-600 mt-1 text-sm">
              View scheduled events for your barangay
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-3"></div>
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
                    your administrator to get assigned to a barangay.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Barangay Info Banner */}
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
                      Events scheduled for your barangay
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <CalendarIcon className="w-7 h-7 text-white" />
                  </div>
                </div>
              </div>

              {/* Statistics Cards */}
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
                {/* Calendar Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4">
                  <div className="flex justify-between items-center">
                    <button
                      onClick={handlePrevMonth}
                      className="p-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg transition-colors flex items-center gap-1.5 text-sm font-semibold"
                    >
                      <ChevronLeft size={18} />
                      <span>Previous</span>
                    </button>

                    <h2 className="text-xl font-bold text-white">
                      {renderCalendar().monthName}
                    </h2>

                    <button
                      onClick={handleNextMonth}
                      className="p-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg transition-colors flex items-center gap-1.5 text-sm font-semibold"
                    >
                      <span>Next</span>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                <div className="p-5">
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
                        className="font-bold text-center text-slate-700 text-xs bg-gradient-to-br from-slate-100 to-slate-50 py-2.5 rounded-lg border-2 border-slate-200"
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
              {statistics.upcoming > 0 && (
                <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-5 py-3 border-b-2 border-slate-200">
                    <h3 className="text-base font-bold text-slate-900">
                      Upcoming Events
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Events scheduled for Barangay {userBarangay.barangayName}
                    </p>
                  </div>

                  <div className="p-5">
                    <div className="space-y-3">
                      {events
                        .filter(
                          (e) => e.attachedToBarangay === userBarangay._id,
                        )
                        .filter((e) => new Date(e.startDate) >= new Date())
                        .sort(
                          (a, b) =>
                            new Date(a.startDate) - new Date(b.startDate),
                        )
                        .map((evt) => (
                          <div
                            key={evt._id}
                            className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg hover:shadow-md transition-all"
                          >
                            <div className="flex items-start gap-2.5 mb-2.5">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                                <CalendarIcon className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-slate-900 text-base">
                                  {evt.subject}
                                </h4>
                                {evt.body && (
                                  <p className="text-xs text-slate-700 mt-0.5">
                                    {evt.body}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div className="flex items-center gap-1.5 text-xs">
                                <Clock className="w-3.5 h-3.5 text-blue-600" />
                                <span className="font-semibold text-slate-700">
                                  Start:{" "}
                                  {new Date(evt.startDate).toLocaleString()}
                                </span>
                              </div>
                              {evt.endDate && (
                                <div className="flex items-center gap-1.5 text-xs">
                                  <Clock className="w-3.5 h-3.5 text-purple-600" />
                                  <span className="font-semibold text-slate-700">
                                    End:{" "}
                                    {new Date(evt.endDate).toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
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
        </div>
      </div>

      {/* Date Modal - Show events for selected date */}
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
                  <span className="text-white text-2xl">×</span>
                </button>
              </div>
            </div>

            <div
              className="p-5 overflow-y-auto"
              style={{ maxHeight: "calc(90vh - 120px)" }}
            >
              {getEventsForDate(selectedDate).length > 0 ? (
                <div className="space-y-3">
                  {getEventsForDate(selectedDate).map((evt) => (
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
    </>
  );
};

/* ==================== STAT CARD COMPONENT ==================== */
const StatCard = ({ icon: Icon, title, value, color, subtitle }) => {
  const colors = {
    blue: {
      bg: "from-blue-500 to-blue-600",
      badge: "bg-blue-100 text-blue-700",
    },
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
          {subtitle}
        </span>
      </div>
      <h3 className="text-slate-500 text-xs font-semibold mb-0.5">{title}</h3>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
};

export default EventCalendar;
