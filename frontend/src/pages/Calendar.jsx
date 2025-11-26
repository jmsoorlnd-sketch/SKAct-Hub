import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../layout/Layout";

const Calendar = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/messages/activities",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setActivities(res.data.activities || []);
      } catch (error) {
        console.error("Failed to fetch activities:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  // Group by date (startDate)
  const grouped = activities.reduce((acc, a) => {
    const d = a.startDate ? new Date(a.startDate).toDateString() : "No date";
    acc[d] = acc[d] || [];
    acc[d].push(a);
    return acc;
  }, {});

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Activities Calendar</h1>
        {loading ? (
          <p>Loading activities...</p>
        ) : activities.length === 0 ? (
          <p>No approved/ongoing activities yet.</p>
        ) : (
          Object.keys(grouped).map((date) => (
            <div key={date} className="mb-6">
              <h3 className="font-semibold mb-2">{date}</h3>
              <div className="space-y-2">
                {grouped[date].map((act) => (
                  <div
                    key={act._id}
                    className="p-3 bg-white rounded shadow-sm flex justify-between items-start"
                  >
                    <div>
                      <p className="font-semibold">{act.subject}</p>
                      <p className="text-sm text-gray-600">
                        By: {act.sender?.username}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">{act.body}</p>
                    </div>
                    <div className="text-sm text-gray-500 text-right">
                      <p>
                        {act.startDate
                          ? new Date(act.startDate).toLocaleTimeString()
                          : ""}
                      </p>
                      <p>
                        {act.endDate
                          ? new Date(act.endDate).toLocaleTimeString()
                          : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
};

export default Calendar;
