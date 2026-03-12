import React from "react";
import { Search, Filter } from "lucide-react";

const OfficialsFilters = ({ filters, setFilters, barangays }) => {
  return (
    <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-slate-600" />
        <h2 className="text-base font-bold text-slate-900">Filters</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            placeholder="Search officials..."
            className="w-full pl-9 pr-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <select
          className="px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all appearance-none cursor-pointer"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Status</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>

        <select
          className="px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all appearance-none cursor-pointer"
          value={filters.position}
          onChange={(e) => setFilters({ ...filters, position: e.target.value })}
        >
          <option value="">All Positions</option>
          <option>Chairman</option>
          <option>Secretary</option>
          <option>Treasurer</option>
        </select>

        <select
          className="px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all appearance-none cursor-pointer"
          value={filters.barangay}
          onChange={(e) => setFilters({ ...filters, barangay: e.target.value })}
        >
          <option value="">All Barangays</option>
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
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-600 font-semibold">
            Active Filters:
          </span>
          {filters.search && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[11px] font-bold">
              Search: {filters.search}
            </span>
          )}
          {filters.status && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[11px] font-bold">
              Status: {filters.status}
            </span>
          )}
          {filters.position && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[11px] font-bold">
              Position: {filters.position}
            </span>
          )}
          {filters.barangay && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[11px] font-bold">
              Barangay:{" "}
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
            className="px-2 py-0.5 bg-red-100 text-red-700 rounded-md text-[11px] font-bold hover:bg-red-200 transition-colors"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
};

export default OfficialsFilters;
