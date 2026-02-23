import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  UserPlus,
  Search,
  Filter,
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  Edit2,
  Eye,
  Mail,
  MapPin,
  Briefcase,
  X,
  Calendar,
  MessageSquare,
  Award,
} from "lucide-react";

import { useToast } from "../../components/Toast";
import CreateOfficialModal from "../../components/popforms/official/AddOfficial";
import EditOfficial from "../../components/popforms/official/EditOfficial";
import RowActions from "../../components/RowActions";

const API_BASE = "http://localhost:5000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("NO_AUTH");
  return { Authorization: `Bearer ${token}` };
};

const SkOfficial = () => {
  const { error } = useToast();

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

  /* ===================== DATA FETCH ===================== */
  useEffect(() => {
    const fetchOfficials = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/admins/getofficials`, {
          headers: getAuthHeaders(),
        });
        setOfficials(res.data);
      } catch (err) {
        handleAuthError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOfficials();
  }, []);

  useEffect(() => {
    const fetchBarangays = async () => {
      try {
        const res = await axios.get(`${API_BASE}/barangays/all-barangays`, {
          headers: getAuthHeaders(),
        });
        setBarangays(res.data.barangays || []);
      } catch (err) {
        console.error("Error fetching barangays:", err);
      }
    };

    fetchBarangays();
  }, []);

  /* ===================== HELPERS ===================== */
  const handleAuthError = (err) => {
    if (err?.response?.status === 401) {
      localStorage.clear();
      alert("Session expired. Please sign in again.");
      window.location.href = "/";
    } else {
      console.error(err);
    }
  };

  /* ===================== FILTERED DATA ===================== */
  const filteredOfficials = useMemo(() => {
    return officials.filter((o) => {
      if (filters.status && o.status !== filters.status) return false;
      if (filters.position && o.position !== filters.position) return false;
      if (filters.barangay && o.barangay?._id !== filters.barangay)
        return false;

      if (filters.search) {
        const q = filters.search.toLowerCase();
        return (
          o.firstname.toLowerCase().includes(q) ||
          o.lastname.toLowerCase().includes(q) ||
          o.username.toLowerCase().includes(q) ||
          o.email.toLowerCase().includes(q)
        );
      }

      return true;
    });
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
  const toggleStatus = async (official) => {
    const newStatus = official.status === "Active" ? "Inactive" : "Active";

    if (
      !window.confirm(
        `Are you sure you want to ${newStatus.toLowerCase()} this official?`,
      )
    )
      return;

    try {
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
    } catch (err) {
      error("Failed to update status");
    }
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

  /* ===================== RENDER ===================== */
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Page Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-2xl font-bold">SK Officials Management</h1>
                <p className="text-slate-600 mt-1 text-sm">
                  Manage and monitor Sangguniang Kabataan officials
                </p>
              </div>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-4 py-2 bg-blue-600  hover:bg-blue-700 text-white rounded-lg font-semibold text-sm shadow-md transition-all flex items-center gap-2"
              >
                <UserPlus size={18} />
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* KPI Card 1 - Total Officials */}
                <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[11px] font-bold">
                      Total
                    </span>
                  </div>
                  <h3 className="text-slate-500 text-xs font-semibold mb-0.5">
                    Total Officials
                  </h3>
                  <p className="text-2xl font-bold text-slate-900 mb-2">
                    {stats.total}
                  </p>
                  <div className="flex items-center text-[11px] text-slate-500">
                    <Award className="w-3 h-3 text-blue-500 mr-1" />
                    <span>Registered in system</span>
                  </div>
                </div>

                {/* KPI Card 2 - Active */}
                <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
                      <UserCheck className="w-5 h-5 text-white" />
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[11px] font-bold">
                      {stats.activeRate}%
                    </span>
                  </div>
                  <h3 className="text-slate-500 text-xs font-semibold mb-0.5">
                    Active Officials
                  </h3>
                  <p className="text-2xl font-bold text-slate-900 mb-2">
                    {stats.active}
                  </p>
                  <div className="flex items-center text-[11px] text-slate-500">
                    <div className="flex-1 bg-slate-200 rounded-full h-1.5 mr-2">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-1.5 rounded-full transition-all duration-1000"
                        style={{ width: `${stats.activeRate}%` }}
                      ></div>
                    </div>
                    <span className="font-semibold">{stats.activeRate}%</span>
                  </div>
                </div>

                {/* KPI Card 3 - Inactive */}
                <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-md">
                      <UserX className="w-5 h-5 text-white" />
                    </div>
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-md text-[11px] font-bold">
                      Inactive
                    </span>
                  </div>
                  <h3 className="text-slate-500 text-xs font-semibold mb-0.5">
                    Inactive Officials
                  </h3>
                  <p className="text-2xl font-bold text-slate-900 mb-2">
                    {stats.inactive}
                  </p>
                  <div className="flex items-center text-[11px] text-slate-500">
                    <div className="flex-1 bg-slate-200 rounded-full h-1.5 mr-2">
                      <div
                        className="bg-gradient-to-r from-red-500 to-red-600 h-1.5 rounded-full transition-all duration-1000"
                        style={{
                          width: `${((stats.inactive / stats.total) * 100).toFixed(1)}%`,
                        }}
                      ></div>
                    </div>
                    <span className="font-semibold">
                      {((stats.inactive / stats.total) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* KPI Card 4 - Barangays */}
                <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md text-[11px] font-bold">
                      Active
                    </span>
                  </div>
                  <h3 className="text-slate-500 text-xs font-semibold mb-0.5">
                    Barangays
                  </h3>
                  <p className="text-2xl font-bold text-slate-900 mb-2">
                    {barangays.length}
                  </p>
                  <div className="flex items-center text-[11px] text-slate-500">
                    <TrendingUp className="w-3 h-3 text-purple-500 mr-1" />
                    <span>With SK officials</span>
                  </div>
                </div>
              </div>

              {/* Filters Section */}
              <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="w-4 h-4 text-slate-600" />
                  <h2 className="text-base font-bold text-slate-900">
                    Filters
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                    <input
                      placeholder="Search officials..."
                      className="w-full pl-9 pr-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      value={filters.search}
                      onChange={(e) =>
                        setFilters({ ...filters, search: e.target.value })
                      }
                    />
                  </div>

                  <select
                    className="px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all appearance-none cursor-pointer"
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                  >
                    <option value="">All Status</option>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>

                  <select
                    className="px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all appearance-none cursor-pointer"
                    value={filters.position}
                    onChange={(e) =>
                      setFilters({ ...filters, position: e.target.value })
                    }
                  >
                    <option value="">All Positions</option>
                    <option>Chairman</option>
                    <option>Secretary</option>
                    <option>Treasurer</option>
                  </select>

                  <select
                    className="px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all appearance-none cursor-pointer"
                    value={filters.barangay}
                    onChange={(e) =>
                      setFilters({ ...filters, barangay: e.target.value })
                    }
                  >
                    <option value="">All Barangays</option>
                    {barangays.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.barangayName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Active Filters Display */}
                {(filters.search ||
                  filters.status ||
                  filters.position ||
                  filters.barangay) && (
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-600 font-semibold">
                      Active Filters:
                    </span>
                    {filters.search && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[11px] font-bold">
                        Search: {filters.search}
                      </span>
                    )}
                    {filters.status && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[11px] font-bold">
                        Status: {filters.status}
                      </span>
                    )}
                    {filters.position && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[11px] font-bold">
                        Position: {filters.position}
                      </span>
                    )}
                    {filters.barangay && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[11px] font-bold">
                        Barangay:{" "}
                        {
                          barangays.find((b) => b._id === filters.barangay)
                            ?.barangayName
                        }
                      </span>
                    )}
                    <button
                      onClick={() =>
                        setFilters({
                          status: "",
                          position: "",
                          barangay: "",
                          search: "",
                        })
                      }
                      className="px-2 py-0.5 bg-red-100 text-red-700 rounded-md text-[11px] font-bold hover:bg-red-200 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                {/* Officials Table */}
                <div className="lg:col-span-3 bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-b-2 border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">
                          Officials List
                        </h2>
                        <p className="text-sm text-slate-600 mt-1">
                          Showing {filteredOfficials.length} of{" "}
                          {officials.length} officials
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <div className="max-h-[600px] overflow-y-auto relative">
                      <table className="w-full">
                        <thead className="sticky top-0 z-0 pointer-events-none bg-gradient-to-r from-slate-100 to-slate-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Position
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Barangay
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Contact
                            </th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-3 py-3 w-[6%] text-center">
                              Actions
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-200 relative z-10 pointer-events-auto text-sm">
                          {filteredOfficials.length === 0 ? (
                            <tr>
                              <td
                                colSpan="6"
                                className="px-6 py-12 text-center"
                              >
                                <div className="flex flex-col items-center">
                                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                    <Users
                                      className="text-slate-400"
                                      size={32}
                                    />
                                  </div>
                                  <p className="text-slate-500 font-medium">
                                    No officials found
                                  </p>
                                  <p className="text-slate-400 text-sm mt-1">
                                    Try adjusting your filters
                                  </p>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            filteredOfficials.map((official) => (
                              <tr
                                key={official._id}
                                className={`relative z-20 transition-colors ${
                                  official.status === "Inactive"
                                    ? "bg-red-50 hover:bg-red-100"
                                    : "bg-white hover:bg-blue-50"
                                }`}
                              >
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div>
                                      <p className="font-semibold text-slate-900">
                                        {official.firstname} {official.lastname}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        @{official.username}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-slate-400" />
                                    <span className="font-medium text-slate-900">
                                      {official.position}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-slate-400" />
                                    <span className="text-slate-700">
                                      {official.barangay?.barangayName || "—"}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                    <span className="text-slate-700 text-sm">
                                      {official.email}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                                      official.status === "Active"
                                        ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-200"
                                        : "bg-red-100 text-red-700 border-2 border-red-200"
                                    }`}
                                  >
                                    {official.status === "Active" ? (
                                      <UserCheck size={14} />
                                    ) : (
                                      <UserX size={14} />
                                    )}
                                    {official.status}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <RowActions
                                    official={official}
                                    onEdit={(o) => {
                                      setSelectedOfficial(o);
                                      setIsEditOpen(true);
                                    }}
                                    onView={(o) => openProfile(o)}
                                    onToggleStatus={(o) => toggleStatus(o)}
                                  />
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Side Panel - Statistics */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Position Distribution */}
                  <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-50 to-purple-50 px-6 py-4 border-b-2 border-slate-200">
                      <h3 className="text-lg font-bold text-slate-900">
                        By Position
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Distribution
                      </p>
                    </div>
                    <div className="p-6 space-y-3">
                      {Object.entries(positionCounts).map(
                        ([position, count]) => {
                          const percentage = (
                            (count / stats.total) *
                            100
                          ).toFixed(0);
                          return (
                            <div key={position} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-slate-900">
                                  {position}
                                </span>
                                <span className="text-sm font-bold text-slate-700">
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
                    <div className="bg-gradient-to-r from-slate-50 to-emerald-50 px-6 py-4 border-b-2 border-slate-200">
                      <h3 className="text-lg font-bold text-slate-900">
                        Top Barangays
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        By officials
                      </p>
                    </div>
                    <div className="p-6 space-y-3">
                      {topBarangays.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">
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
                                  <p className="font-bold text-slate-900 text-sm">
                                    {item.name}
                                  </p>
                                  <p className="text-xs text-slate-600 mt-1">
                                    {item.active} active of {item.count} total
                                  </p>
                                </div>
                                <div
                                  className={`text-xl font-bold ${color.text}`}
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
      <CreateOfficialModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={(data) => setOfficials((prev) => [...prev, data])}
      />

      <EditOfficial
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

      {/* Profile Modal */}
      {profileOpen && selectedOfficial && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center font-bold text-blue-600 text-2xl shadow-lg">
                    {selectedOfficial.firstname.charAt(0)}
                    {selectedOfficial.lastname.charAt(0)}
                  </div>
                  <div className="text-white">
                    <h3 className="text-2xl font-bold">
                      {selectedOfficial.firstname} {selectedOfficial.lastname}
                    </h3>
                    <p className="text-blue-100 mt-1">
                      {selectedOfficial.position}
                    </p>
                    <p className="text-blue-200 text-sm mt-1">
                      {selectedOfficial.barangay?.barangayName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    setSelectedOfficial(null);
                    setProfileMessages([]);
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={24} className="text-white" />
                </button>
              </div>
            </div>

            <div
              className="p-6 overflow-y-auto"
              style={{ maxHeight: "calc(90vh - 180px)" }}
            >
              {/* Contact Information */}
              <div className="mb-6">
                <h4 className="text-lg font-bold text-slate-900 mb-4">
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-slate-500 font-semibold">
                        Email
                      </p>
                      <p className="text-sm text-slate-900 font-medium">
                        {selectedOfficial.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
                    <Users className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-xs text-slate-500 font-semibold">
                        Username
                      </p>
                      <p className="text-sm text-slate-900 font-medium">
                        @{selectedOfficial.username}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    Messages ({profileMessages.length})
                  </h4>
                </div>

                {profileLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto"></div>
                    <p className="text-slate-500 text-sm mt-2">
                      Loading messages...
                    </p>
                  </div>
                ) : profileMessages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MessageSquare className="text-slate-400" size={32} />
                    </div>
                    <p className="text-slate-500 font-medium">
                      No messages found
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {profileMessages.map((msg) => (
                      <div
                        key={msg._id}
                        className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-bold text-slate-900">
                            {msg.subject}
                          </h5>
                          <span className="px-2 py-1 bg-blue-200 text-blue-700 rounded-md text-xs font-bold">
                            {msg.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 mb-2">
                          {msg.body}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(msg.createdAt).toLocaleDateString()}
                          </div>
                          {msg.sender && (
                            <span>
                              From: {msg.sender.firstname} {msg.sender.lastname}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SkOfficial;
