import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useToast } from "../../components/Toast";
import { AlertCircle, CheckCircle, X } from "lucide-react";

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
  const [showFormModal, setShowFormModal] = useState(false);

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
    const referenceId = formData.idNumber?.toString().trim() || "";
    if (!referenceId) {
      errors.idNumber = "Reference ID Number is required";
    } else if (!/^\d{5}$/.test(referenceId)) {
      errors.idNumber = "Reference ID must be exactly 5 digits";
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
      const res = await axios.get(`${window.API_BASE}/reports/mine`, {
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

  const reportSummary = useMemo(() => {
    const counts = {
      total: myReports.length,
      valid: 0,
      invalid: 0,
      pending: 0,
    };

    myReports.forEach((report) => {
      const status = report.validationStatus?.toLowerCase() || "pending";
      if (status === "valid") counts.valid += 1;
      else if (status === "not valid") counts.invalid += 1;
      else counts.pending += 1;
    });

    return counts;
  }, [myReports]);

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
      await axios.post(`${window.API_BASE}/reports/submit`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      success("Report submitted successfully!");
      setShowFormModal(false);
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
      if (
        message ===
        "Reference ID number already taken. Please use another Reference ID."
      ) {
        setFormErrors({ idNumber: "This Reference ID is already taken" });
        error("The Reference ID is already taken, please use another ID");
      } else if (message === "Reference ID number must be exactly 5 digits.") {
        setFormErrors({ idNumber: "Reference ID must be exactly 5 digits" });
        error("Reference ID must be exactly 5 digits");
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
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-4xl border border-slate-200/80 bg-white px-6 py-8 shadow-[0_20px_80px_-50px_rgba(15,23,42,0.15)] sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Submit Report
              </h1>
              <p className="text-slate-600 mt-2">
                Click the button to open the report form in a popup.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowFormModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-white font-semibold transition hover:bg-blue-600"
            >
              <CheckCircle size={18} />
              Submit New Report
            </button>
          </div>
        </div>

        <div className="rounded-4xl border border-slate-200/80 bg-white px-6 py-8 shadow-[0_20px_80px_-50px_rgba(15,23,42,0.15)] sm:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2 text-slate-800">
              Your Submitted Reports
            </h1>
            <p className="text-slate-600 text-sm">
              Every report shows the full details below.
            </p>
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-4">
            <div className="rounded-3xl border border-slate-200/80 bg-slate-50 px-4 py-4 text-sm">
              <p className="text-slate-500">Total Reports</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {reportSummary.total}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200/80 bg-emerald-50 px-4 py-4 text-sm">
              <p className="text-emerald-700">Valid</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-900">
                {reportSummary.valid}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200/80 bg-rose-50 px-4 py-4 text-sm">
              <p className="text-rose-700">Not Valid</p>
              <p className="mt-2 text-2xl font-semibold text-rose-900">
                {reportSummary.invalid}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200/80 bg-amber-50 px-4 py-4 text-sm">
              <p className="text-amber-700">Pending</p>
              <p className="mt-2 text-2xl font-semibold text-amber-900">
                {reportSummary.pending}
              </p>
            </div>
          </div>

          {loadingReports ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : myReports.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              No reports submitted yet. Submit your first report using the
              button above.
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="whitespace-nowrap px-3 py-2 font-semibold text-xs">
                        Reference ID Number
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 font-semibold text-xs">
                        PYDP
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 font-semibold text-xs">
                        Program Name
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 font-semibold text-xs">
                        Objectives
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 font-semibold text-xs">
                        Start Date
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 font-semibold text-xs">
                        Budget Allocated
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 font-semibold text-xs">
                        Budget Spent
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 font-semibold text-xs">
                        Status
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 font-semibold text-xs">
                        Barangay
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 font-semibold text-xs">
                        Submitted By
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 font-semibold text-xs">
                        Submitted At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {myReports.map((report) => (
                      <tr key={report._id} className="hover:bg-slate-50">
                        <td className="px-3 py-2">{report.idNumber}</td>
                        <td className="px-3 py-2">{report.pydp}</td>
                        <td className="px-3 py-2">
                          {report.programName || "-"}
                        </td>
                        <td className="max-w-48 px-3 py-2 text-slate-700 overflow-hidden text-ellipsis whitespace-nowrap">
                          {report.objectives || "-"}
                        </td>
                        <td className="px-3 py-2">
                          {new Date(report.startDate).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2">
                          ₱{Number(report.budgetAllocated).toLocaleString()}
                        </td>
                        <td className="px-3 py-2">
                          ₱{Number(report.budgetSpent).toLocaleString()}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                              report.validationStatus === "valid"
                                ? "bg-emerald-100 text-emerald-700"
                                : report.validationStatus === "not valid"
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {report.validationStatus
                              ? report.validationStatus
                              : "pending"}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {report.barangay?.barangayName || "Unknown"}
                        </td>
                        <td className="px-3 py-2">
                          {report.submittedBy?.firstname || ""}{" "}
                          {report.submittedBy?.lastname || ""}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-slate-500 text-sm">
                          {new Date(report.submittedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {showFormModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowFormModal(false);
            }
          }}
        >
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl max-h-[90vh]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Submit Report
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Fill in the report details and submit them directly from this
                  popup.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            <div className="max-h-[calc(90vh-5rem)] overflow-y-auto px-6 py-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Reference ID Number
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    name="idNumber"
                    value={formData.idNumber}
                    onChange={handleChange}
                    inputMode="numeric"
                    pattern="\d{5}"
                    maxLength={5}
                    required
                    placeholder="Enter 5-digit Reference ID"
                    className={inputClass("idNumber")}
                  />
                  {formErrors.idNumber && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={16} /> {formErrors.idNumber}
                    </p>
                  )}
                </div>

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

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-blue-500 py-3 px-4 text-white font-semibold transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Submitting..." : "Submit Report"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmitReport;
