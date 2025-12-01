import React, { useEffect, useState } from "react";
import axios from "axios";

export default function BarangayView({ barangayId }) {
  const [barangay, setBarangay] = useState(null);
  const [officials, setOfficials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [barangayId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchBarangay(), fetchOfficials()]);
    } catch (err) {
      setError("Failed to load barangay data");
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBarangay = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:5000/api/barangays/get-barangay/${barangayId.trim()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setBarangay(res.data.barangay);
    } catch (err) {
      console.error("Error fetching barangay:", err);
      throw err;
    }
  };

  const fetchOfficials = async () => {
    try {
      const token = localStorage.getItem("token");
      // Fixed: Use consistent URL format
      const res = await axios.get(
        `http://localhost:5000/api/barangays/officials/${barangayId.trim()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // Fixed: Ensure officials is always an array
      setOfficials(
        Array.isArray(res.data?.officials) ? res.data.officials : []
      );
      console.log("Officials loaded:", res.data?.officials);
    } catch (err) {
      console.error("Error fetching officials:", err);
      setOfficials([]);
      throw err;
    }
  };

  const chairman = officials.find(
    (official) =>
      official.position === "Chairman" && official.status === "Active"
  );

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-gray-500">Loading barangay data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* BARANGAY HEADER CARD */}
      <div className="bg-white p-6 shadow rounded-xl w-full">
        <h1 className="text-2xl font-bold">{barangay?.barangayName}</h1>
        <p className="text-gray-600">
          {barangay?.region} • {barangay?.province} • {barangay?.city}
        </p>
      </div>

      {/* GRID: CHAIRMAN + INFO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CHAIRMAN CARD */}
        <div className="bg-white p-5 shadow rounded-xl">
          <h2 className="text-lg font-semibold mb-3">Chairman</h2>
          {chairman ? (
            <div className="text-center">
              {chairman.profileImage && (
                <img
                  src={chairman.profileImage}
                  alt={`${chairman.firstname} ${chairman.lastname}`}
                  className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
                />
              )}
              <h3 className="font-bold">
                {chairman.firstname} {chairman.lastname}
              </h3>
              {chairman.email && (
                <p className="text-gray-500 text-sm">{chairman.email}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">{chairman.position}</p>
            </div>
          ) : (
            <p className="text-gray-500">No active chairman</p>
          )}
        </div>

        {/* BARANGAY INFO */}
        <div className="bg-white p-5 shadow rounded-xl md:col-span-2">
          <h2 className="text-lg font-semibold mb-3">Barangay Information</h2>
          <div className="space-y-2">
            <p>
              <strong>Region:</strong> {barangay?.region || "N/A"}
            </p>
            <p>
              <strong>Province:</strong> {barangay?.province || "N/A"}
            </p>
            <p>
              <strong>City:</strong> {barangay?.city || "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* OFFICIALS TABLE */}
      <SectionTable
        title="Officials"
        data={officials}
        columns={["firstname", "lastname", "position", "status"]}
      />
    </div>
  );
}

/* REUSABLE TABLE SECTION */
function SectionTable({ title, data = [], columns }) {
  return (
    <div className="bg-white p-6 shadow rounded-xl">
      <h2 className="text-xl font-bold mb-4">{title}</h2>

      <div className="overflow-auto max-h-64 border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              {columns.map((col) => (
                <th key={col} className="p-3 text-left capitalize">
                  {col.replace(/([A-Z])/g, " $1")}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  className="p-4 text-gray-500 text-center"
                  colSpan={columns.length}
                >
                  No data found
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={item._id || index}
                  className="border-b hover:bg-gray-50 transition"
                >
                  {columns.map((col) => (
                    <td key={col} className="p-3">
                      {typeof item[col] === "object"
                        ? item[col]?.firstname ||
                          item[col]?.documentName ||
                          "N/A"
                        : item[col] || "N/A"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
