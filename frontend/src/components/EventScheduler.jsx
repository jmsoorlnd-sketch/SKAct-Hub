import React, { useState, useEffect } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight, X, Plus } from "lucide-react";

const EventScheduler = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    body: "",
    startDate: "",
    endDate: "",
    barangayId: "",
  });

  // Fetch events and barangays
  useEffect(() => {
    console.log("EventScheduler mounted, fetching events...");
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
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "http://localhost:5000/api/messages/activities",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setEvents(res.data.activities || []);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.startDate) {
      alert("Please fill in required fields");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/messages/send",
        {
          subject: formData.subject,
          body: formData.body,
          startDate: formData.startDate,
          endDate: formData.endDate,
          barangayId: formData.barangayId || null,
          recipient: "admin",
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
      alert("Failed to schedule event");
    }
  };

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

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getEventsForDate = (day) => {
    const dateStr = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day,
    ).toDateString();
    return events.filter((event) => {
      const eventDate = new Date(event.startDate).toDateString();
      return eventDate === dateStr;
    });
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const year = currentDate.getFullYear();
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Event Scheduler</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} /> Schedule Event
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Create New Event</h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Title *
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Community Meeting"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.body}
                onChange={(e) =>
                  setFormData({ ...formData, body: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Event details..."
                rows="3"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Barangay (Optional)
              </label>
              <select
                value={formData.barangayId}
                onChange={(e) =>
                  setFormData({ ...formData, barangayId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a Barangay</option>
                {barangays.map((barangay) => (
                  <option key={barangay._id} value={barangay._id}>
                    {barangay.barangayName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                Create Event
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Calendar Header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
        <div className="flex items-center gap-2">
          <select
            value={year}
            onChange={(e) =>
              setCurrentDate(
                new Date(parseInt(e.target.value), currentDate.getMonth()),
              )
            }
            className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700"
          >
            {[2024, 2025, 2026, 2027, 2028].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-gray-700 font-semibold min-w-[150px] text-center">
            {monthName}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <button
          onClick={handleToday}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium"
        >
          Today
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
          <div
            key={day}
            className="text-center font-semibold text-gray-600 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, idx) => (
          <div key={idx} className="aspect-square">
            {day ? (
              <div
                onClick={() => setSelectedDate(day)}
                className={`h-full w-full p-2 rounded-lg cursor-pointer border-2 transition-all ${
                  isToday(day)
                    ? "border-blue-500 bg-blue-50"
                    : selectedDate === day
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                } flex flex-col`}
              >
                <span className="text-sm font-semibold text-gray-700">
                  {day}
                </span>
                <div className="flex-1 overflow-hidden mt-1">
                  {getEventsForDate(day).length > 0 && (
                    <div className="text-xs bg-red-100 text-red-700 px-1 rounded truncate">
                      {getEventsForDate(day).length} event
                      {getEventsForDate(day).length > 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full w-full rounded-lg bg-gray-50" />
            )}
          </div>
        ))}
      </div>

      {/* Selected Date Events */}
      {selectedDate && (
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-lg font-semibold mb-4">
            Events on {monthName} {selectedDate}, {year}
          </h3>
          {getEventsForDate(selectedDate).length > 0 ? (
            <div className="space-y-3">
              {getEventsForDate(selectedDate).map((event) => (
                <div
                  key={event._id}
                  className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg"
                >
                  <h4 className="font-semibold text-blue-900">
                    {event.subject}
                  </h4>
                  <p className="text-sm text-blue-700 mt-1">{event.body}</p>
                  {event.attachedToBarangay && (
                    <div className="mt-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded inline-block">
                      📍{" "}
                      {barangays.find((b) => b._id === event.attachedToBarangay)
                        ?.barangayName || "Loading..."}
                    </div>
                  )}
                  <div className="mt-3 text-sm text-blue-700 space-y-1">
                    {event.startDate && (
                      <p>
                        <strong>Start:</strong>{" "}
                        {new Date(event.startDate).toLocaleString()}
                      </p>
                    )}
                    {event.endDate && (
                      <p>
                        <strong>End:</strong>{" "}
                        {new Date(event.endDate).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end text-xs text-blue-600 mt-2">
                    <span>Status: {event.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No events scheduled for this date.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default EventScheduler;
