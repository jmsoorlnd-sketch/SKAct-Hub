import React, { useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "../../components/Toast";
import { Search, Filter, Download, X } from "lucide-react";

const AdminReports = () => {
  const { error } = useToast();
  const token = localStorage.getItem("token");

  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports, searchTerm, selectedBarangay]);

  const fetchReports = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/reports", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(res.data);
    } catch {
      error("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = reports;

    if (searchTerm) {
      filtered = filtered.filter(
        (report) =>
          report.idNumber.includes(searchTerm) ||
          report.objectives.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.pydp.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (selectedBarangay) {
      filtered = filtered.filter(
        (report) => report.barangay?.barangayName === selectedBarangay,
      );
    }

    setFilteredReports(filtered);
  };

  const openReportModal = (report) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const closeReportModal = () => {
    setSelectedReport(null);
    setShowDetailModal(false);
  };

  const updateValidationStatus = async (reportId, validationStatus) => {
    try {
      const res = await axios.patch(
        `http://localhost:5000/api/reports/${reportId}/validation`,
        { validationStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const updatedReport = res.data;
      setReports((prev) =>
        prev.map((report) =>
          report._id === updatedReport._id ? updatedReport : report,
        ),
      );
      setFilteredReports((prev) =>
        prev.map((report) =>
          report._id === updatedReport._id ? updatedReport : report,
        ),
      );
      if (selectedReport?._id === updatedReport._id) {
        setSelectedReport(updatedReport);
      }
    } catch {
      error("Failed to update validation status");
    }
  };

  const uniqueBarangays = [
    ...new Set(reports.map((r) => r.barangay?.barangayName || "Unknown")),
  ].sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Reports</h1>
        <p className="text-slate-600">
          View and manage all submitted reports from officials
        </p>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:gap-4">
            <div className="relative w-full lg:w-[calc(100%-220px)]">
              <Search
                className="absolute left-3 top-3 text-slate-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by ID, objectives, or PYDP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
              />
            </div>
            <div className="md:w-48 relative flex items-center gap-2">
              <Filter size={20} className="text-slate-400" />
              <select
                value={selectedBarangay}
                onChange={(e) => setSelectedBarangay(e.target.value)}
                className="w-full pl-2 pr-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
              >
                <option value="">All Barangays</option>
                {uniqueBarangays.map((barangay) => (
                  <option key={barangay} value={barangay}>
                    {barangay}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredReports.length > 0 && (
            <button className="flex items-center gap-2 self-start bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-semibold">
              <Download size={20} />
              Export as CSV
            </button>
          )}
        </div>
        <p className="text-sm text-slate-500 mt-4">
          {filteredReports.length} report
          {filteredReports.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {filteredReports.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <p className="text-lg">No reports found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-xs">
              <thead className="bg-slate-50 border-b-2 border-slate-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">
                    ID Number
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">
                    PYDP
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">
                    Program Name
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">
                    Objectives
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">
                    Start Date
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">
                    Budget Allocated
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">
                    Budget Spent
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">
                    Barangay
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">
                    Submitted By
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">
                    Submitted At
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">
                    Validation
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report, index) => (
                  <tr
                    key={report._id}
                    onClick={() => openReportModal(report)}
                    className={`cursor-pointer border-b border-slate-200 hover:bg-slate-50 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-slate-50"
                    }`}
                  >
                    <td className="px-3 py-2 text-xs text-slate-700 font-medium">
                      {report.idNumber}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-700">
                      {report.pydp}
                    </td>
                    <td
                      className="px-3 py-2 text-xs text-slate-700 max-w-xs truncate"
                      title={report.programName}
                    >
                      {report.programName || "-"}
                    </td>
                    <td
                      className="px-3 py-2 text-xs text-slate-700 max-w-xs truncate"
                      title={report.objectives}
                    >
                      {report.objectives}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-700">
                      {new Date(report.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-700">
                      ₱{report.budgetAllocated.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-700">
                      ₱{report.budgetSpent.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                        {report.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-700">
                      {report.barangay?.barangayName || "Unknown"}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-700">
                      {report.submittedBy?.firstname || ""}{" "}
                      {report.submittedBy?.lastname || ""}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-700">
                      {new Date(report.submittedAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-700">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateValidationStatus(report._id, "valid");
                          }}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                            report.validationStatus === "valid"
                              ? "bg-green-600 text-white shadow-sm"
                              : "bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
                          }`}
                        >
                          Valid
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateValidationStatus(report._id, "not valid");
                          }}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                            report.validationStatus === "not valid"
                              ? "bg-red-600 text-white shadow-sm"
                              : "bg-red-100 text-red-900 hover:bg-red-200"
                          }`}
                        >
                          Not Valid
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Report Details
                </h2>
                <p className="text-sm text-slate-500">
                  Review the full report information below.
                </p>
              </div>
              <button
                onClick={closeReportModal}
                className="text-slate-500 hover:text-slate-900"
                aria-label="Close report details"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4 px-6 py-6 text-slate-700">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    ID Number
                  </span>
                  <p className="mt-1 text-sm text-slate-900">
                    {selectedReport.idNumber}
                  </p>
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Program/Activity/Event Name
                  </span>
                  <p className="mt-1 text-sm text-slate-900">
                    {selectedReport.programName || "-"}
                  </p>
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </span>
                  <p className="mt-1 text-sm text-slate-900">
                    {selectedReport.status}
                  </p>
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Barangay
                  </span>
                  <p className="mt-1 text-sm text-slate-900">
                    {selectedReport.barangay?.barangayName || "Unknown"}
                  </p>
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Submitted By
                  </span>
                  <p className="mt-1 text-sm text-slate-900">
                    {selectedReport.submittedBy?.firstname || ""}{" "}
                    {selectedReport.submittedBy?.lastname || ""}
                  </p>
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Validation
                  </span>
                  <p className="mt-1 text-sm">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        selectedReport.validationStatus === "valid"
                          ? "bg-green-600 text-white"
                          : selectedReport.validationStatus === "not valid"
                            ? "bg-red-600 text-white"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {selectedReport.validationStatus || "pending"}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Objectives
                </span>
                <p className="mt-1 whitespace-pre-line rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900">
                  {selectedReport.objectives}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Start Date
                  </span>
                  <p className="mt-1 text-sm text-slate-900">
                    {new Date(selectedReport.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Submitted At
                  </span>
                  <p className="mt-1 text-sm text-slate-900">
                    {new Date(selectedReport.submittedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Budget Allocated
                  </span>
                  <p className="mt-1 text-sm text-slate-900">
                    ₱{selectedReport.budgetAllocated.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Budget Spent
                  </span>
                  <p className="mt-1 text-sm text-slate-900">
                    ₱{selectedReport.budgetSpent.toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Description
                </span>
                <p className="mt-1 whitespace-pre-line rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900">
                  {selectedReport.description}
                </p>
              </div>
            </div>
            <div className="border-t border-slate-200 px-6 py-4 text-right">
              <button
                onClick={closeReportModal}
                className="inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
