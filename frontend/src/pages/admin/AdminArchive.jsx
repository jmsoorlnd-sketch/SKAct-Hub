import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import {
  Trash2,
  RotateCcw,
  Users,
  Building2,
  Search,
  AlertCircle,
  Calendar,
  Archive as ArchiveIcon,
  X,
} from "lucide-react";
import { useToast } from "../../components/Toast";

const API_BASE = window.API_BASE;

/* -------- Stat Card -------- */
const StatCard = React.memo(function StatCard({
  label,
  value,
  icon,
  iconClass,
}) {
  const Icon = icon;
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm px-5 py-5 flex items-center justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
          {label}
        </p>
        <p className="text-3xl font-semibold text-slate-950 mt-1">{value}</p>
      </div>
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <Icon size={24} className={iconClass} />
        </div>
      )}
    </div>
  );
});

/* -------- Confirmation Modal -------- */
const ConfirmationModal = React.memo(function ConfirmationModal({
  show,
  action,
  onClose,
}) {
  if (!show || !action) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="text-red-600" size={24} />
          <h3 className="text-lg font-bold text-gray-900">Confirm Action</h3>
        </div>
        <p className="text-sm text-gray-600 mb-6">{action.message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              try {
                await action.onConfirm();
              } catch (err) {
                console.error(err);
              } finally {
                onClose();
              }
            }}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
          >
            {action.confirmText || "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
});

