import React, { useEffect, useState } from "react";
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

const AdminArchive = () => {
  const toast = useToast();

  // Deleted Users State
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchUsers, setSearchUsers] = useState("");

  // Deleted Barangays State
  const [deletedBarangays, setDeletedBarangays] = useState([]);
  const [loadingBarangays, setLoadingBarangays] = useState(true);
  const [searchBarangays, setSearchBarangays] = useState("");

  // Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch deleted users
  const fetchDeletedUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await axios.get(
        `${API_BASE}/admins/archive/deleted-users`,
        { headers: getAuthHeaders() },
      );
      setDeletedUsers(response.data.users || []);
    } catch (error) {
      console.error("Error fetching deleted users:", error);
      toast.error("Failed to load deleted users");
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch deleted barangays
  const fetchDeletedBarangays = async () => {
    setLoadingBarangays(true);
    try {
      const response = await axios.get(
        `${API_BASE}/barangays/admin/archive/deleted-barangays`,
        { headers: getAuthHeaders() },
      );
      setDeletedBarangays(response.data.barangays || []);
    } catch (error) {
      console.error("Error fetching deleted barangays:", error);
      toast.error("Failed to load deleted barangays");
    } finally {
      setLoadingBarangays(false);
    }
  };

  useEffect(() => {
    fetchDeletedUsers();
    fetchDeletedBarangays();
  }, []);

  // Restore user
  const handleRestoreUser = async (userId) => {
    try {
      await axios.put(
        `${API_BASE}/admins/archive/restore-user/${userId}`,
        {},
        { headers: getAuthHeaders() },
      );
      toast.success("User restored successfully");
      fetchDeletedUsers();
    } catch (error) {
      console.error("Error restoring user:", error);
      toast.error("Failed to restore user");
    }
  };

  // Permanently delete user
  const handlePermanentlyDeleteUser = async (userId) => {
    try {
      await axios.delete(
        `${API_BASE}/admins/archive/permanently-delete-user/${userId}`,
        { headers: getAuthHeaders() },
      );
      toast.success("User permanently deleted");
      fetchDeletedUsers();
    } catch (error) {
      console.error("Error permanently deleting user:", error);
      toast.error("Failed to permanently delete user");
    }
  };

  // Restore barangay
  const handleRestoreBarangay = async (barangayId) => {
    try {
      await axios.put(
        `${API_BASE}/barangays/admin/archive/restore-barangay/${barangayId}`,
        {},
        { headers: getAuthHeaders() },
      );
      toast.success("Barangay and its documents restored successfully");
      fetchDeletedBarangays();
    } catch (error) {
      console.error("Error restoring barangay:", error);
      toast.error("Failed to restore barangay");
    }
  };

  // Permanently delete barangay
  const handlePermanentlyDeleteBarangay = async (barangayId) => {
    try {
      await axios.delete(
        `${API_BASE}/barangays/admin/archive/permanently-delete-barangay/${barangayId}`,
        { headers: getAuthHeaders() },
      );
      toast.success("Barangay permanently deleted");
      fetchDeletedBarangays();
    } catch (error) {
      console.error("Error permanently deleting barangay:", error);
      toast.error("Failed to permanently delete barangay");
    }
  };

  // Confirmation Modal
  const ConfirmationModal = () => {
    if (!showConfirmModal || !confirmAction) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="text-red-600" size={24} />
            <h3 className="text-lg font-bold text-gray-900">Confirm Action</h3>
          </div>
          <p className="text-gray-600 mb-6">{confirmAction.message}</p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowConfirmModal(false);
                setConfirmAction(null);
              }}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                await confirmAction.onConfirm();
                setShowConfirmModal(false);
                setConfirmAction(null);
              }}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
            >
              {confirmAction.confirmText || "Delete"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Filter functions
  const filteredDeletedUsers = deletedUsers.filter(
    (user) =>
      user.username?.toLowerCase().includes(searchUsers.toLowerCase()) ||
      user.firstname?.toLowerCase().includes(searchUsers.toLowerCase()) ||
      user.lastname?.toLowerCase().includes(searchUsers.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchUsers.toLowerCase()),
  );

  const filteredDeletedBarangays = deletedBarangays.filter((barangay) =>
    barangay.barangayName
      ?.toLowerCase()
      .includes(searchBarangays.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Archive</h1>
          <p className="text-gray-600">
            Manage deleted users and barangays. You can restore or permanently
            delete them.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Deleted Users Section */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center gap-2">
              <Users className="text-white" size={24} />
              <h2 className="text-xl font-bold text-white">Deleted Users</h2>
              <span className="ml-auto bg-blue-800 px-3 py-1 rounded-full text-white text-sm font-semibold">
                {deletedUsers.length}
              </span>
            </div>

            <div className="p-6">
              {/* Search */}
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or username..."
                  value={searchUsers}
                  onChange={(e) => setSearchUsers(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {loadingUsers ? (
                <div className="text-center py-8 text-gray-500">
                  Loading deleted users...
                </div>
              ) : filteredDeletedUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No deleted users found
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredDeletedUsers.map((user) => (
                    <div
                      key={user._id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {user.firstname} {user.lastname}
                          </h3>
                          <p className="text-sm text-gray-600">
                            @{user.username}
                          </p>
                          {user.email && (
                            <p className="text-sm text-gray-600">
                              {user.email}
                            </p>
                          )}
                        </div>
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                          {user.role}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">
                        Deleted:{" "}
                        {new Date(user.deletedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRestoreUser(user._id)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-semibold"
                        >
                          <RotateCcw size={16} />
                          Restore
                        </button>
                        <button
                          onClick={() => {
                            setConfirmAction({
                              message: `Are you sure you want to permanently delete ${user.firstname} ${user.lastname}? This action cannot be undone.`,
                              confirmText: "Delete",
                              onConfirm: () =>
                                handlePermanentlyDeleteUser(user._id),
                            });
                            setShowConfirmModal(true);
                          }}
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

          {/* Deleted Barangays Section */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex items-center gap-2">
              <Building2 className="text-white" size={24} />
              <h2 className="text-xl font-bold text-white">
                Deleted Barangays
              </h2>
              <span className="ml-auto bg-purple-800 px-3 py-1 rounded-full text-white text-sm font-semibold">
                {deletedBarangays.length}
              </span>
            </div>

            <div className="p-6">
              {/* Search */}
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search barangay name..."
                  value={searchBarangays}
                  onChange={(e) => setSearchBarangays(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {loadingBarangays ? (
                <div className="text-center py-8 text-gray-500">
                  Loading deleted barangays...
                </div>
              ) : filteredDeletedBarangays.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No deleted barangays found
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredDeletedBarangays.map((barangay) => (
                    <div
                      key={barangay._id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {barangay.barangayName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {barangay.city}, {barangay.province}
                          </p>
                          <p className="text-sm text-gray-600">
                            Region: {barangay.region}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">
                        Deleted:{" "}
                        {new Date(barangay.deletedAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRestoreBarangay(barangay._id)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-semibold"
                        >
                          <RotateCcw size={16} />
                          Restore
                        </button>
                        <button
                          onClick={() => {
                            setConfirmAction({
                              message: `Are you sure you want to permanently delete ${barangay.barangayName} and all its data? This action cannot be undone.`,
                              confirmText: "Delete",
                              onConfirm: () =>
                                handlePermanentlyDeleteBarangay(barangay._id),
                            });
                            setShowConfirmModal(true);
                          }}
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
        </div>
      </div>

      <ConfirmationModal />
    </div>
  );
};

export default AdminArchive;
