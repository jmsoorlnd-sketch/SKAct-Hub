import React, { useEffect, useState } from "react";
import Layout from "../../layout/Layout";
import { useToast } from "../../components/Toast";

const SkPersonnelAdmin = () => {
  const toast = useToast();
  const [barangays, setBarangays] = useState([]);
  const [selectedBarangay, setSelectedBarangay] = useState("");
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
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();

      setBarangays(data.barangays || []);
      if (data.barangays?.length) {
        setSelectedBarangay(data.barangays[0]._id);
        fetchSKPersonnel(data.barangays[0]._id);
      }
    } catch {
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
      const data = await res.json();
      setSkPersonnel(data.skPersonnel);
    } catch {
      toast.error("Failed to load personnel");
    } finally {
      setLoading(false);
    }
  };

  const getBarangayName = () =>
    barangays.find((b) => b._id === selectedBarangay)?.barangayName ||
    "Barangay";

  const DirectoryItem = ({ role, data }) => {
    const name =
      data?.firstName && data?.surname
        ? `${data.surname}, ${data.firstName} ${data.middleName || ""}`
        : "Not Assigned";

    return (
      <div className="flex items-center justify-between py-4 shadow-md-b">
        {/* Left: Role badge + Name */}
        <div className="flex items-center gap-8">
          <span className="px-2 py-1 text-xs font-medium rounded bg-gray-200 text-gray-700">
            {role}
          </span>
          <span className="text-md font-semibold text-gray-900">{name}</span>
        </div>

        {/* Right: Status */}
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            data?.status === "Inactive"
              ? "bg-red-100 text-red-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {data?.status || "Active"}
        </span>
      </div>
    );
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-5">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            SK Personnel Directory
          </h1>
          <p className="text-sm text-gray-600">
            Official directory of Sangguniang Kabataan members
          </p>
        </div>

        {/* Barangay Selector */}
        <div className="bg-white shadow-md rounded-lg p-5 mb-4">
          <label className="text-sm font-medium text-gray-700">
            Select Barangay
          </label>
          <select
            value={selectedBarangay}
            onChange={(e) => {
              setSelectedBarangay(e.target.value);
              fetchSKPersonnel(e.target.value);
            }}
            className="block mt-2 w-full md:w-1/3 px-3 py-2 shadow-md rounded"
          >
            {barangays.map((b) => (
              <option key={b._id} value={b._id}>
                {b.barangayName}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 shadow-md-b-2 shadow-md-gray-800 rounded-full" />
          </div>
        ) : (
          skPersonnel && (
            <>
              {/* Barangay Header */}
              <div className="bg-white shadow-md rounded-lg p-6 mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Barangay {getBarangayName()}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Current SK Officials Directory
                </p>
              </div>

              {/* Officials Directory */}
              <div className="bg-white shadow-md rounded-lg p-6 mb-4">
                <h3 className="text-lg font-semibold mb-4">Key Officials</h3>

                <DirectoryItem role="SK Chairman" data={skPersonnel.chairman} />
                <DirectoryItem
                  role="SK Secretary"
                  data={skPersonnel.secretary}
                />
                <DirectoryItem
                  role="SK Treasurer"
                  data={skPersonnel.treasurer}
                />
              </div>

              {/* Kagawad Directory */}
              <div className="bg-white shadow-md rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">
                  SK Kagawad Members
                </h3>

                {skPersonnel.kagawad?.length ? (
                  skPersonnel.kagawad.map((k) => (
                    <DirectoryItem key={k._id} role="SK Kagawad" data={k} />
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-6">
                    No kagawad assigned
                  </p>
                )}
              </div>
            </>
          )
        )}
      </div>
    </Layout>
  );
};

export default SkPersonnelAdmin;
