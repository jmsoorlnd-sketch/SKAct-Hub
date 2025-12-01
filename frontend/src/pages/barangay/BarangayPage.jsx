import React, { useEffect, useState } from "react";
import Layout from "../../layout/Layout";
import AddBarangay from "../../components/popforms/barangay/AddBarangay";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const BarangayPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const [barangays, setBarangays] = useState([]);
  const [officials, setOfficials] = useState([]);

  // Fetch barangays
  useEffect(() => {
    const fetchBarangays = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/barangays/all-barangays",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setBarangays(res.data.barangays || []);
      } catch (error) {
        console.error("Failed to fetch barangays:", error);
      }
    };
    fetchBarangays();
  }, []);

  // Fetch officials
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
      } catch (error) {
        console.error("Failed to fetch officials:", error);
      }
    };
    fetchOfficials();
  }, []);

  // Get officials for a specific barangay
  const getBarangayOfficials = (barangayId) => {
    return officials.filter(
      (official) => official.barangay?._id === barangayId
    );
  };

  // Get SK Chairman for a barangay
  const getSkChairman = (barangayId) => {
    const chairman = officials.find(
      (official) =>
        official.barangay?._id === barangayId &&
        official.position === "Chairman" &&
        official.status === "Active"
    );
    return chairman
      ? `${chairman.firstname} ${chairman.lastname}`
      : "Not Assigned";
  };

  // Count SK Officials (excluding Chairman)
  const countSkOfficials = (barangayId) => {
    return officials.filter(
      (official) => official.barangay?._id === barangayId && official.position
    ).length;
  };

  //view barangay
  const handleViewBarangay = (barangayId) => {
    // Redirect to BarangayPage with the barangayId as a query parameter
    navigate(`/barangay-view/ ${barangayId}`);
  };
  return (
    <Layout>
      <div className="bg-gray-200 p-2 h-screen overflow-y-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Barangay Management
          </h1>

          <div className="px-4 py-2 border bg-white rounded-md">
            Total Barangay: {barangays.length}
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + Add Barangay
          </button>
        </div>

        <AddBarangay
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />

        {/* SEARCH + FILTERS */}
        <div className="p-2 rounded-lg mb-6 flex items-center gap-4">
          <input
            type="text"
            placeholder="Search Barangay..."
            className="flex-1 px-4 py-2 border rounded-lg bg-white"
          />
          <select className="px-4 py-2 border rounded-lg bg-white">
            <option value="">Filter by Province</option>
            {[...new Set(barangays.map((b) => b.province))].map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
          <select className="px-4 py-2 border rounded-lg bg-white">
            <option value="">Filter by City</option>
            {[...new Set(barangays.map((b) => b.city))].map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* TABLE */}
        <div className="rounded-lg shadow h-[75vh] overflow-y-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Province
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Region
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  City
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Barangay Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  SK Chairman
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  SK Officials
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {barangays.map((barangay) => (
                <tr key={barangay._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {barangay.province}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {barangay.region}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {barangay.city}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {barangay.barangayName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {getSkChairman(barangay._id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {countSkOfficials(barangay._id)} Officials
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                    <div className="flex gap-3 justify-center">
                      <button className="text-blue-600 hover:text-blue-800 font-medium">
                        Edit
                      </button>
                      <button
                        className="text-blue-600 hover:text-blue-800 font-medium"
                        onClick={() => handleViewBarangay(barangay._id)}
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default BarangayPage;
