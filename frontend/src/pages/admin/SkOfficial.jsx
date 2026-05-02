import { useEffect, useMemo, useState, useContext, useCallback } from "react";
import axios from "axios";
import { createPortal } from "react-dom";
import { UserPlus, Trash2, AlertTriangle } from "lucide-react";

import { AuthContext } from "../../context/AuthContext";
import { useToast } from "../../components/Toast";

import { lazy, Suspense } from "react";

import SkProfileModal from "../../components/skOfficialComponents/SkProfileModal";
import ConfirmModal from "../../components/ConfirmModal";

const OfficialsFilters = lazy(
  () => import("../../components/skOfficialComponents/OfficialsFilter"),
);

const OfficialsStats = lazy(
  () => import("../../components/skOfficialComponents/OfficialsStats"),
);

const OfficialsTable = lazy(
  () => import("../../components/skOfficialComponents/OfficialsTable"),
);

const CreateOfficialModal = lazy(
  () => import("../../components/official/AddOfficial"),
);

const EditOfficialModal = lazy(
  () => import("../../components/official/EditOfficial"),
);

const API_BASE = "http://localhost:5000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("NO_AUTH");
  return { Authorization: `Bearer ${token}` };
};

const SkOfficial = () => {
  const { error, success } = useToast();
  const { logout } = useContext(AuthContext);

  /* ===================== STATE ===================== */
  const [officials, setOfficials] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [selectedOfficial, setSelectedOfficial] = useState(null);

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileMessages, setProfileMessages] = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);

  const [filters, setFilters] = useState({
    status: "",
    position: "",
    barangay: "",
    search: "",
  });

  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    official: null,
  });

  /* ===================== DATA FETCH ===================== */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const [officialsRes, barangaysRes] = await Promise.all([
          axios.get(`${API_BASE}/admins/getofficials`, {
            headers: getAuthHeaders(),
          }),
          axios.get(`${API_BASE}/barangays/all-barangays`, {
            headers: getAuthHeaders(),
          }),
        ]);

        setOfficials(officialsRes.data);
        setBarangays(barangaysRes.data.barangays || []);
      } catch (err) {
        handleAuthError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  /* ===================== HELPERS ===================== */
  const handleAuthError = (err) => {
    if (err?.response?.status === 401) {
      logout();
      alert("Session expired. Please sign in again.");
      window.location.href = "/";
    } else {
      console.error(err);
    }
  };

  // Callback when a new official is created
  const handleOfficialCreated = useCallback((newOfficial) => {
    setOfficials((prev) => [newOfficial, ...prev]);
    setIsCreateOpen(false);
  }, []);

  /* ===================== FILTERED DATA ===================== */
  const officialsData = useMemo(() => {
    let active = 0,
      inactive = 0;
    const positionCounts = {};
    const barangayMap = {};

    const filtered = officials.filter((o) => {
      if (filters.status && o.status !== filters.status) return false;
      if (filters.position && o.position !== filters.position) return false;
      if (filters.barangay && o.barangay?._id !== filters.barangay)
        return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        return (
          (o.firstname || "").toLowerCase().includes(q) ||
          (o.lastname || "").toLowerCase().includes(q) ||
          (o.username || "").toLowerCase().includes(q) ||
          (o.email || "").toLowerCase().includes(q)
        );
      }
      return true;
    });

    officials.forEach((o) => {
      // Stats
      if (o.status === "Active") active++;
      else inactive++;

      // Position counts
      positionCounts[o.position] = (positionCounts[o.position] || 0) + 1;

      // Barangays
      if (o.barangay) {
        const key = o.barangay._id;
        if (!barangayMap[key]) {
          barangayMap[key] = {
            name: o.barangay.barangayName,
            count: 0,
            active: 0,
          };
        }
        barangayMap[key].count++;
        if (o.status === "Active") barangayMap[key].active++;
      }
    });

    return {
      filteredOfficials: filtered,
      stats: {
        total: officials.length,
        active,
        inactive,
        activeRate:
          officials.length > 0
            ? ((active / officials.length) * 100).toFixed(1)
            : 0,
      },
      positionCounts,
      topBarangays: Object.values(barangayMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 4),
    };
  }, [officials, filters]);
  /* ===================== STATISTICS ===================== */
  const stats = useMemo(() => {
    const total = officials.length;
    const active = officials.filter((o) => o.status === "Active").length;
    const inactive = officials.filter((o) => o.status === "Inactive").length;
    const activeRate = total > 0 ? ((active / total) * 100).toFixed(1) : 0;

    return { total, active, inactive, activeRate };
  }, [officials]);

  // Count officials by position
  const positionCounts = useMemo(() => {
    const counts = {};
    officials.forEach((o) => {
      counts[o.position] = (counts[o.position] || 0) + 1;
    });
    return counts;
  }, [officials]);

  // Top barangays by official count
  const topBarangays = useMemo(() => {
    const barangayMap = {};
    officials.forEach((o) => {
      if (o.barangay) {
        const key = o.barangay._id;
        if (!barangayMap[key]) {
          barangayMap[key] = {
            name: o.barangay.barangayName,
            count: 0,
            active: 0,
          };
        }
        barangayMap[key].count++;
        if (o.status === "Active") barangayMap[key].active++;
      }
    });

    return Object.values(barangayMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [officials]);

  /* ===================== ACTIONS ===================== */
  const toggleStatus = useCallback(async (official) => {
    const newStatus = official.status === "Active" ? "Inactive" : "Active";

    await axios.put(
      `${API_BASE}/admins/status-official/${official._id}`,
      { status: newStatus },
      { headers: getAuthHeaders() },
    );

    setOfficials((prev) =>
      prev.map((o) =>
        o._id === official._id ? { ...o, status: newStatus } : o,
      ),
    );
  }, []);

  const handleDelete = async (official) => {
    setDeleteConfirmation({ isOpen: true, official });
  };

  const confirmDelete = async () => {
    const official = deleteConfirmation.official;
    setDeleteConfirmation({ isOpen: false, official: null });

    try {
      await axios.delete(`${API_BASE}/admins/delete-official/${official._id}`, {
        headers: getAuthHeaders(),
      });

      setOfficials((prev) => prev.filter((o) => o._id !== official._id));
      success(
        `${official.firstname} ${official.lastname} has been deleted successfully.`,
      );
    } catch (err) {
      error("Failed to delete official");
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, official: null });
  };

  const openProfile = async (official) => {
    setSelectedOfficial(official);
    setProfileOpen(true);
    setProfileLoading(true);

    try {
      const res = await axios.get(`${API_BASE}/messages/user/${official._id}`, {
        headers: getAuthHeaders(),
      });
      setProfileMessages(res.data.messages || []);
    } catch {
      setProfileMessages([]);
    } finally {
      setProfileLoading(false);
    }
  };
  const PositionBar = ({ position, count, total }) => {
    const percentage = ((count / total) * 100).toFixed(0);
    return <div>...</div>;
  };

  /* ===================== RENDER ===================== */
  return (
    <>
      <div className="min-h-screen bg-blue-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          {/* Page Header */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl font-bold">
                  SK Officials Management
                </h1>
                <p className="text-slate-600 mt-1 text-xs sm:text-sm">
                  Manage and monitor Sangguniang Kabataan officials
                </p>
              </div>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center sm:justify-start gap-2 whitespace-nowrap"
              >
                <UserPlus size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span>Add Official</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-3"></div>
                <p className="text-slate-600 font-medium">
                  Loading officials data...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Key Performance Indicators */}
              <Suspense fallback={<div>Loading...</div>}>
                <OfficialsStats
                  stats={officialsData.stats}
                  barangays={barangays}
                />
              </Suspense>
              <Suspense fallback={<div>Loading...</div>}>
                {/* Filters Section */}
                <OfficialsFilters
                  filters={filters}
                  setFilters={setFilters}
                  barangays={barangays}
                />
              </Suspense>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <Suspense fallback={<div>Loading...</div>}>
                  {/* Officials Table */}
                  <OfficialsTable
                    officials={officials}
                    filteredOfficials={officialsData.filteredOfficials}
                    setSelectedOfficial={setSelectedOfficial}
                    toggleStatus={toggleStatus}
                    setIsEditOpen={setIsEditOpen}
                    handleDelete={handleDelete}
                    openProfile={openProfile} // make sure this exists in parent
                  />
                </Suspense>

                {/* Side Panel - Statistics (Hidden on Mobile, Visible on Large Screens) */}
                <div className="hidden lg:block lg:col-span-1 space-y-4 sm:space-y-6">
                  {/* Position Distribution */}
                  <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-50 to-purple-50 px-4 sm:px-6 py-3 sm:py-4 border-b-2 border-slate-200">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        By Position
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1">
                        Distribution
                      </p>
                    </div>
                    <div className="p-4 sm:p-6 space-y-3">
                      {Object.entries(positionCounts).map(
                        ([position, count]) => {
                          const percentage = (
                            (count / stats.total) *
                            100
                          ).toFixed(0);
                          return (
                            <div key={position} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs sm:text-sm font-semibold text-slate-900">
                                  {position}
                                </span>
                                <span className="text-xs sm:text-sm font-bold text-slate-700">
                                  {count}
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-1000"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>

                  {/* Top Barangays */}
                  <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-50 to-emerald-50 px-4 sm:px-6 py-3 sm:py-4 border-b-2 border-slate-200">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        Top Barangays
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1">
                        By officials
                      </p>
                    </div>
                    <div className="p-4 sm:p-6 space-y-3">
                      {topBarangays.length === 0 ? (
                        <p className="text-xs sm:text-sm text-slate-500 text-center py-4">
                          No data available
                        </p>
                      ) : (
                        topBarangays.map((item, index) => {
                          const colors = [
                            {
                              bg: "from-emerald-50 to-teal-50",
                              border: "border-emerald-200",
                              text: "text-emerald-700",
                            },
                            {
                              bg: "from-blue-50 to-indigo-50",
                              border: "border-blue-200",
                              text: "text-blue-700",
                            },
                            {
                              bg: "from-purple-50 to-pink-50",
                              border: "border-purple-200",
                              text: "text-purple-700",
                            },
                            {
                              bg: "from-slate-50 to-gray-50",
                              border: "border-slate-200",
                              text: "text-slate-700",
                            },
                          ];
                          const color = colors[index] || colors[3];

                          return (
                            <div
                              key={item.name}
                              className={`p-3 bg-gradient-to-r ${color.bg} rounded-xl border-2 ${color.border}`}
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex-1">
                                  <p className="font-bold text-slate-900 text-xs sm:text-sm">
                                    {item.name}
                                  </p>
                                  <p className="text-xs text-slate-600 mt-1">
                                    {item.active} active of {item.count} total
                                  </p>
                                </div>
                                <div
                                  className={`text-lg sm:text-xl font-bold ${color.text}`}
                                >
                                  {item.count}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <Suspense fallback={null}>
        {isCreateOpen && (
          <CreateOfficialModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onSubmit={handleOfficialCreated}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {/* Edit Modal */}
        {isEditOpen && selectedOfficial && (
          <EditOfficialModal
            isOpen={isEditOpen}
            official={selectedOfficial}
            onClose={() => {
              setIsEditOpen(false);
              setSelectedOfficial(null);
            }}
            onSubmit={(updated) =>
              setOfficials((prev) =>
                prev.map((o) => (o._id === updated._id ? updated : o)),
              )
            }
          />
        )}
      </Suspense>

      {/* Profile Modal */}

      {profileOpen && selectedOfficial && (
        <SkProfileModal
          selectedOfficial={selectedOfficial}
          setSelectedOfficial={setSelectedOfficial}
          setProfileOpen={setProfileOpen}
          profileLoading={profileLoading}
          profileMessages={profileMessages}
          setProfileMessages={setProfileMessages}
        />
      )}

      {/* Delete Confirmation Modal */}

      {deleteConfirmation.isOpen &&
        deleteConfirmation.official &&
        createPortal(
          <ConfirmModal
            isOpen={deleteConfirmation.isOpen}
            title="Delete Official"
            icon={AlertTriangle}
            iconBgClass="bg-red-200"
            iconColorClass="text-red-600"
            confirmText="Delete"
            confirmIcon={Trash2}
            confirmClass="bg-red-600 hover:bg-red-700 text-white"
            onConfirm={confirmDelete}
            onCancel={cancelDelete}
          >
            <div>
              <p className="text-slate-700 text-base mb-2">
                Are you sure you want to permanently delete:
              </p>
              <div className="bg-slate-50 border-2 border-slate-200 rounded-lg p-4 mb-6">
                <p className="font-bold text-slate-900 text-lg">
                  {deleteConfirmation.official.firstname}{" "}
                  {deleteConfirmation.official.lastname}
                </p>
                <p className="text-sm text-slate-600">
                  @{deleteConfirmation.official.username}
                </p>
                <p className="text-sm text-slate-600 mt-2">
                  {deleteConfirmation.official.email}
                </p>
              </div>
              <p className="text-red-600 text-sm font-semibold mb-0 flex items-center gap-2">
                <Trash2 size={16} /> This action cannot be undone.
              </p>
            </div>
          </ConfirmModal>,
          document.body,
        )}
    </>
  );
};

export default SkOfficial;
