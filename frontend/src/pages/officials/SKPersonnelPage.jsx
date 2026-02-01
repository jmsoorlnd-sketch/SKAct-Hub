import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../components/Toast";
import Layout from "../../layout/Layout";
import { Trash2, Plus, Edit2 } from "lucide-react";

const SKPersonnelPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [skPersonnel, setSkPersonnel] = useState(null);
  const [barangayName, setBarangayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingPosition, setEditingPosition] = useState(null);
  const [editingKagawad, setEditingKagawad] = useState(null);
  const [showAddKagawad, setShowAddKagawad] = useState(false);

  // Form states
  const [chairmanForm, setChairmanForm] = useState({
    surname: "",
    firstName: "",
    middleName: "",
    age: "",
    status: "Active",
  });
  const [vpForm, setVpForm] = useState({
    surname: "",
    firstName: "",
    middleName: "",
    age: "",
    status: "Active",
  });
  const [secretaryForm, setSecretaryForm] = useState({
    surname: "",
    firstName: "",
    middleName: "",
    age: "",
    status: "Active",
  });
  const [kagawadForm, setKagawadForm] = useState({
    surname: "",
    firstName: "",
    middleName: "",
    age: "",
    status: "Active",
  });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser || storedUser.role !== "Official") {
      navigate("/");
      return;
    }

    setUser(storedUser);

    // Try to get barangay ID from stored user, or fetch full user profile
    if (storedUser.barangay) {
      const barangayId = storedUser.barangay?._id || storedUser.barangay;
      if (barangayId) {
        fetchBarangayName(barangayId);
        fetchSKPersonnel(barangayId);
      } else {
        fetchUserProfile(storedUser._id);
      }
    } else {
      // Fetch full user profile from API to get barangay
      fetchUserProfile(storedUser._id);
    }
  }, [navigate]);

  const fetchUserProfile = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const responseData = await response.json();
        const userData = responseData.user || responseData;
        if (userData.barangay || userData.barangay?._id) {
          const barangayId = userData.barangay?._id || userData.barangay;
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
          fetchBarangayName(barangayId);
          fetchSKPersonnel(barangayId);
        } else {
          toast.error("User is not assigned to a barangay");
          setLoading(false);
        }
      } else {
        toast.error("Failed to fetch user profile");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error("Failed to fetch user profile");
      setLoading(false);
    }
  };

  const fetchBarangayName = async (barangayId) => {
    if (!barangayId || typeof barangayId !== "string") {
      console.error("Invalid barangay ID:", barangayId);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/barangays/get-barangay/${barangayId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setBarangayName(data.barangayName || data.name || "");
      } else if (response.status !== 404) {
        console.error("Failed to fetch barangay name:", response.status);
      }
    } catch (error) {
      console.error("Error fetching barangay name:", error);
    }
  };

  const fetchSKPersonnel = async (barangayId) => {
    // Normalize barangay ID - handle both string and object formats
    const normalizedId = barangayId?._id || barangayId;

    if (!normalizedId || typeof normalizedId !== "string") {
      console.error("Invalid barangayId provided:", barangayId);
      setLoading(false);
      return;
    }

    console.log("Fetching SK Personnel for barangayId:", normalizedId);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/sk-personnel/${normalizedId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(
          "API Error:",
          response.status,
          response.statusText,
          errorData,
        );
        toast.error(
          errorData.message ||
            `Failed to fetch SK Personnel: ${response.status}`,
        );
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log("SK Personnel data received:", data.skPersonnel);
      if (data.skPersonnel) {
        setSkPersonnel(data.skPersonnel);
        // Populate form fields
        if (
          data.skPersonnel.chairman?.firstName ||
          data.skPersonnel.chairman?.surname
        ) {
          console.log("Setting chairman form with:", data.skPersonnel.chairman);
          setChairmanForm({
            surname: data.skPersonnel.chairman.surname || "",
            firstName: data.skPersonnel.chairman.firstName || "",
            middleName: data.skPersonnel.chairman.middleName || "",
            age: data.skPersonnel.chairman.age || "",
            status: data.skPersonnel.chairman.status || "Active",
          });
        }
        // Handle secretary position
        const secretaryData = data.skPersonnel.secretary;
        if (secretaryData?.firstName || secretaryData?.surname) {
          console.log("Setting secretary form with:", secretaryData);
          setVpForm({
            surname: secretaryData.surname || "",
            firstName: secretaryData.firstName || "",
            middleName: secretaryData.middleName || "",
            age: secretaryData.age || "",
            status: secretaryData.status || "Active",
          });
        }
        // Handle treasurer position
        const treasurerData = data.skPersonnel.treasurer;
        if (treasurerData?.firstName || treasurerData?.surname) {
          console.log("Setting treasurer form with:", treasurerData);
          setSecretaryForm({
            surname: treasurerData.surname || "",
            firstName: treasurerData.firstName || "",
            middleName: treasurerData.middleName || "",
            age: treasurerData.age || "",
            status: treasurerData.status || "Active",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching SK Personnel:", error);
      toast.error("Failed to fetch SK Personnel data");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePosition = async (position, formData) => {
    if (!user || !user.barangay) {
      toast.error("User barangay information not available");
      return;
    }

    const barangayId = user.barangay?._id || user.barangay;
    if (!barangayId || typeof barangayId !== "string") {
      toast.error("Invalid barangay ID");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      let endpoint = "";
      if (position === "chairman") endpoint = "chairman";
      else if (position === "vicePresident") endpoint = "secretary";
      else if (position === "secretary") endpoint = "treasurer";

      const response = await fetch(
        `/api/sk-personnel/${barangayId}/${endpoint}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            surname: formData.surname,
            firstName: formData.firstName,
            middleName: formData.middleName,
            age: parseInt(formData.age),
            status: formData.status,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || "Failed to update");
        return;
      }

      const data = await response.json();
      setSkPersonnel(data.skPersonnel);
      setEditingPosition(null);
      toast.success(`${position} updated successfully`);
    } catch (error) {
      console.error("Error updating position:", error);
      toast.error("Failed to update position");
    }
  };

  const handleAddKagawad = async () => {
    if (!user || !user.barangay) {
      toast.error("User barangay information not available");
      return;
    }

    const barangayId = user.barangay?._id || user.barangay;
    if (!barangayId || typeof barangayId !== "string") {
      toast.error("Invalid barangay ID");
      return;
    }

    if (!kagawadForm.firstName || !kagawadForm.surname || !kagawadForm.age) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/sk-personnel/${barangayId}/kagawad`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          surname: kagawadForm.surname,
          firstName: kagawadForm.firstName,
          middleName: kagawadForm.middleName,
          age: parseInt(kagawadForm.age),
          status: kagawadForm.status,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || "Failed to add kagawad");
        return;
      }

      const data = await response.json();
      setSkPersonnel(data.skPersonnel);
      setKagawadForm({
        surname: "",
        firstName: "",
        middleName: "",
        age: "",
        status: "Active",
      });
      setShowAddKagawad(false);
      toast.success("Kagawad added successfully");
    } catch (error) {
      console.error("Error adding kagawad:", error);
      toast.error("Failed to add kagawad");
    }
  };

  const handleUpdateKagawad = async (kagawadId, updatedData) => {
    if (!user || !user.barangay) {
      toast.error("User barangay information not available");
      return;
    }

    const barangayId = user.barangay?._id || user.barangay;
    if (!barangayId || typeof barangayId !== "string") {
      toast.error("Invalid barangay ID");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/sk-personnel/${barangayId}/kagawad/${kagawadId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedData),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || "Failed to update kagawad");
        return;
      }

      const data = await response.json();
      setSkPersonnel(data.skPersonnel);
      setEditingKagawad(null);
      toast.success("Kagawad updated successfully");
    } catch (error) {
      console.error("Error updating kagawad:", error);
      toast.error("Failed to update kagawad");
    }
  };

  const handleDeleteKagawad = async (kagawadId) => {
    if (!user || !user.barangay) {
      toast.error("User barangay information not available");
      return;
    }

    const barangayId = user.barangay?._id || user.barangay;
    if (!barangayId || typeof barangayId !== "string") {
      toast.error("Invalid barangay ID");
      return;
    }

    if (window.confirm("Are you sure you want to delete this kagawad?")) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `/api/sk-personnel/${barangayId}/kagawad/${kagawadId}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!response.ok) {
          const error = await response.json();
          toast.error(error.message || "Failed to delete kagawad");
          return;
        }

        const data = await response.json();
        setSkPersonnel(data.skPersonnel);
        toast.success("Kagawad deleted successfully");
      } catch (error) {
        console.error("Error deleting kagawad:", error);
        toast.error("Failed to delete kagawad");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            SK Personnel Management
          </h1>
          {barangayName && (
            <p className="text-lg text-gray-600 mt-2">
              Barangay:{" "}
              <span className="font-semibold text-blue-600">
                {barangayName}
              </span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Chairman */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <h2 className="text-xl font-bold mb-4 text-blue-600">
              SK Chairman
            </h2>
            {editingPosition === "chairman" ? (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Surname"
                  value={chairmanForm.surname}
                  onChange={(e) =>
                    setChairmanForm({
                      ...chairmanForm,
                      surname: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="First Name"
                  value={chairmanForm.firstName}
                  onChange={(e) =>
                    setChairmanForm({
                      ...chairmanForm,
                      firstName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="Middle Name (Optional)"
                  value={chairmanForm.middleName}
                  onChange={(e) =>
                    setChairmanForm({
                      ...chairmanForm,
                      middleName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
                <input
                  type="number"
                  placeholder="Age"
                  value={chairmanForm.age}
                  onChange={(e) =>
                    setChairmanForm({ ...chairmanForm, age: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
                <select
                  value={chairmanForm.status}
                  onChange={(e) =>
                    setChairmanForm({ ...chairmanForm, status: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleUpdatePosition("chairman", chairmanForm)
                    }
                    className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingPosition(null)}
                    className="flex-1 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-lg font-semibold">
                  {chairmanForm.firstName && chairmanForm.surname ? (
                    <>
                      {chairmanForm.surname}, {chairmanForm.firstName}{" "}
                      {chairmanForm.middleName && `${chairmanForm.middleName}`}
                    </>
                  ) : (
                    "Not assigned"
                  )}
                </p>
                {chairmanForm.firstName && (
                  <>
                    <p className="text-sm text-gray-600">
                      Age: {chairmanForm.age}
                    </p>
                    <p
                      className={`text-sm font-medium ${chairmanForm.status === "Active" ? "text-green-600" : "text-red-600"}`}
                    >
                      {chairmanForm.status}
                    </p>
                  </>
                )}
                <button
                  onClick={() => setEditingPosition("chairman")}
                  className="mt-4 flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  <Edit2 size={16} /> Edit
                </button>
              </div>
            )}
          </div>

          {/* Secretary */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <h2 className="text-xl font-bold mb-4 text-purple-600">
              SK Secretary
            </h2>
            {editingPosition === "vicePresident" ? (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Surname"
                  value={vpForm.surname}
                  onChange={(e) =>
                    setVpForm({ ...vpForm, surname: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="First Name"
                  value={vpForm.firstName}
                  onChange={(e) =>
                    setVpForm({ ...vpForm, firstName: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="Middle Name (Optional)"
                  value={vpForm.middleName}
                  onChange={(e) =>
                    setVpForm({ ...vpForm, middleName: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
                <input
                  type="number"
                  placeholder="Age"
                  value={vpForm.age}
                  onChange={(e) =>
                    setVpForm({ ...vpForm, age: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
                <select
                  value={vpForm.status}
                  onChange={(e) =>
                    setVpForm({ ...vpForm, status: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleUpdatePosition("vicePresident", vpForm)
                    }
                    className="flex-1 bg-purple-500 text-white py-2 rounded hover:bg-purple-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingPosition(null)}
                    className="flex-1 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-lg font-semibold">
                  {vpForm.firstName && vpForm.surname ? (
                    <>
                      {vpForm.surname}, {vpForm.firstName}{" "}
                      {vpForm.middleName && `${vpForm.middleName}`}
                    </>
                  ) : (
                    "Not assigned"
                  )}
                </p>
                {vpForm.firstName && (
                  <>
                    <p className="text-sm text-gray-600">Age: {vpForm.age}</p>
                    <p
                      className={`text-sm font-medium ${vpForm.status === "Active" ? "text-green-600" : "text-red-600"}`}
                    >
                      {vpForm.status}
                    </p>
                  </>
                )}
                <button
                  onClick={() => setEditingPosition("vicePresident")}
                  className="mt-4 flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                >
                  <Edit2 size={16} /> Edit
                </button>
              </div>
            )}
          </div>

          {/* Treasurer */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <h2 className="text-xl font-bold mb-4 text-green-600">
              SK Treasurer
            </h2>
            {editingPosition === "secretary" ? (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Surname"
                  value={secretaryForm.surname}
                  onChange={(e) =>
                    setSecretaryForm({
                      ...secretaryForm,
                      surname: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="First Name"
                  value={secretaryForm.firstName}
                  onChange={(e) =>
                    setSecretaryForm({
                      ...secretaryForm,
                      firstName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="Middle Name (Optional)"
                  value={secretaryForm.middleName}
                  onChange={(e) =>
                    setSecretaryForm({
                      ...secretaryForm,
                      middleName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
                <input
                  type="number"
                  placeholder="Age"
                  value={secretaryForm.age}
                  onChange={(e) =>
                    setSecretaryForm({ ...secretaryForm, age: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
                <select
                  value={secretaryForm.status}
                  onChange={(e) =>
                    setSecretaryForm({
                      ...secretaryForm,
                      status: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleUpdatePosition("secretary", secretaryForm)
                    }
                    className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingPosition(null)}
                    className="flex-1 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-lg font-semibold">
                  {secretaryForm.firstName && secretaryForm.surname ? (
                    <>
                      {secretaryForm.surname}, {secretaryForm.firstName}{" "}
                      {secretaryForm.middleName &&
                        `${secretaryForm.middleName}`}
                    </>
                  ) : (
                    "Not assigned"
                  )}
                </p>
                {secretaryForm.firstName && (
                  <>
                    <p className="text-sm text-gray-600">
                      Age: {secretaryForm.age}
                    </p>
                    <p
                      className={`text-sm font-medium ${secretaryForm.status === "Active" ? "text-green-600" : "text-red-600"}`}
                    >
                      {secretaryForm.status}
                    </p>
                  </>
                )}
                <button
                  onClick={() => setEditingPosition("secretary")}
                  className="mt-4 flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  <Edit2 size={16} /> Edit
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SK Kagawad Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">SK Kagawad</h2>
            {!showAddKagawad && (
              <button
                onClick={() => setShowAddKagawad(true)}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                <Plus size={20} /> Add Kagawad
              </button>
            )}
          </div>

          {showAddKagawad && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-blue-200">
              <h3 className="text-lg font-semibold mb-3">Add New Kagawad</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Surname"
                  value={kagawadForm.surname}
                  onChange={(e) =>
                    setKagawadForm({ ...kagawadForm, surname: e.target.value })
                  }
                  className="px-3 py-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="First Name"
                  value={kagawadForm.firstName}
                  onChange={(e) =>
                    setKagawadForm({
                      ...kagawadForm,
                      firstName: e.target.value,
                    })
                  }
                  className="px-3 py-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="Middle Name"
                  value={kagawadForm.middleName}
                  onChange={(e) =>
                    setKagawadForm({
                      ...kagawadForm,
                      middleName: e.target.value,
                    })
                  }
                  className="px-3 py-2 border rounded-md"
                />
                <input
                  type="number"
                  placeholder="Age"
                  value={kagawadForm.age}
                  onChange={(e) =>
                    setKagawadForm({ ...kagawadForm, age: e.target.value })
                  }
                  className="px-3 py-2 border rounded-md"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <select
                  value={kagawadForm.status}
                  onChange={(e) =>
                    setKagawadForm({ ...kagawadForm, status: e.target.value })
                  }
                  className="px-3 py-2 border rounded-md"
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddKagawad}
                  className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddKagawad(false)}
                  className="bg-gray-300 text-gray-800 px-6 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Kagawad List */}
          {skPersonnel?.kagawad && skPersonnel.kagawad.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="px-4 py-3 text-left font-semibold">Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Age</th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {skPersonnel.kagawad.map((k) => (
                    <tr key={k._id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{k.name}</td>
                      <td className="px-4 py-3">{k.age}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            k.status === "Active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {k.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingKagawad(k._id)}
                            className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteKagawad(k._id)}
                            className="text-red-500 hover:text-red-700 flex items-center gap-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Edit Kagawad Modal */}
              {editingKagawad && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-96">
                    <h3 className="text-lg font-bold mb-4">Edit Kagawad</h3>
                    {(() => {
                      const currentKagawad = skPersonnel.kagawad.find(
                        (k) => k._id === editingKagawad,
                      );
                      return currentKagawad ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            defaultValue={currentKagawad.name}
                            onChange={(e) => {
                              currentKagawad.name = e.target.value;
                            }}
                            className="w-full px-3 py-2 border rounded-md"
                            id="kagawadName"
                          />
                          <input
                            type="number"
                            defaultValue={currentKagawad.age}
                            onChange={(e) => {
                              currentKagawad.age = parseInt(e.target.value);
                            }}
                            className="w-full px-3 py-2 border rounded-md"
                            id="kagawadAge"
                          />
                          <select
                            defaultValue={currentKagawad.status}
                            onChange={(e) => {
                              currentKagawad.status = e.target.value;
                            }}
                            className="w-full px-3 py-2 border rounded-md"
                            id="kagawadStatus"
                          >
                            <option>Active</option>
                            <option>Inactive</option>
                          </select>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                handleUpdateKagawad(editingKagawad, {
                                  name: document.getElementById("kagawadName")
                                    .value,
                                  age: parseInt(
                                    document.getElementById("kagawadAge").value,
                                  ),
                                  status:
                                    document.getElementById("kagawadStatus")
                                      .value,
                                });
                              }}
                              className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingKagawad(null)}
                              className="flex-1 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No kagawad added yet
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SKPersonnelPage;
