import { useEffect, useState, useMemo } from "react";
import {
  Users,
  Award,
  UserCheck,
  UserX,
  MapPin,
  Shield,
  FileText,
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

  /* ===================== DATA FETCH ===================== */
  useEffect(() => {
    fetchBarangays();
  }, []);

  const fetchBarangays = async () => {
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
        fetchSKPersonnel(list[0]._id);
      }
    } catch {
      toast.error("Failed to fetch barangays");
    } finally {
      setInitialLoading(false);
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
      setSkPersonnel(data.skPersonnel || null);
    } catch {
      toast.error("Failed to load SK personnel");
      setSkPersonnel(null);
    } finally {
      setLoading(false);
    }
  };

  /* ===================== COMPUTED VALUES ===================== */
  const currentBarangay = useMemo(() => {
    return barangays.find((b) => b._id === selectedBarangay);
  }, [barangays, selectedBarangay]);

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

  /* ===================== COMPONENTS ===================== */
  const DirectoryItem = ({ role, data, isKeyOfficial = false }) => {
    const fullName =
      data?.firstName && data?.surname
        ? `${data.surname}, ${data.firstName} ${data.middleName || ""}`.trim()
        : "Not Assigned";

    const isInactive = data?.status === "Inactive";
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
          className={`p-5 bg-gradient-to-r ${colors.bg} rounded-xl border-2 ${colors.border} hover:shadow-md transition-all`}
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
            <div>
              {isAssigned ? (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                    isInactive
                      ? "bg-red-100 text-red-700 border-2 border-red-200"
                      : "bg-emerald-100 text-emerald-700 border-2 border-emerald-200"
                  }`}
                >
                  {isInactive ? <UserX size={18} /> : <UserCheck size={18} />}
                  {data?.status || "Active"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold border-2 border-amber-200">
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
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border-2 border-slate-200 hover:shadow-md hover:border-blue-300 transition-all">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-slate-600 rounded-full flex items-center justify-center shadow-md">
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
                isInactive
                  ? "bg-red-100 text-red-700 border-2 border-red-200"
                  : "bg-emerald-100 text-emerald-700 border-2 border-emerald-200"
              }`}
            >
              {isInactive ? <UserX size={18} /> : <UserCheck size={18} />}
              {data?.status || "Active"}
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Page Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-2xl font-bold">SK Personnel Directory</h1>
                <p className="text-slate-600 mt-1 text-sm">
                  Official directory of Sangguniang Kabataan members
                </p>
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
              {/* Barangay Selector */}
              <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-6 mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-slate-900">
                    Select Barangay
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    value={selectedBarangay}
                    onChange={(e) => {
                      setSelectedBarangay(e.target.value);
                      fetchSKPersonnel(e.target.value);
                    }}
                    className="px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                  >
                    {barangays.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.barangayName}
                      </option>
                    ))}
                  </select>
                  {currentBarangay && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-xs text-slate-500 font-semibold">
                          Location
                        </p>
                        <p className="text-sm text-slate-900 font-bold">
                          {currentBarangay.city}, {currentBarangay.province}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

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
                <>
                  {/* Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {" "}
                    {/* Total Members */}
                    <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 p-4 ">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">
                          Total
                        </span>
                      </div>
                      <h3 className="text-slate-500 text-xs font-semibold mb-0.5">
                        Total Members
                      </h3>
                      <p className="text-2xl font-bold text-slate-900 mb-2">
                        {statistics.total}
                      </p>
                      <div className="flex items-center text-xs text-slate-500">
                        <Users className="w-3 h-3 text-blue-500 mr-1" />
                        <span>SK Personnel</span>
                      </div>
                    </div>
                    {/* Active Members */}
                    <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 p-4 hover:shadow-xl transition-all hover:-translate-y-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
                          <UserCheck className="w-5 h-5 text-white" />
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">
                          {statistics.activeRate}%
                        </span>
                      </div>
                      <h3 className="text-slate-500 text-xs font-semibold mb-0.5">
                        Active Members
                      </h3>
                      <p className="text-2xl font-bold text-slate-900 mb-2">
                        {statistics.active}
                      </p>
                      <div className="flex items-center text-xs text-slate-500">
                        <div className="flex-1 bg-slate-200 rounded-full h-1.5 mr-2">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-1.5 rounded-full transition-all duration-1000"
                            style={{ width: `${statistics.activeRate}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold">
                          {statistics.activeRate}%
                        </span>
                      </div>
                    </div>
                    {/* Inactive Members */}
                    <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 p-4 hover:shadow-xl transition-all hover:-translate-y-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-11 h-11 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
                          <UserX className="w-5 h-5 text-white" />
                        </div>
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-lg text-xs font-bold">
                          Inactive
                        </span>
                      </div>
                      <h3 className="text-slate-500 text-xs font-semibold mb-0.5">
                        Inactive Members
                      </h3>
                      <p className="text-2xl font-bold text-slate-900 mb-2">
                        {statistics.inactive}
                      </p>
                      <div className="flex items-center text-xs text-slate-500">
                        <div className="flex-1 bg-slate-200 rounded-full h-1.5 mr-2">
                          <div
                            className="bg-gradient-to-r from-red-500 to-red-600 h-1.5 rounded-full transition-all duration-1000"
                            style={{
                              width: `${statistics.total > 0 ? ((statistics.inactive / statistics.total) * 100).toFixed(1) : 0}%`,
                            }}
                          ></div>
                        </div>
                        <span className="font-semibold">
                          {statistics.total > 0
                            ? (
                                (statistics.inactive / statistics.total) *
                                100
                              ).toFixed(1)
                            : 0}
                          %
                        </span>
                      </div>
                    </div>
                    {/* Key Positions */}
                    <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 p-4 hover:shadow-xl transition-all hover:-translate-y-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                          <Award className="w-5 h-5 text-white" />
                        </div>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold">
                          Officers
                        </span>
                      </div>
                      <h3 className="text-slate-500 text-xs font-semibold mb-0.5">
                        Key Positions
                      </h3>
                      <p className="text-2xl font-bold text-slate-900 mb-2">
                        3
                      </p>
                      <div className="flex items-center text-xs text-slate-500">
                        <Shield className="w-3 h-3 text-purple-500 mr-1" />
                        <span>Executive Officers</span>
                      </div>
                    </div>
                  </div>

                  {/* Barangay Info Banner */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-6 mb-8">
                    <div className="flex items-center justify-between text-white">
                      <div>
                        <h2 className="text-2xl font-bold">
                          Barangay {currentBarangay?.barangayName}
                        </h2>
                        <p className="text-blue-100 mt-2">
                          Current SK Officials Directory
                        </p>
                      </div>
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <FileText className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Main Content Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Key Officials - 2 columns */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-b-2 border-slate-200">
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
                            data={skPersonnel.chairman}
                            isKeyOfficial={true}
                          />
                          <DirectoryItem
                            role="SK Secretary"
                            data={skPersonnel.secretary}
                            isKeyOfficial={true}
                          />
                          <DirectoryItem
                            role="SK Treasurer"
                            data={skPersonnel.treasurer}
                            isKeyOfficial={true}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Kagawad Members - 1 column */}
                    <div className="lg:col-span-1">
                      <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden sticky top-6">
                        <div className="bg-gradient-to-r from-slate-50 to-purple-50 px-6 py-4 border-b-2 border-slate-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-purple-600" />
                                <h3 className="text-lg font-bold text-slate-900">
                                  SK Kagawad
                                </h3>
                              </div>
                              <p className="text-sm text-slate-600 mt-1">
                                {skPersonnel.kagawad?.length || 0} member
                                {(skPersonnel.kagawad?.length || 0) !== 1
                                  ? "s"
                                  : ""}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="p-6">
                          {skPersonnel.kagawad?.length ? (
                            <div className="space-y-3 max-h-[600px] overflow-y-auto">
                              {skPersonnel.kagawad.map((k, index) => (
                                <DirectoryItem
                                  key={k._id || index}
                                  role="SK Kagawad"
                                  data={k}
                                  isKeyOfficial={false}
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
                  </div>
                </>
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
    </>
  );
};

export default SkPersonnelAdmin;
