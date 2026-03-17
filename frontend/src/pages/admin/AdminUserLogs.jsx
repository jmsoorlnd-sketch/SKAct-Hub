import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Search,
  Download,
  Clock,
  LogIn,
  LogOut,
  Trash2,
  FileText,
  Settings,
  Filter,
  ChevronDown,
  Users,
  Plus,
  Edit,
} from "lucide-react";
import { useToast } from "../../components/Toast";

const API_BASE = "http://localhost:5000/api";

const AdminUserLogs = () => {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActionType, setFilterActionType] = useState("");
  const [filterBarangay, setFilterBarangay] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [statistics, setStatistics] = useState(null);
  const [expandedLog, setExpandedLog] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const actionTypeIcons = {
    login: <LogIn size={16} className="text-green-600" />,
    logout: <LogOut size={16} className="text-red-600" />,
    delete_message: <Trash2 size={16} className="text-red-600" />,
    send_document: <FileText size={16} className="text-blue-600" />,
    account_change: <Settings size={16} className="text-purple-600" />,
    delete_document: <Trash2 size={16} className="text-red-600" />,
    create_folder: <FileText size={16} className="text-blue-600" />,
    delete_folder: <Trash2 size={16} className="text-red-600" />,
    restore_document: <FileText size={16} className="text-green-600" />,
    set_sk_personnel: <Plus size={16} className="text-blue-600" />,
    edit_sk_personnel: <Edit size={16} className="text-orange-600" />,
    delete_sk_personnel: <Trash2 size={16} className="text-red-600" />,
  };

  const actionTypeLabels = {
    login: "Login",
    logout: "Logout",
    delete_message: "Delete Message",
    send_document: "Send Document",
    account_change: "Account Change",
    delete_document: "Delete Document",
    create_folder: "Create Folder",
    delete_folder: "Delete Folder",
    restore_document: "Restore Document",
    set_sk_personnel: "Set SK Personnel",
    edit_sk_personnel: "Edit SK Personnel",
    delete_sk_personnel: "Delete SK Personnel",
  };

  const actionTypeColors = {
    login: "bg-green-100 text-green-800",
    logout: "bg-red-100 text-red-800",
    delete_message: "bg-red-100 text-red-800",
    send_document: "bg-blue-100 text-blue-800",
    account_change: "bg-purple-100 text-purple-800",
    delete_document: "bg-red-100 text-red-800",
    create_folder: "bg-blue-100 text-blue-800",
    delete_folder: "bg-red-100 text-red-800",
    restore_document: "bg-green-100 text-green-800",
    set_sk_personnel: "bg-blue-100 text-blue-800",
    edit_sk_personnel: "bg-orange-100 text-orange-800",
    delete_sk_personnel: "bg-red-100 text-red-800",
  };

  // Fetch logs
  const fetchLogs = async (pageNum = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", pageNum);
      params.append("limit", 50);

      if (filterActionType) params.append("actionType", filterActionType);
      if (filterBarangay) params.append("barangayId", filterBarangay);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await axios.get(`${API_BASE}/user-logs/all?${params}`, {
        headers: getAuthHeaders(),
      });

      setLogs(response.data.logs || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalLogs(response.data.totalLogs || 0);
      setPage(pageNum);
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error("Failed to load user logs");
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await axios.get(
        `${API_BASE}/user-logs/statistics?${params}`,
        { headers: getAuthHeaders() },
      );
      setStatistics(response.data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  useEffect(() => {
    fetchLogs(1);
    fetchStatistics();
  }, [filterActionType, filterBarangay, startDate, endDate]);

  // Filter logs by search term
  const filteredLogs = logs.filter(
    (log) =>
      log.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Export logs to CSV
  const exportToCSV = () => {
    const csv = [
      [
        "Timestamp",
        "User",
        "Username",
        "Barangay",
        "Action",
        "Description",
        "IP Address",
      ],
      ...logs.map((log) => [
        new Date(log.createdAt).toLocaleString(),
        `${log.firstname} ${log.lastname}`,
        log.username,
        log.barangayName || "N/A",
        actionTypeLabels[log.actionType] || log.actionType,
        log.description || "",
        log.ipAddress,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `user-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Logs</h1>
          <p className="text-gray-600">
            Track user login/logout activities and system actions across all
            barangays
          </p>
        </div>

        {/* Statistics cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-semibold">
                    Total Logs
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {statistics.totalLogs}
                  </p>
                </div>
                <Clock className="text-blue-600" size={32} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-semibold">
                    Action Types
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {statistics.actionTypeCounts?.length || 0}
                  </p>
                </div>
                <Filter className="text-purple-600" size={32} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-semibold">
                    Top User Actions
                  </p>
                  <p className="text-sm text-gray-900 mt-2">
                    {statistics.topUsers?.[0]?.username || "No data"} (
                    {statistics.topUsers?.[0]?.count || 0})
                  </p>
                </div>
                <div className="text-right">
                  {statistics.actionTypeCounts?.slice(0, 3).map((action) => (
                    <div key={action._id} className="text-xs text-gray-600">
                      {actionTypeLabels[action._id] || action._id}:{" "}
                      {action.count}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search
                className="absolute left-3 top-3 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search user, username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Action Type */}
            <select
              value={filterActionType}
              onChange={(e) => {
                setFilterActionType(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Actions</option>
              {Object.entries(actionTypeLabels).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </select>

            {/* Start Date */}
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {/* End Date */}
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Export Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
            >
              <Download size={18} />
              Export to CSV
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No logs found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        IP Address
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <React.Fragment key={log._id}>
                        <tr className="border-b hover:bg-gray-50 transition">
                          <td className="px-6 py-3 text-sm text-gray-900">
                            {new Date(log.createdAt).toLocaleString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </td>
                          <td className="px-6 py-3 text-sm">
                            <div className="font-semibold text-gray-900">
                              {log.firstname} {log.lastname}
                            </div>
                            <div className="text-xs text-gray-600">
                              @{log.username}
                            </div>
                          </td>
                          <td className="px-6 py-3 text-sm">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                                actionTypeColors[log.actionType] ||
                                "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {actionTypeIcons[log.actionType]}
                              {actionTypeLabels[log.actionType] ||
                                log.actionType}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-600">
                            {log.description
                              ? log.description.substring(0, 40) + "..."
                              : "No description"}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-600 font-mono">
                            {log.ipAddress}
                          </td>
                          <td className="px-6 py-3 text-sm">
                            <button
                              onClick={() =>
                                setExpandedLog(
                                  expandedLog === log._id ? null : log._id,
                                )
                              }
                              className="text-blue-600 hover:text-blue-800 transition"
                            >
                              <ChevronDown
                                size={18}
                                className={`transform transition ${
                                  expandedLog === log._id ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Details */}
                        {expandedLog === log._id && (
                          <tr className="bg-blue-50 border-b">
                            <td colSpan="6" className="px-6 py-4">
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-xs font-semibold text-gray-600">
                                      Barangay
                                    </p>
                                    <p className="text-sm text-gray-900">
                                      {log.barangayName || "N/A"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-gray-600">
                                      Role
                                    </p>
                                    <p className="text-sm text-gray-900">
                                      {log.role}
                                    </p>
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-xs font-semibold text-gray-600">
                                      Description
                                    </p>
                                    <p className="text-sm text-gray-900">
                                      {log.description || "No description"}
                                    </p>
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-xs font-semibold text-gray-600">
                                      User Agent
                                    </p>
                                    <p className="text-xs text-gray-600 break-words">
                                      {log.userAgent}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {filteredLogs.length} of {totalLogs} logs
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchLogs(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-300 transition"
                  >
                    Previous
                  </button>
                  <div className="px-4 py-2 flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (p) => (
                        <button
                          key={p}
                          onClick={() => fetchLogs(p)}
                          className={`px-3 py-1 rounded ${
                            page === p
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          } transition`}
                        >
                          {p}
                        </button>
                      ),
                    )}
                  </div>
                  <button
                    onClick={() => fetchLogs(page + 1)}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-300 transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUserLogs;
