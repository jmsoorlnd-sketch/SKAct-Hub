import React from "react";
import RowActions from "../official/RowActions";
import { Users, UserCheck, UserX, Briefcase, Mail, MapPin } from "lucide-react";

const OfficialsTable = ({
  officials,
  filteredOfficials,
  setSelectedOfficial,
  toggleStatus,
  setIsEditOpen,
  handleDelete,
  openProfile,
}) => {
  return (
    <div className="lg:col-span-3 bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden">
      <div className="bg-linear-to-r from-slate-50 to-blue-50 px-3 sm:px-6 py-3 sm:py-4 border-b-2 border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Officials List
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Showing {filteredOfficials.length} of {officials.length} officials
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="max-h-[600px] overflow-y-auto relative">
          <table className="w-full">
            <thead className="sticky top-0 z-0 pointer-events-none bg-linear-to-r from-slate-100 to-slate-50">
              <tr>
                <th className="px-2 sm:px-6 py-2 sm:py-4 text-left text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="hidden sm:table-cell px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Position
                </th>
                <th className="hidden lg:table-cell px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Barangay
                </th>
                <th className="hidden md:table-cell px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-2 sm:px-6 py-2 sm:py-4 text-center text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-1 sm:px-3 py-2 sm:py-3 w-[8%] sm:w-[6%] text-center text-[10px] sm:text-xs font-bold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 relative z-10 pointer-events-auto text-sm">
              {filteredOfficials.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-3 sm:px-6 py-8 sm:py-12 text-center"
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-12 sm:w-16 h-12 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mb-2 sm:mb-3">
                        <Users className="text-slate-400" size={24} />
                      </div>
                      <p className="text-slate-500 font-medium text-sm sm:text-base">
                        No officials found
                      </p>
                      <p className="text-slate-400 text-xs sm:text-sm mt-1">
                        Try adjusting your filters
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOfficials.map((official) => (
                  <tr
                    key={official._id}
                    className={`relative z-20 transition-colors ${
                      official.status === "Inactive"
                        ? "bg-red-50 hover:bg-red-100"
                        : "bg-white hover:bg-blue-50"
                    }`}
                  >
                    <td className="px-2 sm:px-6 py-2 sm:py-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div>
                          <p className="font-semibold text-slate-900 text-xs sm:text-base">
                            {official.firstname} {official.lastname}
                          </p>
                          <p className="text-[10px] sm:text-xs text-slate-500">
                            @{official.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                        <span className="font-medium text-slate-900 text-xs sm:text-base">
                          {official.position}
                        </span>
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                        <span className="text-slate-700 text-xs sm:text-base">
                          {official.barangay?.barangayName || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                        <span className="text-slate-700 text-xs sm:text-sm truncate">
                          {official.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold whitespace-nowrap ${
                          official.status === "Active"
                            ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-200"
                            : "bg-red-100 text-red-700 border-2 border-red-200"
                        }`}
                      >
                        {official.status === "Active" ? (
                          <UserCheck size={12} className="sm:w-3.5 sm:h-3.5" />
                        ) : (
                          <UserX size={12} className="sm:w-3.5 sm:h-3.5" />
                        )}
                        <span className="hidden sm:inline">
                          {official.status}
                        </span>
                        <span className="sm:hidden">
                          {official.status === "Active" ? "A" : "I"}
                        </span>
                      </span>
                    </td>
                    <td className="px-1 sm:px-3 py-1 sm:py-2 text-center">
                      <RowActions
                        official={official}
                        onEdit={(o) => {
                          setSelectedOfficial(o);
                          setIsEditOpen(true);
                        }}
                        onView={(o) => openProfile(o)}
                        onToggleStatus={(o) => toggleStatus(o)}
                        onDelete={(o) => handleDelete(o)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OfficialsTable;
