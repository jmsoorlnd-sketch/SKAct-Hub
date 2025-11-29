import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../../layout/Layout";

const BarangayManagement = () => {
  const [barangays, setBarangays] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBarangay, setSelectedBarangay] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    barangay: "",
    city: "",
    province: "",
    region: "",
  });

  useEffect(() => {
    fetchBarangays();
  }, []);

  const fetchBarangays = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/barangays", {
        headers: { Authorization: `Bearer ${token}` },
      });
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
        }
      );
      setUsers(res.data.users || []);
      setSelectedBarangay(barangayId);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateBarangay = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/barangays", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Barangay created successfully!");
      setFormData({ barangay: "", city: "", province: "", region: "" });
      setShowForm(false);
      fetchBarangays();
    } catch (error) {
      console.error("Error creating barangay:", error);
      alert("Failed to create barangay.");
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
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            {showForm ? "Cancel" : "+ Add Barangay"}
          </button>
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
                name="barangay"
                placeholder="Barangay Name"
                value={formData.barangay}
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

        {/* Barangays List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <p>Loading...</p>
          ) : barangays.length === 0 ? (
            <p>No barangays yet.</p>
          ) : (
            barangays.map((b) => (
              <div key={b._id} className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-bold">{b.barangay}</h3>
                <p className="text-sm text-gray-600">
                  {b.city}, {b.province} - {b.region}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => fetchUsersInBarangay(b._id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                  >
                    View Users
                  </button>
                  <button
                    onClick={() => handleDeleteBarangay(b._id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Users in Selected Barangay */}
        {selectedBarangay && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">
              Users in Selected Barangay
            </h2>
            {users.length === 0 ? (
              <p>No users in this barangay.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2 text-left">Username</th>
                    <th className="border p-2 text-left">Name</th>
                    <th className="border p-2 text-left">Role</th>
                    <th className="border p-2 text-left">Position</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="border">
                      <td className="border p-2">{u.username}</td>
                      <td className="border p-2">
                        {u.firstname} {u.lastname}
                      </td>
                      <td className="border p-2">{u.role}</td>
                      <td className="border p-2">{u.position || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BarangayManagement;
