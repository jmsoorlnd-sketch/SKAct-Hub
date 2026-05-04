import React from "react";
import { Users, UserCheck, UserX, MapPin } from "lucide-react";

const OfficialsStats = ({ stats, barangays }) => {
  return (
    <div className="flex justify-between items-center gap-2 sm:gap-3 mb-3 sm:mb-4 bg-linear-to-r from-blue-50 to-purple-50 rounded-lg shadow-md border border-slate-200 p-2.5 sm:p-3.5">
      {/* Stat 1 - Total */}
      <div className="flex-1 flex flex-col items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-md hover:bg-white/40 transition-colors">
        <div className="bg-blue-100 p-1.5 rounded-md mb-1">
          <Users className="w-4 h-4 text-blue-600" />
        </div>
        <p className="text-sm sm:text-base font-bold text-slate-900">
          {stats.total}
        </p>
        <p className="text-[11px] sm:text-xs text-slate-600 font-medium">
          Total
        </p>
      </div>

      {/* Divider */}
      <div className="h-10 w-px bg-linear-to-b from-slate-200 via-slate-300 to-slate-200"></div>

      {/* Stat 2 - Active */}
      <div className="flex-1 flex flex-col items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-md hover:bg-white/40 transition-colors">
        <div className="bg-emerald-100 p-1.5 rounded-md mb-1">
          <UserCheck className="w-4 h-4 text-emerald-600" />
        </div>
        <p className="text-sm sm:text-base font-bold text-slate-900">
          {stats.active}
        </p>
        <p className="text-[11px] sm:text-xs text-slate-600 font-medium">
          {stats.activeRate}%
        </p>
      </div>

      {/* Divider */}
      <div className="h-10 w-px bg-linear-to-b from-slate-200 via-slate-300 to-slate-200"></div>

      {/* Stat 3 - Inactive */}
      <div className="flex-1 flex flex-col items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-md hover:bg-white/40 transition-colors">
        <div className="bg-red-100 p-1.5 rounded-md mb-1">
          <UserX className="w-4 h-4 text-red-600" />
        </div>
        <p className="text-sm sm:text-base font-bold text-slate-900">
          {stats.inactive}
        </p>
        <p className="text-[11px] sm:text-xs text-slate-600 font-medium">
          Inactive
        </p>
      </div>

      {/* Divider */}
      <div className="h-10 w-px bg-linear-to-b from-slate-200 via-slate-300 to-slate-200"></div>

      {/* Stat 4 - Barangays */}
      <div className="flex-1 flex flex-col items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-md hover:bg-white/40 transition-colors">
        <div className="bg-purple-100 p-1.5 rounded-md mb-1">
          <MapPin className="w-4 h-4 text-purple-600" />
        </div>
        <p className="text-sm sm:text-base font-bold text-slate-900">
          {barangays?.length || 0}
        </p>
        <p className="text-[11px] sm:text-xs text-slate-600 font-medium">
          Brgy
        </p>
      </div>
    </div>
  );
};

export default OfficialsStats;
