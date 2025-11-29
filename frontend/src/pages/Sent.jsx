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
        const res = await axios.get("http://localhost:5000/api/messages/sent", {
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
      <div className="p-6 bg-gray-50 min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Sent Messages</h1>

        {loading ? (
          <p>Loading...</p>
        ) : messages.length === 0 ? (
          <p>No sent messages yet</p>
        ) : (
          <div className="grid gap-4">
            {messages.map((m) => (
              <div key={m._id} className="bg-white p-4 rounded shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{m.subject}</p>
                    <p className="text-sm text-gray-600">
                      To: {m.recipient?.username || "Unknown"} (
                      {m.recipient?.email || "No email"})
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(m.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    {m.attachmentName && (
                      <a
                        href={`http://localhost:5000${m.attachmentUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Download
                      </a>
                    )}
                  </div>
                </div>
                <div className="mt-3 text-gray-800 whitespace-pre-wrap">
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
