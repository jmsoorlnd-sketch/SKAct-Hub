import React, { useEffect } from "react";
import Layout from "../../layout/Layout";
import CreateOfficialModal from "../../components/popforms/AddOfficial";
import { useState } from "react";
import axios from "axios";

const SkOfficial = () => {
  const [officials, setOfficials] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchOfficials = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/admins/getofficials",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setOfficials(res.data);
      } catch (err) {
        console.log(err);
        console.log("Error fetching officials:", err);
      }
    };

    fetchOfficials();
  }, []);
  const handleSoftDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this official?"))
      return;

    try {
      const token = localStorage.getItem("token");

      await axios.delete(
        `http://localhost:5000/api/admins/delete-officials/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setOfficials((prev) => prev.filter((o) => o._id !== id));
      alert("Official removed successfully");
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Failed to delete official");
    }
  };

  return (
    <Layout>
      <div className="bg-gray-200">
        {/* Page Header */}
        <div className="p-2">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              SK Officials Management
            </h1>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              + Add Official
            </button>
            <CreateOfficialModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSubmit={(newOfficial) =>
                setOfficials((prev) => [...prev, newOfficial])
              }
            />
          </div>
        </div>

        {/* Search + Filter */}
        <div className="p-2 rounded-lg mb-6 flex items-center gap-4">
          <input
            type="text"
            placeholder="Search SK officials..."
            className="flex-1 px-4 py-2 border rounded-lg bg-white"
          />

          <select className="px-4 py-2 border rounded-lg bg-white">
            <option value="">Filter by Position</option>
            <option>Chairperson</option>
            <option>Kagawad</option>
            <option>Secretary</option>
            <option>Treasurer</option>
          </select>

          <select className="px-4 py-2 border rounded-lg bg-white">
            <option value="">Barangay</option>
            <option>Brgy. 1</option>
            <option>Brgy. 2</option>
            <option>Brgy. 3</option>
          </select>
        </div>

        {/* Officials Table */}
        <div className="rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
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
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {officials.map((official) => (
                  <tr
                    key={official._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {official.lastname}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {official.firstname}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {official.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {official.barangay}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {official.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {official.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <div className="flex gap-3 justify-center">
                        <button className="text-blue-600 hover:text-blue-800 font-medium">
                          Edit
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800 font-medium"
                          onClick={() => handleSoftDelete(official._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SkOfficial;
