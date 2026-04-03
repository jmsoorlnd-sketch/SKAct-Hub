import React from "react";
import { CalendarDays } from "lucide-react";

const StatCard = ({
  icon: Icon,
  title,
  value,
  color,
  subtitle,
  badge,
  compact = false,
}) => {
  const compactClasses = {
    container: compact ? "p-2" : "p-3",
    iconSize: compact ? "w-4 h-4" : "w-5 h-5",
    title: compact ? "text-[10px]" : "text-xs",
    value: compact ? "text-lg" : "text-xl",
    subtitle: compact ? "text-[9px]" : "text-[10px]",
    badge: compact ? "px-1 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]",
  };

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
    <div
      className={`bg-white rounded-lg shadow-sm border-2 border-slate-200 ${compactClasses.container}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div
          className={`w-8 h-8 ${compact ? "w-8 h-8" : "w-9 h-9"} bg-linear-to-br ${c.bg} rounded-lg flex items-center justify-center shadow-sm`}
        >
          <Icon className={`${compact ? "w-4 h-4" : "w-5 h-5"} text-white`} />
        </div>
        <span
          className={`${c.badge} rounded-md ${compactClasses.badge} font-bold`}
        >
          {badge}
        </span>
      </div>
      <h3
        className={`text-slate-500 ${compactClasses.title} font-semibold mb-0.5`}
      >
        {title}
      </h3>
      <p className={`font-bold text-slate-900 mb-1 ${compactClasses.value}`}>
        {value}
      </p>
      <div
        className={`flex items-center ${compactClasses.subtitle} text-slate-500`}
      >
        <CalendarDays
          className={`mr-1 ${c.icon} ${compact ? "w-3 h-3" : "w-3 h-3"}`}
        />
        <span>{subtitle}</span>
      </div>
    </div>
  );
};

export default StatCard;
