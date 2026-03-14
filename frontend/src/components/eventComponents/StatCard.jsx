import React from "react";
import { CalendarDays } from "lucide-react";

const StatCard = ({ icon: Icon, title, value, color, subtitle, badge }) => {
  const colors = {
    blue: {
      bg: "from-blue-500 to-blue-600",
      badge: "bg-blue-100 text-blue-700",
      icon: "text-blue-500",
    },
    emerald: {
      bg: "from-emerald-500 to-emerald-600",
      badge: "bg-emerald-100 text-emerald-700",
      icon: "text-emerald-500",
    },
    purple: {
      bg: "from-purple-500 to-purple-600",
      badge: "bg-purple-100 text-purple-700",
      icon: "text-purple-500",
    },
    slate: {
      bg: "from-slate-500 to-slate-600",
      badge: "bg-slate-100 text-slate-700",
      icon: "text-slate-500",
    },
  };
  const c = colors[color];

  return (
    <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-11 h-11 bg-gradient-to-br ${c.bg} rounded-lg flex items-center justify-center shadow-md`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span
          className={`px-2 py-0.5 ${c.badge} rounded-md text-[11px] font-bold`}
        >
          {badge}
        </span>
      </div>
      <h3 className="text-slate-500 text-xs font-semibold mb-0.5">{title}</h3>
      <p className="text-2xl font-bold text-slate-900 mb-2">{value}</p>
      <div className="flex items-center text-[11px] text-slate-500">
        <CalendarDays className={`w-3 h-3 mr-1 ${c.icon}`} />
        <span>{subtitle}</span>
      </div>
    </div>
  );
};

export default StatCard;
