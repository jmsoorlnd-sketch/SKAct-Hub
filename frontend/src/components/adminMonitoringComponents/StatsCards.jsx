import {
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
  Image as ImageIcon,
  Activity,
} from "lucide-react";

const StatsCards = ({ stats, barangays }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* KPI Card 1 - Total Projects */}
      <div className="stat-card bg-white rounded-xl shadow-md border-2 border-slate-200 p-4 ">
        <div className="flex items-start justify-between mb-4">
          <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-xs font-bold">
            Total
          </span>
        </div>
        <h3 className="text-slate-500 text-xs font-semibold mb-0.5">
          Total Projects
        </h3>
        <p className="text-2xl font-bold text-slate-900 mb-2">
          {stats.totalProjects}
        </p>
        <div className="flex items-center text-xs text-slate-500">
          <Activity className="w-3 h-3 text-blue-500 mr-1" />
          <span>Across {barangays.length} barangays</span>
        </div>
      </div>

      {/* KPI Card 2 - Completed */}
      <div className="stat-card bg-white rounded-xl shadow-md border-2 border-slate-200 p-4 ">
        <div className="flex items-start justify-between mb-4">
          <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-xs font-bold">
            +{stats.completionRate}%
          </span>
        </div>
        <h3 className="text-slate-500 text-xs font-semibold mb-0.5">
          Completed
        </h3>
        <p className="text-2xl font-bold text-slate-900 mb-2">
          {stats.completedProjects}
        </p>
        <div className="flex items-center text-xs text-slate-500">
          <div className="flex-1 bg-slate-200 rounded-full h-2 mr-2">
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${stats.completionRate}%` }}
            ></div>
          </div>
          <span className="font-semibold">{stats.completionRate}%</span>
        </div>
      </div>

      {/* KPI Card 3 - In Progress */}
      <div className="stat-card bg-white rounded-xl shadow-md border-2 border-slate-200 p-4 ">
        <div className="flex items-start justify-between mb-4">
          <div className="w-11 h-11 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center shadow-md">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md text-xs font-bold">
            Active
          </span>
        </div>
        <h3 className="text-slate-500 text-xs font-semibold mb-0.5">
          In Progress
        </h3>
        <p className="text-2xl font-bold text-slate-900 mb-2">
          {stats.ongoingProjects}
        </p>
        <div className="flex items-center text-xs text-slate-500">
          <div className="flex-1 bg-slate-200 rounded-full h-2 mr-2">
            <div
              className="bg-gradient-to-r from-amber-500 to-amber-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${stats.ongoingRate}%` }}
            ></div>
          </div>
          <span className="font-semibold">{stats.ongoingRate}%</span>
        </div>
      </div>

      {/* KPI Card 4 - Success Rate */}
      <div className="stat-card bg-white rounded-xl shadow-md border-2 border-slate-200 p-4 ">
        <div className="flex items-start justify-between mb-4">
          <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md text-xs font-bold">
            {stats.successRate}%
          </span>
        </div>
        <h3 className="text-slate-500 text-xs font-semibold mb-0.5">
          Success Rate
        </h3>
        <p className="text-2xl font-bold text-slate-900 mb-2">
          {stats.successRate}%
        </p>
        <div className="flex items-center text-xs text-slate-500">
          <TrendingUp className="w-3 h-3 text-purple-500 mr-1" />
          <span>Based on completion</span>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
