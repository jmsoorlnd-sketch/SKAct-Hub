import { memo } from "react";

const DonutChart = ({ stats }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-50 to-purple-50 px-6 py-4 border-b-2 border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">Project Status</h2>
        <p className="text-sm text-slate-600 mt-1">Current distribution</p>
      </div>
      <div className="p-6">
        {/* Donut Chart */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative w-48 h-48">
            <svg className="transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="20"
              />
              {/* Completed (Green) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#10b981"
                strokeWidth="20"
                strokeDasharray={`${(stats.completionRate / 100) * 251} 251`}
                strokeLinecap="round"
              />
              {/* In Progress (Amber) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="20"
                strokeDasharray={`${(stats.ongoingRate / 100) * 251} 251`}
                strokeDashoffset={`-${(stats.completionRate / 100) * 251}`}
                strokeLinecap="round"
              />
              {/* Pending (Slate) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#64748b"
                strokeWidth="20"
                strokeDasharray={`${(stats.pendingRate / 100) * 251} 251`}
                strokeDashoffset={`-${((stats.completionRate + stats.ongoingRate) / 100) * 251}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-slate-900">
                {stats.totalProjects}
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                Total
              </span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border-2 border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
              <span className="text-sm font-semibold text-slate-900">
                Completed
              </span>
            </div>
            <span className="text-sm font-bold text-emerald-700">
              {stats.completedProjects} ({stats.completionRate}%)
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border-2 border-amber-200">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
              <span className="text-sm font-semibold text-slate-900">
                In Progress
              </span>
            </div>
            <span className="text-sm font-bold text-amber-700">
              {stats.ongoingProjects} ({stats.ongoingRate}%)
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border-2 border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-slate-500 rounded-full"></div>
              <span className="text-sm font-semibold text-slate-900">
                Pending
              </span>
            </div>
            <span className="text-sm font-bold text-slate-700">
              {stats.approvedProjects} ({stats.pendingRate}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(DonutChart);
