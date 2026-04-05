import React, { useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "../../components/Toast";
import { AlertCircle, CheckCircle } from "lucide-react";

const SubmitReport = () => {
  const { success, error } = useToast();
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    idNumber: "",
    pydp: "",
    programName: "",
    objectives: "",
    startDate: "",
    budgetAllocated: "",
    budgetSpent: "",
  });
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [myReports, setMyReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);

  const pydpOptions = [
    "Health",
    "Education",
    "Economic Empowerment",
    "Social Inclusion and Equity",
    "Peace Building and Security",
    "Governance",
    "Active Citizenship",
    "Environment Global Mobility",
  ];

  const validateForm = () => {
    const errors = {};
    if (!formData.idNumber || formData.idNumber.trim() === "") {
      errors.idNumber = "ID Number is required";
    }
    if (!formData.pydp) {
      errors.pydp = "PYDP is required";
    }
    if (!formData.programName || formData.programName.trim() === "") {
      errors.programName = "Program/Activity/Event Name is required";
    }
    if (!formData.objectives || formData.objectives.trim() === "") {
      errors.objectives = "Objectives are required";
    }
    if (!formData.startDate) {
      errors.startDate = "Start Date is required";
    }
    if (!formData.budgetAllocated || formData.budgetAllocated <= 0) {
      errors.budgetAllocated = "Budget Allocated must be greater than 0";
    }
    if (!formData.budgetSpent || formData.budgetSpent < 0) {
      errors.budgetSpent = "Budget Spent cannot be negative";
    }
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: "" });
    }
  };

  const fetchMyReports = async () => {
    setLoadingReports(true);
    try {
      const res = await axios.get("http://localhost:5000/api/reports/mine", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyReports(res.data);
    } catch {
      error("Failed to fetch your reports");
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchMyReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      error("Please fix all errors before submitting");
      return;
    }

    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/reports/submit", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      success("Report submitted successfully!");
      setFormData({
        idNumber: "",
        pydp: "",
        programName: "",
        objectives: "",
        startDate: "",
        budgetAllocated: "",
        budgetSpent: "",
      });
      setFormErrors({});
      fetchMyReports();
    } catch (err) {
      const message = err?.response?.data?.message;
      if (message === "ID number already taken. Please use another ID.") {
        setFormErrors({ idNumber: "This ID is already taken" });
        error("The ID is already taken, please use another ID");
      } else {
        error(message || "Failed to submit report");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (fieldName) =>
    `w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all bg-white ${
      formErrors[fieldName]
        ? "border-red-400 bg-red-50 focus:ring-red-300 focus:border-red-400"
        : "border-slate-200 focus:ring-blue-300 focus:border-blue-500"
    }`;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid gap-8 lg:grid-cols-[1.7fr_1fr] items-start">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2 text-slate-800">
            Submit Report
          </h1>
          <p className="text-slate-600 mb-8">
            Fill in all the details below to submit a new report for your PYDP
            activities.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ID Number */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                ID Number
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="number"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleChange}
                min="1"
                required
                placeholder="Enter ID Number"
                className={inputClass("idNumber")}
              />
              {formErrors.idNumber && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle size={16} /> {formErrors.idNumber}
                </p>
              )}
            </div>

            {/* Select PYDP */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Select PYDP
                <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                name="pydp"
                value={formData.pydp}
                onChange={handleChange}
                required
                className={inputClass("pydp")}
              >
                <option value="">-- Select PYDP --</option>
                {pydpOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {formErrors.pydp && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle size={16} /> {formErrors.pydp}
                </p>
              )}
            </div>

            {/* Program/Activity/Event Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Program/Activity/Event Name
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                name="programName"
                value={formData.programName}
                onChange={handleChange}
                required
                placeholder="Enter program, activity, or event name"
                className={inputClass("programName")}
              />
              {formErrors.programName && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle size={16} /> {formErrors.programName}
                </p>
              )}
            </div>

            {/* Objectives */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Objectives
                <span className="text-red-500 ml-1">*</span>
              </label>
              <textarea
                name="objectives"
                value={formData.objectives}
                onChange={handleChange}
                required
                placeholder="Describe the objectives of the program or activity"
                rows="4"
                className={inputClass("objectives")}
              />
              {formErrors.objectives && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle size={16} /> {formErrors.objectives}
                </p>
              )}
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Start Date
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className={inputClass("startDate")}
              />
              {formErrors.startDate && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle size={16} /> {formErrors.startDate}
                </p>
              )}
            </div>

            {/* Budget Fields */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Budget Allocated
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="number"
                  name="budgetAllocated"
                  value={formData.budgetAllocated}
                  onChange={handleChange}
                  min="0.01"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className={inputClass("budgetAllocated")}
                />
                {formErrors.budgetAllocated && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={16} /> {formErrors.budgetAllocated}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Budget Spent
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="number"
                  name="budgetSpent"
                  value={formData.budgetSpent}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className={inputClass("budgetSpent")}
                />
                {formErrors.budgetSpent && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={16} /> {formErrors.budgetSpent}
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-8 bg-blue-500 text-white font-semibold py-3 px-4 rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Submit Report
                </>
              )}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 max-h-[680px] overflow-hidden lg:overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2 text-slate-800">
              Your Submitted Reports
            </h1>
            <p className="text-slate-600 text-sm">
              See the reports you have submitted so far.
            </p>
          </div>

          {loadingReports ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : myReports.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              No reports submitted yet. Submit your first report on the left.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-700">
                      ID Number
                    </th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-700">
                      PYDP
                    </th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-700">
                      Program Name
                    </th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-700">
                      Start Date
                    </th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-700">
                      Budget Allocated
                    </th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-700">
                      Budget Spent
                    </th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-700">
                      Barangay
                    </th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-700">
                      Validation
                    </th>
                    <th className="px-4 py-3 text-sm font-semibold text-slate-700">
                      Submitted At
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {myReports.map((report) => (
                    <tr
                      key={report._id}
                      className="border-b border-slate-200 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {report.idNumber}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {report.pydp}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {report.programName || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {new Date(report.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        ₱{report.budgetAllocated.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        ₱{report.budgetSpent.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {report.barangay?.barangayName || "Unknown"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            report.validationStatus === "valid"
                              ? "bg-green-100 text-green-800"
                              : report.validationStatus === "not valid"
                                ? "bg-red-100 text-red-800"
                                : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {report.validationStatus
                            ? report.validationStatus
                            : "pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {new Date(report.submittedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmitReport;
