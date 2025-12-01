import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../../layout/Layout";

const Profiles = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    username: "",
    password: "",
    email: "",
    role: "Official",
    position: "",
    barangay: "",
  });

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/users/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data.users || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      alert("Failed to fetch users. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const officials = users.filter((u) => u.role === "Official");
  const youths = users.filter((u) => u.role === "Youth");

  const handleToggleStatus = async (official) => {
    const newStatus = official.status === "Active" ? "Inactive" : "Active";
    if (!window.confirm(`Change status to ${newStatus}?`)) return;
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/admins/status-official/${official._id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers((prev) =>
        prev.map((u) =>
          u._id === official._id ? { ...u, status: newStatus } : u
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      alert("Username and password are required");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/users/signup",
        {
          firstname: form.firstname,
          lastname: form.lastname,
          username: form.username,
          password: form.password,
          email: form.email,
          role: form.role,
          position: form.position,
          barangay: form.barangay,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message || "User created successfully");
      setForm({
        firstname: "",
        lastname: "",
        username: "",
        password: "",
        email: "",
        role: "Official",
        position: "",
        barangay: "",
      });
      setShowCreateForm(false);
      fetchUsers();
    } catch (error) {
      console.error("Create user failed:", error);
      alert(error.response?.data?.message || "Failed to create user");
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Profiles</h1>

        {/* SK Officials Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">SK Officials</h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {showCreateForm ? "Cancel" : "+ Create User"}
            </button>
          </div>

          {/* Create User Form Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Create New User</h3>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleCreateUser} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      name="firstname"
                      value={form.firstname}
                      onChange={handleFormChange}
                      placeholder="Enter first name"
                      className="w-full p-3 border rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      name="lastname"
                      value={form.lastname}
                      onChange={handleFormChange}
                      placeholder="Enter last name"
                      className="w-full p-3 border rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      name="username"
                      value={form.username}
                      onChange={handleFormChange}
                      placeholder="Enter username"
                      className="w-full p-3 border rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      name="email"
                      value={form.email}
                      onChange={handleFormChange}
                      placeholder="Enter email (optional)"
                      className="w-full p-3 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={handleFormChange}
                      placeholder="Enter password"
                      className="w-full p-3 border rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      name="role"
                      value={form.role}
                      onChange={handleFormChange}
                      className="w-full p-3 border rounded"
                    >
                      <option value="Official">Official</option>
                      <option value="Youth">Youth</option>
                    </select>
                  </div>
                  {form.role === "Official" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Position
                      </label>
                      <select
                        name="position"
                        value={form.position}
                        onChange={handleFormChange}
                        className="w-full p-3 border rounded"
                      >
                        <option value="">Select position</option>
                        <option value="Chairperson">Chairperson</option>
                        <option value="Treasurer">Treasurer</option>
                        <option value="Secretary">Secretary</option>
                        <option value="Kagawad">Kagawad</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Barangay
                    </label>
                    <input
                      name="barangay"
                      value={form.barangay}
                      onChange={handleFormChange}
                      placeholder="Enter barangay"
                      className="w-full p-3 border rounded"
                    />
                  </div>
                  <div className="flex gap-3 pt-6">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="rounded-lg shadow overflow-hidden bg-white">
            <div className="overflow-x-auto overflow-y-auto max-h-[50vh]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Last Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      First Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Barangay
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-4">
                        Loading...
                      </td>
                    </tr>
                  ) : officials.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-4">
                        No officials found.
                      </td>
                    </tr>
                  ) : (
                    officials.map((official) => (
                      <tr
                        key={official._id}
                        className="bg-green-50 hover:bg-green-100"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {official.lastname || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {official.firstname || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {official.position || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {official.barangay || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {official.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {official.email || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              official.status === "Active"
                                ? "bg-green-200 text-green-800"
                                : "bg-red-200 text-red-800"
                            }`}
                          >
                            {official.status || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                          <div className="flex gap-3 justify-center">
                            <button
                              className="text-blue-600 hover:text-blue-800"
                              onClick={() =>
                                alert("Edit not implemented in combined view")
                              }
                            >
                              Edit
                            </button>
                            <button
                              className={`font-medium ${
                                official.status === "Active"
                                  ? "text-red-600 hover:text-red-800"
                                  : "text-green-600 hover:text-green-800"
                              }`}
                              onClick={() => handleToggleStatus(official)}
                            >
                              {official.status === "Active"
                                ? "Deactivate"
                                : "Activate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Youth Profiles Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Youth Profiles</h2>
          </div>

          <div className="bg-white rounded shadow p-4">
            {loading ? (
              <p>Loading...</p>
            ) : youths.length === 0 ? (
              <p>No youth profiles found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {youths.map((u) => (
                  <div
                    key={u._id}
                    className="border rounded-lg p-4 shadow transition duration-300 transform hover:shadow-xl hover:scale-105 cursor-pointer flex flex-col items-center"
                  >
                    <div className="w-24 h-24 bg-gray-200 rounded-full mb-3 flex items-center justify-center">
                      <span className="text-gray-500 text-sm">No Image</span>
                    </div>
                    <h3 className="font-bold text-lg text-center">
                      {u.username}
                    </h3>
                    <p className="text-sm text-gray-600 text-center">
                      {u.email || "No email"}
                    </p>
                    <p className="text-sm mt-1 text-center">
                      <span className="font-semibold">Role:</span> {u.role}
                      {u.position ? ` - ${u.position}` : ""}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 text-center">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profiles;
