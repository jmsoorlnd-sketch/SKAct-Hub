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

const API_BASE = "http://localhost:5000/api";

/* -------- Stat Card -------- */
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
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingBarangays, setLoadingBarangays] = useState(true);
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

  useEffect(() => {
    const fetchAll = async () => {
      await Promise.all([fetchArchive("users"), fetchArchive("barangays")]);
    };
    fetchAll();
  }, [fetchArchive]);

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

    // Sort by deletion date (newest first)
    return items.sort((a, b) => {
      const dateA = new Date(a.deletedAt || 0);
      const dateB = new Date(b.deletedAt || 0);
      return dateB - dateA;
    });
  }, [deletedUsers, deletedBarangays]);

  /* ===================== RENDER HELPERS ===================== */
  const getTypeIcon = (type) => {
    switch (type) {
      case "user":
        return <Users size={16} />;
      case "barangay":
        return <Building2 size={16} />;
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
  };

  const isLoading = loadingUsers || loadingBarangays;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Archive</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage deleted users and barangays. You can restore or permanently
              delete them.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <StatCard
            label="Deleted Users"
            value={stats.deletedUsers}
            icon={Users}
            iconClass="text-blue-400"
          />
          <StatCard
            label="Deleted Barangays"
            value={stats.deletedBarangays}
            icon={Building2}
            iconClass="text-purple-400"
          />
        </div>

        {/* Combined Archive Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          {/* Header */}
          <div className="bg-linear-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                All Archived Items
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {filteredItems.length} item
                {filteredItems.length === 1 ? "" : "s"}
                {searchQuery && ` • Filtering ${allArchivedItems.length}`}
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search by name, type, or details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Clear search"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="p-6">
              <p className="text-sm text-gray-500">Loading...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArchiveIcon className="text-gray-400" size={40} />
              </div>
              <p className="text-base text-gray-600 font-semibold">
                {searchQuery ? "No matching items found" : "No archived items"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Deleted users and barangays will appear here."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Type & Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${getTypeBadgeStyles(
                            item.type,
                          )}`}
                        >
                          {getTypeIcon(item.type)}
                          {getTypeLabel(item.type)}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900 truncate">
                        {item.title}
                      </p>
                      <div className="text-xs text-gray-600 mt-2 space-y-1">
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
                      <p className="text-xs text-gray-500 mt-2">
                        <Calendar size={12} className="inline mr-1" />
                        Deleted{" "}
                        {item.deletedAt
                          ? new Date(item.deletedAt).toLocaleDateString()
                          : "unknown"}
                      </p>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() =>
                          handleRestore(
                            item.type === "user" ? "users" : "barangays",
                            item.id,
                          )
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors"
                      >
                        <RotateCcw size={14} />
                        Restore
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(
                            item.type === "user" ? "users" : "barangays",
                            item.data,
                          )
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={14} />
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
