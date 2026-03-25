import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  lazy,
  Suspense,
} from "react";
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
  Plus,
  Edit,
  UserPlus,
  UserX,
  Building2,
  RotateCcw,
  Calendar,
} from "lucide-react";
import { useToast } from "../../components/Toast";

import LogRow from "../../components/UserLogs/LogRow";
const API_BASE = "http://localhost:5000/api";

const ACTION_META = {
  login: { label: "Login", icon: LogIn, color: "green" },
  logout: { label: "Logout", icon: LogOut, color: "red" },
  delete_message: { label: "Delete Message", icon: Trash2, color: "red" },
  delete_event: { label: "Delete Event", icon: Calendar, color: "red" },
  send_document: { label: "Send Document", icon: FileText, color: "blue" },
  account_change: { label: "Account Change", icon: Settings, color: "purple" },
  delete_document: { label: "Delete Document", icon: Trash2, color: "red" },
  create_folder: { label: "Create Folder", icon: FileText, color: "blue" },
  delete_folder: { label: "Delete Folder", icon: Trash2, color: "red" },
  restore_document: {
    label: "Restore Document",
    icon: FileText,
    color: "green",
  },
  set_sk_personnel: { label: "Set SK Personnel", icon: Plus, color: "blue" },
  edit_sk_personnel: {
    label: "Edit SK Personnel",
    icon: Edit,
    color: "orange",
  },
  delete_sk_personnel: { label: "Delete SK", icon: Trash2, color: "red" },
  create_user: { label: "Create User", icon: UserPlus, color: "green" },
  edit_user: { label: "Edit User", icon: Edit, color: "orange" },
  delete_user: { label: "Delete User", icon: UserX, color: "red" },
  delete_barangay: { label: "Delete Barangay", icon: Trash2, color: "red" },
  restore_barangay: {
    label: "Restore Barangay",
    icon: RotateCcw,
    color: "green",
  },
};

const COLOR_CLASSES = {
  green: "bg-green-50 text-green-700 ring-1 ring-green-200",
  red: "bg-red-50 text-red-700 ring-1 ring-red-200",
  blue: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  purple: "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
  orange: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
};

const ICON_COLOR_CLASSES = {
  green: "text-green-600",
  red: "text-red-500",
  blue: "text-blue-500",
  purple: "text-purple-500",
  orange: "text-orange-500",
};

