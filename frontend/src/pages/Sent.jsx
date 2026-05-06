import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../layout/Layout";

const Sent = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSent = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${window.API_BASE}/messages/sent`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(res.data.messages || []);
      } catch (error) {
        console.error("Failed to fetch sent messages:", error);
        alert("Failed to fetch sent messages. Check console for details.");
      } finally {
        setLoading(false);
      }
    };
    fetchSent();
  }, []);

  return (
    <Layout>
      <div className="p-3 sm:p-4 md:p-6 bg-gray-50 min-h-screen">
        <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
          Sent Messages
        </h1>

        {loading ? (
          <p className="text-sm sm:text-base">Loading...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm sm:text-base">No sent messages yet</p>
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {messages.map((m) => (
              <div
                key={m._id}
                className="bg-white p-3 sm:p-4 rounded shadow hover:shadow-md transition"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm sm:text-base break-words">
                      {m.subject}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      To:{" "}
                      <span className="font-medium">
                        {m.recipient?.username || "Unknown"}
                      </span>
                    </p>
                    {m.recipient?.email && (
                      <p className="text-xs sm:text-sm text-gray-500">
                        {m.recipient.email}
                      </p>
                    )}
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      {new Date(m.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {m.attachmentName && (
                      <a
                        href={`${window.BACKEND_URL}${m.attachmentUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline text-xs sm:text-sm font-medium"
                      >
                        Download
                      </a>
                    )}
                  </div>
                </div>
                <div className="mt-3 text-gray-800 whitespace-pre-wrap text-xs sm:text-sm line-clamp-3 sm:line-clamp-none">
                  {m.body}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Sent;
