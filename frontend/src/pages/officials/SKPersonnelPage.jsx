import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  Trash2,
  Plus,
  Edit2,
  Users,
  Award,
  UserCheck,
  UserX,
  Shield,
  TrendingUp,
  X,
  Save,
  Ban,
} from "lucide-react";

import { useToast } from "../../components/Toast";

const SKPersonnelPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  /* ===================== STATE ===================== */
  const [user, setUser] = useState(null);
  const [skPersonnel, setSkPersonnel] = useState(null);
  const [barangayName, setBarangayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingPosition, setEditingPosition] = useState(null);
  const [editingKagawad, setEditingKagawad] = useState(null);
  const [showAddKagawad, setShowAddKagawad] = useState(false);

  // Form states - unified to reduce duplication
  const defaultFormData = {
    surname: "",
    firstName: "",
    middleName: "",
    age: "",
    status: "Active",
  };

  const [forms, setForms] = useState({
    chairman: { ...defaultFormData },
    vicePresident: { ...defaultFormData },
    secretary: { ...defaultFormData },
  });

  const [kagawadForm, setKagawadForm] = useState({
    surname: "",
    firstName: "",
    middleName: "",
    age: "",
    status: "Active",
  });

  /* ===================== INITIALIZATION ===================== */
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser || storedUser.role !== "Official") {
      navigate("/");
      return;
    }

    setUser(storedUser);

    if (storedUser.barangay) {
      const barangayId = storedUser.barangay?._id || storedUser.barangay;
      if (barangayId) {
        fetchBarangayName(barangayId);
        fetchSKPersonnel(barangayId);
      } else {
        fetchUserProfile(storedUser._id);
      }
    } else {
      fetchUserProfile(storedUser._id);
    }
  }, [navigate]);

  /* ===================== DATA FETCHING ===================== */
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
      }
    } catch (error) {
      console.error("Error fetching barangay name:", error);
    }
  };

  const fetchSKPersonnel = async (barangayId) => {
    const normalizedId = barangayId?._id || barangayId;

    if (!normalizedId || typeof normalizedId !== "string") {
      console.error("Invalid barangayId provided:", barangayId);
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/sk-personnel/${normalizedId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || `Failed to fetch SK Personnel`);
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (data.skPersonnel) {
        setSkPersonnel(data.skPersonnel);

        // Create a helper function to populate form data
        const populateFormData = (personelData) => ({
          surname: personelData?.surname || "",
          firstName: personelData?.firstName || "",
          middleName: personelData?.middleName || "",
          age: personelData?.age || "",
          status: personelData?.status || "Active",
        });

        // Populate forms using unified object
        setForms({
          chairman: populateFormData(data.skPersonnel.chairman),
          vicePresident: populateFormData(data.skPersonnel.vicePresident),
          secretary: populateFormData(data.skPersonnel.secretary),
        });
      }
    } catch (error) {
      console.error("Error fetching SK Personnel:", error);
      toast.error("Failed to fetch SK Personnel data");
    } finally {
      setLoading(false);
    }
  };

  /* ===================== EVENT HANDLERS ===================== */
  const handleUpdatePosition = async (position, formData) => {
    if (!user || !user.barangay) {
      toast.error("User barangay information not available");
      return;
    }

    const barangayId = user.barangay?._id || user.barangay;

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
      toast.success(`Position updated successfully`);
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

    if (!kagawadForm.firstName || !kagawadForm.surname || !kagawadForm.age) {
      toast.error("Please fill in all required fields");
      return;
    }

    const barangayId = user.barangay?._id || user.barangay;

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
    if (!window.confirm("Are you sure you want to delete this kagawad?"))
      return;

    const barangayId = user.barangay?._id || user.barangay;

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
  };

  /* ===================== STATISTICS ===================== */
  const statistics = useMemo(() => {
    if (!skPersonnel)
      return { total: 0, active: 0, inactive: 0, activeRate: 0 };

    const allMembers = [
      skPersonnel.chairman,
      skPersonnel.secretary,
      skPersonnel.treasurer,
      ...(skPersonnel.kagawad || []),
    ].filter(Boolean);

    const total = allMembers.length;
    const active = allMembers.filter((m) => m.status !== "Inactive").length;
    const inactive = total - active;
    const activeRate = total > 0 ? ((active / total) * 100).toFixed(1) : 0;

    return { total, active, inactive, activeRate };
  }, [skPersonnel]);

  /* ===================== LOADING STATE ===================== */
  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-3"></div>
            <p className="text-slate-600 font-medium">
              Loading SK personnel...
            </p>
          </div>
        </div>
      </>
    );
  }

  /* ===================== RENDER ===================== */
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold">SK Personnel Management</h1>
            {barangayName && (
              <p className="text-slate-600 mt-1 text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                Barangay:{" "}
                <span className="font-bold text-blue-600">{barangayName}</span>
              </p>
            )}
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={Users}
              title="Total Members"
              value={statistics.total}
              color="blue"
              subtitle="SK Personnel"
            />
            <StatCard
              icon={UserCheck}
              title="Active Members"
              value={statistics.active}
              color="emerald"
              percentage={statistics.activeRate}
            />
            <StatCard
              icon={UserX}
              title="Inactive Members"
              value={statistics.inactive}
              color="red"
              percentage={
                statistics.total > 0
                  ? ((statistics.inactive / statistics.total) * 100).toFixed(1)
                  : 0
              }
            />
            <StatCard
              icon={Award}
              title="Key Positions"
              value="3"
              color="purple"
              subtitle="Executive Officers"
            />
          </div>

          {/* Key Officials Section */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              Key Officials
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Chairman */}
              <OfficialCard
                title="SK Chairman"
                color="blue"
                formData={forms.chairman}
                setFormData={(newData) =>
                  setForms({ ...forms, chairman: newData })
                }
                isEditing={editingPosition === "chairman"}
                onEdit={() => setEditingPosition("chairman")}
                onSave={() => handleUpdatePosition("chairman", forms.chairman)}
                onCancel={() => setEditingPosition(null)}
              />

              {/* Secretary */}
              <OfficialCard
                title="SK Secretary"
                color="purple"
                formData={forms.vicePresident}
                setFormData={(newData) =>
                  setForms({ ...forms, vicePresident: newData })
                }
                isEditing={editingPosition === "vicePresident"}
                onEdit={() => setEditingPosition("vicePresident")}
                onSave={() =>
                  handleUpdatePosition("vicePresident", forms.vicePresident)
                }
                onCancel={() => setEditingPosition(null)}
              />

              {/* Treasurer */}
              <OfficialCard
                title="SK Treasurer"
                color="emerald"
                formData={forms.secretary}
                setFormData={(newData) =>
                  setForms({ ...forms, secretary: newData })
                }
                isEditing={editingPosition === "secretary"}
                onEdit={() => setEditingPosition("secretary")}
                onSave={() =>
                  handleUpdatePosition("secretary", forms.secretary)
                }
                onCancel={() => setEditingPosition(null)}
              />
            </div>
          </div>

          {/* SK Kagawad Section */}
          <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-purple-50 px-5 py-4 border-b-2 border-slate-200">
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <h2 className="text-lg font-bold text-slate-900">
                      SK Kagawad
                    </h2>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {skPersonnel?.kagawad?.length || 0} member
                    {(skPersonnel?.kagawad?.length || 0) !== 1 ? "s" : ""}
                  </p>
                </div>
                {!showAddKagawad && (
                  <button
                    onClick={() => setShowAddKagawad(true)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold text-sm shadow-md transition-all flex items-center gap-2"
                  >
                    <Plus size={18} />
                    <span>Add Kagawad</span>
                  </button>
                )}
              </div>
            </div>

            <div className="p-5">
              {/* Add Kagawad Modal */}
              {showAddKagawad &&
                createPortal(
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
                      {/* Modal Header */}
                      <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-bold text-slate-900">
                            Add New Kagawad
                          </h2>
                          <p className="text-sm text-slate-600 mt-1">
                            Register a new SK Kagawad member
                          </p>
                        </div>
                        <button
                          onClick={() => setShowAddKagawad(false)}
                          className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <X size={20} className="text-slate-600" />
                        </button>
                      </div>

                      {/* Modal Body */}
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              Surname *
                            </label>
                            <input
                              type="text"
                              placeholder="Enter surname"
                              value={kagawadForm.surname}
                              onChange={(e) =>
                                setKagawadForm({
                                  ...kagawadForm,
                                  surname: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              First Name *
                            </label>
                            <input
                              type="text"
                              placeholder="Enter first name"
                              value={kagawadForm.firstName}
                              onChange={(e) =>
                                setKagawadForm({
                                  ...kagawadForm,
                                  firstName: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              Middle Name
                            </label>
                            <input
                              type="text"
                              placeholder="Enter middle name (optional)"
                              value={kagawadForm.middleName}
                              onChange={(e) =>
                                setKagawadForm({
                                  ...kagawadForm,
                                  middleName: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              Age *
                            </label>
                            <input
                              type="number"
                              placeholder="Enter age"
                              value={kagawadForm.age}
                              onChange={(e) =>
                                setKagawadForm({
                                  ...kagawadForm,
                                  age: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                          </div>
                        </div>
                        <div className="mb-6">
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Status *
                          </label>
                          <select
                            value={kagawadForm.status}
                            onChange={(e) =>
                              setKagawadForm({
                                ...kagawadForm,
                                status: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                          >
                            <option>Active</option>
                            <option>Inactive</option>
                          </select>
                        </div>
                      </div>

                      {/* Modal Footer */}
                      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3">
                        <button
                          onClick={() => setShowAddKagawad(false)}
                          className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-slate-900 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Ban size={16} />
                          Cancel
                        </button>
                        <button
                          onClick={handleAddKagawad}
                          className="flex-1 py-2 px-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Save size={16} />
                          Add Kagawad
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.body,
                )}

              {/* Kagawad List */}
              {skPersonnel?.kagawad && skPersonnel.kagawad.length > 0 ? (
                <div className="space-y-3">
                  {skPersonnel.kagawad.map((k) => (
                    <div
                      key={k._id}
                      className="p-5 bg-white rounded-xl border-2 border-slate-200 hover:shadow-lg hover:border-blue-400 transition-all duration-200"
                    >
                      <div className="flex justify-between items-start gap-4">
                        {/* Left Content */}
                        <div className="flex items-center gap-4 flex-1">
                          {/* Avatar */}
                          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                            <span className="text-white font-bold text-lg">
                              {k.firstName?.charAt(0) ||
                                k.name?.charAt(0) ||
                                "K"}
                            </span>
                          </div>

                          {/* Info */}
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900 text-base">
                              {k.name || `${k.firstName} ${k.surname || ""}`}
                            </h4>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="text-slate-600">
                                <span className="font-semibold">Age:</span>{" "}
                                {k.age}
                              </span>
                              {k.middleName && (
                                <span className="text-slate-500 text-xs">
                                  {k.firstName} {k.middleName} {k.surname}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {/* Status Badge */}
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border-2 whitespace-nowrap ${
                              k.status === "Active"
                                ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                                : "bg-red-100 text-red-700 border-red-300"
                            }`}
                          >
                            {k.status === "Active" ? (
                              <UserCheck size={14} />
                            ) : (
                              <UserX size={14} />
                            )}
                            {k.status}
                          </span>

                          {/* Edit Button */}
                          <button
                            onClick={() => setEditingKagawad(k._id)}
                            className="p-2.5 bg-blue-100 hover:bg-blue-200 text-blue-600 hover:text-blue-700 rounded-lg transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
                            title="Edit Kagawad"
                          >
                            <Edit2 size={16} />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteKagawad(k._id)}
                            className="p-2.5 bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 rounded-lg transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
                            title="Delete Kagawad"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="text-slate-400" size={36} />
                  </div>
                  <p className="text-base text-slate-600 font-semibold">
                    No kagawad members added yet
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Click "Add Kagawad" to register a new member
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Kagawad Modal */}
      {editingKagawad && (
        <EditKagawadModal
          kagawad={skPersonnel.kagawad.find((k) => k._id === editingKagawad)}
          onSave={(updatedData) =>
            handleUpdateKagawad(editingKagawad, updatedData)
          }
          onClose={() => setEditingKagawad(null)}
        />
      )}
    </>
  );
};

/* ==================== SUB-COMPONENTS ==================== */

const StatCard = ({
  icon: Icon,
  title,
  value,
  color,
  percentage,
  subtitle,
}) => {
  const colors = {
    blue: {
      bg: "from-blue-500 to-blue-600",
      badge: "bg-blue-100 text-blue-700",
      bar: "from-blue-500 to-blue-600",
    },
    emerald: {
      bg: "from-emerald-500 to-emerald-600",
      badge: "bg-emerald-100 text-emerald-700",
      bar: "from-emerald-500 to-emerald-600",
    },
    red: {
      bg: "from-red-500 to-red-600",
      badge: "bg-red-100 text-red-700",
      bar: "from-red-500 to-red-600",
    },
    purple: {
      bg: "from-purple-500 to-purple-600",
      badge: "bg-purple-100 text-purple-700",
      bar: "from-purple-500 to-purple-600",
    },
  };

  const c = colors[color];

  return (
    <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-11 h-11 bg-gradient-to-br ${c.bg} rounded-lg flex items-center justify-center shadow-md`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        {percentage !== undefined && (
          <span
            className={`px-2 py-0.5 ${c.badge} rounded-md text-[11px] font-bold`}
          >
            {percentage}%
          </span>
        )}
      </div>
      <h3 className="text-slate-500 text-xs font-semibold mb-0.5">{title}</h3>
      <p className="text-2xl font-bold text-slate-900 mb-2">{value}</p>
      {percentage !== undefined && (
        <div className="flex items-center text-[11px] text-slate-500">
          <div className="flex-1 bg-slate-200 rounded-full h-1.5 mr-2">
            <div
              className={`bg-gradient-to-r ${c.bar} h-1.5 rounded-full transition-all duration-1000`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <span className="font-semibold">{percentage}%</span>
        </div>
      )}
      {subtitle && (
        <div className="flex items-center text-[11px] text-slate-500 mt-2">
          <Shield className="w-3 h-3 mr-1" />
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
};

const OfficialEditModal = ({
  title,
  formData,
  setFormData,
  onSave,
  onCancel,
}) => {
  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Edit {title}</h2>
            <p className="text-sm text-slate-600 mt-1">
              Update officer details
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Surname *
            </label>
            <input
              type="text"
              placeholder="Enter surname"
              value={formData.surname}
              onChange={(e) =>
                setFormData({ ...formData, surname: e.target.value })
              }
              className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              First Name *
            </label>
            <input
              type="text"
              placeholder="Enter first name"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Middle Name
            </label>
            <input
              type="text"
              placeholder="Enter middle name (optional)"
              value={formData.middleName}
              onChange={(e) =>
                setFormData({ ...formData, middleName: e.target.value })
              }
              className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Age *
            </label>
            <input
              type="number"
              placeholder="Enter age"
              value={formData.age}
              onChange={(e) =>
                setFormData({ ...formData, age: e.target.value })
              }
              className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Status *
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-slate-900 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Ban size={16} />
            Cancel
          </button>
          <button
            onClick={onSave}
            className="flex-1 py-2 px-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Save size={16} />
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

const OfficialCard = ({
  title,
  color,
  formData,
  setFormData,
  isEditing,
  onEdit,
  onSave,
  onCancel,
}) => {
  const colors = {
    blue: {
      bg: "from-blue-50 to-indigo-50",
      border: "border-blue-200",
      badge: "bg-blue-600",
      text: "text-blue-900",
    },
    purple: {
      bg: "from-purple-50 to-pink-50",
      border: "border-purple-200",
      badge: "bg-purple-600",
      text: "text-purple-900",
    },
    emerald: {
      bg: "from-emerald-50 to-teal-50",
      border: "border-emerald-200",
      badge: "bg-emerald-600",
      text: "text-emerald-900",
    },
  };

  const c = colors[color];
  const isAssigned = formData.firstName && formData.surname;

  return (
    <>
      <div
        className={`p-5 bg-gradient-to-r ${c.bg} rounded-xl border-2 ${c.border} shadow-md`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 ${c.badge} rounded-lg flex items-center justify-center shadow-md`}
            >
              <span className="text-white font-bold text-base">
                {isAssigned
                  ? `${formData.firstName.charAt(0)}${formData.surname.charAt(0)}`
                  : "?"}
              </span>
            </div>
            <div>
              <span
                className={`inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-md ${c.badge} text-white`}
              >
                {title}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h4 className={`text-base font-bold ${c.text} mb-1.5`}>
            {isAssigned ? (
              <>
                {formData.surname}, {formData.firstName}{" "}
                {formData.middleName && formData.middleName}
              </>
            ) : (
              "Not assigned"
            )}
          </h4>
          {isAssigned && (
            <>
              <p className="text-xs text-slate-600 mb-2">Age: {formData.age}</p>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold border-2 ${
                  formData.status === "Active"
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                    : "bg-red-100 text-red-700 border-red-200"
                }`}
              >
                {formData.status === "Active" ? (
                  <UserCheck size={11} />
                ) : (
                  <UserX size={11} />
                )}
                {formData.status}
              </span>
            </>
          )}
          <button
            onClick={onEdit}
            className="mt-3 px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5"
          >
            <Edit2 size={14} />
            Edit
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <OfficialEditModal
          title={title}
          formData={formData}
          setFormData={setFormData}
          onSave={onSave}
          onCancel={onCancel}
        />
      )}
    </>
  );
};

const EditKagawadModal = ({ kagawad, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: kagawad?.name || "",
    age: kagawad?.age || "",
    status: kagawad?.status || "Active",
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Edit2 size={20} />
              Edit Kagawad
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              Age
            </label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) =>
                setFormData({ ...formData, age: parseInt(e.target.value) })
              }
              className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
          <div className="flex gap-2 pt-3">
            <button
              onClick={() => onSave(formData)}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-md transition-all"
            >
              Save Changes
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold text-sm transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SKPersonnelPage;
