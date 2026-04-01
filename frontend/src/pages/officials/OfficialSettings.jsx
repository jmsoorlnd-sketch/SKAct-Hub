import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  Package,
  Zap,
  Users,
  Calendar,
  Archive,
  MessageSquare,
  History,
  CheckCircle,
  MapPin,
  HelpCircle,
} from "lucide-react";

const OfficialSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  /* System information */
  const systemInfo = {
    version: "1.0.0",
    releaseDate: "April 2026",
    environment: "Production",
  };

  const systemFeatures = [
    {
      id: 1,
      name: "Document Storage",
      description:
        "Submit and store documents requiring admin approval before storage",
      icon: MessageSquare,
      status: "Active",
    },
    {
      id: 2,
      name: "Event Calendar",
      description: "View and manage community events and activities",
      icon: Calendar,
      status: "Active",
    },
    {
      id: 3,
      name: "SK Personnel Management",
      description: "Track and manage SK personnel information",
      icon: Users,
      status: "Active",
    },
    {
      id: 4,
      name: "Barangay Storage",
      description: "Access and manage barangay documents and files",
      icon: Archive,
      status: "Active",
    },
    {
      id: 5,
      name: "Real-time Notifications",
      description: "Receive instant notifications for important updates",
      icon: Zap,
      status: "Active",
    },
    {
      id: 6,
      name: "Activity Updates",
      description: "Track activity progress and updates",
      icon: Package,
      status: "Active",
    },
    {
      id: 7,
      name: "Activity History",
      description: "View your personal activity and document submissions",
      icon: History,
      status: "Active",
    },
    {
      id: 8,
      name: "Approval Status Tracker",
      description: "Track approval status of submitted documents",
      icon: CheckCircle,
      status: "Active",
    },
    {
      id: 9,
      name: "Barangay Information",
      description: "View your barangay details and resources",
      icon: MapPin,
      status: "Active",
    },
    {
      id: 10,
      name: "Help / Support",
      description: "Access help documentation and contact support",
      icon: HelpCircle,
      status: "Active",
    },
  ];

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser || storedUser.role !== "Official") {
      navigate("/");
      return;
    }
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-slate-600">Loading Settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg p-3">
            <Settings className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
              Settings
            </h1>
            <p className="text-slate-600">
              System configuration and feature information
            </p>
          </div>
        </div>

        {/* System Version Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Package className="text-blue-600" size={24} />
            System Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Version Card */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-l-4 border-blue-600">
              <p className="text-slate-600 text-sm font-semibold mb-2">
                VERSION
              </p>
              <p className="text-3xl font-bold text-blue-600 mb-1">
                v{systemInfo.version}
              </p>
              <p className="text-xs text-slate-500">Current system version</p>
            </div>

            {/* Release Date Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-6 border-l-4 border-indigo-600">
              <p className="text-slate-600 text-sm font-semibold mb-2">
                RELEASE DATE
              </p>
              <p className="text-xl font-bold text-indigo-600 mb-1">
                {systemInfo.releaseDate}
              </p>
              <p className="text-xs text-slate-500">Latest release</p>
            </div>

            {/* Environment Card */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-l-4 border-green-600">
              <p className="text-slate-600 text-sm font-semibold mb-2">
                ENVIRONMENT
              </p>
              <p className="text-xl font-bold text-green-600 mb-1">
                {systemInfo.environment}
              </p>
              <p className="text-xs text-slate-500">Running status</p>
            </div>
          </div>
        </div>

        {/* System Features Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Zap className="text-amber-600" size={24} />
            System Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {systemFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.id}
                  className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 rounded-lg p-3 flex-shrink-0">
                      <Icon className="text-blue-600" size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-1">
                        {feature.name}
                      </h3>
                      <p className="text-sm text-slate-600 mb-2">
                        {feature.description}
                      </p>
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        {feature.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mt-6 border-t-4 border-blue-600">
          <h3 className="text-lg font-bold text-slate-900 mb-3">Need Help?</h3>
          <p className="text-slate-600 mb-3">
            For more information about system features or to report issues,
            please contact the system administrator.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-slate-700">
              <span className="font-semibold">Version Info: </span>
              SKActhub v{systemInfo.version} ({systemInfo.releaseDate})
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficialSettings;
