import React, { useEffect, useState, useMemo, useCallback } from "react";
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
const API_BASE = window.API_BASE;

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
    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700">
      <Icon size={11} className="text-gray-500" />
      {meta.label}
    </span>
  );
});

const StatCard = React.memo(function StatCard({
  label,
  value,
  icon,
  iconClass,
}) {
  const Icon = icon;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 px-3 py-2.5 flex items-center justify-between shadow-xs">
      <div>
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm font-bold text-slate-900 mt-1">{value}</p>
      </div>
      <Icon size={18} className={iconClass} />
    </div>
  );
});

// ✅ After
const ExpandedDetails = React.memo(function ExpandedDetails({ log }) {
  // Handles: populated object, flat string, or missing
  const barangayName =
    log.barangayId?.barangayName || // ✅ populated from .populate()
    log.barangayName || // fallback: flat string if stored directly
    "—";

  return (
    <tr className="bg-gray-50 border-b border-gray-100">
      <td colSpan={6} className="px-6 py-3">
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <Detail label="Barangay" value={barangayName} /> {/* ✅ */}
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
      ["Timestamp", "User", "Username", "Barangay", "Action", "Description"],
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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Page hero */}
        <div className="mb-6 rounded-4xl border border-slate-200 bg-white/95 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)] px-6 py-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600 mb-3">
                Admin workspace
              </p>
              <h1 className="text-3xl font-semibold text-slate-950">
                User Logs
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Track login, logout, and system actions across all barangays
                with a clean audit view.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15">
              <Clock size={16} className="text-sky-300" />
              Audit trail
            </div>
          </div>
        </div>

        {statistics && (
          <div className="sticky top-4 z-10 mb-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total Logs"
                value={statistics.totalLogs?.toLocaleString()}
                icon={Clock}
                iconClass="text-sky-500"
              />
              <StatCard
                label="Action Types"
                value={statistics.actionTypeCounts?.length ?? 0}
                icon={Filter}
                iconClass="text-violet-500"
              />
              <StatCard
                label="Top User"
                value={topUser ? `@${topUser.username}` : "—"}
                icon={UserPlus}
                iconClass="text-emerald-500"
              />
              <div className="rounded-2xl border border-slate-100 bg-white px-3 py-2.5 text-center shadow-xs">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  Actions
                </p>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {topUser?.count ?? 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm px-4 py-4 mb-5">
          <div className="grid gap-4 lg:grid-cols-[1.5fr_auto] lg:items-center">
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr] xl:grid-cols-[2fr_1fr_1fr]">
              <div className="relative min-w-0">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-3 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search user or description…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <select
                value={filterAction}
                onChange={(e) => {
                  setFilterAction(e.target.value);
                  setPage(1);
                }}
                className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              >
                <option value="">All Activities</option>
                {Object.entries(ACTION_META).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-slate-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>
            <button
              onClick={exportCSV}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-3xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-4xl border border-slate-200 bg-white shadow-[0_20px_50px_-20px_rgba(15,23,42,0.15)] overflow-hidden">
          {loading ? (
            <div className="text-center py-20 text-sm text-slate-400">
              Loading audit logs…
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-20 text-sm text-slate-400">
              No logs found. Try adjusting your filters.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                      <th className="px-6 py-4 text-left font-semibold">
                        Timestamp
                      </th>
                      <th className="px-6 py-4 text-left font-semibold">
                        User
                      </th>
                      <th className="px-6 py-4 text-left font-semibold">
                        Activity
                      </th>
                      <th className="px-6 py-4 text-left font-semibold">
                        Description
                      </th>
                      <th className="px-6 py-4 w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
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
              <div className="flex flex-col gap-4 px-6 py-4 border-t border-slate-200 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">
                  Showing {filteredLogs.length} of {totalLogs.toLocaleString()}{" "}
                  logs
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => fetchData(page - 1)}
                    disabled={page === 1}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Prev
                  </button>
                  {visiblePages.map((p) => (
                    <button
                      key={p}
                      onClick={() => fetchData(p)}
                      className={`rounded-2xl px-4 py-2 text-xs font-medium transition ${
                        p === page
                          ? "bg-slate-900 text-white"
                          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => fetchData(page + 1)}
                    disabled={page === totalPages}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
