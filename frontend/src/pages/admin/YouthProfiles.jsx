import React, { useState, useEffect } from "react";
import axios from "axios";
import Layout from "../../layout/Layout";

const YouthProfiles = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    role: "Youth",
    position: "",
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password)
      return alert("Username and password are required");
    try {
      const res = await axios.post("http://localhost:5000/api/users/signup", {
        username: form.username,
        password: form.password,
        email: form.email,
        role: form.role,
        position: form.position,
      });
      alert(res.data.message || "User created");
      setForm({
        username: "",
        password: "",
        email: "",
        role: "Youth",
        position: "",
      });
      fetchUsers();
    } catch (error) {
      console.error("Create user failed:", error);
      alert(error.response?.data?.message || "Create failed");
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Youth Profiles</h1>

        {/* Create User Form */}
        <div className="mb-6 bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Create Youth Account</h2>
          <form
            className="grid grid-cols-1 gap-3 sm:grid-cols-3"
            onSubmit={handleCreate}
          >
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Username"
              className="p-2 border rounded"
            />
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="p-2 border rounded"
            >
              <option value="Youth">Youth</option>
              <option value="Official">Official</option>
            </select>
            {form.role === "Official" && (
              <select
                name="position"
                value={form.position}
                onChange={handleChange}
                className="p-2 border rounded"
              >
                <option value="">Select position</option>
                <option value="Chairperson">Chairperson</option>
                <option value="Treasurer">Treasurer</option>
                <option value="Secretary">Secretary</option>
                <option value="Kagawad">Kagawad</option>
              </select>
            )}
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email (optional)"
              className="p-2 border rounded"
            />
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              className="p-2 border rounded"
            />
            <div className="sm:col-span-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded mt-2">
                Create
              </button>
            </div>
          </form>
        </div>

        {/* User Cards */}
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-4">All Users</h2>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {users.map((u) => (
                <div
                  key={u._id}
                  className="border rounded-lg p-4 shadow transition duration-300 transform 
                             hover:shadow-xl hover:scale-105 cursor-pointer flex flex-col items-center"
                >
                  {/* Circular Image Holder */}
                  <div
                    className="w-24 h-24 bg-gray-200 rounded-full mb-3 flex items-center justify-center
                               transition duration-300 transform hover:scale-105"
                  >
                    <span className="text-gray-500 text-sm">No Image</span>
                  </div>

                  {/* User Info */}
                  <h3 className="font-bold text-lg text-center">
                    {u.username}
                  </h3>
                  <p className="text-sm text-gray-600 text-center">
                    {u.email || "No email"}
                  </p>
                  <p className="text-sm mt-1 text-center">
                    <span className="font-semibold">Role:</span> {u.role}{" "}
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
    </Layout>
  );
};

export default YouthProfiles;
