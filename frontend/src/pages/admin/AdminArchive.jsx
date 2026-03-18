import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import {
  Trash2,
  RotateCcw,
  Users,
  Building2,
  Search,
  AlertCircle,
  Download,
  Calendar,
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

/* -------- Archive Section -------- */
const ArchiveSection = React.memo(function ArchiveSection({
  title,
  icon: Icon,
  iconColor,
  data,
  loading,
  searchValue,
  setSearchValue,
  onRestore,
  onDelete,
  isUser,
}) {
  const filteredData = useMemo(() => {
    if (!searchValue) return data;
    const q = searchValue.toLowerCase();
    return data.filter((item) => {
      const searchFields = isUser
        ? [
            item.firstname,
            item.lastname,
            item.username,
            item.email,
            item.position,
            item.barangayName,
          ]
        : [item.barangayName, item.city, item.province, item.region];
      return searchFields
        .filter(Boolean)
        .some((val) => val.toLowerCase().includes(q));
    });
  }, [data, searchValue, isUser]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-2.5 rounded-lg ${iconColor} bg-opacity-10`}>
            <Icon className={`${iconColor}`} size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-500">{data.length} item(s)</p>
          </div>
        </div>
        <div className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold text-sm">
          {data.length}
        </div>
      </div>

      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder={`Search ${title.toLowerCase()}...`}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-sm text-gray-400">
            Loading {title.toLowerCase()}...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400">
            No {title.toLowerCase()} found
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 max-h-[600px] overflow-y-auto pr-2">
            {filteredData.map((item) => (
              <ArchiveItemCard
                key={item._id}
                item={item}
                isUser={isUser}
                onRestore={() => onRestore(item._id)}
                onDelete={() => onDelete(item)}
              />
            ))}
          </div>
        )}
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
  const [searchUsers, setSearchUsers] = useState("");
  const [searchBarangays, setSearchBarangays] = useState("");
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

  const stats = {
    deletedUsers: deletedUsers.length,
    deletedBarangays: deletedBarangays.length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Archive</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage deleted users and barangays. You can restore or permanently
            delete them.
          </p>
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

        {/* Archive Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
            <ArchiveSection
              title="Deleted Users"
              icon={Users}
              iconColor="text-blue-600"
              data={deletedUsers}
              loading={loadingUsers}
              searchValue={searchUsers}
              setSearchValue={setSearchUsers}
              onRestore={(id) => handleRestore("users", id)}
              onDelete={(item) => handleDelete("users", item)}
              isUser={true}
            />
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
            <ArchiveSection
              title="Deleted Barangays"
              icon={Building2}
              iconColor="text-purple-600"
              data={deletedBarangays}
              loading={loadingBarangays}
              searchValue={searchBarangays}
              setSearchValue={setSearchBarangays}
              onRestore={(id) => handleRestore("barangays", id)}
              onDelete={(item) => handleDelete("barangays", item)}
              isUser={false}
            />
          </div>
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
