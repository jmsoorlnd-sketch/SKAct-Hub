import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../../layout/Layout";

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
        "http://localhost:5000/api/barangays/all-barangays",
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
        `http://localhost:5000/api/barangays/${barangayId}/users`,
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
        `http://localhost:5000/api/barangays/${barangayId}/available-users`,
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
        `http://localhost:5000/api/barangays/${selectedBarangay}/add-user`,
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
        `http://localhost:5000/api/barangays/${selectedBarangay}/remove-user`,
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
        "http://localhost:5000/api/barangays/add-barangay",
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

  const handleDeleteBarangay = async (barangayId) => {
    if (!window.confirm("Delete this barangay?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/barangays/${barangayId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Barangay deleted successfully!");
      fetchBarangays();
      setSelectedBarangay(null);
      setUsers([]);
    } catch (error) {
      console.error("Error deleting barangay:", error);
      alert("Failed to delete barangay.");
    }
  };

  return (
    <Layout>
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Barangay Management</h1>
          <div className="flex gap-3">
            <button
              onClick={() => (window.location.href = "/admin-dashboard")}
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
                  className="group relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg overflow-hidden hover:shadow-lg hover:from-blue-100 hover:to-blue-150 transition-all duration-300 transform hover:scale-105"
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
                <h2 className="text-xl font-bold">
                  Users in Selected Barangay
                </h2>
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
      </div>
    </Layout>
  );
};

export default BarangayManagement;
