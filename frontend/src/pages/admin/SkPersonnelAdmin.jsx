import React, { useState, useEffect } from "react";
import Layout from "../../layout/Layout";
import { useToast } from "../../components/Toast";

const SkPersonnelAdmin = () => {
  const toast = useToast();
  const [barangays, setBarangays] = useState([]);
  const [selectedBarangay, setSelectedBarangay] = useState(null);
  const [skPersonnel, setSkPersonnel] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBarangays();
  }, []);

  const fetchBarangays = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        "http://localhost:5000/api/barangays/all-barangays",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setBarangays(data.barangays || []);
        // Select first barangay by default
        if (data.barangays && data.barangays.length > 0) {
          setSelectedBarangay(data.barangays[0]._id);
          fetchSKPersonnel(data.barangays[0]._id);
        }
      }
    } catch (error) {
      console.error("Error fetching barangays:", error);
      toast.error("Failed to fetch barangays");
    }
  };

  const fetchSKPersonnel = async (barangayId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/sk-personnel/${barangayId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setSkPersonnel(data.skPersonnel);
      } else {
        toast.error("Failed to fetch SK Personnel");
      }
    } catch (error) {
      console.error("Error fetching SK Personnel:", error);
      toast.error("Failed to fetch SK Personnel data");
    } finally {
      setLoading(false);
    }
  };

  const handleBarangayChange = (e) => {
    const barangayId = e.target.value;
    setSelectedBarangay(barangayId);
    fetchSKPersonnel(barangayId);
  };

  const getBarangayName = (barangayId) => {
    const barangay = barangays.find((b) => b._id === barangayId);
    return barangay?.barangayName || "Unknown Barangay";
  };

  const PersonCard = ({ title, data, color }) => {
    const fullName =
      data?.firstName && data?.surname
        ? `${data.surname}, ${data.firstName} ${data.middleName || ""}`
        : "Not assigned";

    return (
      <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${color}`}>
        <h3
          className={`text-lg font-bold mb-4 ${color.replace("border", "text")}`}
        >
          {title}
        </h3>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            <strong>Name:</strong> {fullName}
          </p>
          {data?.age && (
            <p className="text-sm text-gray-600">
              <strong>Age:</strong> {data.age}
            </p>
          )}
          <p className="text-sm">
            <strong>Status:</strong>{" "}
            <span
              className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                data?.status === "Active"
                  ? "bg-green-200 text-green-800"
                  : "bg-red-200 text-red-800"
              }`}
            >
              {data?.status || "Active"}
            </span>
          </p>
        </div>
      </div>
    );
  };

  if (loading && !skPersonnel) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            SK Personnel View
          </h1>
          <p className="text-gray-600">
            View SK officials and kagawad members for each barangay
          </p>
        </div>

        {/* Barangay Selector */}
        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Barangay
          </label>
          <select
            value={selectedBarangay || ""}
            onChange={handleBarangayChange}
            className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select a Barangay --</option>
            {barangays.map((barangay) => (
              <option key={barangay._id} value={barangay._id}>
                {barangay.barangayName}
              </option>
            ))}
          </select>
        </div>

        {selectedBarangay && skPersonnel && (
          <>
            {/* Barangay Header */}
            <div className="mb-8 bg-blue-50 border-l-4 border-blue-500 rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-blue-900">
                {getBarangayName(selectedBarangay)}
              </h2>
              <p className="text-blue-700 mt-2">SK Personnel Information</p>
            </div>

            {/* SK Officials */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <PersonCard
                title="SK Chairman"
                data={skPersonnel.chairman}
                color="border-blue-500"
              />
              <PersonCard
                title="SK Secretary"
                data={skPersonnel.secretary}
                color="border-purple-500"
              />
              <PersonCard
                title="SK Treasurer"
                data={skPersonnel.treasurer}
                color="border-green-500"
              />
            </div>

            {/* SK Kagawad */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-6 text-gray-800">
                SK Kagawad Members
              </h3>

              {skPersonnel.kagawad && skPersonnel.kagawad.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {skPersonnel.kagawad.map((kagawad) => {
                    const fullName =
                      kagawad?.firstName && kagawad?.surname
                        ? `${kagawad.surname}, ${kagawad.firstName} ${
                            kagawad.middleName || ""
                          }`
                        : "Unknown";

                    return (
                      <div
                        key={kagawad._id}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                      >
                        <p className="font-semibold text-gray-800 mb-2">
                          {fullName}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Age:</strong> {kagawad.age}
                        </p>
                        <p className="text-sm mt-2">
                          <strong>Status:</strong>{" "}
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                              kagawad.status === "Active"
                                ? "bg-green-200 text-green-800"
                                : "bg-red-200 text-red-800"
                            }`}
                          >
                            {kagawad.status || "Active"}
                          </span>
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No kagawad members assigned yet
                </p>
              )}
            </div>
          </>
        )}

        {!selectedBarangay && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-800">
              Please select a barangay to view SK personnel information
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SkPersonnelAdmin;
