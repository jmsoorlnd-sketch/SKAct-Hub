import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import {
  Folder,
  FileText,
  RefreshCw,
  Trash2,
  RotateCcw,
  Users,
  Archive as ArchiveIcon,
  Search,
  X,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useToast } from "../components/Toast";

const API_BASE = "http://localhost:5000/api";

const Archive = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [kagawad, setKagawad] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  /* ===================== USER ===================== */
  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw || raw === "undefined" || raw === "null") return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  const barangayId = useMemo(() => {
    return user?.barangay?._id || user?.barangay || user?.barangayId || null;
  }, [user]);

  /* ===================== AUTH ===================== */
  const token = useMemo(() => localStorage.getItem("token"), []);

  const authHeaders = useMemo(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  /* ===================== API HELPER ===================== */
  const apiCall = useCallback(
    async (method, url) => {
      try {
        return await axios({
          method,
          url,
          headers: authHeaders,
        });
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error.message ||
          "Something went wrong";
        toast.error(message);
        throw error;
      }
    },
    [authHeaders, toast],
  );

  /* ===================== FETCH ===================== */
  const fetchArchive = useCallback(async () => {
    if (!barangayId) return;

    setLoading(true);
    try {
      // Fetch folders and messages
      const archiveRes = await apiCall(
        "get",
        `${API_BASE}/barangays/${barangayId}/archive`,
      );

      setFolders(archiveRes.data.folders || []);
      setMessages(archiveRes.data.messages || []);

      // Fetch deleted kagawad
      const kagawadRes = await apiCall(
        "get",
        `${API_BASE}/sk-personnel/${barangayId}?includeDeleted=true`,
      );

      setKagawad(kagawadRes.data.deletedKagawad || []);
    } catch {
      // Error already handled in apiCall
    } finally {
      setLoading(false);
    }
  }, [barangayId, apiCall]);

  /* ===================== ACTIONS ===================== */
  const confirmAction = (message) => window.confirm(message);

  const handleRestoreFolder = useCallback(
    async (folderId) => {
      if (!folderId || !barangayId) return;
      if (!confirmAction("Restore this folder?")) return;

      try {
        await apiCall(
          "post",
          `${API_BASE}/barangays/${barangayId}/archive/folders/${folderId}/restore`,
        );
        toast.success("Folder restored successfully");
        fetchArchive();
      } catch {
        // Error already handled in apiCall
      }
    },
    [barangayId, apiCall, fetchArchive, toast],
  );

  const handleHardDeleteFolder = useCallback(
    async (folderId) => {
      if (!folderId || !barangayId) return;
      if (
        !confirmAction("Permanently delete this folder? This cannot be undone.")
      )
        return;

      try {
        await apiCall(
          "delete",
          `${API_BASE}/barangays/${barangayId}/archive/folders/${folderId}/hard`,
        );
        toast.success("Folder permanently deleted");
        fetchArchive();
      } catch {
        // Error already handled in apiCall
      }
    },
    [barangayId, apiCall, fetchArchive, toast],
  );

  const handleRestoreMessage = useCallback(
    async (messageId) => {
      if (!messageId) return;
      if (!confirmAction("Restore this document?")) return;

      try {
        await apiCall("post", `${API_BASE}/messages/${messageId}/restore`);
        toast.success("Document restored successfully");
        fetchArchive();
      } catch {
        // Error already handled in apiCall
      }
    },
    [apiCall, fetchArchive, toast],
  );

  const handleHardDeleteMessage = useCallback(
    async (messageId) => {
      if (!messageId) return;
      if (
        !confirmAction(
          "Permanently delete this document? This cannot be undone.",
        )
      )
        return;

      try {
        await apiCall("delete", `${API_BASE}/messages/${messageId}/hard`);
        toast.success("Document permanently deleted");
        fetchArchive();
      } catch {
        // Error already handled in apiCall
      }
    },
    [apiCall, fetchArchive, toast],
  );

  const handleHardDeleteEvent = useCallback(
    async (messageId) => {
      if (!messageId) return;
      if (
        !confirmAction(
          "Permanently delete this event from all storage? This cannot be undone.",
        )
      )
        return;

      try {
        await apiCall("delete", `${API_BASE}/messages/${messageId}/hard-event`);
        toast.success("Event permanently deleted from all storage");
        fetchArchive();
      } catch {
        // Error already handled in apiCall
      }
    },
    [apiCall, fetchArchive, toast],
  );

  const handleRestoreEvent = useCallback(
    async (messageId, eventData) => {
      if (!messageId) return;
      if (!confirmAction("Restore this event?")) return;

      try {
        if (eventData?.isDeleted) {
          await apiCall("post", `${API_BASE}/messages/${messageId}/restore`);
        } else if (eventData?.status === "cancelled") {
          await apiCall("put", `${API_BASE}/messages/${messageId}/status`, {
            status: "ongoing",
          });
        } else {
          // fallback to simple restore
          await apiCall("post", `${API_BASE}/messages/${messageId}/restore`);
        }

        toast.success("Event restored successfully");
        fetchArchive();
      } catch {
        // Error already handled in apiCall
      }
    },
    [apiCall, fetchArchive, toast],
  );

  const handleRestoreKagawad = useCallback(
    async (kagawadId) => {
      if (!kagawadId || !barangayId) return;
      if (!confirmAction("Restore this personnel?")) return;

      try {
        await apiCall(
          "post",
          `${API_BASE}/sk-personnel/${barangayId}/kagawad/${kagawadId}/restore`,
        );
        toast.success("Personnel restored successfully");
        fetchArchive();
      } catch {
        // Error already handled in apiCall
      }
    },
    [barangayId, apiCall, fetchArchive, toast],
  );

  const handleHardDeleteKagawad = useCallback(
    async (kagawadId) => {
      if (!kagawadId || !barangayId) return;
      if (
        !confirmAction(
          "Permanently delete this personnel? This cannot be undone.",
        )
      )
        return;

      try {
        await apiCall(
          "delete",
          `${API_BASE}/sk-personnel/${barangayId}/kagawad/${kagawadId}/hard`,
        );
        toast.success("Personnel permanently deleted");
        fetchArchive();
      } catch {
        // Error already handled in apiCall
      }
    },
    [barangayId, apiCall, fetchArchive, toast],
  );

  /* ===================== COMBINED ITEMS ===================== */
  const allArchivedItems = useMemo(() => {
    const items = [];

    // Add folders
    folders.forEach((folder) => {
      items.push({
        id: folder._id,
        type: "folder",
        name: folder.name,
        title: folder.name,
        deletedAt: folder.deletedAt,
        deletedBy: folder.deletedBy?.username || "user",
        data: folder,
      });
    });

    // Add messages
    messages.forEach((msg) => {
      // Determine if this is an event or document
      // Events have startDate or are admin scheduled
      const isEvent = msg.startDate || msg.isAdminScheduled;
      items.push({
        id: msg._id,
        type: isEvent ? "event" : "document",
        name: msg.subject,
        title: msg.subject,
        deletedAt: msg.deletedAt,
        deletedBy: msg.sender?.username || "Unknown",
        data: msg,
      });
    });

    // Add kagawad
    kagawad.forEach((k) => {
      items.push({
        id: k._id,
        type: "personnel",
        name: `${k.firstName} ${k.surname || ""}`.trim(),
        title: `${k.firstName} ${k.surname || ""}`.trim(),
        deletedAt: k.deletedAt,
        deletedBy: k.deletedBy?.username || "user",
        data: k,
      });
    });

    // Sort by deletion date (newest first)
    return items.sort((a, b) => {
      const dateA = new Date(a.deletedAt || 0);
      const dateB = new Date(b.deletedAt || 0);
      return dateB - dateA;
    });
  }, [folders, messages, kagawad]);

  /* ===================== RENDER HELPERS ===================== */
  const getTypeIcon = (type) => {
    switch (type) {
      case "folder":
        return <Folder size={16} />;
      case "event":
        return <CalendarIcon size={16} />;
      case "document":
        return <FileText size={16} />;
      case "personnel":
        return <Users size={16} />;
      default:
        return <ArchiveIcon size={16} />;
    }
  };

  const getTypeBadgeStyles = (type) => {
    switch (type) {
      case "folder":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "event":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "document":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "personnel":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "folder":
        return "Folder";
      case "event":
        return "Event";
      case "document":
        return "Document";
      case "personnel":
        return "Personnel";
      default:
        return "Item";
    }
  };

  /* ===================== FILTERED ITEMS ===================== */
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return allArchivedItems;

    const query = searchQuery.toLowerCase();
    return allArchivedItems.filter((item) => {
      const title = item.title?.toLowerCase() || "";
      const type = getTypeLabel(item.type)?.toLowerCase() || "";
      const deletedBy = item.deletedBy?.toLowerCase() || "";

      return (
        title.includes(query) ||
        type.includes(query) ||
        deletedBy.includes(query)
      );
    });
  }, [allArchivedItems, searchQuery]);

  /* ===================== EFFECT ===================== */
  useEffect(() => {
    if (barangayId) fetchArchive();
  }, [barangayId, fetchArchive]);

  /* ===================== UI ===================== */
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Archive</h1>
            <p className="text-sm text-slate-600 mt-1">
              View all deleted items for your barangay.
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
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-linear-to-r from-slate-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    All Archived Items
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {filteredItems.length} item
                    {filteredItems.length === 1 ? "" : "s"}
                    {searchQuery && ` • Filtering ${allArchivedItems.length}`}
                  </p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search by name, type, or deleted by..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border-2 border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    title="Clear search"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="p-6">
                <p className="text-sm text-slate-500">Loading...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArchiveIcon className="text-slate-400" size={40} />
                </div>
                <p className="text-base text-slate-600 font-semibold">
                  {searchQuery
                    ? "No matching items found"
                    : "No archived items"}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : "Deleted folders, documents, and personnel will appear here."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Type & Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${getTypeBadgeStyles(
                              item.type,
                            )}`}
                          >
                            {getTypeIcon(item.type)}
                            {getTypeLabel(item.type)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900 truncate">
                            {item.title}
                          </p>
                          {item.type === "event" && item.data?.status && (
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                item.data.status === "cancelled"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {item.data.status}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Deleted by {item.deletedBy} on{" "}
                          {item.deletedAt
                            ? new Date(item.deletedAt).toLocaleString()
                            : "unknown"}
                        </p>

                        {/* Extra details for Personnel */}
                        {item.type === "personnel" && item.data?.age && (
                          <p className="text-xs text-slate-600 mt-1">
                            Age: {item.data.age} •{" "}
                            <span
                              className={`${
                                item.data.status === "Active"
                                  ? "text-emerald-600"
                                  : "text-red-600"
                              }`}
                            >
                              {item.data.status}
                            </span>
                          </p>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            if (item.type === "folder") {
                              handleRestoreFolder(item.id);
                            } else if (item.type === "event") {
                              handleRestoreEvent(item.id, item.data);
                            } else if (item.type === "document") {
                              handleRestoreMessage(item.id);
                            } else if (item.type === "personnel") {
                              handleRestoreKagawad(item.id);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors"
                        >
                          <RotateCcw size={14} />
                          Restore
                        </button>
                        <button
                          onClick={() => {
                            if (item.type === "folder") {
                              handleHardDeleteFolder(item.id);
                            } else if (item.type === "event") {
                              handleHardDeleteEvent(item.id);
                            } else if (item.type === "document") {
                              handleHardDeleteMessage(item.id);
                            } else if (item.type === "personnel") {
                              handleHardDeleteKagawad(item.id);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
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
        )}
      </div>
    </div>
  );
};

export default Archive;
