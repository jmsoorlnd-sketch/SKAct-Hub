import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  Package,
  Zap,
  Users,
  Calendar,
  Archive,
  MessageSquare,
  BarChart3,
  Clock,
  Database,
  Download,
  Shield,
} from "lucide-react";

const AdminSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [backupStatus, setBackupStatus] = useState("");
  const [restoreStatus, setRestoreStatus] = useState("");
  const restoreFileRef = useRef(null);

  const [systemInfo, setSystemInfo] = useState({
    version: "1.0.0",
    releaseDate: "April 2026",
    environment: "Production",
  });

  const [systemFeatures, setSystemFeatures] = useState([
    {
      id: 1,
      name: "Document Storage",
      description:
        "Store and manage documents with approval workflow before archival",
      icon: MessageSquare,
      status: "Active",
    },
    {
      id: 2,
      name: "Event Scheduling",
      description:
        "Create, manage, and schedule community events and activities",
      icon: Calendar,
      status: "Active",
    },
    {
      id: 3,
      name: "Youth Profiles",
      description: "View and manage SK officials and youth profiles",
      icon: Users,
      status: "Active",
    },
    {
      id: 4,
      name: "SK Personnel Management",
      description: "Track and manage SK personnel information and status",
      icon: Users,
      status: "Active",
    },
    {
      id: 5,
      name: "Barangay Management",
      description: "Oversee and manage barangay storage and documents",
      icon: Archive,
      status: "Active",
    },
    {
      id: 6,
      name: "Monitoring & Evaluation",
      description: "Track system performance and analytics",
      icon: BarChart3,
      status: "Active",
    },
    {
      id: 7,
      name: "User Logs",
      description: "Monitor user activities and system logs",
      icon: Clock,
      status: "Active",
    },
    {
      id: 8,
      name: "Real-time Notifications",
      description: "Manage and send system notifications",
      icon: Zap,
      status: "Active",
    },
    {
      id: 9,
      name: "System Backup & Recovery",
      description: "Manage system backups and data recovery options",
      icon: Database,
      status: "Active",
    },
    {
      id: 10,
      name: "Reports & Export",
      description: "Generate and export system reports and data",
      icon: Download,
      status: "Active",
    },
    {
      id: 11,
      name: "Data Privacy & Security",
      description: "Manage data retention and security policies",
      icon: Shield,
      status: "Active",
    },
  ]);

  const handleCreateBackup = () => {
    const backupData = {
      systemInfo,
      systemFeatures,
      createdAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `skacthub-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setBackupStatus(
      "Backup created successfully. Save the file to restore later.",
    );
    setRestoreStatus("");
  };

  const handleRestoreFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const content = JSON.parse(loadEvent.target.result);
        if (content.systemInfo && content.systemFeatures) {
          setSystemInfo(content.systemInfo);
          setSystemFeatures(content.systemFeatures);
          setRestoreStatus("System restored successfully from backup.");
          setBackupStatus("");
        } else {
          throw new Error("Invalid backup file");
        }
      } catch (restoreError) {
        console.error(restoreError);
        setRestoreStatus(
          "Unable to restore backup. Please upload a valid backup file.",
        );
      }
    };
    reader.readAsText(file);
    event.target.value = null;
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser || storedUser.role !== "Admin") {
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
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-linear-to-br from-blue-600 to-indigo-600 rounded-lg p-3">
            <Settings className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
              Admin Settings
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
            <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-600">
              <p className="text-slate-600 text-sm font-semibold mb-2">
                VERSION
              </p>
              <p className="text-3xl font-bold text-blue-600 mb-1">
                v{systemInfo.version}
              </p>
              <p className="text-xs text-slate-500">Current system version</p>
            </div>

            {/* Release Date Card */}
            <div className="bg-indigo-50 rounded-lg p-6 border-l-4 border-indigo-600">
              <p className="text-slate-600 text-sm font-semibold mb-2">
                RELEASE DATE
              </p>
              <p className="text-xl font-bold text-indigo-600 mb-1">
                {systemInfo.releaseDate}
              </p>
              <p className="text-xs text-slate-500">Latest release</p>
            </div>

            {/* Environment Card */}
            <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-600">
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
                  id={
                    feature.name === "Reports & Export" ? "reports" : undefined
                  }
                  className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 rounded-lg p-3 shrink-0">
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

        {/* Backup & Recovery Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mt-6 border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Database className="text-blue-600" size={24} />
            Backup & Recovery
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            Export a system backup file or restore the admin settings and
            feature configuration from a previously saved backup.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleCreateBackup}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-all duration-200"
            >
              <Download size={16} />
              Download Backup
            </button>
            <button
              type="button"
              onClick={() => restoreFileRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
            >
              Restore from Backup
            </button>
          </div>
          <input
            ref={restoreFileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleRestoreFile}
          />
          {(backupStatus || restoreStatus) && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              {backupStatus || restoreStatus}
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mt-6 border-t-4 border-blue-600">
          <h3 className="text-lg font-bold text-slate-900 mb-3">
            System Administration
          </h3>
          <p className="text-slate-600 mb-3">
            This admin dashboard provides comprehensive management tools for the
            SKActhub system. All features are monitored for security and
            performance.
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

export default AdminSettings;
