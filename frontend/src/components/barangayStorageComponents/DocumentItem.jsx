import React, { useState } from "react";
import axios from "axios";
import { MoreVertical, Calendar, X, FileText } from "lucide-react";

const DocumentItem = ({
  item,
  user,
  folders,
  handleUpdateStatus,
  handleMoveToFolder,
  selectedBarangay,
  setStorage,
  storage,
  setSelectedDocument,
  fetchActivityUpdates,
  showUsersModal,
  setShowUsersModal,
  fileInputRef,
  confirmationModal,
  openConfirmationModal,
  closeConfirmationModal,
  handleConfirmAction,
  showPreviewModal,
  setShowPreviewModal,
  previewUrl,
  setPreviewUrl,
  toast,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showFolderSubmenu, setShowFolderSubmenu] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [openAttachmentMenu, setOpenAttachmentMenu] = useState(null);
  const [calendarFormData, setCalendarFormData] = useState({
    startDate: "",
    endDate: "",
  });
  const [addingToCalendar, setAddingToCalendar] = useState(false);

  const resolveAttachmentUrl = (url) => {
    if (!url) return "";
    if (/^(https?:)?\/\//i.test(url)) return url;
    if (url.startsWith("/")) return `${window.BACKEND_URL}${url}`;
    return `${window.BACKEND_URL}/${url}`;
  };

  const handleAddToCalendar = async (e) => {
    e.preventDefault();
    if (!calendarFormData.startDate) {
      toast.warning("Please fill in the start date and time");
      return;
    }

    try {
      setAddingToCalendar(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        return;
      }

      const documentSubject =
        item.documentName || item.document?.subject || "Document";

      await axios.post(
        `${window.API_BASE}/messages/send`,
        {
          recipientId: user?._id,
          subject: `Document: ${documentSubject}`,
          body:
            item.description ||
            item.document?.body ||
            "Document scheduled from storage",
          startDate: calendarFormData.startDate,
          endDate: calendarFormData.endDate,
          barangayId: selectedBarangay,
          status: "approved",
          isAdminScheduled: true,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      toast.success("Document added to calendar successfully");
      setShowCalendarModal(false);
      setCalendarFormData({ startDate: "", endDate: "" });
      setShowMenu(false);
    } catch (error) {
      console.error("Failed to add to calendar:", error);
      toast.error("Failed to add document to calendar");
    } finally {
      setAddingToCalendar(false);
    }
  };

  const getStatusColor = (status) => {
    const normalized = status === "approved" ? "completed" : status;
    switch (normalized) {
      case "completed":
        return "bg-linear-to-r from-emerald-100 to-emerald-50 text-emerald-700 border-emerald-200";
      case "ongoing":
        return "bg-linear-to-r from-amber-100 to-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-linear-to-r from-slate-100 to-slate-50 text-slate-700 border-slate-200";
    }
  };

  const document = item.document || item;
  const documentAttachments = [];
  if (document?.attachmentUrls?.length > 0) {
    document.attachmentUrls.forEach((url, idx) => {
      documentAttachments.push({
        url,
        name:
          document.attachmentNames?.[idx] ||
          document.attachmentName ||
          `Attachment ${idx + 1}`,
      });
    });
  } else if (document?.attachmentUrl) {
    documentAttachments.push({
      url: document.attachmentUrl,
      name: document.attachmentName || "Attachment",
    });
  }

  return (
    <div className="border border-slate-200 rounded-2xl p-3 hover:shadow-md hover:border-blue-300 transition-all duration-200 bg-white">
      <div className="flex justify-between items-start gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 text-sm mb-1">
            {item.documentName || item.document?.subject || "Document"}
          </h3>
          <p className="text-[11px] text-slate-600 mb-2">
            From:{" "}
            <span className="font-semibold">
              {item.document?.sender?.username || item.uploadedBy?.username}
            </span>{" "}
            ({item.document?.sender?.firstname || item.uploadedBy?.firstname}{" "}
            {item.document?.sender?.lastname || item.uploadedBy?.lastname})
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getStatusColor(
                item.document?.status || item.status,
              )}`}
            >
              {item.document?.status === "approved"
                ? "completed"
                : item.document?.status || item.status}
            </span>
            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-semibold">
              {new Date(item.createdAt).toLocaleDateString()}
            </span>
          </div>
          {item.description && (
            <p className="text-xs text-slate-700 mt-2 p-2 bg-slate-50 rounded-2xl border border-slate-200 line-clamp-1">
              {item.description}
            </p>
          )}
        </div>
        <div className="ml-3 flex items-start gap-2">
          {user?.role &&
            (user.role === "Official" || user.role === "Admin") && (
              <button
                onClick={() => {
                  setSelectedDocument(item);
                  fetchActivityUpdates(item.document?._id || item._id);
                }}
                className="px-3 py-1.5 bg-linear-to-r from-purple-100 to-purple-50 hover:from-purple-200 hover:to-purple-100 text-purple-700 rounded-lg text-xs font-semibold border border-purple-200 transition-all"
              >
                Activity
              </button>
            )}
          {documentAttachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {documentAttachments.map((att, idx) => {
                const attachmentUrl = resolveAttachmentUrl(att.url);
                return (
                  <div key={idx} className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenAttachmentMenu(
                          openAttachmentMenu === idx ? null : idx,
                        )
                      }
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold border border-slate-800 transition-all"
                    >
                      Actions
                    </button>
                    {openAttachmentMenu === idx && (
                      <div className="absolute right-0 top-full mt-2 w-40 rounded-xl border border-slate-200 bg-white shadow-lg z-20">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewUrl(attachmentUrl);
                            setShowPreviewModal(true);
                            setOpenAttachmentMenu(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-100 text-slate-700 text-sm"
                        >
                          View
                        </button>
                        <a
                          href={attachmentUrl}
                          download={att.name}
                          onClick={() => setOpenAttachmentMenu(null)}
                          className="block px-4 py-2 hover:bg-slate-100 text-slate-700 text-sm"
                        >
                          Download
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2.5 hover:bg-slate-100 rounded-lg transition-colors border-2 border-slate-200"
              title="More options"
            >
              <MoreVertical size={18} className="text-slate-600" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border-2 border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                {/* Status controls - only if user can modify */}
                {(user?.role === "Official" || user?.role === "Admin") && (
                  <>
                    <button
                      onClick={() => {
                        openConfirmationModal(
                          "pending",
                          item._id,
                          null,
                          "Set Pending",
                          "Change document status to pending?",
                        );
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm text-slate-700 font-semibold transition-colors"
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => {
                        openConfirmationModal(
                          "ongoing",
                          item._id,
                          null,
                          "Set Ongoing",
                          "Change document status to ongoing?",
                        );
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm text-slate-700 font-semibold transition-colors"
                    >
                      Ongoing
                    </button>
                    <button
                      onClick={() => {
                        openConfirmationModal(
                          "completed",
                          item._id,
                          null,
                          "Set Completed",
                          "Change document status to completed?",
                        );
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm text-slate-700 font-semibold transition-colors"
                    >
                      Completed
                    </button>
                    <div className="border-t border-slate-200" />
                  </>
                )}
                <button
                  onClick={() => {
                    setShowCalendarModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm text-slate-700 font-semibold transition-colors flex items-center gap-2"
                >
                  <Calendar size={16} className="text-blue-600" />
                  Add to Calendar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200 mt-4">
        {String(item.document?.sender?._id) === String(user?._id) && (
          <>
            <button
              onClick={() =>
                openConfirmationModal(
                  "pending",
                  item.document?._id,
                  null,
                  "Mark as Pending",
                  "Are you sure you want to mark this document as pending?",
                )
              }
              className="px-3 py-1.5 bg-linear-to-r from-slate-100 to-slate-50 hover:from-slate-200 hover:to-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-all"
            >
              Mark Pending
            </button>
            <button
              onClick={() =>
                openConfirmationModal(
                  "ongoing",
                  item.document?._id,
                  null,
                  "Mark as Ongoing",
                  "Are you sure you want to mark this document as ongoing?",
                )
              }
              className="px-3 py-1.5 bg-linear-to-r from-amber-100 to-amber-50 hover:from-amber-200 hover:to-amber-100 text-amber-700 rounded-lg text-xs font-semibold border border-amber-200 transition-all"
            >
              Mark Ongoing
            </button>
            <button
              onClick={() =>
                openConfirmationModal(
                  "completed",
                  item.document?._id,
                  null,
                  "Mark as Completed",
                  "Are you sure you want to mark this document as completed?",
                )
              }
              className="px-3 py-1.5 bg-linear-to-r from-emerald-100 to-emerald-50 hover:from-emerald-200 hover:to-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200 transition-all"
            >
              Mark Completed
            </button>
            {item.document?.status === "pending" && (
              <button
                onClick={() =>
                  openConfirmationModal(
                    "cancelled",
                    item.document?._id,
                    null,
                    "Cancel Submission",
                    "Are you sure you want to cancel this document submission for approval?",
                  )
                }
                className="px-3 py-1.5 bg-linear-to-r from-red-100 to-red-50 hover:from-red-200 hover:to-red-100 text-red-700 rounded-lg text-xs font-semibold border border-red-200 transition-all"
              >
                Cancel
              </button>
            )}
          </>
        )}
        {user?.role === "Official" &&
          (user.position === "Secretary" ||
            user.position === "Treasurer" ||
            user.position === "Chairman") &&
          selectedBarangay && (
            <>
              <button
                onClick={() =>
                  openConfirmationModal(
                    "remove",
                    null,
                    item.document?._id || item.document,
                    "Remove Document",
                    "Are you sure you want to remove this message from the barangay? It will be returned to your inbox.",
                  )
                }
                className="px-3 py-1.5 bg-linear-to-r from-red-100 to-red-50 hover:from-red-200 hover:to-red-100 text-red-700 rounded-lg text-xs font-semibold border border-red-200 transition-all"
              >
                Remove
              </button>
            </>
          )}
      </div>

      {/* Calendar Modal */}
      {showCalendarModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-linear-to-r from-blue-600 to-indigo-600 p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calendar size={24} />
                  Add to Calendar
                </h3>
                <button
                  onClick={() => setShowCalendarModal(false)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={24} className="text-white" />
                </button>
              </div>
            </div>
            <form onSubmit={handleAddToCalendar} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={calendarFormData.startDate}
                  onChange={(e) =>
                    setCalendarFormData({
                      ...calendarFormData,
                      startDate: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={calendarFormData.endDate}
                  onChange={(e) =>
                    setCalendarFormData({
                      ...calendarFormData,
                      endDate: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={addingToCalendar}
                  className="flex-1 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-400 disabled:to-slate-500 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
                >
                  {addingToCalendar ? "Adding..." : "Add to Calendar"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCalendarModal(false)}
                  className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmationModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-linear-to-r from-blue-600 to-indigo-600 p-6 rounded-t-2xl">
              <h3 className="text-xl font-bold text-white">
                {confirmationModal.title}
              </h3>
            </div>

            <div className="p-6">
              <p className="text-slate-700 text-base mb-6">
                {confirmationModal.message}
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  className="px-4 py-2 bg-slate-200 rounded font-semibold text-slate-700 hover:bg-slate-300"
                  onClick={() =>
                    setConfirmationModal({
                      isOpen: false,
                      action: null,
                      messageId: null,
                      docId: null,
                      message: "",
                      title: "",
                    })
                  }
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-1.5 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 text-xs"
                  onClick={handleConfirmAction}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b-2 border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">
                Document Preview
              </h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={24} className="text-slate-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto bg-slate-50 flex items-center justify-center">
              {previewUrl.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-full max-h-full object-contain"
                />
              ) : previewUrl.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-0"
                  title="PDF Preview"
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 px-6">
                  <FileText size={64} className="text-slate-400 mb-4" />
                  <p className="text-slate-600 text-lg font-semibold text-center mb-4">
                    Preview not available for this file type
                  </p>
                  <a
                    href={previewUrl}
                    download
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all"
                  >
                    Download File
                  </a>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t-2 border-slate-100 flex justify-end">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-6 py-2.5 bg-slate-300 hover:bg-slate-400 text-slate-800 rounded-lg font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentItem;
