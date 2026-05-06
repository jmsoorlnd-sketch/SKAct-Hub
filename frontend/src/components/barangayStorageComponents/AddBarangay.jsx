import React, { useState } from "react";
import axios from "axios";
import {
  X,
  HousePlus,
  MapPin,
  Save,
  AlertCircle,
  Globe,
  Building2,
} from "lucide-react";

/* ===================== CONSTANTS ===================== */
const API_BASE = window.API_BASE;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const DEFAULT_FORM = {
  barangayName: "",
  city: "Ormoc City",
  province: "Leyte",
  region: "Region VIII",
};

/* ===================== MAIN COMPONENT ===================== */
const AddBarangay = ({ isOpen, onClose, onSubmit }) => {
  /* ==================== STATE ==================== */
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ==================== HELPERS ==================== */
  const resetForm = () => {
    setFormData(DEFAULT_FORM);
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  /* ==================== FORM HANDLING ==================== */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.barangayName.trim()) {
      setError("Barangay name is required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await axios.post(
        `${API_BASE}/barangays/add-barangay`,
        formData,
        {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        },
      );

      onSubmit(response.data);
      handleClose();
    } catch (err) {
      console.error("Failed to add barangay:", err);
      setError(
        err.response?.data?.message ||
          "Failed to add barangay. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  /* ==================== RENDER ==================== */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* ====== MODAL HEADER ====== */}
        <div className="bg-blue-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <HousePlus size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Add Barangay</h2>
                <p className="text-blue-100 text-sm">
                  Register a new barangay to the system
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors disabled:opacity-50"
            >
              <X size={22} className="text-white" />
            </button>
          </div>
        </div>

        {/* ====== MODAL BODY ====== */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-6 space-y-5">
            {/* Error Banner */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm font-semibold">{error}</p>
              </div>
            )}

            {/* ---- Barangay Name ---- */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
                <HousePlus size={15} className="text-blue-600" />
                Barangay Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="barangayName"
                value={formData.barangayName}
                onChange={handleChange}
                placeholder="e.g., Barangay San Jose"
                autoFocus
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  error && !formData.barangayName.trim()
                    ? "border-red-400 bg-red-50 focus:ring-red-300"
                    : "border-slate-200 focus:ring-blue-300 focus:border-blue-500"
                }`}
              />
            </div>

            {/* ---- City & Province Row ---- */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
                  <Building2 size={15} className="text-slate-400" />
                  City
                </label>
                <input
                  type="text"
                  value="Ormoc City"
                  readOnly
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed font-medium"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
                  <MapPin size={15} className="text-slate-400" />
                  Province
                </label>
                <input
                  type="text"
                  value="Leyte"
                  readOnly
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed font-medium"
                />
              </div>
            </div>

            {/* ---- Region ---- */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
                <Globe size={15} className="text-slate-400" />
                Region
              </label>
              <input
                type="text"
                value="Region VIII"
                readOnly
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed font-medium"
              />
            </div>

            {/* Info Note */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">i</span>
              </div>
              <p className="text-blue-800 text-sm font-medium">
                City, Province, and Region are pre-set for{" "}
                <span className="font-bold">
                  Ormoc City, Leyte — Region VIII
                </span>
                . Only the Barangay Name is required.
              </p>
            </div>
          </div>

          {/* ====== MODAL FOOTER ====== */}
          <div className="px-6 py-4 border-t-2 border-slate-200 bg-slate-50 flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Create Barangay</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-6 py-3 bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-300 rounded-xl font-bold transition-all disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBarangay;
