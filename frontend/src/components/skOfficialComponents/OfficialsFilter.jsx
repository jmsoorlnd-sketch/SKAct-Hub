import React from "react";
import { Search, Filter } from "lucide-react";

const OfficialsFilters = ({ filters, setFilters, barangays }) => {
  return (
    <div className="bg-linear-to-r from-blue-50 to-purple-50 rounded-lg shadow-md border border-slate-200 p-2 sm:p-2.5 mb-3 sm:mb-4">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Filter className="w-3.5 h-3.5 text-blue-600" />
        <h2 className="text-xs sm:text-sm font-bold text-slate-900">
          Quick Filters
        </h2>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <div className="relative flex-1 min-w-[120px]">
          <Search
            className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400"
            size={12}
          />
          <input
            placeholder="Search..."
            className="w-full pl-6 pr-2 py-1.5 sm:py-2 border border-slate-300 rounded-md text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <select
          className="px-2 py-1.5 sm:py-2 border border-slate-300 rounded-md text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none cursor-pointer hover:border-slate-400"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">Status</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>

        <select
          className="px-2 py-1.5 sm:py-2 border border-slate-300 rounded-md text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none cursor-pointer hover:border-slate-400"
          value={filters.position}
          onChange={(e) => setFilters({ ...filters, position: e.target.value })}
        >
          <option value="">Position</option>
          <option>Chairman</option>
          <option>Secretary</option>
          <option>Treasurer</option>
        </select>

        <select
          className="px-2 py-1.5 sm:py-2 border border-slate-300 rounded-md text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none cursor-pointer hover:border-slate-400"
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

        {(filters.search ||
          filters.status ||
          filters.position ||
          filters.barangay) && (
          <button
            onClick={() =>
              setFilters({
                status: "",
                position: "",
                barangay: "",
                search: "",
              })
            }
            className="px-2.5 py-1.5 sm:py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-xs font-semibold transition-colors whitespace-nowrap"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default OfficialsFilters;
