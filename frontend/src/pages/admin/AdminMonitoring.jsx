import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import Layout from "../../layout/Layout";
import {
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
  Download,
  Image as ImageIcon,
  X,
  Calendar,
  Award,
  Activity,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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

  // Calculate statistics
  const totalProjects = allStorage.length;
  const completedProjects = allStorage.filter(
    (s) => (s.document?.status || s.status) === "completed",
  ).length;
  const ongoingProjects = allStorage.filter(
    (s) => (s.document?.status || s.status) === "ongoing",
  ).length;
  const approvedProjects = allStorage.filter(
    (s) => (s.document?.status || s.status) === "approved",
  ).length;
  const successRate =
    totalProjects > 0
      ? ((completedProjects / totalProjects) * 100).toFixed(1)
      : 0;
  const completionRate =
    totalProjects > 0
      ? ((completedProjects / totalProjects) * 100).toFixed(1)
      : 0;
  const ongoingRate =
    totalProjects > 0
      ? ((ongoingProjects / totalProjects) * 100).toFixed(1)
      : 0;
  const pendingRate =
    totalProjects > 0
      ? ((approvedProjects / totalProjects) * 100).toFixed(1)
      : 0;

  // Get top performing barangays (based on completion rate)
  const topBarangays = barangays
    .map((b) => {
      const barangayStorage = allStorage.filter(
        (s) => s.barangay?._id === b._id,
      );
      const completed = barangayStorage.filter(
        (s) => (s.document?.status || s.status) === "completed",
      ).length;
      const total = barangayStorage.length;
      const rate = total > 0 ? (completed / total) * 100 : 0;
      return { barangay: b, completionRate: rate, total, completed };
    })
    .sort((a, b) => b.completionRate - a.completionRate)
    .slice(0, 4);

  // Recent activities - get latest 3 storage items
  const recentActivities = [...allStorage]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Monitoring & Evaluation
                </h1>
                <p className="text-slate-600 mt-2 text-lg">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* KPI Card 1 - Total Projects */}
                <div className="stat-card bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-6 hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <FileText className="w-7 h-7 text-white" />
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">
                      Total
                    </span>
                  </div>
                  <h3 className="text-slate-500 text-sm font-semibold mb-1">
                    Total Projects
                  </h3>
                  <p className="text-3xl font-bold text-slate-900 mb-2">
                    {totalProjects}
                  </p>
                  <div className="flex items-center text-xs text-slate-500">
                    <Activity className="w-4 h-4 text-blue-500 mr-1" />
                    <span>Across {barangays.length} barangays</span>
                  </div>
                </div>

                {/* KPI Card 2 - Completed */}
                <div className="stat-card bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-6 hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                      <CheckCircle className="w-7 h-7 text-white" />
                    </div>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">
                      +{completionRate}%
                    </span>
                  </div>
                  <h3 className="text-slate-500 text-sm font-semibold mb-1">
                    Completed
                  </h3>
                  <p className="text-3xl font-bold text-slate-900 mb-2">
                    {completedProjects}
                  </p>
                  <div className="flex items-center text-xs text-slate-500">
                    <div className="flex-1 bg-slate-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${completionRate}%` }}
                      ></div>
                    </div>
                    <span className="font-semibold">{completionRate}%</span>
                  </div>
                </div>

                {/* KPI Card 3 - In Progress */}
                <div className="stat-card bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-6 hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Clock className="w-7 h-7 text-white" />
                    </div>
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold">
                      Active
                    </span>
                  </div>
                  <h3 className="text-slate-500 text-sm font-semibold mb-1">
                    In Progress
                  </h3>
                  <p className="text-3xl font-bold text-slate-900 mb-2">
                    {ongoingProjects}
                  </p>
                  <div className="flex items-center text-xs text-slate-500">
                    <div className="flex-1 bg-slate-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-amber-600 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${ongoingRate}%` }}
                      ></div>
                    </div>
                    <span className="font-semibold">{ongoingRate}%</span>
                  </div>
                </div>

                {/* KPI Card 4 - Success Rate */}
                <div className="stat-card bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-6 hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <TrendingUp className="w-7 h-7 text-white" />
                    </div>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold">
                      {successRate}%
                    </span>
                  </div>
                  <h3 className="text-slate-500 text-sm font-semibold mb-1">
                    Success Rate
                  </h3>
                  <p className="text-3xl font-bold text-slate-900 mb-2">
                    {successRate}%
                  </p>
                  <div className="flex items-center text-xs text-slate-500">
                    <TrendingUp className="w-4 h-4 text-purple-500 mr-1" />
                    <span>Based on completion</span>
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Performance Overview - Project Status */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-b-2 border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">
                          Project Distribution by Barangay
                        </h2>
                        <p className="text-sm text-slate-600 mt-1">
                          Current status across all barangays
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
                      {barangays.map((b) => {
                        const ongoingItems = ongoingMap[b._id] || [];
                        const completedItems = completedMap[b._id] || [];
                        const barangayStorage = allStorage.filter(
                          (s) => s.barangay?._id === b._id,
                        );
                        const hasOngoing = ongoingItems.length > 0;

                        return (
                          <div
                            key={b._id}
                            className={`border-2 rounded-xl p-4 transition-all hover:shadow-md ${
                              hasOngoing
                                ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200"
                                : "bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200"
                            }`}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h3 className="font-bold text-slate-900 text-lg">
                                  {b.barangayName || b.barangay}
                                </h3>
                                <p className="text-xs text-slate-600 mt-1">
                                  {b.city}, {b.province}
                                </p>
                              </div>
                              <div>
                                {hasOngoing ? (
                                  <span className="px-3 py-1 bg-amber-500 text-white rounded-lg text-xs font-bold shadow-md">
                                    {ongoingItems.length} Ongoing
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 bg-slate-300 text-slate-700 rounded-lg text-xs font-bold">
                                    No Ongoing
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Statistics */}
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              <div className="text-center p-2 bg-white rounded-lg border border-slate-200">
                                <p className="text-lg font-bold text-slate-900">
                                  {barangayStorage.length}
                                </p>
                                <p className="text-xs text-slate-500 font-semibold">
                                  Total
                                </p>
                              </div>
                              <div className="text-center p-2 bg-white rounded-lg border border-emerald-200">
                                <p className="text-lg font-bold text-emerald-600">
                                  {completedItems.length}
                                </p>
                                <p className="text-xs text-slate-500 font-semibold">
                                  Done
                                </p>
                              </div>
                              <div className="text-center p-2 bg-white rounded-lg border border-amber-200">
                                <p className="text-lg font-bold text-amber-600">
                                  {ongoingItems.length}
                                </p>
                                <p className="text-xs text-slate-500 font-semibold">
                                  Active
                                </p>
                              </div>
                            </div>

                            {/* Carousel for ongoing projects */}
                            {hasOngoing &&
                              ongoingItems.length > 0 &&
                              (() => {
                                const currentIndex = carouselIndex[b._id] || 0;
                                const currentItem = ongoingItems[currentIndex];
                                const isAnimating = animatingBarangay === b._id;

                                const handleCarouselChange = (newIndex) => {
                                  setAnimatingBarangay(b._id);
                                  setCarouselIndex({
                                    ...carouselIndex,
                                    [b._id]: newIndex,
                                  });
                                  setTimeout(
                                    () => setAnimatingBarangay(null),
                                    250,
                                  );
                                };

                                return (
                                  <div className="relative bg-white rounded-lg p-3 border-2 border-amber-200">
                                    {/* Previous Button - Left Side */}
                                    <button
                                      onClick={() => {
                                        handleCarouselChange(
                                          currentIndex === 0
                                            ? ongoingItems.length - 1
                                            : currentIndex - 1,
                                        );
                                      }}
                                      disabled={ongoingItems.length <= 1}
                                      className="absolute left-1 top-1/2 -translate-y-1/2 p-1.5 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 rounded-lg transition-colors flex items-center justify-center z-30 ring-1 ring-slate-100"
                                    >
                                      <ChevronLeft size={18} />
                                    </button>

                                    {/* Content */}
                                    <div
                                      className={`pr-10 pl-10 py-2 carousel-card ${isAnimating ? "carousel-card-out" : "carousel-card-current"}`}
                                      key={`${b._id}-${currentIndex}`}
                                    >
                                      {/* Project counter */}
                                      <div className="text-center text-xs text-slate-500 font-semibold mb-2">
                                        {currentIndex + 1} of{" "}
                                        {ongoingItems.length}
                                      </div>

                                      <h4 className="font-semibold text-slate-900 text-sm mb-1 truncate">
                                        {currentItem.documentName ||
                                          currentItem.document?.subject}
                                      </h4>
                                      <p className="text-xs text-slate-600 mb-2">
                                        From:{" "}
                                        {currentItem.document?.sender
                                          ?.firstname ||
                                          currentItem.uploadedBy
                                            ?.firstname}{" "}
                                        {currentItem.document?.sender
                                          ?.lastname ||
                                          currentItem.uploadedBy?.lastname}
                                      </p>

                                      <div className="flex gap-2">
                                        <button
                                          onClick={async () => {
                                            const msgId =
                                              currentItem.document?._id ||
                                              currentItem._id ||
                                              currentItem.document;
                                            setSelectedMessage({
                                              barangayId: b._id,
                                              barangayName:
                                                b.barangayName || b.barangay,
                                              messageId: msgId,
                                              title:
                                                currentItem.documentName ||
                                                currentItem.document?.subject,
                                            });
                                            await fetchActivityUpdates(msgId);
                                          }}
                                          className="flex-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                                        >
                                          <ImageIcon size={14} />
                                          Updates
                                        </button>
                                        {currentItem.documentUrl && (
                                          <a
                                            href={`http://localhost:5000${currentItem.documentUrl}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                                          >
                                            <Download size={14} />
                                            Open
                                          </a>
                                        )}
                                      </div>
                                    </div>

                                    {/* Next Button - Right Side */}
                                    <button
                                      onClick={() => {
                                        handleCarouselChange(
                                          currentIndex ===
                                            ongoingItems.length - 1
                                            ? 0
                                            : currentIndex + 1,
                                        );
                                      }}
                                      disabled={ongoingItems.length <= 1}
                                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 rounded-lg transition-colors flex items-center justify-center z-30 ring-1 ring-slate-100"
                                    >
                                      <ChevronRight size={18} />
                                    </button>
                                  </div>
                                );
                              })()}

                            {!hasOngoing && (
                              <p className="text-sm text-slate-500 text-center py-2">
                                No ongoing projects
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Project Status Breakdown (Donut Chart) */}
                <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-50 to-purple-50 px-6 py-4 border-b-2 border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900">
                      Project Status
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Current distribution
                    </p>
                  </div>
                  <div className="p-6">
                    {/* Donut Chart */}
                    <div className="flex items-center justify-center mb-6">
                      <div className="relative w-48 h-48">
                        <svg
                          className="transform -rotate-90"
                          viewBox="0 0 100 100"
                        >
                          {/* Background circle */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="20"
                          />
                          {/* Completed (Green) */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="20"
                            strokeDasharray={`${(completionRate / 100) * 251} 251`}
                            strokeLinecap="round"
                          />
                          {/* In Progress (Amber) */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="20"
                            strokeDasharray={`${(ongoingRate / 100) * 251} 251`}
                            strokeDashoffset={`-${(completionRate / 100) * 251}`}
                            strokeLinecap="round"
                          />
                          {/* Pending (Slate) */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#64748b"
                            strokeWidth="20"
                            strokeDasharray={`${(pendingRate / 100) * 251} 251`}
                            strokeDashoffset={`-${((completionRate + ongoingRate) / 100) * 251}`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-bold text-slate-900">
                            {totalProjects}
                          </span>
                          <span className="text-xs text-slate-500 font-semibold">
                            Total
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border-2 border-emerald-200">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
                          <span className="text-sm font-semibold text-slate-900">
                            Completed
                          </span>
                        </div>
                        <span className="text-sm font-bold text-emerald-700">
                          {completedProjects} ({completionRate}%)
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border-2 border-amber-200">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
                          <span className="text-sm font-semibold text-slate-900">
                            In Progress
                          </span>
                        </div>
                        <span className="text-sm font-bold text-amber-700">
                          {ongoingProjects} ({ongoingRate}%)
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border-2 border-slate-200">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-slate-500 rounded-full"></div>
                          <span className="text-sm font-semibold text-slate-900">
                            Pending
                          </span>
                        </div>
                        <span className="text-sm font-bold text-slate-700">
                          {approvedProjects} ({pendingRate}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activities Timeline */}
                <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-50 to-indigo-50 px-6 py-4 border-b-2 border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">
                          Recent Activities
                        </h2>
                        <p className="text-sm text-slate-600 mt-1">
                          Latest project updates
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    {recentActivities.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Calendar className="text-slate-400" size={32} />
                        </div>
                        <p className="text-sm text-slate-500 font-medium">
                          No recent activities
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recentActivities.map((activity, index) => {
                          const status =
                            activity.document?.status || activity.status;
                          const isCompleted = status === "completed";
                          const isOngoing = status === "ongoing";
                          const isApproved = status === "approved";

                          return (
                            <div key={activity._id} className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                                    isCompleted
                                      ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                                      : isOngoing
                                        ? "bg-gradient-to-br from-amber-500 to-amber-600"
                                        : "bg-gradient-to-br from-blue-500 to-blue-600"
                                  }`}
                                  style={{
                                    boxShadow:
                                      "0 0 0 4px rgba(59, 130, 246, 0.1)",
                                  }}
                                >
                                  {isCompleted ? (
                                    <CheckCircle className="w-5 h-5 text-white" />
                                  ) : isOngoing ? (
                                    <Clock className="w-5 h-5 text-white" />
                                  ) : (
                                    <FileText className="w-5 h-5 text-white" />
                                  )}
                                </div>
                                {index < recentActivities.length - 1 && (
                                  <div className="w-0.5 h-full bg-slate-200 mt-2"></div>
                                )}
                              </div>
                              <div className="flex-1 pb-6">
                                <div className="flex items-start justify-between mb-1">
                                  <h3 className="font-bold text-slate-900">
                                    {activity.documentName ||
                                      activity.document?.subject ||
                                      "Document"}
                                  </h3>
                                  <span className="text-xs text-slate-500 font-semibold">
                                    {new Date(
                                      activity.createdAt,
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 mb-2">
                                  {activity.barangay?.barangayName ||
                                    activity.barangay?.barangay}{" "}
                                  - From:{" "}
                                  {activity.document?.sender?.firstname ||
                                    activity.uploadedBy?.firstname}{" "}
                                  {activity.document?.sender?.lastname ||
                                    activity.uploadedBy?.lastname}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2 py-1 rounded-md text-xs font-bold ${
                                      isCompleted
                                        ? "bg-emerald-100 text-emerald-700"
                                        : isOngoing
                                          ? "bg-amber-100 text-amber-700"
                                          : "bg-blue-100 text-blue-700"
                                    }`}
                                  >
                                    {status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Performing Barangays */}
                <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-50 to-emerald-50 px-6 py-4 border-b-2 border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">
                          Top Performing Barangays
                        </h2>
                        <p className="text-sm text-slate-600 mt-1">
                          Based on completion rate
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    {topBarangays.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Award className="text-slate-400" size={32} />
                        </div>
                        <p className="text-sm text-slate-500 font-medium">
                          No data available
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {topBarangays.map((item, index) => {
                          const rankColors = [
                            {
                              bg: "from-emerald-50 to-teal-50",
                              border: "border-emerald-200",
                              badge: "bg-emerald-600",
                              score: "text-emerald-600",
                            },
                            {
                              bg: "from-blue-50 to-indigo-50",
                              border: "border-blue-200",
                              badge: "bg-blue-600",
                              score: "text-blue-600",
                            },
                            {
                              bg: "from-purple-50 to-pink-50",
                              border: "border-purple-200",
                              badge: "bg-purple-600",
                              score: "text-purple-600",
                            },
                            {
                              bg: "from-slate-50 to-gray-50",
                              border: "border-slate-200",
                              badge: "bg-slate-600",
                              score: "text-slate-600",
                            },
                          ];
                          const colors = rankColors[index] || rankColors[3];

                          return (
                            <div
                              key={item.barangay._id}
                              className={`p-4 bg-gradient-to-r ${colors.bg} rounded-xl border-2 ${colors.border} hover:shadow-md transition-shadow`}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-slate-900">
                                      {item.barangay.barangayName ||
                                        item.barangay.barangay}
                                    </h3>
                                    <span
                                      className={`px-2 py-0.5 ${colors.badge} text-white rounded-md text-xs font-bold`}
                                    >
                                      {index + 1}
                                      {index === 0
                                        ? "st"
                                        : index === 1
                                          ? "nd"
                                          : index === 2
                                            ? "rd"
                                            : "th"}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600">
                                    {item.barangay.city},{" "}
                                    {item.barangay.province}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p
                                    className={`text-2xl font-bold ${colors.score}`}
                                  >
                                    {item.completionRate.toFixed(0)}%
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    Score
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-600">
                                  Completed:{" "}
                                  <span className={`font-bold ${colors.score}`}>
                                    {item.completed}/{item.total}
                                  </span>
                                </span>
                                <span className="text-slate-600">
                                  Projects:{" "}
                                  <span className="font-bold text-slate-900">
                                    {item.total}
                                  </span>
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Activity Updates Modal */}
              {selectedMessage && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6">
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
    </Layout>
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