const ActionBadge = React.memo(function ActionBadge({ actionType }) {
  const meta = ACTION_META[actionType] ?? {
    label: actionType,
    icon: Filter,
    color: "blue",
  };
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${COLOR_CLASSES[meta.color]}`}
    >
      <Icon size={11} className={ICON_COLOR_CLASSES[meta.color]} />
      {meta.label}
    </span>
  );
});

const StatCard = React.memo(function StatCard({
  label,
  value,
  icon: Icon,
  iconClass,
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
          {label}
        </p>
        <p className="text-2xl font-semibold text-gray-900 mt-0.5">{value}</p>
      </div>
      <Icon size={22} className={iconClass} />
    </div>
  );
});

const ExpandedDetails = React.memo(function ExpandedDetails({ log }) {
  return (
    <tr className="bg-gray-50 border-b border-gray-100">
      <td colSpan={6} className="px-6 py-3">
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <Detail label="Barangay" value={log.barangayName || "—"} />
          <Detail label="Role" value={log.role} />
          <div className="col-span-2">
            <Detail
              label="Description"
              value={log.description || "No description"}
            />
          </div>
          <div className="col-span-2">
            <Detail
              label="User agent"
              value={<span className="font-mono text-xs">{log.userAgent}</span>}
            />
          </div>
        </div>
      </td>
    </tr>
  );
});

const Detail = React.memo(function Detail({ label, value }) {
  return (
    <div>
      <span className="text-xs text-gray-400 uppercase tracking-wide">
        {label}
      </span>
      <p className="text-gray-800 mt-0.5">{value}</p>
    </div>
  );
});

export default function AdminUserLogs() {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [statistics, setStatistics] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const token = localStorage.getItem("token");
  const authHeaders = useMemo(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  const buildParams = useCallback(
    (extras = {}) => {
      const p = new URLSearchParams(extras);
      if (filterAction) p.append("actionType", filterAction);
      if (startDate) p.append("startDate", startDate);
      if (endDate) p.append("endDate", endDate);
      return p;
    },
    [filterAction, startDate, endDate],
  );

  const fetchData = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      try {
        const params = buildParams({ page: pageNum, limit: 30 });
        const statsParams = buildParams(); // only once

        const [logsRes, statsRes] = await Promise.all([
          axios.get(`${API_BASE}/user-logs/all?${params}`, {
            headers: authHeaders,
          }),
          axios.get(`${API_BASE}/user-logs/statistics?${statsParams}`, {
            headers: authHeaders,
          }),
        ]);

        setLogs(logsRes.data.logs ?? []);
        setTotalPages(logsRes.data.totalPages ?? 1);
        setTotalLogs(logsRes.data.totalLogs ?? 0);
        setStatistics(statsRes.data);
        setPage(pageNum);
      } catch {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    },
    [buildParams, authHeaders, toast],
  );
  useEffect(() => {
    fetchData(1);
  }, [fetchData]);
  const filteredLogs = useMemo(() => {
    if (!searchTerm) return logs;

    const q = searchTerm.toLowerCase();

    return logs.filter((log) => {
      return (
        log.username?.toLowerCase().includes(q) ||
        log.firstname?.toLowerCase().includes(q) ||
        log.lastname?.toLowerCase().includes(q) ||
        log.description?.toLowerCase().includes(q)
      );
    });
  }, [logs, searchTerm]);
  const exportCSV = useCallback(() => {
    const rows = [
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
        log.barangayName ?? "N/A",
        ACTION_META[log.actionType]?.label ?? log.actionType,
        log.description ?? "",
        log.ipAddress,
      ]),
    ];

    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `user-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();

    URL.revokeObjectURL(url); // 🔥 important cleanup
  }, [logs]);
  const topUser = statistics?.topUsers?.[0];

  const visiblePages = useMemo(() => {
    const range = 2; // 2 pages before and after
    const start = Math.max(1, page - range);
    const end = Math.min(totalPages, page + range);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, totalPages]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900">User Logs</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Track login, logout, and system actions across all barangays
          </p>
        </div>

        {/* Stats - Sticky */}
        {statistics && (
          <div className="sticky top-0 z-10 bg-gray-50 pb-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatCard
                label="Total Logs"
                value={statistics.totalLogs?.toLocaleString()}
                icon={Clock}
                iconClass="text-blue-400"
              />
              <StatCard
                label="Action Types"
                value={statistics.actionTypeCounts?.length ?? 0}
                icon={Filter}
                iconClass="text-purple-400"
              />
              <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Top user
                </p>
                <p className="text-sm font-semibold text-gray-900 mt-1 truncate">
                  {topUser ? `@${topUser.username}` : "—"}
                </p>
                <div className="flex flex-wrap gap-x-3 mt-1.5">
                  {statistics.actionTypeCounts?.slice(0, 3).map((a) => (
                    <span key={a._id} className="text-xs text-gray-500">
                      {ACTION_META[a._id]?.label ?? a._id}:
                      <strong className="text-gray-700">{a.count}</strong>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
          <div className="flex flex-wrap gap-2 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-48">
              <Search
                size={14}
                className="absolute left-2.5 top-2.5 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search user or description…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Action type */}
            <select
              value={filterAction}
              onChange={(e) => {
                setFilterAction(e.target.value);
                setPage(1);
              }}
              className="text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All actions</option>
              {Object.entries(ACTION_META).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            {/* Date range */}
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={exportCSV}
              className="ml-auto flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition"
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="text-center py-16 text-sm text-gray-400">
              Loading…
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-16 text-sm text-gray-400">
              No logs found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                      <th className="px-4 py-2.5 text-left font-medium">
                        Timestamp
                      </th>
                      <th className="px-4 py-2.5 text-left font-medium">
                        User
                      </th>
                      <th className="px-4 py-2.5 text-left font-medium">
                        Action
                      </th>
                      <th className="px-4 py-2.5 text-left font-medium">
                        Description
                      </th>
                      <th className="px-4 py-2.5 text-left font-medium">IP</th>
                      <th className="px-4 py-2.5 w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <LogRow
                        key={log._id}
                        log={log}
                        expandedId={expandedId}
                        setExpandedId={setExpandedId}
                        ActionBadge={ActionBadge}
                        ExpandedDetails={ExpandedDetails}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {filteredLogs.length} of {totalLogs.toLocaleString()} logs
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => fetchData(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40 transition"
                  >
                    Prev
                  </button>
                  {visiblePages.map((p) => (
                    <button
                      key={p}
                      onClick={() => fetchData(p)}
                      className={`px-3 py-1.5 text-xs rounded-md transition ${
                        p === page
                          ? "bg-gray-900 text-white"
                          : "text-gray-600 border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => fetchData(page + 1)}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40 transition"
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
}
