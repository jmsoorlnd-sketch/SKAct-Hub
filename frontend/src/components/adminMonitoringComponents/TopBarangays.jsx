import React from "react";
import { Image as ImageIcon, Award } from "lucide-react";

const TopBarangays = ({ topBarangays }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-50 to-emerald-50 px-6 py-4 border-b-2 border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Top Performing Barangays
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Based on completion rate
            </p>
          </div>
        </div>
      </div>
      <div className="p-6">
        {topBarangays.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Award className="text-slate-400" size={32} />
            </div>
            <p className="text-sm text-slate-500 font-medium">
              No data available
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {topBarangays.map((item, index) => {
              const rankColors = [
                {
                  bg: "from-emerald-50 to-teal-50",
                  border: "border-emerald-200",
                  badge: "bg-emerald-600",
                  score: "text-emerald-600",
                },
                {
                  bg: "from-blue-50 to-indigo-50",
                  border: "border-blue-200",
                  badge: "bg-blue-600",
                  score: "text-blue-600",
                },
                {
                  bg: "from-purple-50 to-pink-50",
                  border: "border-purple-200",
                  badge: "bg-purple-600",
                  score: "text-purple-600",
                },
                {
                  bg: "from-slate-50 to-gray-50",
                  border: "border-slate-200",
                  badge: "bg-slate-600",
                  score: "text-slate-600",
                },
              ];
              const colors = rankColors[index] || rankColors[3];

              return (
                <div
                  key={item.barangay._id}
                  className={`p-4 bg-gradient-to-r ${colors.bg} rounded-xl border-2 ${colors.border} `}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900">
                          {item.barangay.barangayName || item.barangay.barangay}
                        </h3>
                        <span
                          className={`px-2 py-0.5 ${colors.badge} text-white rounded-md text-xs font-bold`}
                        >
                          {index + 1}
                          {index === 0
                            ? "st"
                            : index === 1
                              ? "nd"
                              : index === 2
                                ? "rd"
                                : "th"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        {item.barangay.city}, {item.barangay.province}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${colors.score}`}>
                        {item.completionRate.toFixed(0)}%
                      </p>
                      <p className="text-xs text-slate-500">Score</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">
                      Completed:{" "}
                      <span className={`font-bold ${colors.score}`}>
                        {item.completed}/{item.total}
                      </span>
                    </span>
                    <span className="text-slate-600">
                      Projects:{" "}
                      <span className="font-bold text-slate-900">
                        {item.total}
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopBarangays;
