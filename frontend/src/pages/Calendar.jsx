import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../layout/Layout";
import { MapPin, User, Clock, X, CalendarIcon } from "lucide-react";

const Calendar = () => {
  const [activities, setActivities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        // Fetch activities
        const resActivities = await axios.get(
          "http://localhost:5000/api/messages/activities",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setActivities(resActivities.data.activities || []);

        // Fetch barangays
        const resBarangays = await axios.get(
          "http://localhost:5000/api/barangays/all-barangays",
        );
        setBarangays(resBarangays.data.barangays || []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Group by date (startDate)
  const grouped = activities.reduce((acc, a) => {
    const d = a.startDate ? new Date(a.startDate).toDateString() : "No date";
    acc[d] = acc[d] || [];
    acc[d].push(a);
    return acc;
  }, {});

  // Create barangay map
  const barangayMap = barangays.reduce((map, b) => {
    map[b._id] = b.barangayName;
    return map;
  }, {});

  return (
    <Layout>
      <div className="p-3 sm:p-4 md:p-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-4">
          Activities Calendar
        </h1>
        {loading ? (
          <p className="text-sm sm:text-base">Loading activities...</p>
        ) : activities.length === 0 ? (
          <p className="text-sm sm:text-base">
            No approved/ongoing activities yet.
          </p>
        ) : (
          Object.keys(grouped).map((date) => (
            <div key={date} className="mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold mb-2">
                {date}
              </h3>
              <div className="space-y-2 sm:space-y-3">
                {grouped[date].map((act) => {
                  const barangayName = barangayMap[act.attachedToBarangay];
                  return (
                    <div
                      key={act._id}
                      onClick={() => setSelectedEvent(act)}
                      className="p-3 sm:p-4 bg-white rounded shadow-md border-l-4 border-blue-500 hover:shadow-lg hover:cursor-pointer transition-all hover:scale-105"
                    >
                      <div className="flex justify-between items-start gap-3 mb-2">
                        <div className="flex-1">
                          <p className="font-bold text-sm sm:text-base text-slate-900">
                            {act.subject}
                          </p>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 font-semibold whitespace-nowrap">
                          {act.startDate
                            ? new Date(act.startDate).toLocaleTimeString(
                                "default",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )
                            : ""}
                        </div>
                      </div>

                      {act.body && (
                        <p className="text-xs sm:text-sm text-gray-700 mb-2 line-clamp-2">
                          {act.body}
                        </p>
                      )}

                      <div className="space-y-1 text-xs sm:text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                          <User size={14} className="text-blue-600" />
                          <span className="font-semibold">Created by: </span>
                          <span className="text-slate-700">
                            {act.sender?.username || "Unknown"}
                          </span>
                        </div>

                        {barangayName && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <MapPin size={14} className="text-green-600" />
                            <span className="font-semibold">Barangay: </span>
                            <span className="text-slate-700">
                              {barangayName}
                            </span>
                          </div>
                        )}

                        {act.endDate && (
                          <div className="text-xs text-gray-500 mt-1 ml-6">
                            Ends:{" "}
                            {new Date(act.endDate).toLocaleTimeString(
                              "default",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex-shrink-0">
              <div className="flex justify-between items-start">
                <div className="text-white">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <CalendarIcon size={26} />
                    Events on{" "}
                    {new Date(selectedEvent.startDate).toLocaleDateString(
                      "default",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      },
                    )}
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    1 event scheduled
                  </p>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X size={24} className="text-white" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                      <CalendarIcon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg">
                      {selectedEvent.subject}
                    </h3>
                  </div>

                  {selectedEvent.body && (
                    <p className="text-sm text-slate-700 mb-4 p-3 bg-white rounded-lg border border-blue-200">
                      {selectedEvent.body}
                    </p>
                  )}

                  {/* Time Information */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock
                        size={16}
                        className="text-blue-600 flex-shrink-0"
                      />
                      <span className="font-semibold text-slate-700">
                        Start:{" "}
                        <span className="text-blue-600">
                          {new Date(
                            selectedEvent.startDate,
                          ).toLocaleTimeString()}
                        </span>
                      </span>
                    </div>
                    {selectedEvent.endDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock
                          size={16}
                          className="text-purple-600 flex-shrink-0"
                        />
                        <span className="font-semibold text-slate-700">
                          End:{" "}
                          <span className="text-purple-600">
                            {new Date(
                              selectedEvent.endDate,
                            ).toLocaleTimeString()}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Created By Information */}
                  <div className="flex items-center gap-2 text-sm p-2.5 bg-white rounded-lg border border-slate-200 mb-3">
                    <User size={16} className="text-blue-600 flex-shrink-0" />
                    <span className="font-semibold text-slate-700">
                      Created by:{" "}
                      <span className="text-blue-600">
                        {selectedEvent.sender?.username || "Unknown"}
                      </span>
                    </span>
                  </div>

                  {/* Barangay Information */}
                  <div className="flex items-center gap-2 text-sm p-2.5 bg-white rounded-lg border border-slate-200">
                    <MapPin
                      size={16}
                      className="text-emerald-600 flex-shrink-0"
                    />
                    <span className="font-semibold text-slate-700">
                      {selectedEvent.attachedToBarangay === null ||
                      selectedEvent.attachedToBarangay === undefined
                        ? "All Barangays"
                        : `Barangay: ${
                            barangayMap[selectedEvent.attachedToBarangay] ||
                            "Unknown"
                          }`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Calendar;
