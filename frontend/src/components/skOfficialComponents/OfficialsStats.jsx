import React from "react";
import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  MapPin,
  Award,
} from "lucide-react";

const OfficialsStats = ({ stats, barangays }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* KPI Card 1 - Total Officials */}
      <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
            <Users className="w-5 h-5 text-white" />
          </div>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[11px] font-bold">
            Total
          </span>
        </div>
        <h3 className="text-slate-500 text-xs font-semibold mb-0.5">
          Total Officials
        </h3>
        <p className="text-2xl font-bold text-slate-900 mb-2">{stats.total}</p>
        <div className="flex items-center text-[11px] text-slate-500">
          <Award className="w-3 h-3 text-blue-500 mr-1" />
          <span>Registered in system</span>
        </div>
      </div>

      {/* KPI Card 2 - Active */}
      <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
            <UserCheck className="w-5 h-5 text-white" />
          </div>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[11px] font-bold">
            {stats.activeRate}%
          </span>
        </div>
        <h3 className="text-slate-500 text-xs font-semibold mb-0.5">
          Active Officials
        </h3>
        <p className="text-2xl font-bold text-slate-900 mb-2">{stats.active}</p>
        <div className="flex items-center text-[11px] text-slate-500">
          <div className="flex-1 bg-slate-200 rounded-full h-1.5 mr-2">
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${stats.activeRate}%` }}
            ></div>
          </div>
          <span className="font-semibold">{stats.activeRate}%</span>
        </div>
      </div>

      {/* KPI Card 3 - Inactive */}
      <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="w-11 h-11 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-md">
            <UserX className="w-5 h-5 text-white" />
          </div>
          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-md text-[11px] font-bold">
            Inactive
          </span>
        </div>
        <h3 className="text-slate-500 text-xs font-semibold mb-0.5">
          Inactive Officials
        </h3>
        <p className="text-2xl font-bold text-slate-900 mb-2">
          {stats.inactive}
        </p>
        <div className="flex items-center text-[11px] text-slate-500">
          <div className="flex-1 bg-slate-200 rounded-full h-1.5 mr-2">
            <div
              className="bg-gradient-to-r from-red-500 to-red-600 h-1.5 rounded-full transition-all duration-1000"
              style={{
                width: `${((stats.inactive / stats.total) * 100).toFixed(1)}%`,
              }}
            ></div>
          </div>
          <span className="font-semibold">
            {((stats.inactive / stats.total) * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* KPI Card 4 - Barangays */}
      <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md text-[11px] font-bold">
            Active
          </span>
        </div>
        <h3 className="text-slate-500 text-xs font-semibold mb-0.5">
          Barangays
        </h3>
        <p className="text-2xl font-bold text-slate-900 mb-2">
          {barangays?.length || 0}
        </p>
        <div className="flex items-center text-[11px] text-slate-500">
          <TrendingUp className="w-3 h-3 text-purple-500 mr-1" />
          <span>With SK officials</span>
        </div>
      </div>
    </div>
  );
};

export default OfficialsStats;
