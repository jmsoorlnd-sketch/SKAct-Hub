import React, { useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "../../components/Toast";
import { Search, Filter, Download, X, FileDown } from "lucide-react";

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
      const res = await axios.get(`${window.API_BASE}/reports`, {
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
        `${window.API_BASE}/reports/${reportId}/validation`,
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

  const exportReportToCSV = (report) => {
    // Helper function to format values for CSV
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return "";
      const stringValue = String(value);
      if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n")
      ) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Prepare report data for CSV
    const csvData = [
      ["Report Export"],
      [],
      ["Field", "Value"],
      ["Reference ID", report.idNumber],
      ["PYDP", report.pydp],
      ["Program Name", report.programName || "-"],
      ["Objectives", report.objectives],
      ["Start Date", new Date(report.startDate).toLocaleDateString("en-US")],
      ["Budget Allocated", `₱${report.budgetAllocated.toLocaleString()}`],
      ["Budget Spent", `₱${report.budgetSpent.toLocaleString()}`],
      ["Status", report.status],
      ["Barangay", report.barangay?.barangayName || "Unknown"],
      [
        "Submitted By",
        `${report.submittedBy?.firstname || ""} ${report.submittedBy?.lastname || ""}`,
      ],
      ["Submitted At", new Date(report.submittedAt).toLocaleString("en-US")],
      ["Validation Status", report.validationStatus || "pending"],
      ["Description", report.description || ""],
    ];

    // Convert array to CSV string
    const csvString = csvData
      .map((row) => row.map((cell) => escapeCSV(cell)).join(","))
      .join("\n");

    // Create blob and download
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Report_${report.idNumber}_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportReportsToCSV = (reportsToExport) => {
    if (!reportsToExport || reportsToExport.length === 0) return;

    const escapeCSV = (value) => {
      if (value === null || value === undefined) return "";
      const stringValue = String(value);
      if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n")
      ) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const headers = [
      "Reference ID",
      "PYDP",
      "Program Name",
      "Objectives",
      "Start Date",
      "Budget Allocated",
      "Budget Spent",
      "Status",
      "Barangay",
      "Submitted By",
      "Submitted At",
      "Validation Status",
      "Description",
    ];

    const rows = reportsToExport.map((report) => [
      report.idNumber,
      report.pydp,
      report.programName || "-",
      report.objectives,
      new Date(report.startDate).toLocaleDateString("en-US"),
      `₱${report.budgetAllocated.toLocaleString()}`,
      `₱${report.budgetSpent.toLocaleString()}`,
      report.status,
      report.barangay?.barangayName || "Unknown",
      `${report.submittedBy?.firstname || ""} ${report.submittedBy?.lastname || ""}`,
      new Date(report.submittedAt).toLocaleString("en-US"),
      report.validationStatus || "pending",
      report.description || "",
    ]);

    const csvString = [headers, ...rows]
      .map((row) => row.map((cell) => escapeCSV(cell)).join(","))
      .join("\n");

    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Reports_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    <div className="min-h-screen bg-slate-100 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-4xl border border-slate-200 bg-white/95 p-8 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.2)] backdrop-blur-xl mb-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">
                Reports & Export
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                Manage submitted reports
              </h1>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Browse, validate, and export official reports in a clean
                dashboard with fast search and filters.
              </p>
            </div>
            <div className="rounded-3xl bg-slate-950 px-6 py-5 shadow-xl shadow-slate-950/10 text-white">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                Total records
              </p>
              <p className="mt-3 text-4xl font-semibold tracking-tight">
                {filteredReports.length}
              </p>
              <p className="mt-2 text-sm text-slate-300">matched results</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr] mb-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search by ID, objectives, or PYDP..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Filter size={18} className="text-slate-500" />
                    <span>Filter</span>
                  </div>
                  <select
                    value={selectedBarangay}
                    onChange={(e) => setSelectedBarangay(e.target.value)}
                    className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300"
                  >
                    <option value="">All Barangays</option>
                    {uniqueBarangays.map((barangay) => (
                      <option key={barangay} value={barangay}>
                        {barangay}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => exportReportsToCSV(filteredReports)}
                  disabled={filteredReports.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-3xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                >
                  <Download size={18} />
                  Export CSV
                </button>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              {filteredReports.length} report
              {filteredReports.length !== 1 ? "s" : ""} found
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.28em] text-slate-400">
              Quick summary
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  Barangays
                </p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">
                  {uniqueBarangays.length}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  Validation tags
                </p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">
                  {
                    reports.filter(
                      (report) => report.validationStatus === "valid",
                    ).length
                  }
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    valid
                  </span>
                </p>
              </div>
            </div>
          </div>
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
                      Reference ID
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
                      className={`cursor-pointer border-b border-slate-200 hover:bg-blue-50 transition-all duration-200 hover:scale-[1.01] hover:shadow-md hover:z-10 relative ${
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
                              exportReportToCSV(report);
                            }}
                            className="rounded-full px-2 py-1 text-xs font-semibold transition-colors bg-blue-100 text-blue-900 hover:bg-blue-200"
                            title="Export this report as CSV"
                          >
                            <FileDown size={14} className="inline" />
                          </button>
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
                      Reference ID
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
              <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between">
                <button
                  onClick={() => exportReportToCSV(selectedReport)}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <FileDown size={16} />
                  Export as CSV
                </button>
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
    </div>
  );
};

export default AdminReports;
