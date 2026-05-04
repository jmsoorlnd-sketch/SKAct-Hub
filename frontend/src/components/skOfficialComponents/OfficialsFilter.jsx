import React from "react";
import { Search, Filter } from "lucide-react";

const OfficialsFilters = ({ filters, setFilters, barangays }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-1.5 sm:p-2 mb-2 sm:mb-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Filter className="w-3 h-3 text-slate-600" />
        <h2 className="text-xs sm:text-sm font-bold text-slate-900">Filters</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2">
        <div className="relative">
          <Search
            className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400"
            size={12}
          />
          <input
            placeholder="Search..."
            className="w-full pl-7 pr-2 py-1 sm:py-1.5 border border-slate-200 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <select
          className="px-2 py-1 sm:py-1.5 border border-slate-200 rounded text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all appearance-none cursor-pointer"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">Status</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>

        <select
          className="px-2 py-1 sm:py-1.5 border border-slate-200 rounded text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all appearance-none cursor-pointer"
          value={filters.position}
          onChange={(e) => setFilters({ ...filters, position: e.target.value })}
        >
          <option value="">Position</option>
          <option>Chairman</option>
          <option>Secretary</option>
          <option>Treasurer</option>
        </select>

        <select
          className="px-2 py-1 sm:py-1.5 border border-slate-200 rounded text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all appearance-none cursor-pointer"
          value={filters.barangay}
          onChange={(e) => setFilters({ ...filters, barangay: e.target.value })}
        >
          <option value="">Barangay</option>
          {barangays.map((b) => (
            <option key={b._id} value={b._id}>
              {b.barangayName}
            </option>
          ))}
        </select>
      </div>

      {/* Active Filters Display */}
      {(filters.search ||
        filters.status ||
        filters.position ||
        filters.barangay) && (
        <div className="mt-1.5 hidden sm:flex items-center gap-1 flex-wrap text-[10px]">
          <span className="text-slate-600 font-semibold">Filters:</span>
          {filters.search && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold\">
              {filters.search}
            </span>
          )}
          {filters.status && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold\">
              {filters.status}
            </span>
          )}
          {filters.position && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold\">
              {filters.position}
            </span>
          )}
          {filters.barangay && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold\">
              {barangays.find((b) => b._id === filters.barangay)?.barangayName}
            </span>
          )}
          <button
            onClick={() =>
              setFilters({
                status: "",
                position: "",
                barangay: "",
                search: "",
              })
            }
            className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold hover:bg-red-200 transition-colors\"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

export default OfficialsFilters;
