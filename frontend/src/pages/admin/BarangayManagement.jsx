import React, { useEffect, useState } from "react";
import axios from "axios";
import { AlertCircle, Trash2, X } from "lucide-react";

const BarangayManagement = () => {
  const [barangays, setBarangays] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBarangay, setSelectedBarangay] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [user, setUser] = useState(null);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState("");
  const [addingUser, setAddingUser] = useState(false);
  const [showApprovalsModal, setShowApprovalsModal] = useState(false);
  const [approvalMessages, setApprovalMessages] = useState([]);
  const [loadingApprovals, setLoadingApprovals] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [barangayToDelete, setBarangayToDelete] = useState(null);
  const ADMIN_LIMIT = 5;
  const [formData, setFormData] = useState({
    barangayName: "",
    city: "",
    province: "",
    region: "",
  });

  useEffect(() => {
    let u = null;
    try {
      const raw = localStorage.getItem("user");
      if (raw && raw !== "undefined" && raw !== "null") u = JSON.parse(raw);
    } catch (err) {
      u = null;
    }
    setUser(u);
    fetchBarangays(u);
  }, []);

  const fetchBarangays = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${window.API_BASE}/barangays/all-barangays`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setBarangays(res.data.barangays || []);
    } catch (error) {
      console.error("Error fetching barangays:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersInBarangay = async (barangayId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${window.API_BASE}/barangays/${barangayId}/users`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setUsers(res.data.users || []);
      setSelectedBarangay(barangayId);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchAvailableUsers = async (barangayId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${window.API_BASE}/barangays/${barangayId}/available-users`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setAvailableUsers(res.data.users || []);
    } catch (error) {
      console.error("Error fetching available users:", error);
      setAvailableUsers([]);
    }
  };

  const handleAddUserToBarangay = async (e) => {
    e.preventDefault();
    if (!selectedUserToAdd) {
      alert("Please select a user");
      return;
    }

    setAddingUser(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${window.API_BASE}/barangays/${selectedBarangay}/add-user`,
        { userId: selectedUserToAdd },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      alert("User added successfully!");
      setSelectedUserToAdd("");
      setShowAddUserModal(false);
      await fetchUsersInBarangay(selectedBarangay);
    } catch (error) {
      console.error("Error adding user:", error);
      alert(error?.response?.data?.message || "Failed to add user");
    } finally {
      setAddingUser(false);
    }
  };

  const handleRemoveUserFromBarangay = async (userId) => {
    if (!window.confirm("Remove this user from the barangay?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${window.API_BASE}/barangays/${selectedBarangay}/remove-user`,
        { userId },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      alert("User removed successfully!");
      await fetchUsersInBarangay(selectedBarangay);
    } catch (error) {
      console.error("Error removing user:", error);
      alert("Failed to remove user");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateBarangay = async (e) => {
    e.preventDefault();
    // client-side guard: admins can only create up to ADMIN_LIMIT barangays
    if (user?.role === "Admin") {
      const createdCount = barangays.filter(
        (b) => String(b.chairmanId) === String(user._id),
      ).length;
      if (createdCount >= ADMIN_LIMIT) {
        return alert(
          `Creation limit reached. Each admin can create up to ${ADMIN_LIMIT} barangays.`,
        );
      }
    }
    try {
      const token = localStorage.getItem("token");
      // Ensure payload matches backend expected field names
      const payload = {
        barangayName: formData.barangayName || formData.barangay,
        city: formData.city,
        province: formData.province,
        region: formData.region,
      };

      await axios.post(
        `${window.API_BASE}/barangays/add-barangay`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      alert("Barangay created successfully!");
      setFormData({ barangayName: "", city: "", province: "", region: "" });
      setShowForm(false);
      fetchBarangays();
    } catch (error) {
      console.error("Error creating barangay:", error);
      const serverMsg = error?.response?.data?.message;
      if (serverMsg) alert(serverMsg);
      else alert("Failed to create barangay.");
    }
  };

  const handleDeleteBarangay = (barangayId) => {
    const barangay = barangays.find((b) => b._id === barangayId);
    if (barangay) {
      setBarangayToDelete(barangay);
      setShowDeleteConfirmModal(true);
    }
  };

  const handleConfirmDeleteBarangay = async () => {
    if (!barangayToDelete) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${window.API_BASE}/barangays/${barangayToDelete._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      alert("Barangay deleted successfully!");
      fetchBarangays();
      setSelectedBarangay(null);
      setUsers([]);
      setShowDeleteConfirmModal(false);
      setBarangayToDelete(null);
    } catch (error) {
      console.error("Error deleting barangay:", error);
      alert("Failed to delete barangay.");
    }
  };

  const fetchApprovalMessages = async () => {
    setLoadingApprovals(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${window.API_BASE}/messages/inbox`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const pendingMessages = res.data.messages.filter(
        (msg) =>
          msg.sender?.role === "Official" &&
          !msg.isAdminScheduled &&
          msg.status === "pending",
      );
      setApprovalMessages(pendingMessages);
    } catch (error) {
      console.error("Failed to fetch approval messages:", error);
      alert("Failed to load approval messages");
    } finally {
      setLoadingApprovals(false);
    }
  };

  const handleShowApprovals = async () => {
    setShowApprovalsModal(true);
    await fetchApprovalMessages();
  };

  const handleApproveMessage = async (messageId) => {
    if (!window.confirm("Approve this message?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${window.API_BASE}/messages/admin/approve`,
        { messageId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Message approved and stored to barangay!");
      await fetchApprovalMessages();
      setSelectedApproval(null);
    } catch (error) {
      console.error("Approve failed:", error);
      const errorMsg =
        error?.response?.data?.message || "Failed to approve message";
      alert(errorMsg);
    }
  };

  const handleRejectMessage = async (messageId) => {
    if (!window.confirm("Reject this message?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${window.API_BASE}/messages/admin/reject`,
        { messageId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Message rejected and returned to the official");
      await fetchApprovalMessages();
      setSelectedApproval(null);
    } catch (error) {
      console.error("Reject failed:", error);
      alert("Failed to reject message");
    }
  };

  /* -------- Delete Confirmation Modal -------- */
  const DeleteConfirmationModal = () => {
    if (!showDeleteConfirmModal || !barangayToDelete) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
          {/* Header */}
          <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="bg-red-100 p-2.5 rounded-lg">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Barangay
                </h3>
                <p className="text-xs text-red-600 font-medium mt-0.5">
                  Permanent action
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowDeleteConfirmModal(false);
                setBarangayToDelete(null);
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-100">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Are you sure?</span> You are
                about to permanently delete:
              </p>
              <div className="mt-3 space-y-1.5 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">Barangay:</span>
                  <span className="text-gray-600">
                    {barangayToDelete.barangayName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">City:</span>
                  <span className="text-gray-600">{barangayToDelete.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">Province:</span>
                  <span className="text-gray-600">
                    {barangayToDelete.province}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800">
                <span className="font-semibold">⚠️ Warning:</span> This action
                cannot be undone. All associated data will be permanently
                deleted.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type "{barangayToDelete.barangayName}" to confirm deletion:
              </label>
              <input
                type="text"
                id="confirmText"
                placeholder={barangayToDelete.barangayName}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex gap-3">
            <button
              onClick={() => {
                setShowDeleteConfirmModal(false);
                setBarangayToDelete(null);
              }}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                const confirmText =
                  document.getElementById("confirmText").value;
                if (confirmText === barangayToDelete.barangayName) {
                  handleConfirmDeleteBarangay();
                } else {
                  alert(
                    `Please type "${barangayToDelete.barangayName}" exactly to confirm deletion.`,
                  );
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Barangay Management</h1>
        <div className="flex gap-3">
          <button
            onClick={handleShowApprovals}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            To Approved
          </button>
          {(() => {
            // Calculate how many barangays this admin has created
            const adminBarangayCount = barangays.filter(
              (b) => String(b.chairmanId) === String(user?._id),
            ).length;
            const hasReachedLimit = adminBarangayCount >= ADMIN_LIMIT;

            return hasReachedLimit ? (
              <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-medium">
                Limit reached (5/5 barangays)
              </div>
            ) : (
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                {showForm ? "Cancel" : "+ Add Barangay"}
              </button>
            );
          })()}
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Create New Barangay</h2>
          <form
            className="grid grid-cols-2 gap-4"
            onSubmit={handleCreateBarangay}
          >
            <input
              type="text"
              name="barangayName"
              placeholder="Barangay Name"
              value={formData.barangayName}
              onChange={handleChange}
              required
              className="border border-gray-300 rounded px-3 py-2"
            />
            <input
              type="text"
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={handleChange}
              required
              className="border border-gray-300 rounded px-3 py-2"
            />
            <input
              type="text"
              name="province"
              placeholder="Province"
              value={formData.province}
              onChange={handleChange}
              required
              className="border border-gray-300 rounded px-3 py-2"
            />
            <input
              type="text"
              name="region"
              placeholder="Region"
              value={formData.region}
              onChange={handleChange}
              required
              className="border border-gray-300 rounded px-3 py-2"
            />
            <button
              type="submit"
              className="col-span-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded font-medium"
            >
              Create Barangay
            </button>
          </form>
        </div>
      )}

      {/* Barangays List - Folder Design */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Barangays</h2>
        {loading ? (
          <p className="text-gray-600">Loading...</p>
        ) : barangays.length === 0 ? (
          <p className="text-gray-600">No barangays yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {barangays.map((b) => (
              <div
                key={b._id}
                className="group relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg overflow-hidden hover:shadow-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-200 transform hover:scale-[1.02] hover:z-10 cursor-pointer"
              >
                {/* Folder Tab */}
                <div className="absolute top-0 left-0 w-32 h-8 bg-gradient-to-r from-blue-400 to-blue-500 rounded-br-lg"></div>

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteBarangay(b._id)}
                  className="absolute top-2 right-2 text-white hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 z-10"
                  title="Delete barangay"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {/* Content */}
                <div className="p-6 pt-8">
                  <div className="flex items-center gap-2 mb-3">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm4 2a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H7a1 1 0 01-1-1V8z"></path>
                    </svg>
                    <h3 className="text-lg font-bold text-gray-800">
                      {b.barangayName || b.barangay || b.name}
                    </h3>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    {b.city}, {b.province}
                  </p>

                  <p className="text-xs text-gray-500 mb-4">
                    <span className="font-semibold">Region:</span> {b.region}
                  </p>

                  <button
                    onClick={() => {
                      fetchUsersInBarangay(b._id);
                      setShowUsersModal(true);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded font-medium text-sm transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10.5 1.5H2.75C1.784 1.5 1 2.284 1 3.25v13.5C1 17.716 1.784 18.5 2.75 18.5h14.5c.966 0 1.75-.784 1.75-1.75V9.5M10.5 1.5v8h8M10.5 1.5L18.5 9.5"></path>
                    </svg>
                    View Users
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Users Modal */}
      {showUsersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Users in Selected Barangay</h2>
              <button
                onClick={() => setShowUsersModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Add User Section */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="text-sm font-bold mb-3">Add User to Barangay</h3>
              <div className="flex gap-2">
                <select
                  value={selectedUserToAdd}
                  onChange={(e) => setSelectedUserToAdd(e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a user...</option>
                  {availableUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.firstname} {u.lastname} ({u.username})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    setShowAddUserModal(true);
                    fetchAvailableUsers(selectedBarangay);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Users Table */}
            {users.length === 0 ? (
              <p className="text-gray-600">No users in this barangay.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2 text-left">Username</th>
                    <th className="border p-2 text-left">First Name</th>
                    <th className="border p-2 text-left">Last Name</th>
                    <th className="border p-2 text-left">Role</th>
                    <th className="border p-2 text-left">Position</th>
                    <th className="border p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="border">
                      <td className="border p-2">{u.username}</td>
                      <td className="border p-2">{u.firstname}</td>
                      <td className="border p-2">{u.lastname}</td>
                      <td className="border p-2">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
                          {u.role}
                        </span>
                      </td>
                      <td className="border p-2">{u.position || "—"}</td>
                      <td className="border p-2">
                        <button
                          onClick={() => handleRemoveUserFromBarangay(u._id)}
                          className="text-red-600 hover:text-red-800 font-medium text-sm"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowUsersModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add User to Barangay</h2>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddUserToBarangay} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Select a user *
                </label>
                <select
                  value={selectedUserToAdd}
                  onChange={(e) => setSelectedUserToAdd(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a user...</option>
                  {availableUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.firstname} {u.lastname} ({u.username})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={addingUser}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  {addingUser ? "Adding..." : "Add User"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approvals Modal */}
      {showApprovalsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Pending Approvals ({approvalMessages.length})
              </h2>
              <button
                onClick={() => setShowApprovalsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {loadingApprovals ? (
              <p className="text-gray-600">Loading approval messages...</p>
            ) : approvalMessages.length === 0 ? (
              <p className="text-gray-600">No pending approvals.</p>
            ) : !selectedApproval ? (
              <div className="space-y-3">
                {approvalMessages.map((msg) => (
                  <div
                    key={msg._id}
                    className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedApproval(msg)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {msg.subject}
                        </h3>
                        <p className="text-sm text-gray-600">
                          From: {msg.sender?.firstname} {msg.sender?.lastname} (
                          {msg.sender?.username})
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(msg.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-sm font-medium">
                        Pending
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">
                    {selectedApproval.subject}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    <strong>From:</strong> {selectedApproval.sender?.firstname}{" "}
                    {selectedApproval.sender?.lastname} (
                    {selectedApproval.sender?.username})
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    <strong>Date:</strong>{" "}
                    {new Date(selectedApproval.createdAt).toLocaleString()}
                  </p>
                  <div className="border-t pt-3">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedApproval.message ||
                        selectedApproval.body ||
                        selectedApproval.content}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setSelectedApproval(null)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-medium"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => handleRejectMessage(selectedApproval._id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApproveMessage(selectedApproval._id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Approve
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal />
    </div>
  );
};

export default BarangayManagement;
