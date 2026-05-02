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
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 mb-3 sm:mb-4 md:mb-6">
      {/* KPI Card 1 - Total Officials */}
      <div className="bg-white rounded-lg sm:rounded-lg md:rounded-xl shadow-md border border-slate-200 p-1.5 sm:p-2 md:p-3 lg:p-4">
        <div className="flex items-start justify-between mb-1 sm:mb-2">
          <div className="w-7 sm:w-8 md:w-9 lg:w-11 h-7 sm:h-8 md:h-9 lg:h-11 bg-linear-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
            <Users className="w-3.5 sm:w-4 md:w-4 lg:w-5 h-3.5 sm:h-4 md:h-4 lg:h-5 text-white" />
          </div>
          <span className="px-1 sm:px-1.5 py-px bg-blue-100 text-blue-700 rounded-md text-[8px] sm:text-[9px] md:text-[10px] font-bold">
            Total
          </span>
        </div>
        <h3 className="text-slate-500 text-[8px] sm:text-[9px] md:text-xs font-semibold mb-0.5 truncate">
          Total Officials
        </h3>
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-slate-900 mb-0.5 sm:mb-1">
          {stats.total}
        </p>
        <div className="flex items-center text-[7px] sm:text-[8px] md:text-[9px] lg:text-[11px] text-slate-500 gap-px sm:gap-0.5">
          <Award className="w-2 sm:w-2.5 h-2 sm:h-2.5 text-blue-500 shrink-0" />
          <span className="truncate">Registered</span>
        </div>
      </div>

      {/* KPI Card 2 - Active */}
      <div className="bg-white rounded-lg sm:rounded-lg md:rounded-xl shadow-md border border-slate-200 p-1.5 sm:p-2 md:p-3 lg:p-4">
        <div className="flex items-start justify-between mb-1 sm:mb-2">
          <div className="w-7 sm:w-8 md:w-9 lg:w-11 h-7 sm:h-8 md:h-9 lg:h-11 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
            <UserCheck className="w-3.5 sm:w-4 md:w-4 lg:w-5 h-3.5 sm:h-4 md:h-4 lg:h-5 text-white" />
          </div>
          <span className="px-1 sm:px-1.5 py-px bg-emerald-100 text-emerald-700 rounded-md text-[8px] sm:text-[9px] md:text-[10px] font-bold">
            {stats.activeRate}%
          </span>
        </div>
        <h3 className="text-slate-500 text-[8px] sm:text-[9px] md:text-xs font-semibold mb-0.5 truncate">
          Active
        </h3>
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-slate-900 mb-0.5 sm:mb-1">
          {stats.active}
        </p>
        <div className="flex items-center text-[7px] sm:text-[8px] md:text-[9px] lg:text-[11px] text-slate-500 gap-0.5">
          <div className="flex-1 bg-slate-200 rounded-full h-0.5 sm:h-1">
            <div
              className="bg-linear-to-r from-emerald-500 to-emerald-600 h-0.5 sm:h-1 rounded-full transition-all duration-1000"
              style={{ width: `${stats.activeRate}%` }}
            ></div>
          </div>
          <span className="font-semibold whitespace-nowrap text-[7px] sm:text-[8px]">
            {stats.activeRate}%
          </span>
        </div>
      </div>

      {/* KPI Card 3 - Inactive */}
      <div className="bg-white rounded-lg sm:rounded-lg md:rounded-xl shadow-md border border-slate-200 p-1.5 sm:p-2 md:p-3 lg:p-4">
        <div className="flex items-start justify-between mb-1 sm:mb-2">
          <div className="w-7 sm:w-8 md:w-9 lg:w-11 h-7 sm:h-8 md:h-9 lg:h-11 bg-linear-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-md">
            <UserX className="w-3.5 sm:w-4 md:w-4 lg:w-5 h-3.5 sm:h-4 md:h-4 lg:h-5 text-white" />
          </div>
          <span className="px-1 sm:px-1.5 py-px bg-red-100 text-red-700 rounded-md text-[8px] sm:text-[9px] md:text-[10px] font-bold">
            Inactive
          </span>
        </div>
        <h3 className="text-slate-500 text-[8px] sm:text-[9px] md:text-xs font-semibold mb-0.5 truncate">
          Inactive
        </h3>
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-slate-900 mb-0.5 sm:mb-1">
          {stats.inactive}
        </p>
        <div className="flex items-center text-[7px] sm:text-[8px] md:text-[9px] lg:text-[11px] text-slate-500 gap-0.5">
          <div className="flex-1 bg-slate-200 rounded-full h-0.5 sm:h-1">
            <div
              className="bg-linear-to-r from-red-500 to-red-600 h-0.5 sm:h-1 rounded-full transition-all duration-1000"
              style={{
                width: `${((stats.inactive / stats.total) * 100).toFixed(1)}%`,
              }}
            ></div>
          </div>
          <span className="font-semibold whitespace-nowrap text-[7px] sm:text-[8px]">
            {((stats.inactive / stats.total) * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* KPI Card 4 - Barangays */}
      <div className="bg-white rounded-lg sm:rounded-lg md:rounded-xl shadow-md border border-slate-200 p-1.5 sm:p-2 md:p-3 lg:p-4">
        <div className="flex items-start justify-between mb-1 sm:mb-2">
          <div className="w-7 sm:w-8 md:w-9 lg:w-11 h-7 sm:h-8 md:h-9 lg:h-11 bg-linear-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
            <MapPin className="w-3.5 sm:w-4 md:w-4 lg:w-5 h-3.5 sm:h-4 md:h-4 lg:h-5 text-white" />
          </div>
          <span className="px-1 sm:px-1.5 py-px bg-purple-100 text-purple-700 rounded-md text-[8px] sm:text-[9px] md:text-[10px] font-bold">
            Active
          </span>
        </div>
        <h3 className="text-slate-500 text-[8px] sm:text-[9px] md:text-xs font-semibold mb-0.5 truncate">
          Barangays
        </h3>
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-slate-900 mb-0.5 sm:mb-1">
          {barangays?.length || 0}
        </p>
        <div className="flex items-center text-[7px] sm:text-[8px] md:text-[9px] lg:text-[11px] text-slate-500 gap-px sm:gap-0.5">
          <TrendingUp className="w-2 sm:w-2.5 h-2 sm:h-2.5 text-purple-500 shrink-0" />
          <span className="truncate">With SK</span>
        </div>
      </div>
    </div>
  );
};

export default OfficialsStats;
