import React, { useEffect, useState } from "react";
import axios from "axios";
import { Folder, FileText, RefreshCw, Trash2, RotateCcw } from "lucide-react";
import { useToast } from "../components/Toast";

const API_BASE = "http://localhost:5000/api";

const Archive = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState([]);
  const [messages, setMessages] = useState([]);

  const user = React.useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw && raw !== "undefined" && raw !== "null"
        ? JSON.parse(raw)
        : null;
    } catch (err) {
      return null;
    }
  }, []);

  const barangayId =
    user?.barangay?._id || user?.barangay || (user?.barangayId ?? null);

  const fetchArchive = async () => {
    if (!barangayId) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${API_BASE}/barangays/${barangayId}/archive`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setFolders(res.data.folders || []);
      setMessages(res.data.messages || []);
    } catch (error) {
      console.error("Error fetching archive:", error);
      const message =
        error?.response?.data?.message ||
        error.message ||
        "Failed to load archive";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreFolder = async (folderId) => {
    if (!folderId || !barangayId) return;
    if (!window.confirm("Restore this folder?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE}/barangays/${barangayId}/archive/folders/${folderId}/restore`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Folder restored successfully");
      fetchArchive();
    } catch (error) {
      console.error("Error restoring folder:", error);
      toast.error(error?.response?.data?.message || "Failed to restore folder");
    }
  };

  const handleHardDeleteFolder = async (folderId) => {
    if (!folderId || !barangayId) return;
    if (
      !window.confirm("Permanently delete this folder? This cannot be undone.")
    )
      return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${API_BASE}/barangays/${barangayId}/archive/folders/${folderId}/hard`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Folder permanently deleted");
      fetchArchive();
    } catch (error) {
      console.error("Error permanently deleting folder:", error);
      toast.error(
        error?.response?.data?.message || "Failed to permanently delete folder",
      );
    }
  };

  const handleRestoreMessage = async (messageId) => {
    if (!messageId) return;
    if (!window.confirm("Restore this document?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE}/messages/${messageId}/restore`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Document restored successfully");
      fetchArchive();
    } catch (error) {
      console.error("Error restoring document:", error);
      toast.error(
        error?.response?.data?.message || "Failed to restore document",
      );
    }
  };

  const handleHardDeleteMessage = async (messageId) => {
    if (!messageId) return;
    if (
      !window.confirm(
        "Permanently delete this document? This cannot be undone.",
      )
    )
      return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE}/messages/${messageId}/hard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Document permanently deleted");
      fetchArchive();
    } catch (error) {
      console.error("Error permanently deleting document:", error);
      toast.error(
        error?.response?.data?.message ||
          "Failed to permanently delete document",
      );
    }
  };

  useEffect(() => {
    if (barangayId) fetchArchive();
  }, [barangayId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Archive</h1>
            <p className="text-sm text-slate-600 mt-1">
              View deleted folders and documents for your barangay.
            </p>
          </div>
          <button
            onClick={fetchArchive}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-sm transition"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {!barangayId ? (
          <div className="rounded-xl p-6 bg-white shadow-sm border border-slate-200">
            <p className="text-sm text-slate-600">
              Your account is not linked to a barangay. Archive is unavailable.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center">
                    <Folder size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Deleted Folders
                    </h2>
                    <p className="text-xs text-slate-500">
                      {folders.length} item{folders.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
              </div>

              {loading ? (
                <p className="text-sm text-slate-500">Loading...</p>
              ) : folders.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No deleted folders found.
                </p>
              ) : (
                <div className="space-y-3">
                  {folders.map((folder) => (
                    <div
                      key={folder._id}
                      className="p-4 border border-slate-200 rounded-xl bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {folder.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            Deleted by {folder.deletedBy?.username || "user"} on{" "}
                            {folder.deletedAt
                              ? new Date(folder.deletedAt).toLocaleString()
                              : "unknown"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRestoreFolder(folder._id)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-100"
                          >
                            <RotateCcw size={14} />
                            Restore
                          </button>
                          <button
                            onClick={() => handleHardDeleteFolder(folder._id)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-100"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Deleted Documents
                    </h2>
                    <p className="text-xs text-slate-500">
                      {messages.length} item{messages.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
              </div>

              {loading ? (
                <p className="text-sm text-slate-500">Loading...</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No deleted documents found.
                </p>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg._id}
                      className="p-4 border border-slate-200 rounded-xl bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">
                            {msg.subject}
                          </p>
                          <p className="text-xs text-slate-500">
                            From: {msg.sender?.username || "Unknown"}
                          </p>
                          <p className="text-xs text-slate-500">
                            Deleted on{" "}
                            {msg.deletedAt
                              ? new Date(msg.deletedAt).toLocaleString()
                              : "unknown"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRestoreMessage(msg._id)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-100"
                          >
                            <RotateCcw size={14} />
                            Restore
                          </button>
                          <button
                            onClick={() => handleHardDeleteMessage(msg._id)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-100"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Archive;
