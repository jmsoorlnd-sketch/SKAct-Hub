import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { Image as ImageIcon, X } from "lucide-react";
const TopBarangays = lazy(
  () => import("../../components/adminMonitoringComponents/TopBarangays"),
);
const RecentActivities = lazy(
  () => import("../../components/adminMonitoringComponents/RecentActivities"),
);
const StatsCards = lazy(
  () => import("../../components/adminMonitoringComponents/StatsCards"),
);

const ProjectOverview = lazy(
  () => import("../../components/adminMonitoringComponents/ProjectOverview"),
);

const DonutChart = lazy(
  () => import("../../components/adminMonitoringComponents/DonutChart"),
);

const AdminMonitoring = () => {
  const [barangays, setBarangays] = useState([]);
  const [ongoingMap, setOngoingMap] = useState({});
  const [completedMap, setCompletedMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedUpdates, setSelectedUpdates] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loadingUpdates, setLoadingUpdates] = useState(false);
  const [timeRange, setTimeRange] = useState("Last 30 Days");
  const [allStorage, setAllStorage] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState({});
  const [animatingBarangay, setAnimatingBarangay] = useState(null);

  const location = useLocation();

  useEffect(() => {
    (async () => {
      await fetchBarangays();
    })();
  }, []);

  // If navigated with a message/document id (from notifications), open updates
  useEffect(() => {
    const messageId = location?.state?.messageId || location?.state?.documentId;
    if (messageId) {
      setSelectedMessage({ messageId });
      fetchActivityUpdates(messageId);
    }
  }, [location]);

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

      const ongoingMapTemp = {};
      const completedMapTemp = {};
      const allStorageTemp = [];

      await Promise.all(
        bars.map(async (b) => {
          try {
            const r = await axios.get(
              `http://localhost:5000/api/barangays/${b._id}/storage`,
              { headers: { Authorization: `Bearer ${token}` } },
            );
            const storage = r.data.storage || [];
            allStorageTemp.push(...storage.map((s) => ({ ...s, barangay: b })));

            const ongoing = storage.filter((item) => {
              const status = item.document?.status || item.status;
              return status === "ongoing";
            });

            const completed = storage.filter((item) => {
              const status = item.document?.status || item.status;
              return status === "completed";
            });

            if (ongoing.length > 0) ongoingMapTemp[b._id] = ongoing;
            if (completed.length > 0) completedMapTemp[b._id] = completed;
          } catch (err) {
            console.warn("Failed to fetch storage for ", b._id, err?.message);
          }
        }),
      );

      setOngoingMap(ongoingMapTemp);
      setCompletedMap(completedMapTemp);
      setAllStorage(allStorageTemp);
    } catch (error) {
      console.error("Error fetching barangays for monitoring:", error);
      setBarangays([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityUpdates = useCallback(async (messageId) => {
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
      console.error(error);
    } finally {
      setLoadingUpdates(false);
    }
  }, []);
  const storageByBarangay = useMemo(() => {
    const map = {};

    allStorage.forEach((s) => {
      const id = s.barangay?._id;
      if (!map[id]) map[id] = [];
      map[id].push(s);
    });

    return map;
  }, [allStorage]);
  // Calculate statistics
  const stats = useMemo(() => {
    let completed = 0;
    let ongoing = 0;
    let approved = 0;

    allStorage.forEach((s) => {
      const status = s.document?.status || s.status;

      if (status === "completed") completed++;
      if (status === "ongoing") ongoing++;
      if (status === "approved") approved++;
    });

    const total = allStorage.length;

    return {
      totalProjects: total,
      completedProjects: completed,
      ongoingProjects: ongoing,
      approvedProjects: approved,
      successRate: total ? ((completed / total) * 100).toFixed(1) : 0,
      completionRate: total ? ((completed / total) * 100).toFixed(1) : 0,
      ongoingRate: total ? ((ongoing / total) * 100).toFixed(1) : 0,
      pendingRate: total ? ((approved / total) * 100).toFixed(1) : 0,
    };
  }, [allStorage]);
  // Get top performing barangays (based on completion rate)

  const topBarangays = useMemo(() => {
    return barangays
      .map((b) => {
        const barangayStorage = storageByBarangay[b._id] || [];

        const completed = barangayStorage.filter(
          (s) => (s.document?.status || s.status) === "completed",
        ).length;

        const total = barangayStorage.length;

        const rate = total > 0 ? (completed / total) * 100 : 0;

        return { barangay: b, completionRate: rate, total, completed };
      })
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 4);
  }, [barangays, storageByBarangay]);
  // Recent activities - get latest 3 storage items
  const recentActivities = useMemo(() => {
    return [...allStorage]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);
  }, [allStorage]);

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold">Monitoring & Evaluation</h1>
              <p className="text-slate-600 mt-1 text-sm">
                Track progress, analyze performance, and measure impact
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
              >
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Last 3 Months</option>
                <option>Last Year</option>
                <option>Custom Range</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-slate-600 font-medium">
                Loading monitoring data...
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Key Performance Indicators */}
            <Suspense fallback={<div>Loading...</div>}>
              <StatsCards stats={stats} barangays={barangays} />
            </Suspense>

            {/* Main Content Grid */}
            <Suspense fallback={<div>Loading...</div>}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {/* Performance Overview - Project Status */}

                <ProjectOverview
                  barangays={barangays}
                  ongoingMap={ongoingMap}
                  completedMap={completedMap}
                  storageByBarangay={storageByBarangay}
                  carouselIndex={carouselIndex}
                  setCarouselIndex={setCarouselIndex}
                  animatingBarangay={animatingBarangay}
                  setAnimatingBarangay={setAnimatingBarangay}
                  setSelectedMessage={setSelectedMessage}
                  fetchActivityUpdates={fetchActivityUpdates}
                />
                {/* Project Status Breakdown (Donut Chart) */}
                <DonutChart stats={stats} />
              </div>
            </Suspense>
            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activities Timeline */}
              <Suspense fallback={<div>Loading...</div>}>
                <RecentActivities recentActivities={recentActivities} />
              </Suspense>

              <Suspense fallback={<div>Loading...</div>}>
                {/* Top Performing Barangays */}
                <TopBarangays topBarangays={topBarangays} />
              </Suspense>
            </div>
            {/* Activity Updates Modal */}
            {selectedMessage && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                  <div className="bg-blue-700 p-6">
                    <div className="flex justify-between items-center">
                      <div className="text-white">
                        <h3 className="text-2xl font-bold flex items-center gap-2">
                          <ImageIcon size={28} />
                          Activity Updates
                        </h3>
                        <p className="text-purple-100 mt-2 text-sm">
                          {selectedMessage.title}
                        </p>
                        <p className="text-purple-200 mt-1 text-xs">
                          Barangay: {selectedMessage.barangayName}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedMessage(null);
                          setSelectedUpdates([]);
                        }}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <X size={24} className="text-white" />
                      </button>
                    </div>
                  </div>

                  <div
                    className="p-6 overflow-y-auto"
                    style={{ maxHeight: "calc(90vh - 140px)" }}
                  >
                    {loadingUpdates ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
                        <p className="text-slate-600 font-medium">
                          Loading updates...
                        </p>
                      </div>
                    ) : selectedUpdates.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <ImageIcon className="text-slate-400" size={40} />
                        </div>
                        <p className="text-slate-500 font-medium text-lg">
                          No activity updates yet
                        </p>
                        <p className="text-slate-400 text-sm mt-2">
                          Check back later for project updates
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedUpdates.map((update) => (
                          <div
                            key={update._id}
                            className="border-2 border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow bg-white"
                          >
                            {update.photoUrl && (
                              <img
                                src={`http://localhost:5000${update.photoUrl}`}
                                alt={update.caption || "Activity update"}
                                className="w-full h-56 object-cover"
                              />
                            )}
                            <div className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="text-sm font-bold text-slate-900">
                                    {update.uploadedBy?.firstname}{" "}
                                    {update.uploadedBy?.lastname}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {new Date(
                                      update.createdAt,
                                    ).toLocaleDateString()}{" "}
                                    at{" "}
                                    {new Date(
                                      update.createdAt,
                                    ).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                              {update.caption && (
                                <p className="text-sm text-slate-700 mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                  {update.caption}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminMonitoring;

const style = document.createElement("style");
style.textContent = `
@keyframes cardOut {
0% {
  z-index: 20;
  transform: translateY(0px) rotate(-4deg) translateX(0);
  opacity: 1;
}
50% {
  transform: translateY(-120%) rotate(-8deg) translateX(-60px);
  opacity: 0.5;
}
80% {
  z-index: 1;
}
100% {
  transform: translateY(-50px) rotate(8deg) translateX(55px) scale(0.9);
  opacity: 0;
  z-index: 1;
}
}

@keyframes cardIn {
0% {
  transform: translateY(-50px) rotate(8deg) translateX(55px) scale(0.9);
  opacity: 0;
  z-index: 1;
}
50% {
  transform: translateY(-30px) rotate(2deg) translateX(20px) scale(0.95);
  opacity: 0.5;
}
100% {
  transform: translateY(0px) rotate(-1deg) translateX(0) scale(1);
  opacity: 1;
  z-index: 10;
}
}

.carousel-card {
border: 1px solid rgba(15,23,42,0.06);
border-radius: 12px;
overflow: hidden;
box-shadow: 0 6px 20px rgba(2,6,23,0.06);
background: #fff;
}

.carousel-card-current {
animation: cardIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
position: relative;
z-index: 10;
}

.carousel-card-out {
animation: cardOut 0.25s cubic-bezier(0.8, 0.2, 0.1, 0.8);
z-index: 1;
}
`;
if (typeof document !== "undefined") {
  document.head.appendChild(style);
}
