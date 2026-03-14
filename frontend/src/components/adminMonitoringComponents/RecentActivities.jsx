import { memo } from "react";
import {
  FileText,
  CheckCircle,
  Clock,
  Image as ImageIcon,
  Calendar,
} from "lucide-react";

const RecentActivities = ({ recentActivities }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-50 to-indigo-50 px-6 py-4 border-b-2 border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Recent Activities
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Latest project updates
            </p>
          </div>
        </div>
      </div>
      <div className="p-6">
        {recentActivities.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="text-slate-400" size={32} />
            </div>
            <p className="text-sm text-slate-500 font-medium">
              No recent activities
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentActivities.map((activity, index) => {
              const status = activity.document?.status || activity.status;
              const isCompleted = status === "completed";
              const isOngoing = status === "ongoing";
              const isApproved = status === "approved";

              return (
                <div key={activity._id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                        isCompleted
                          ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                          : isOngoing
                            ? "bg-gradient-to-br from-amber-500 to-amber-600"
                            : "bg-gradient-to-br from-blue-500 to-blue-600"
                      }`}
                      style={{
                        boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.1)",
                      }}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : isOngoing ? (
                        <Clock className="w-5 h-5 text-white" />
                      ) : (
                        <FileText className="w-5 h-5 text-white" />
                      )}
                    </div>
                    {index < recentActivities.length - 1 && (
                      <div className="w-0.5 h-full bg-slate-200 mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-bold text-slate-900">
                        {activity.documentName ||
                          activity.document?.subject ||
                          "Document"}
                      </h3>
                      <span className="text-xs text-slate-500 font-semibold">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      {activity.barangay?.barangayName ||
                        activity.barangay?.barangay}{" "}
                      - From:{" "}
                      {activity.document?.sender?.firstname ||
                        activity.uploadedBy?.firstname}{" "}
                      {activity.document?.sender?.lastname ||
                        activity.uploadedBy?.lastname}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-bold ${
                          isCompleted
                            ? "bg-emerald-100 text-emerald-700"
                            : isOngoing
                              ? "bg-amber-100 text-amber-700"
                              : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {status}
                      </span>
                    </div>
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

export default memo(RecentActivities);
