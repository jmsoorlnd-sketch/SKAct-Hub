import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import {
  Trash2,
  RotateCcw,
  Users,
  Building2,
  Search,
  AlertCircle,
} from "lucide-react";
import { useToast } from "../../components/Toast";

const API_BASE = "http://localhost:5000/api";

/* -------------------- Confirmation Modal -------------------- */
const ConfirmationModal = ({ show, action, onClose }) => {
  if (!show || !action) return null;

  return (
    <div className="fixed inset-0 bg-black/50  flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="text-red-600" size={24} />
          <h3 className="text-lg font-bold text-gray-900">Confirm Action</h3>
        </div>
        <p className="text-gray-600 mb-6">{action.message}</p>
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
};

/* -------------------- Archive Section -------------------- */
const ArchiveSection = ({
  title,
  icon: Icon,
  color,
  data,
  loading,
  searchValue,
  setSearchValue,
  onRestore,
  onDelete,
  extraFields,
}) => {
  const filteredData = useMemo(() => {
    if (!searchValue) return data;
    const q = searchValue.toLowerCase();
    return data.filter((item) =>
      [
        item.firstname,
        item.lastname,
        item.username,
        item.email,
        item.position,
        item.barangayName,
        item.province,
        item.city,
        item.region,
        ...(extraFields?.map((f) => item[f.key]) || []),
      ]
        .filter(Boolean)
        .some((val) => val.toLowerCase().includes(q)),
    );
  }, [data, searchValue, extraFields]);
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div
        className={`bg-gradient-to-r from-${color}-600 to-${color}-700 px-6 py-4 flex items-center gap-2`}
      >
        <Icon className="text-white" size={24} />
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <span
          className={`ml-auto bg-${color}-800 px-3 py-1 rounded-full text-white text-sm font-semibold`}
        >
          {data.length}
        </span>
      </div>

      <div className="p-6">
        {/* Search */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${title.toLowerCase()}...`}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${color}-500 focus:border-transparent`}
          />
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">
            Loading {title.toLowerCase()}...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No {title.toLowerCase()} found
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredData.map((item) => (
              <div
                key={item._id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {item.firstname
                        ? `${item.firstname} ${item.lastname}`
                        : item.barangayName}
                    </h3>
                    {item.position && (
                      <p className="text-sm text-gray-600">
                        Position: {item.position}
                      </p>
                    )}
                    {item.barangayName && (
                      <p className="text-sm text-gray-600">
                        Barangay: {item.barangayName}
                      </p>
                    )}
                    {item.username && (
                      <p className="text-sm text-gray-600">@{item.username}</p>
                    )}
                    {item.email && (
                      <p className="text-sm text-gray-600">{item.email}</p>
                    )}
                    {extraFields &&
                      extraFields.map(({ label, key }) => (
                        <p key={key} className="text-sm text-gray-600">
                          {label}: {item[key]}
                        </p>
                      ))}
                  </div>
                  {item.role && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                      {item.role}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Deleted:{" "}
                  {new Date(item.deletedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onRestore(item._id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-semibold"
                  >
                    <RotateCcw size={16} />
                    Restore
                  </button>
                  <button
                    onClick={() => onDelete(item)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-semibold"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* -------------------- Main Component -------------------- */
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
      confirmText: "Delete",
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Archive</h1>
          <p className="text-gray-600">
            Manage deleted users and barangays. You can restore or permanently
            delete them.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ArchiveSection
            title="Deleted Users"
            icon={Users}
            color="blue"
            data={deletedUsers}
            loading={loadingUsers}
            searchValue={searchUsers}
            setSearchValue={setSearchUsers}
            onRestore={(id) => handleRestore("users", id)}
            onDelete={(item) => handleDelete("users", item)}
            extraFields={[{ label: "Email", key: "email" }]}
          />

          <ArchiveSection
            title="Deleted Barangays"
            icon={Building2}
            color="purple"
            data={deletedBarangays}
            loading={loadingBarangays}
            searchValue={searchBarangays}
            setSearchValue={setSearchBarangays}
            onRestore={(id) => handleRestore("barangays", id)}
            onDelete={(item) => handleDelete("barangays", item)}
            extraFields={[
              { label: "City", key: "city" },
              { label: "Province", key: "province" },
              { label: "Region", key: "region" },
            ]}
          />
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
