import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users,
  Award,
  UserCheck,
  UserX,
  MapPin,
  Shield,
  FileText,
  X,
} from "lucide-react";

import { useToast } from "../../components/Toast";

const SkPersonnelAdmin = () => {
  const toast = useToast();

  /* ===================== STATE ===================== */
  const [barangays, setBarangays] = useState([]);
  const [selectedBarangay, setSelectedBarangay] = useState("");
  const [skPersonnel, setSkPersonnel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const [isDeactivatingAccount, setIsDeactivatingAccount] = useState(false);

  /* ===================== DATA FETCH ===================== */
  const fetchSKPersonnel = useCallback(
    async (barangayId) => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `http://localhost:5000/api/sk-personnel/${barangayId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const data = await res.json();
        setSkPersonnel(
          data.skPersonnel
            ? {
                ...data.skPersonnel,
                accountPositions: data.accountPositions || null,
              }
            : null,
        );
      } catch {
        toast.error("Failed to load SK personnel");
        setSkPersonnel(null);
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  const fetchBarangays = useCallback(async () => {
    setInitialLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        "http://localhost:5000/api/barangays/all-barangays",
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const data = await res.json();
      const list = data.barangays || [];

      setBarangays(list);

      if (list.length) {
        setSelectedBarangay(list[0]._id);
        await fetchSKPersonnel(list[0]._id);
      }
    } catch {
      toast.error("Failed to fetch barangays");
    } finally {
      setInitialLoading(false);
    }
  }, [fetchSKPersonnel, toast]);

  useEffect(() => {
    fetchBarangays();
  }, [fetchBarangays]);

  const handleToggleAccountStatus = async (personnel = selectedPersonnel) => {
    if (!personnel?._id) {
      toast.error(
        "Unable to update account status: missing account reference.",
      );
      return;
    }

    const currentStatus = personnel.status || "Active";
    if (currentStatus === "Resigned") {
      toast.error("Resigned accounts cannot be updated.");
      return;
    }

    const nextStatus = currentStatus === "Inactive" ? "Active" : "Inactive";
    const actionLabel = nextStatus === "Active" ? "Activate" : "Deactivate";

    const confirmed = window.confirm(
      `${actionLabel} this official's account? This will set the official account status to ${nextStatus}.`,
    );

    if (!confirmed) {
      return;
    }

    setIsDeactivatingAccount(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/admins/status-official/${personnel._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: nextStatus }),
        },
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.message || `Failed to ${actionLabel.toLowerCase()} account`,
        );
      }

      toast.success(
        `Account ${nextStatus === "Active" ? "activated" : "deactivated"} successfully.`,
      );
      await fetchSKPersonnel(selectedBarangay);
      setSelectedPersonnel((prev) =>
        prev ? { ...prev, status: nextStatus } : prev,
      );
    } catch (error) {
      toast.error(
        error.message || `Failed to ${actionLabel.toLowerCase()} account`,
      );
    } finally {
      setIsDeactivatingAccount(false);
    }
  };

  /* ===================== COMPUTED VALUES ===================== */
  const currentBarangay = useMemo(() => {
    return barangays.find((b) => b._id === selectedBarangay);
  }, [barangays, selectedBarangay]);

  const resolvedSkPersonnel = useMemo(() => {
    if (!skPersonnel) return null;

    const mergeOfficial = (positionKey, fallbackKey) => {
      const accountOfficial = skPersonnel.accountPositions?.[positionKey] || {};
      const fallbackOfficial = skPersonnel[fallbackKey] || {};
      const hasAssignedName =
        accountOfficial.firstName ||
        accountOfficial.surname ||
        fallbackOfficial.firstName ||
        fallbackOfficial.surname;

      if (!hasAssignedName) return null;

      return {
        _id: accountOfficial._id || fallbackOfficial._id || null,
        surname: accountOfficial.surname || fallbackOfficial.surname || "",
        firstName:
          accountOfficial.firstName || fallbackOfficial.firstName || "",
        middleName:
          accountOfficial.middleName || fallbackOfficial.middleName || "",
        age: fallbackOfficial.age ?? accountOfficial.age ?? "",
        status: fallbackOfficial.status || accountOfficial.status || "Active",
        username: accountOfficial.username || fallbackOfficial.username || "",
      };
    };

    return {
      ...skPersonnel,
      chairman: mergeOfficial("chairman", "chairman"),
      secretary: mergeOfficial("secretary", "secretary"),
      treasurer: mergeOfficial("treasurer", "treasurer"),
    };
  }, [skPersonnel]);

  const statistics = useMemo(() => {
    if (!resolvedSkPersonnel)
      return { total: 0, active: 0, inactive: 0, activeRate: 0 };

    const allMembers = [
      resolvedSkPersonnel.chairman,
      resolvedSkPersonnel.secretary,
      resolvedSkPersonnel.treasurer,
      ...(resolvedSkPersonnel.kagawad || []),
    ].filter((m) => m?.firstName || m?.surname);

    const total = allMembers.length;
    const active = allMembers.filter((m) => m.status === "Active").length;
    const inactive = allMembers.filter((m) => m.status === "Inactive").length;
    const activeRate = total > 0 ? ((active / total) * 100).toFixed(1) : 0;

    return { total, active, inactive, activeRate };
  }, [resolvedSkPersonnel]);

  /* ===================== COMPONENTS ===================== */
  const DirectoryItem = ({
    role,
    data,
    isKeyOfficial = false,
    onView,
    onDeactivate,
  }) => {
    const fullName =
      data?.firstName && data?.surname
        ? `${data.surname}, ${data.firstName} ${data.middleName || ""}`.trim()
        : "Not Assigned";

    const status = data?.status || "Active";
    const statusLabel = status === "Inactive" ? "Deactivated" : status;
    const isInactive = status === "Inactive";
    const isResigned = status === "Resigned";
    const isAssigned = data?.firstName && data?.surname;

    const roleColors = {
      "SK Chairman": {
        bg: "from-blue-50 to-indigo-50",
        border: "border-blue-200",
        badge: "bg-blue-600",
      },
      "SK Secretary": {
        bg: "from-purple-50 to-pink-50",
        border: "border-purple-200",
        badge: "bg-purple-600",
      },
      "SK Treasurer": {
        bg: "from-emerald-50 to-teal-50",
        border: "border-emerald-200",
        badge: "bg-emerald-600",
      },
      "SK Kagawad": {
        bg: "from-slate-50 to-gray-50",
        border: "border-slate-200",
        badge: "bg-slate-600",
      },
    };

    const colors = roleColors[role] || roleColors["SK Kagawad"];

    if (isKeyOfficial) {
      return (
        <div
          onClick={() => onView && data?.firstName && onView({ ...data, role })}
          className={`p-5 bg-white/95 rounded-3xl border border-slate-200 shadow-sm transition-all duration-300 ${
            data?.firstName && data?.surname
              ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-xl"
              : ""
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 ${colors.badge} rounded-xl flex items-center justify-center shadow-lg`}
              >
                <span className="text-white font-bold text-lg">
                  {isAssigned
                    ? `${data.firstName.charAt(0)}${data.surname.charAt(0)}`
                    : "?"}
                </span>
              </div>
              <div>
                <span
                  className={`inline-block px-3 py-1 text-xs font-bold rounded-lg ${colors.badge} text-white mb-1`}
                >
                  {role}
                </span>
                <h4 className="text-lg font-bold text-slate-900">{fullName}</h4>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAssigned ? (
                <>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                      isResigned
                        ? "bg-red-100 text-red-700 border-2 border-red-200"
                        : isInactive
                          ? "bg-yellow-100 text-yellow-700 border-2 border-yellow-200"
                          : "bg-emerald-100 text-emerald-700 border-2 border-emerald-200"
                    }`}
                  >
                    {isResigned ? (
                      <UserX size={18} />
                    ) : isInactive ? (
                      <UserX size={18} />
                    ) : (
                      <UserCheck size={18} />
                    )}
                    {statusLabel}
                  </span>
                  {!isResigned && data?._id && (
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeactivate && onDeactivate(data);
                      }}
                      className={`px-2 py-1 text-[11px] font-semibold rounded-lg border border-slate-300 bg-white transition-all ${
                        isInactive
                          ? "text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {isInactive ? "Activate" : "Deactivate"}
                    </button>
                  )}
                </>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold border-2 border-amber-200">
                  <UserX size={18} />
                  Vacant
                </span>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Regular kagawad item
    return (
      <div
        onClick={() => onView && data?.firstName && onView({ ...data, role })}
        className={`flex items-center justify-between gap-4 p-4 bg-white rounded-3xl border border-slate-200 shadow-sm transition-all duration-300 ${
          data?.firstName && data?.surname
            ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg"
            : ""
        }`}
      >
        {" "}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-sm">
              {isAssigned
                ? `${data.firstName.charAt(0)}${data.surname.charAt(0)}`
                : "?"}
            </span>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              {role}
            </span>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              {fullName}
            </p>
          </div>
        </div>
        <div>
          {isAssigned ? (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${
                isResigned
                  ? "bg-red-100 text-red-700 border-2 border-red-200"
                  : isInactive
                    ? "bg-yellow-100 text-yellow-700 border-2 border-yellow-200"
                    : "bg-emerald-100 text-emerald-700 border-2 border-emerald-200"
              }`}
            >
              {isResigned ? (
                <UserX size={18} />
              ) : isInactive ? (
                <UserX size={18} />
              ) : (
                <UserCheck size={18} />
              )}
              {status}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold border-2 border-amber-200">
              <UserX size={18} />
              Vacant
            </span>
          )}
        </div>
      </div>
    );
  };

  /* ===================== RENDER ===================== */
  return (
    <>
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Page Header */}
          <div className="mb-8">
            <div className="bg-white/90 backdrop-blur-md rounded-4xl border border-slate-200 shadow-xl p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                  <p className="text-sm font-semibold text-blue-600 uppercase tracking-[0.24em] mb-2">
                    SK Personnel Directory
                  </p>
                  <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900">
                    SK Personnel Directory
                  </h1>
                  <p className="text-slate-600 mt-3 max-w-2xl text-sm md:text-base">
                    Browse SK officers, view account status, and manage barangay
                    personnel assignments.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full sm:w-auto">
                  <div className="rounded-3xl bg-slate-50 border border-slate-200 p-4 text-center">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 mb-2">
                      Barangay
                    </p>
                    <p className="text-base font-semibold text-slate-900">
                      {currentBarangay?.barangayName || "None selected"}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 border border-slate-200 p-4 text-center">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 mb-2">
                      Active Rate
                    </p>
                    <p className="text-base font-semibold text-slate-900">
                      {statistics.activeRate}%
                    </p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 border border-slate-200 p-4 text-center">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 mb-2">
                      Total Officials
                    </p>
                    <p className="text-base font-semibold text-slate-900">
                      {statistics.total}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {initialLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                <p className="text-slate-600 font-medium">
                  Loading barangays...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Loading State */}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">
                      Loading SK personnel...
                    </p>
                  </div>
                </div>
              ) : skPersonnel ? (
                <div className="space-y-6">
                  {/* Main Content Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Key Officials - 2 columns */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden">
                        <div className="bg-linear-to-r from-slate-50 to-blue-50 px-6 py-4 border-b-2 border-slate-200">
                          <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-bold text-slate-900">
                              Key Officials
                            </h3>
                          </div>
                          <p className="text-sm text-slate-600 mt-1">
                            Executive leadership positions
                          </p>
                        </div>

                        <div className="p-6 space-y-4">
                          <DirectoryItem
                            role="SK Chairman"
                            data={
                              resolvedSkPersonnel?.chairman ||
                              skPersonnel?.chairman
                            }
                            isKeyOfficial={true}
                            onView={(personnel) => {
                              setSelectedPersonnel({
                                ...personnel,
                                role: "SK Chairman",
                              });
                              setShowModal(true);
                            }}
                            onDeactivate={(personnel) =>
                              handleToggleAccountStatus(personnel)
                            }
                          />
                          <DirectoryItem
                            role="SK Secretary"
                            data={
                              resolvedSkPersonnel?.secretary ||
                              skPersonnel?.secretary
                            }
                            isKeyOfficial={true}
                            onView={(personnel) => {
                              setSelectedPersonnel({
                                ...personnel,
                                role: "SK Secretary",
                              });
                              setShowModal(true);
                            }}
                            onDeactivate={(personnel) =>
                              handleToggleAccountStatus(personnel)
                            }
                          />
                          <DirectoryItem
                            role="SK Treasurer"
                            data={
                              resolvedSkPersonnel?.treasurer ||
                              skPersonnel?.treasurer
                            }
                            isKeyOfficial={true}
                            onView={(personnel) => {
                              setSelectedPersonnel({
                                ...personnel,
                                role: "SK Treasurer",
                              });
                              setShowModal(true);
                            }}
                            onDeactivate={(personnel) =>
                              handleToggleAccountStatus(personnel)
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Kagawad Members + Stats Sidebar */}
                    <div className="lg:col-span-1 space-y-4">
                      <div className="bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg p-4 border border-blue-200">
                        <h3 className="text-sm font-bold mb-1">Barangay</h3>
                        <p className="text-lg font-bold">
                          {currentBarangay?.barangayName || "--"}
                        </p>
                        <p className="text-xs text-blue-100 mt-1">
                          Current SK Officials Directory
                        </p>
                      </div>
                      <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-4">
                        <h3 className="text-sm font-bold text-slate-900 mb-2">
                          Select Barangay
                        </h3>
                        <select
                          value={selectedBarangay}
                          onChange={(e) => {
                            setSelectedBarangay(e.target.value);
                            fetchSKPersonnel(e.target.value);
                          }}
                          className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                        >
                          {barangays.map((b) => (
                            <option key={b._id} value={b._id}>
                              {b.barangayName}
                            </option>
                          ))}
                        </select>
                        {currentBarangay && (
                          <div className="mt-3 flex items-center gap-3 px-3 py-2 bg-blue-50 rounded-xl border border-blue-200">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <div>
                              <p className="text-[11px] text-slate-500 uppercase tracking-wider">
                                Location
                              </p>
                              <p className="text-sm text-slate-900 font-semibold">
                                {currentBarangay.city},{" "}
                                {currentBarangay.province}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-4">
                        <h3 className="text-sm font-bold text-slate-900 mb-3">
                          SK Summary
                        </h3>
                        <div className="space-y-2 text-sm text-slate-700">
                          <div className="flex items-center justify-between">
                            <span>Total</span>
                            <strong>{statistics.total}</strong>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Active</span>
                            <strong>{statistics.active}</strong>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Inactive</span>
                            <strong>{statistics.inactive}</strong>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Active Rate</span>
                            <strong>{statistics.activeRate}%</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SK Kagawad below Key Officials */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    <div className="lg:col-span-2">
                      <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden">
                        <div className="bg-linear-to-r from-slate-50 to-purple-50 px-6 py-4 border-b-2 border-slate-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Users className="w-5 h-5 text-purple-600" />
                              <h3 className="text-lg font-bold text-slate-900">
                                SK Kagawad
                              </h3>
                            </div>
                            <span className="text-sm text-slate-500">
                              {skPersonnel.kagawad?.length || 0} member
                              {(skPersonnel.kagawad?.length || 0) !== 1
                                ? "s"
                                : ""}
                            </span>
                          </div>
                        </div>
                        <div className="p-6">
                          {skPersonnel.kagawad?.length ? (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                              {skPersonnel.kagawad.map((k, index) => (
                                <DirectoryItem
                                  key={k._id || index}
                                  role="SK Kagawad"
                                  data={k}
                                  isKeyOfficial={false}
                                  onView={(personnel) => {
                                    setSelectedPersonnel(personnel);
                                    setShowModal(true);
                                  }}
                                  onDeactivate={(personnel) =>
                                    handleToggleAccountStatus(personnel)
                                  }
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Users className="text-slate-400" size={18} />
                              </div>
                              <p className="text-sm text-slate-500 font-medium">
                                No kagawad members assigned
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="lg:col-span-1"></div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-12">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="text-slate-400" size={18} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      No Personnel Data
                    </h3>
                    <p className="text-slate-500">
                      No SK personnel found for this barangay
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Personnel Details Modal */}
      {showModal && selectedPersonnel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in scale-in">
            {/* Modal Header */}
            <div className="bg-linear-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">Details</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedPersonnel(null);
                }}
                className="bg-white/20 hover:bg-white/30 p-1.5 rounded-lg transition-all"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Position Badge */}
              <div className="flex justify-center mb-4">
                <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold">
                  {selectedPersonnel.role}
                </span>
              </div>

              {/* Full Name */}
              <div className="border-b-2 border-slate-200 pb-4">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">
                  Full Name
                </p>
                <p className="text-lg font-bold text-slate-900">
                  {selectedPersonnel.surname}, {selectedPersonnel.firstName}
                </p>
                {selectedPersonnel.middleName && (
                  <p className="text-sm text-slate-600 mt-1">
                    Middle Name: {selectedPersonnel.middleName}
                  </p>
                )}
              </div>

              {/* Age */}
              <div className="border-b-2 border-slate-200 pb-4">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">
                  Age
                </p>
                <p className="text-lg font-bold text-slate-900">
                  {selectedPersonnel.age} years old
                </p>
              </div>

              {/* Status */}
              <div className="pb-4">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">
                  Status
                </p>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    {selectedPersonnel.status === "Active" ? (
                      <>
                        <UserCheck size={18} className="text-emerald-600" />
                        <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold border-2 border-emerald-200">
                          Active
                        </span>
                      </>
                    ) : selectedPersonnel.status === "Inactive" ? (
                      <>
                        <UserX size={18} className="text-yellow-600" />
                        <span className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-bold border-2 border-yellow-200">
                          Inactive
                        </span>
                      </>
                    ) : (
                      <>
                        <UserX size={18} className="text-red-600" />
                        <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-bold border-2 border-red-200">
                          Resigned
                        </span>
                      </>
                    )}
                  </div>
                  {selectedPersonnel.status !== "Resigned" &&
                    selectedPersonnel._id && (
                      <button
                        onClick={() =>
                          handleToggleAccountStatus(selectedPersonnel)
                        }
                        disabled={isDeactivatingAccount}
                        className={`inline-flex items-center justify-center rounded-lg px-4 py-2 border font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          selectedPersonnel.status === "Inactive"
                            ? "border-emerald-400 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                            : "border-yellow-400 bg-yellow-50 text-yellow-800 hover:bg-yellow-100"
                        }`}
                      >
                        {isDeactivatingAccount
                          ? selectedPersonnel.status === "Inactive"
                            ? "Activating..."
                            : "Deactivating..."
                          : selectedPersonnel.status === "Inactive"
                            ? "Activate Account"
                            : "Deactivate Account"}
                      </button>
                    )}
                  {selectedPersonnel.skStatus &&
                    selectedPersonnel.skStatus !== selectedPersonnel.status && (
                      <p className="text-xs text-slate-500 mt-1">
                        SK Personnel status: {selectedPersonnel.skStatus}
                      </p>
                    )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 rounded-b-2xl border-t-2 border-slate-200 flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedPersonnel(null);
                }}
                className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold rounded-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SkPersonnelAdmin;
