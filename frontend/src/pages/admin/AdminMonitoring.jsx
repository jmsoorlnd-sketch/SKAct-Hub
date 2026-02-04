import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../../layout/Layout";

const AdminMonitoring = () => {
  const [barangays, setBarangays] = useState([]);
  const [ongoingMap, setOngoingMap] = useState({}); // barangayId -> storage item
  const [loading, setLoading] = useState(true);
  const [selectedUpdates, setSelectedUpdates] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loadingUpdates, setLoadingUpdates] = useState(false);

  useEffect(() => {
    (async () => {
      await fetchBarangays();
    })();
  }, []);

  const fetchBarangays = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "http://localhost:5000/api/barangays/all-barangays",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const bars = res.data.barangays || [];
      setBarangays(bars);
      // Fetch storage for each barangay and pick ongoing message
      const map = {};
      await Promise.all(
        bars.map(async (b) => {
          try {
            const r = await axios.get(
              `http://localhost:5000/api/barangays/${b._id}/storage`,
              { headers: { Authorization: `Bearer ${token}` } },
            );
            const storage = r.data.storage || [];
            const ongoing = storage.find((item) => {
              const status = item.document?.status || item.status;
              return status === "ongoing";
            });
            if (ongoing) map[b._id] = ongoing;
          } catch (err) {
            // ignore per-barangay errors
            console.warn("Failed to fetch storage for ", b._id, err?.message);
          }
        }),
      );
      setOngoingMap(map);
    } catch (error) {
      console.error("Error fetching barangays for monitoring:", error);
      setBarangays([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityUpdates = async (messageId) => {
    if (!messageId) return;
    setLoadingUpdates(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:5000/api/messages/${messageId}/activity-updates`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSelectedUpdates(res.data.updates || []);
    } catch (error) {
      console.error("Error fetching activity updates:", error);
      setSelectedUpdates([]);
    } finally {
      setLoadingUpdates(false);
    }
  };

  return (
    <Layout>
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Monitoring & Evaluation</h1>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            Ongoing Messages by Barangay
          </h2>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {barangays.map((b) => {
                const ongoing = ongoingMap[b._id];
                return (
                  <div key={b._id} className="border rounded p-4 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">
                          {b.barangayName || b.barangay}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {b.city}, {b.province}
                        </p>
                      </div>
                      <div>
                        {ongoing ? (
                          <span className="text-sm px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                            ongoing
                          </span>
                        ) : (
                          <span className="text-sm px-2 py-1 bg-gray-100 text-gray-600 rounded">
                            no ongoing
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3">
                      {ongoing ? (
                        <>
                          <h4 className="font-medium">
                            {ongoing.documentName || ongoing.document?.subject}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            From:{" "}
                            {ongoing.document?.sender?.firstname ||
                              ongoing.uploadedBy?.firstname}{" "}
                            {ongoing.document?.sender?.lastname ||
                              ongoing.uploadedBy?.lastname}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(ongoing.createdAt).toLocaleString()}
                          </p>

                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={async () => {
                                const msgId =
                                  ongoing.document?._id ||
                                  ongoing._id ||
                                  ongoing.document;
                                setSelectedMessage({
                                  barangayId: b._id,
                                  messageId: msgId,
                                  title:
                                    ongoing.documentName ||
                                    ongoing.document?.subject,
                                });
                                await fetchActivityUpdates(msgId);
                              }}
                              className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded text-sm"
                            >
                              View Updates
                            </button>
                            {ongoing.documentUrl && (
                              <a
                                href={`http://localhost:5000${ongoing.documentUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-sm"
                              >
                                Open
                              </a>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No ongoing message for this barangay.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Activity updates panel */}
          {selectedMessage && (
            <div className="mt-6 bg-white border rounded p-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="font-semibold">
                    Updates for: {selectedMessage.title}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Barangay: {selectedMessage.barangayId}
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => {
                      setSelectedMessage(null);
                      setSelectedUpdates([]);
                    }}
                    className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>

              {loadingUpdates ? (
                <p>Loading updates...</p>
              ) : selectedUpdates.length === 0 ? (
                <p className="text-sm text-gray-500">No updates yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedUpdates.map((u) => (
                    <div key={u._id} className="border rounded p-3">
                      {u.photoUrl && (
                        <img
                          src={`http://localhost:5000${u.photoUrl}`}
                          alt={u.caption || "update"}
                          className="w-full h-40 object-cover rounded mb-2"
                        />
                      )}
                      <p className="text-sm text-gray-700">{u.caption}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(u.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminMonitoring;
