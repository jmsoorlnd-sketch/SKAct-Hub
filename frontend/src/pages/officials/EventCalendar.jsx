import React, { useState, useEffect } from "react";
import axios from "axios";
import Layout from "../../layout/Layout";

const EventCalendar = () => {
  const [userBarangay, setUserBarangay] = useState(null);
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchUserBarangay();
    fetchEvents();
  }, []);

  // Calendar helper functions
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

      days.push(
        <div
          key={day}
          className={`border rounded-lg p-2 min-h-24 ${
            isToday ? "bg-blue-50 border-blue-300" : "bg-white"
          }`}
        >
          <div
            className={`font-semibold mb-1 ${isToday ? "text-blue-600" : ""}`}
          >
            {day}
          </div>
          <div className="space-y-1">
            {dayEvents.map((evt) => (
              <div
                key={evt._id}
                className="text-xs bg-blue-100 text-blue-800 p-1 rounded truncate"
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
      <div className="p-5">
        <h1 className="text-2xl font-bold mb-4">Event Calendar</h1>

        {!userBarangay ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            <p className="font-semibold">
              You are not assigned to any barangay yet. No events to display.
            </p>
          </div>
        ) : (
          <div>
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
              <div className="grid grid-cols-7 gap-2 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className="font-bold text-center text-gray-700 bg-gray-100 py-2 rounded"
                    >
                      {day}
                    </div>
                  ),
                )}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {renderCalendar().days}
              </div>
            </div>

            {/* Legend */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-6">
              <p className="font-semibold text-gray-900 mb-2">Legend:</p>
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm">
                  Events
                </div>
                <p className="text-sm text-gray-600">
                  Green cells show events connected to your barangay (
                  {userBarangay.barangayName})
                </p>
              </div>
            </div>

            {/* Events List */}
            {events.filter((e) => e.attachedToBarangay === userBarangay._id)
              .length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-3">
                  Upcoming Events for {userBarangay.barangayName}
                </h3>
                <div className="space-y-2">
                  {events
                    .filter((e) => e.attachedToBarangay === userBarangay._id)
                    .sort(
                      (a, b) => new Date(a.startDate) - new Date(b.startDate),
                    )
                    .map((evt) => (
                      <div
                        key={evt._id}
                        className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
                      >
                        <p className="font-semibold text-blue-900">
                          {evt.subject}
                        </p>
                        <p className="text-sm text-blue-800">
                          {new Date(evt.startDate).toLocaleString()}
                        </p>
                        {evt.body && (
                          <p className="text-sm text-blue-700 mt-1">
                            {evt.body}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EventCalendar;
