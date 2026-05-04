import React from "react";
import { Users, UserCheck, UserX, MapPin } from "lucide-react";

const OfficialsStats = ({ stats, barangays }) => {
  return (
    <div className="flex justify-around items-center gap-1 sm:gap-2 mb-2 sm:mb-3 bg-white rounded-lg shadow-sm border border-slate-200 p-2 sm:p-3">
      {/* Stat 1 - Total */}
      <div className="flex flex-col items-center">
        <Users className="w-4 h-4 text-blue-600 mb-0.5" />
        <p className="text-xs font-bold text-slate-900">{stats.total}</p>
        <p className="text-[10px] text-slate-500">Total</p>
      </div>

      {/* Stat 2 - Active */}
      <div className="flex flex-col items-center">
        <UserCheck className="w-4 h-4 text-emerald-600 mb-0.5" />
        <p className="text-xs font-bold text-slate-900">{stats.active}</p>
        <p className="text-[10px] text-slate-500">{stats.activeRate}%</p>
      </div>

      {/* Stat 3 - Inactive */}
      <div className="flex flex-col items-center">
        <UserX className="w-4 h-4 text-red-600 mb-0.5" />
        <p className="text-xs font-bold text-slate-900">{stats.inactive}</p>
        <p className="text-[10px] text-slate-500">Inactive</p>
      </div>

      {/* Stat 4 - Barangays */}
      <div className="flex flex-col items-center">
        <MapPin className="w-4 h-4 text-purple-600 mb-0.5" />
        <p className="text-xs font-bold text-slate-900">
          {barangays?.length || 0}
        </p>
        <p className="text-[10px] text-slate-500">Brgy</p>
      </div>
    </div>
  );
};

export default OfficialsStats;
