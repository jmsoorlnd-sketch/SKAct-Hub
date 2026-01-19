import React, { useState, useEffect } from "react";
import axios from "axios";
import Layout from "../../layout/Layout";

const AdminCalendar = () => {
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

  // Fetch events and barangays
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
      // Filter to only show admin-scheduled events (actual events, not regular messages)
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
    if (window.confirm("Are you sure you want to cancel this event?")) {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("Authentication token not found. Please log in again.");
          return;
        }

        // Delete the event using DELETE request
        await axios.delete(`http://localhost:5000/api/messages/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Refresh events after deletion
        fetchEvents();
        alert("Event cancelled successfully");
      } catch (error) {
        console.error("Failed to delete event:", error);
        alert("Failed to cancel event. Please try again.");
      }
    }
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
      days.push(<div key={`empty-${i}`} className="bg-gray-50"></div>);
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

      const handleDateClick = () => {
        setSelectedDate(date);
        setShowDateModal(true);
      };

      days.push(
        <div
          key={day}
          onClick={handleDateClick}
          className={`border rounded-lg p-2 h-32 cursor-pointer hover:shadow-lg transition overflow-hidden flex flex-col ${
            isToday ? "bg-blue-50 border-blue-300" : "bg-white hover:bg-gray-50"
          }`}
        >
          <div
            className={`font-semibold mb-1 ${isToday ? "text-blue-600" : ""}`}
          >
            {day}
          </div>
          <div className="space-y-1 flex-1 overflow-y-auto">
            {dayEvents.map((evt) => (
              <div
                key={evt._id}
                className="text-xs bg-green-100 text-green-800 p-1 rounded truncate"
                title={evt.subject}
              >
                {evt.subject}
              </div>
            ))}
          </div>
        </div>,
      );
    }

    return { days, monthName };
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <p>Loading calendar...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Event Calendar</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
          >
            + Create Event
          </button>
        </div>

        {/* Create Event Form */}
        {showForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-blue-900">
                Create New Event
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
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
                <label className="block text-sm font-semibold mb-2">
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
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Connected Barangay *
                </label>
                <select
                  value={formData.barangayId}
                  onChange={(e) =>
                    setFormData({ ...formData, barangayId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select a Barangay --</option>
                  {barangays.map((barangay) => (
                    <option key={barangay._id} value={barangay._id}>
                      {barangay.barangayName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
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
                  <label className="block text-sm font-semibold mb-2">
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
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold"
                >
                  Create Event
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Calendar Header */}
        <div className="flex justify-between items-center mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <button
            onClick={handlePrevMonth}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            ← Previous
          </button>
          <h2 className="text-xl font-bold text-blue-900">
            {renderCalendar().monthName}
          </h2>
          <button
            onClick={handleNextMonth}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            Next →
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="mb-6 bg-white rounded-lg shadow p-6">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="font-bold text-center text-gray-700 bg-gray-100 py-2 rounded h-12 flex items-center justify-center"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">{renderCalendar().days}</div>
        </div>

        {/* Legend */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-6">
          <p className="font-semibold text-gray-900 mb-2">Legend:</p>
          <div className="flex items-center gap-2">
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm">
              Events
            </div>
            <p className="text-sm text-gray-600">
              Green cells show all scheduled events
            </p>
          </div>
        </div>

        {/* Events List */}
        {events.length > 0 && (
          <div>
            <h3 className="text-lg font-bold mb-3">All Events</h3>
            <div className="space-y-2">
              {events
                .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                .map((evt) => (
                  <div
                    key={evt._id}
                    className="p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <p className="font-semibold text-green-900">
                      {evt.subject}
                    </p>
                    <div className="text-sm text-green-800 mt-1">
                      <p>Start: {new Date(evt.startDate).toLocaleString()}</p>
                      {evt.endDate && (
                        <p>End: {new Date(evt.endDate).toLocaleString()}</p>
                      )}
                    </div>
                    {evt.body && (
                      <p className="text-sm text-green-700 mt-2">{evt.body}</p>
                    )}
                    {evt.attachedToBarangay && (
                      <p className="text-xs text-green-600 mt-2">
                        Barangay:{" "}
                        <span className="font-semibold">
                          {barangays.find(
                            (b) => b._id === evt.attachedToBarangay,
                          )?.barangayName || "Unknown"}
                        </span>
                      </p>
                    )}
                    <p className="text-xs text-green-600 mt-2">
                      Status:{" "}
                      <span className="font-semibold">{evt.status}</span>
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Date Modal - Show events for selected date */}
        {showDateModal && selectedDate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Events on {selectedDate.toLocaleDateString()}
                </h2>
                <button
                  onClick={() => setShowDateModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              {getEventsForDate(selectedDate).length > 0 ? (
                <div className="space-y-3">
                  {getEventsForDate(selectedDate).map((evt) => (
                    <div
                      key={evt._id}
                      className="p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-green-900">
                            {evt.subject}
                          </p>
                          <div className="text-sm text-green-800 mt-1">
                            <p>
                              Start:{" "}
                              {new Date(evt.startDate).toLocaleTimeString()}
                            </p>
                            {evt.endDate && (
                              <p>
                                End:{" "}
                                {new Date(evt.endDate).toLocaleTimeString()}
                              </p>
                            )}
                          </div>
                          {evt.body && (
                            <p className="text-sm text-green-700 mt-2">
                              {evt.body}
                            </p>
                          )}
                          {evt.attachedToBarangay && (
                            <p className="text-xs text-green-600 mt-2">
                              Barangay:{" "}
                              <span className="font-semibold">
                                {barangays.find(
                                  (b) => b._id === evt.attachedToBarangay,
                                )?.barangayName || "Unknown"}
                              </span>
                            </p>
                          )}
                          <p className="text-xs text-green-600 mt-2">
                            Status:{" "}
                            <span className="font-semibold">{evt.status}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteEvent(evt._id)}
                          className="ml-2 bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold whitespace-nowrap"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No events on this date
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminCalendar;