/* -------- Archive Item Card -------- */
const ArchiveItemCard = React.memo(function ArchiveItemCard({
  item,
  isUser,
  onRestore,
  onDelete,
}) {
  const name = isUser
    ? `${item.firstname} ${item.lastname}`
    : item.barangayName;

  const deletedDate = new Date(item.deletedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm">{name}</h3>
          <div className="mt-2 space-y-1 text-xs text-gray-600">
            {isUser ? (
              <>
                {item.username && <p>@{item.username}</p>}
                {item.email && <p>{item.email}</p>}
                {item.position && <p>Position: {item.position}</p>}
                {item.barangayName && <p>Barangay: {item.barangayName}</p>}
              </>
            ) : (
              <>
                {item.city && <p>City: {item.city}</p>}
                {item.province && <p>Province: {item.province}</p>}
                {item.region && <p>Region: {item.region}</p>}
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {item.role && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-md font-medium">
              {item.role}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
        <Calendar size={14} />
        <span>Deleted on {deletedDate}</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onRestore}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-xs font-semibold"
        >
          <RotateCcw size={14} />
          Restore
        </button>
        <button
          onClick={onDelete}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-xs font-semibold"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </div>
  );
});

/* -------- Main Component -------- */
const AdminArchive = () => {
  const toast = useToast();

  const [deletedUsers, setDeletedUsers] = useState([]);
  const [deletedBarangays, setDeletedBarangays] = useState([]);
  const [canceledEvents, setCanceledEvents] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingBarangays, setLoadingBarangays] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchArchive = useCallback(
    async (type) => {
      const setData = type === "users" ? setDeletedUsers : setDeletedBarangays;
      const setLoading =
        type === "users" ? setLoadingUsers : setLoadingBarangays;
      setLoading(true);
      try {
        const url =
          type === "users"
            ? `${API_BASE}/admins/archive/deleted-users`
            : `${API_BASE}/barangays/admin/archive/deleted-barangays`;
        const res = await axios.get(url, { headers: getAuthHeaders() });
        setData(res.data[type === "users" ? "users" : "barangays"] || []);
      } catch (err) {
        console.error(`Error fetching deleted ${type}:`, err);
        toast.error(`Failed to load deleted ${type}`);
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders, toast],
  );

  const fetchCanceledEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const res = await axios.get(
        `${API_BASE}/messages/activities?includeCancelled=true`,
        {
          headers: getAuthHeaders(),
        },
      );
      const events = (res.data.activities || []).filter(
        (ev) => ev.status === "cancelled" || ev.isDeleted === true,
      );
      setCanceledEvents(events);
    } catch (err) {
      console.error("Error fetching canceled events:", err);
      toast.error("Failed to fetch canceled events");
    } finally {
      setLoadingEvents(false);
    }
  }, [getAuthHeaders, toast]);

  useEffect(() => {
    const fetchAll = async () => {
      await Promise.all([
        fetchArchive("users"),
        fetchArchive("barangays"),
        fetchCanceledEvents(),
      ]);
    };
    fetchAll();
  }, [fetchArchive, fetchCanceledEvents]);

  const handleRestore = async (type, id) => {
    try {
      const url =
        type === "users"
          ? `${API_BASE}/admins/archive/restore-user/${id}`
          : `${API_BASE}/barangays/admin/archive/restore-barangay/${id}`;
      await axios.put(url, {}, { headers: getAuthHeaders() });
      toast.success(
        `${type === "users" ? "User" : "Barangay"} restored successfully`,
      );
      fetchArchive(type);
    } catch (err) {
      console.error(`Error restoring ${type}:`, err);
      toast.error(`Failed to restore ${type}`);
    }
  };

  const handleRestoreEvent = async (eventId, eventData) => {
    if (!eventId) return;
    if (!window.confirm("Restore this canceled event?")) return;

    try {
      if (eventData?.isDeleted) {
        await axios.post(`${API_BASE}/messages/${eventId}/restore`, {
          headers: getAuthHeaders(),
        });
      } else if (eventData?.status === "cancelled") {
        await axios.put(
          `${API_BASE}/messages/${eventId}/status`,
          { status: "ongoing" },
          { headers: getAuthHeaders() },
        );
      } else {
        await axios.post(`${API_BASE}/messages/${eventId}/restore`, {
          headers: getAuthHeaders(),
        });
      }

      toast.success("Event restored successfully");
      fetchCanceledEvents();
      fetchArchive("users");
      fetchArchive("barangays");
    } catch (err) {
      console.error("Error restoring event:", err);
      toast.error("Failed to restore event");
    }
  };

  const handleDelete = (type, item) => {
    setConfirmAction({
      message:
        type === "users"
          ? `Are you sure you want to permanently delete ${item.firstname} ${item.lastname}? This action cannot be undone.`
          : `Are you sure you want to permanently delete ${item.barangayName} and all its data? This action cannot be undone.`,
      confirmText: "Permanently Delete",
      onConfirm: () => handleDeleteConfirm(type, item._id),
    });
    setShowConfirmModal(true);
  };

  const handleDeleteConfirm = async (type, id) => {
    try {
      const url =
        type === "users"
          ? `${API_BASE}/admins/archive/permanently-delete-user/${id}`
          : `${API_BASE}/barangays/admin/archive/permanently-delete-barangay/${id}`;
      await axios.delete(url, { headers: getAuthHeaders() });
      toast.success(
        `${type === "users" ? "User" : "Barangay"} permanently deleted`,
      );
      fetchArchive(type);
    } catch (err) {
      console.error(`Error deleting ${type}:`, err);
      toast.error(`Failed to permanently delete ${type}`);
    }
  };

  /* ===================== COMBINED ITEMS ===================== */
  const allArchivedItems = useMemo(() => {
    const items = [];

    // Add deleted users
    deletedUsers.forEach((user) => {
      items.push({
        id: user._id,
        type: "user",
        name: `${user.firstname} ${user.lastname}`,
        title: `${user.firstname} ${user.lastname}`,
        deletedAt: user.deletedAt,
        data: user,
      });
    });

    // Add deleted barangays
    deletedBarangays.forEach((barangay) => {
      items.push({
        id: barangay._id,
        type: "barangay",
        name: barangay.barangayName,
        title: barangay.barangayName,
        deletedAt: barangay.deletedAt,
        data: barangay,
      });
    });

    // Add canceled events
    canceledEvents.forEach((evt) => {
      items.push({
        id: evt._id,
        type: "event",
        name: evt.subject || "Untitled Event",
        title: evt.subject || "Untitled Event",
        deletedAt: evt.deletedAt || evt.updatedAt || null,
        data: evt,
      });
    });

    // Sort by deletion date (newest first)
    return items.sort((a, b) => {
      const dateA = new Date(a.deletedAt || 0);
      const dateB = new Date(b.deletedAt || 0);
      return dateB - dateA;
    });
  }, [deletedUsers, deletedBarangays, canceledEvents]);

  /* ===================== RENDER HELPERS ===================== */
  const getTypeIcon = (type) => {
    switch (type) {
      case "user":
        return <Users size={16} />;
      case "barangay":
        return <Building2 size={16} />;
      case "event":
        return <Calendar size={16} />;
      default:
        return <ArchiveIcon size={16} />;
    }
  };

  const getTypeBadgeStyles = (type) => {
    switch (type) {
      case "user":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "barangay":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "event":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "user":
        return "User";
      case "barangay":
        return "Barangay";
      case "event":
        return "Event";
      default:
        return "Item";
    }
  };

  /* ===================== FILTERED ITEMS ===================== */
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return allArchivedItems;

    const query = searchQuery.toLowerCase();
    return allArchivedItems.filter((item) => {
      const title = item.title?.toLowerCase() || "";
      const type = getTypeLabel(item.type)?.toLowerCase() || "";
      const additionalDetails =
        item.type === "user"
          ? [item.data.username, item.data.email, item.data.position]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
          : [item.data.city, item.data.province, item.data.region]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

      return (
        title.includes(query) ||
        type.includes(query) ||
        additionalDetails.includes(query)
      );
    });
  }, [allArchivedItems, searchQuery]);

  const stats = {
    deletedUsers: deletedUsers.length,
    deletedBarangays: deletedBarangays.length,
    cancelledEvents: canceledEvents.length,
  };

  const isLoading = loadingUsers || loadingBarangays || loadingEvents;

  return (
    <div className="min-h-screen bg-slate-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="rounded-4xl border border-slate-200 bg-white/90 shadow-[0_25px_70px_-40px_rgba(15,23,42,0.25)] backdrop-blur-md p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-600">
                Archive workspace
              </p>
              <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-slate-950">
                Archived records
              </h1>
              <p className="mt-4 text-sm leading-7 text-slate-600 max-w-2xl">
                Restore or permanently delete archived users, barangays, and
                canceled events from a single secure workspace.
              </p>
            </div>
            <div className="rounded-3xl bg-slate-950 px-6 py-5 shadow-xl shadow-slate-950/10 text-white">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                Total archived
              </p>
              <p className="mt-3 text-4xl font-semibold tracking-tight">
                {allArchivedItems.length}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Deleted Users"
            value={stats.deletedUsers}
            icon={Users}
            iconClass="text-sky-500"
          />
          <StatCard
            label="Deleted Barangays"
            value={stats.deletedBarangays}
            icon={Building2}
            iconClass="text-violet-500"
          />
          <StatCard
            label="Cancelled Events"
            value={stats.cancelledEvents}
            icon={Calendar}
            iconClass="text-rose-500"
          />
        </div>

        {/* Combined Archive Section */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-slate-950 px-6 py-6 sm:px-8 sm:py-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  All Archived Items
                </h2>
                <p className="mt-2 text-sm text-slate-300 max-w-2xl">
                  Showing {filteredItems.length} of {allArchivedItems.length}{" "}
                  archived records.
                  {searchQuery && ` • Filtered from all records.`}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-900/80 px-4 py-3 text-sm text-slate-200 border border-slate-800">
                <span className="font-semibold text-white">
                  {filteredItems.length}
                </span>
                <span className="ml-2">results</span>
              </div>
            </div>
          </div>

          <div className="border-b border-slate-200 bg-slate-50 px-6 py-5 sm:px-8">
            <div className="relative">
              <Search
                size={20}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search by name, type, or details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-3xl border border-slate-200 bg-white py-3 pl-12 pr-12 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  title="Clear search"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="p-10 text-center">
              <p className="text-sm text-slate-500">Loading archived items…</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-14 text-center">
              <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <ArchiveIcon size={42} />
              </div>
              <p className="text-base font-semibold text-slate-900">
                {searchQuery ? "No matching items found" : "No archived items"}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {searchQuery
                  ? "Try another search term or clear the filter."
                  : "Deleted users, barangays, and canceled events will appear here once archived."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 px-6 py-6 sm:px-8 sm:py-8 xl:grid-cols-2">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="group rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    {/* Left: Type & Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${getTypeBadgeStyles(
                            item.type,
                          )}`}
                        >
                          {getTypeIcon(item.type)}
                          {getTypeLabel(item.type)}
                        </span>
                      </div>
                      <h3 className="mt-4 text-lg font-semibold text-slate-950 truncate">
                        {item.title}
                      </h3>
                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        {item.type === "user" && (
                          <>
                            {item.data.username && <p>@{item.data.username}</p>}
                            {item.data.email && <p>{item.data.email}</p>}
                            {item.data.position && (
                              <p>Position: {item.data.position}</p>
                            )}
                            {item.data.barangayName && (
                              <p>Barangay: {item.data.barangayName}</p>
                            )}
                          </>
                        )}
                        {item.type === "barangay" && (
                          <>
                            {item.data.city && <p>City: {item.data.city}</p>}
                            {item.data.province && (
                              <p>Province: {item.data.province}</p>
                            )}
                            {item.data.region && (
                              <p>Region: {item.data.region}</p>
                            )}
                          </>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        <Calendar size={12} className="inline mr-1" />
                        Deleted{" "}
                        {item.deletedAt
                          ? new Date(item.deletedAt).toLocaleDateString()
                          : "unknown"}
                      </p>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col gap-3 items-stretch pt-2 lg:pt-0">
                      <button
                        onClick={() => {
                          if (item.type === "event") {
                            handleRestoreEvent(item.id, item.data);
                          } else {
                            handleRestore(
                              item.type === "user" ? "users" : "barangays",
                              item.id,
                            );
                          }
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                      >
                        <RotateCcw size={16} />
                        Restore
                      </button>
                      <button
                        onClick={() => {
                          if (item.type === "event") {
                            if (
                              window.confirm("Permanently delete this event?")
                            ) {
                              axios
                                .delete(
                                  `${API_BASE}/messages/${item.id}/hard-event`,
                                  { headers: getAuthHeaders() },
                                )
                                .then(() => {
                                  toast.success("Event permanently deleted");
                                  fetchCanceledEvents();
                                })
                                .catch((err) => {
                                  console.error("Failed to delete event:", err);
                                  toast.error("Failed to delete event");
                                });
                            }
                          } else {
                            handleDelete(
                              item.type === "user" ? "users" : "barangays",
                              item.data,
                            );
                          }
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        show={showConfirmModal}
        action={confirmAction}
        onClose={() => {
          setShowConfirmModal(false);
          setConfirmAction(null);
        }}
      />
    </div>
  );
};

export default AdminArchive;
