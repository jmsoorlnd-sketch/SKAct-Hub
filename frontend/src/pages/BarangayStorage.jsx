import React, { useEffect, useState, useRef, lazy, Suspense } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Check,
  Trash2,
  HousePlus,
  MoreVertical,
  FolderPlus,
  Search,
  Filter,
  X,
  PenSquare,
  AlignLeft,
  Paperclip,
  Send,
  Tag,
  Calendar,
  Image as ImageIcon,
  Plus,
  FileText,
  Eye,
  ArrowLeft,
  Download,
  Activity,
  Edit,
} from "lucide-react";
import DocumentItem from "../components/barangayStorageComponents/DocumentItem";
import { useToast } from "../components/Toast";

const AddBarangay = lazy(
  () => import("../components/barangayStorageComponents/AddBarangay"),
);
// Wrap modal in Suspense

/* ===================== CUSTOM FOLDER STYLES ===================== */
const folderStyles = `
  .folder-container {
    perspective: 1200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
  }

  .animated-folder {
    position: relative;
    width: 100px;
    height: 60px;
    background: #F5E6D3;
    border: 3px solid #D4A574; /* light brown border */
    border-radius: 5px;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    transform-style: preserve-3d;
  }

  .animated-folder::before {
    content: "";
    position: absolute;
    top: -23%;
    left: -3px;
    width: 30px;
    height: 14px;
    background-color: #D4A574; /* light brown flap */
    border-radius: 5px 5px 0 0;
    z-index: 1;
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    transform-origin: center bottom;
  }

  .animated-folder::after {
    content: "";
    position: absolute;
    width: 104%;
    height: 103%;
    background-color: #D4A574;
    border: 3px solid #D4A574;
    border-radius: 5px;
    left: -2px;
    top: -1px;
    transform: rotateX(0deg);
    transform-origin: top;
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    backface-visibility: hidden;
  }

  .folder-container:hover .animated-folder::after {
    transform: rotateX(-45deg);
  }

  .folder-container:hover .animated-folder::before {
    transform: rotateX(-45deg);
  }

  .file {
    position: absolute;
    width: 50px;
    height: 40px;
    border-radius: 4px;
    transition: all 0.3s ease-in-out;
  }

  .file.one {
    top: 10px;
    left: 10px;
    background: #ffd6a5;
    transform: translate(0, 0) rotate(0deg);
  }

  .file.two {
    top: 15px;
    left: 35px;
    background: #efa390;
    transform: translate(0, 0) rotate(0deg);
  }

  .file.three {
    top: 22px;
    left: 22px;
    background: #fdffb6;
    transform: translate(0, 0) rotate(0deg);
  }

  .folder-container:hover .file.one {
    transform: translate(-40px, -60px) rotate(-13deg);
  }

  .folder-container:hover .file.two {
    transform: translate(40px, -60px) rotate(13deg);
  }

  .folder-container:hover .file.three {
    transform: translate(0px, -50px) rotate(0deg);
  }

  .folder-name {
    margin-top: 15px;
    font-weight: bold;
    font-size: 14px;
    color: #1f2937;
    text-align: center;
    max-width: 100%;
    overflow: visible;
    text-overflow: unset;
    white-space: normal;
    word-break: break-word;
    hyphens: auto;
  }

  .folder-count {
    font-size: 12px;
    color: #6b7280;
    margin-top: 4px;
  }
`;

const BarangayStorage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [barangays, setBarangays] = useState([]);
  const [selectedBarangay, setSelectedBarangay] = useState(null);
  const [storage, setStorage] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [usersInBarangay, setUsersInBarangay] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState("");
  const [formData, setFormData] = useState({
    barangay: "",
    city: "",
    province: "",
    region: "",
  });
  const ADMIN_LIMIT = 5;
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeFile, setComposeFile] = useState(null);
  const [search, setSearch] = useState("");
  const [docSearch, setDocSearch] = useState("");
  const [docStatusFilter, setDocStatusFilter] = useState("");
  const [filterProvince, setFilterProvince] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [activityUpdates, setActivityUpdates] = useState([]);
  const [activityPhotoFile, setActivityPhotoFile] = useState(null);
  const [activityCaption, setActivityCaption] = useState("");
  const [uploadingActivity, setUploadingActivity] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [selectedFolderForUpload, setSelectedFolderForUpload] = useState(null);
  const [uploadingToFolder, setUploadingToFolder] = useState(false);
  const [showFolderComposeModal, setShowFolderComposeModal] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    action: null,
    messageId: null,
    docId: null,
    message: "",
    title: "",
  });
  const [folderComposeData, setFolderComposeData] = useState({
    subject: "",
    body: "",
  });
  const [folderComposeFiles, setFolderComposeFiles] = useState([]);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [showFolderViewModal, setShowFolderViewModal] = useState(false);
  const [folderViewData, setFolderViewData] = useState(null);
  const [folderModalSelectedDoc, setFolderModalSelectedDoc] = useState(null);
  const [folderModalViewType, setFolderModalViewType] = useState(null); // 'updates' or 'details'
  const [folderModalActivityUpdates, setFolderModalActivityUpdates] = useState(
    [],
  );
  const [folderModalShowUploadForm, setFolderModalShowUploadForm] =
    useState(false);
  const [folderModalUploadPhoto, setFolderModalUploadPhoto] = useState(null);
  const [folderModalUploadCaption, setFolderModalUploadCaption] = useState("");
  const [folderModalUploadingActivity, setFolderModalUploadingActivity] =
    useState(false);
  const [folderSearchQuery, setFolderSearchQuery] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    let userData = null;
    try {
      const raw = localStorage.getItem("user");
      if (raw && raw !== "undefined" && raw !== "null")
        userData = JSON.parse(raw);
    } catch (err) {
      console.warn("Failed to parse stored user in BarangayStorage:", err);
      userData = null;
    }
    setUser(userData);
    (async () => {
      await fetchBarangays(userData);
    })();
  }, []);

  /* ---- Fetch documents and folders when barangay is selected ---- */
  useEffect(() => {
    if (selectedBarangay) {
      fetchStorageDocuments(selectedBarangay, user);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBarangay]);

  /* ---- Auto-refresh for admin approvals (poll every 10 seconds) ---- */
  useEffect(() => {
    if (!selectedBarangay) return;

    const pollInterval = setInterval(() => {
      fetchStorageDocuments(selectedBarangay, user);
      fetchFolders(selectedBarangay);
    }, 10000);

    return () => clearInterval(pollInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBarangay]);

  const fetchBarangays = async (currentUser = user) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      if (currentUser && currentUser.role === "Admin") {
        const res = await axios.get(
          "http://localhost:5000/api/barangays/all-barangays",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setBarangays(res.data.barangays || []);
      } else {
        try {
          const meRes = await axios.get(
            "http://localhost:5000/api/barangays/me/barangay",
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          const myBarangay = meRes.data.barangay;
          if (myBarangay) {
            const id = myBarangay._id || myBarangay.id;
            setBarangays([myBarangay]);
            setSelectedBarangay(id);
            await fetchStorageDocuments(id, currentUser);
          } else {
            setBarangays([]);
            setStorage([]);
          }
        } catch (err) {
          console.warn(
            "No assigned barangay for user or fetch failed",
            err?.response?.data || err.message,
          );
          setBarangays([]);
          setStorage([]);
        }
      }
    } catch (error) {
      console.error("Error fetching barangays:", error);
      setBarangays([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStorageDocuments = async (barangayId, currentUser = user) => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found in localStorage");
      setStorage([]);
      return;
    }

    try {
      if (currentUser && currentUser.role !== "Admin") {
        const res = await axios.get(
          "http://localhost:5000/api/barangays/me/storage",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setStorage(res.data.storage || []);
        // Fetch folders for officials too
        if (barangayId) {
          await fetchFolders(barangayId);
        }
      } else {
        const res = await axios.get(
          `http://localhost:5000/api/barangays/${barangayId}/storage`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setStorage(res.data.storage || []);
        setSelectedBarangay(barangayId);
        await fetchUsersInBarangay(barangayId);
        await fetchAvailableUsers();
        await fetchFolders(barangayId);
      }
    } catch (error) {
      console.error("Error fetching storage:", error);
      setStorage([]);
    }
  };

  const fetchFolders = async (barangayId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:5000/api/barangays/${barangayId}/folders`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const folders = res.data.folders || [];
      setFolders(folders);
      return folders;
    } catch (error) {
      console.error("Error fetching folders:", error);
      setFolders([]);
      return [];
    }
  };

  const fetchUsersInBarangay = async (barangayId) => {
    try {
      const token = localStorage.getItem("token");
      if (!user || user.role !== "Admin") return;
      const res = await axios.get(
        `http://localhost:5000/api/barangays/${barangayId}/users`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setUsersInBarangay(res.data.users || []);
    } catch (error) {
      console.error("Error fetching users in barangay:", error);
      setUsersInBarangay([]);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/users/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAvailableUsers(res.data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setAvailableUsers([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateBarangay = async (e) => {
    e.preventDefault();
    if (user?.role === "Admin") {
      const createdByThisAdmin = barangays.filter(
        (b) => b?.chairmanId && String(b.chairmanId) === String(user._id),
      ).length;
      if (createdByThisAdmin >= ADMIN_LIMIT) {
        return toast.warning(
          `Creation limit reached. Each admin can create up to ${ADMIN_LIMIT} barangays.`,
        );
      }
    }
    const isDuplicate = barangays.some((b) => {
      const name = b.barangayName || b.barangay || "";
      return (
        name &&
        formData.barangay &&
        name.toLowerCase() === formData.barangay.toLowerCase()
      );
    });
    if (isDuplicate)
      return toast.warning("A barangay with this name already exists!");
    try {
      const token = localStorage.getItem("token");
      const dataToSubmit = {
        barangayName: formData.barangay,
        city: "Ormoc City",
        province: "Leyte",
        region: "Region 8",
      };
      await axios.post(
        "http://localhost:5000/api/barangays/add-barangay",
        dataToSubmit,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Barangay created successfully!");
      setFormData({ barangay: "", city: "", province: "", region: "" });
      setShowForm(false);
      fetchBarangays();
    } catch (error) {
      console.error("Error creating barangay:", error);
      const serverMsg = error?.response?.data?.message;
      if (serverMsg) {
        toast.error(serverMsg);
      } else {
        toast.error("Failed to create barangay.");
      }
    }
  };

  const handleDeleteBarangay = async (barangayId) => {
    if (!window.confirm("Delete this barangay?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/barangays/${barangayId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBarangays(barangays.filter((b) => b._id !== barangayId));
      toast.success("Barangay deleted successfully!");
      setSelectedBarangay(null);
      setStorage([]);
    } catch (error) {
      console.error("Error deleting barangay:", error);
      toast.error("Failed to delete barangay.");
    }
  };

  const handleAssignUser = async () => {
    if (!selectedUserToAdd || !selectedBarangay)
      return toast.warning("Please select a user to assign.");

    const prevUser = availableUsers.find((u) => u._id === selectedUserToAdd);
    const prevBarangayId = prevUser?.barangay
      ? String(prevUser.barangay)
      : null;
    const prevBarangayName = prevUser?.barangayName || null;

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/barangays/assign-user",
        { userId: selectedUserToAdd, barangayId: selectedBarangay },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      await fetchUsersInBarangay(selectedBarangay);
      await fetchAvailableUsers();

      const targetBarangay =
        barangays.find((b) => b._id === selectedBarangay) || {};
      const targetName =
        targetBarangay.barangayName ||
        targetBarangay.barangay ||
        "this barangay";

      if (prevBarangayId && prevBarangayId !== String(selectedBarangay)) {
        toast.info(
          `User reassigned from "${
            prevBarangayName || prevBarangayId
          }" to "${targetName}". Previous access revoked.`,
        );
      } else {
        toast.success("User assigned successfully!");
      }

      setSelectedUserToAdd("");
    } catch (error) {
      console.error("Error assigning user:", error);
      toast.error("Failed to assign user.");
    }
  };

  const handleRemoveUser = async (userId) => {
    if (!userId || !selectedBarangay) return;
    if (!window.confirm("Remove this user from the barangay?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/barangays/remove-user",
        { userId, barangayId: selectedBarangay },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setUsersInBarangay(usersInBarangay.filter((u) => u._id !== userId));
      toast.success("User removed from barangay");
    } catch (error) {
      console.error("Error removing user:", error);
      toast.error("Failed to remove user from barangay.");
    }
  };

  const handleOpenCompose = () => {
    setComposeSubject("");
    setComposeBody("");
    setComposeFile(null);
    setShowComposeModal(true);
  };

  const handleCloseCompose = () => {
    setShowComposeModal(false);
    setComposeSubject("");
    setComposeBody("");
    setComposeFile(null);
  };

  const handleSendToBarangay = async () => {
    if (!selectedBarangay) return toast.warning("Select a barangay first");
    if (!composeSubject || !composeBody)
      return toast.warning("Subject and message are required");
    try {
      const token = localStorage.getItem("token");
      const fd = new FormData();
      fd.append("subject", composeSubject);
      fd.append("body", composeBody);
      if (composeFile) fd.append("attachment", composeFile);

      await axios.post(
        `http://localhost:5000/api/barangays/${selectedBarangay}/messages`,
        fd,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );
      toast.success(
        "Message sent to admin for approval. It will be stored after approval.",
      );
      handleCloseCompose();
      fetchStorageDocuments(selectedBarangay);
    } catch (error) {
      console.error("Error sending to barangay:", error);
      const serverMsg = error?.response?.data?.message;
      if (serverMsg) toast.error(serverMsg);
      else toast.error("Failed to send.");
    }
  };

  const normalizeFolderName = (name) =>
    name?.trim().replace(/\s+/g, " ").toLowerCase() || "";

  const handleCreateFolder = async (folderName) => {
    if (!selectedBarangay || !folderName.trim()) return;

    // local guard: only secretaries/treasurers/chairmen may create folders
    if (
      !user ||
      (user.position !== "Secretary" &&
        user.position !== "Treasurer" &&
        user.position !== "Chairman")
    ) {
      toast.error("You are not authorized to create folders");
      return;
    }

    const normalized = normalizeFolderName(folderName);

    // refresh folder list to avoid stale state
    const currentFolders = await fetchFolders(selectedBarangay);

    const alreadyExists = currentFolders.some(
      (f) => normalizeFolderName(f.name) === normalized,
    );

    if (alreadyExists) {
      toast.error("A folder with that name already exists.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/barangays/${selectedBarangay}/folders`,
        { name: folderName },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Folder created successfully!");
      fetchFolders(selectedBarangay);
    } catch (error) {
      console.error("Error creating folder:", error.response || error);
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Failed to create folder.";
      toast.error(msg);
    }
  };

  const handleMoveToFolder = async (storageId, folderId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/barangays/${selectedBarangay}/storage/${storageId}/move`,
        { folderId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Document moved to folder!");
      fetchStorageDocuments(selectedBarangay);
    } catch (error) {
      console.error("Error moving document:", error);
      toast.error("Failed to move document.");
    }
  };

  const handleUpdateStatus = async (messageId, status) => {
    if (!messageId) return;
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/messages/${messageId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchStorageDocuments(selectedBarangay);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status.");
    }
  };

  const openConfirmationModal = (action, messageId, docId, title, message) => {
    // for removal we need both a barangay and document id
    if (action === "remove") {
      if (!selectedBarangay) {
        toast.error("Please select a barangay before removing documents");
        return;
      }
      if (!docId) {
        toast.error("No document specified for removal");
        return;
      }
    }

    setConfirmationModal({
      isOpen: true,
      action,
      messageId,
      docId,
      message,
      title,
    });
  };

  const closeConfirmationModal = () => {
    setConfirmationModal({
      isOpen: false,
      action: null,
      messageId: null,
      docId: null,
      message: "",
      title: "",
    });
  };

  const handleConfirmAction = async () => {
    const { action, messageId, docId } = confirmationModal;

    if (
      action === "ongoing" ||
      action === "completed" ||
      action === "pending" ||
      action === "cancelled"
    ) {
      await handleUpdateStatus(messageId, action);
      // Update the modal's displayed document with new status
      if (folderModalSelectedDoc) {
        setFolderModalSelectedDoc((prev) => ({
          ...prev,
          document: {
            ...prev.document,
            status: action,
          },
          status: action,
        }));
      }
    } else if (action === "remove") {
      // validate references before calling backend
      if (!selectedBarangay || !docId) {
        toast.error("Invalid barangay or document selected");
        closeConfirmationModal();
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const url = `http://localhost:5000/api/barangays/${selectedBarangay}/attach-message/${docId}`;
        await axios.delete(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStorage(
          storage.filter((s) => (s.document?._id || s.document) !== docId),
        );
        toast.success("Message removed from barangay and returned to inbox");
      } catch (err) {
        console.error("Detach failed:", err.response || err);
        const msg =
          err.response?.data?.message ||
          err.message ||
          "Failed to remove message from barangay";
        toast.error(msg);
      }
    } else if (action === "deleteFolder") {
      try {
        const folderId = docId;
        const documentsInFolder = storage.filter(
          (item) => item.folder && item.folder._id === folderId,
        );
        const token = localStorage.getItem("token");
        await axios.delete(
          `http://localhost:5000/api/barangays/${selectedBarangay}/folders/${folderId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        toast.success(
          `Folder deleted successfully${
            documentsInFolder.length > 0
              ? `! ${documentsInFolder.length} document(s) archived.`
              : "!"
          }`,
        );
        if (selectedFolder && selectedFolder._id === folderId) {
          setSelectedFolder(null);
        }
        fetchFolders(selectedBarangay);
        fetchStorageDocuments(selectedBarangay);
      } catch (error) {
        console.error("Error deleting folder:", error);
        toast.error("Failed to delete folder.");
      }
    }

    closeConfirmationModal();
  };

  const handleDeleteFolder = (folderId, folderName) => {
    const documentsInFolder = storage.filter(
      (item) => item.folder && item.folder._id === folderId,
    );

    let confirmMessage = `Delete folder "${folderName}"?`;
    if (documentsInFolder.length > 0) {
      confirmMessage += `\n\nThis folder contains ${documentsInFolder.length} document(s). They will be moved to stored documents.`;
    }

    // Open modal confirmation instead of window.confirm
    openConfirmationModal(
      "deleteFolder",
      null,
      folderId,
      "Delete Folder",
      confirmMessage,
    );
  };

  const handleDeleteMessage = async (messageId) => {
    if (!messageId) return;
    if (!window.confirm("Delete this document?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Document deleted successfully!");

      // Remove the deleted document from folderViewData immediately (instant UI update)
      if (folderViewData) {
        setFolderViewData({
          ...folderViewData,
          documents: folderViewData.documents.filter((item) => {
            const itemId = item.document?._id || item._id;
            return itemId !== messageId;
          }),
        });
      }

      // Close the selected doc detail modal if it was the deleted one
      if (
        folderModalSelectedDoc &&
        (folderModalSelectedDoc._id === messageId ||
          folderModalSelectedDoc.document?._id === messageId)
      ) {
        setFolderModalSelectedDoc(null);
      }

      // Also update storage documents list for the main view
      setStorage((prevStorage) =>
        prevStorage.filter((item) => {
          const itemId = item.document?._id || item._id;
          return itemId !== messageId;
        }),
      );
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document.");
    }
  };

  const handleUploadToFolderCompose = async (folderId) => {
    if (!selectedBarangay || !folderId) {
      toast.warning("Please select a folder");
      return;
    }

    if (!folderComposeData.subject || !folderComposeData.body) {
      toast.warning("Subject and message are required");
      return;
    }

    try {
      setUploadingToFolder(true);
      const token = localStorage.getItem("token");
      const fd = new FormData();
      fd.append("subject", folderComposeData.subject);
      fd.append("body", folderComposeData.body);
      fd.append("folderId", folderId);
      folderComposeFiles.forEach((file) => fd.append("attachments", file));

      // Create the message with approval required
      await axios.post(
        `http://localhost:5000/api/barangays/${selectedBarangay}/messages`,
        fd,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      toast.success(
        "Document created and sent for admin approval to be stored in the folder!",
      );
      setShowFolderComposeModal(false);
      setFolderComposeData({ subject: "", body: "" });
      setFolderComposeFiles([]);
      setSelectedFolderForUpload(null);
      fetchStorageDocuments(selectedBarangay);
      fetchFolders(selectedBarangay);
    } catch (error) {
      console.error("Error creating document for folder:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to create document. Please try again.",
      );
    } finally {
      setUploadingToFolder(false);
    }
  };

  const handleUploadToFolder = async (folderId, file) => {
    if (!selectedBarangay || !folderId || !file) {
      toast.warning("Please select a folder and file");
      return;
    }

    try {
      setUploadingToFolder(true);
      const token = localStorage.getItem("token");
      const fd = new FormData();
      fd.append("subject", file.name);
      fd.append("body", `File: ${file.name}`);
      fd.append("attachment", file);

      // Create a new message with the file
      const response = await axios.post(
        `http://localhost:5000/api/barangays/${selectedBarangay}/messages`,
        fd,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      // If message was created, move it to the folder
      if (response.data.message) {
        const messageId = response.data.message._id;
        await handleMoveToFolder(messageId, folderId);
        toast.success("File uploaded and added to folder successfully!");
        fetchStorageDocuments(selectedBarangay);
      }
    } catch (error) {
      console.error("Error uploading file to folder:", error);
      toast.error("Failed to upload file to folder.");
    } finally {
      setUploadingToFolder(false);
      setSelectedFolderForUpload(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const fetchActivityUpdates = async (documentId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:5000/api/messages/${documentId}/activity-updates`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setActivityUpdates(res.data.updates || []);
    } catch (error) {
      console.error("Error fetching activity updates:", error);
      setActivityUpdates([]);
    }
  };

  const handleUploadActivityPhoto = async (e) => {
    e.preventDefault();
    if (!selectedDocument) return toast.warning("Select a document first");
    if (!activityPhotoFile) return toast.warning("Please select a photo");

    try {
      setUploadingActivity(true);
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("photo", activityPhotoFile);
      formData.append("caption", activityCaption);
      formData.append("barangayId", selectedBarangay);

      const messageId = selectedDocument.document?._id || selectedDocument._id;
      await axios.post(
        `http://localhost:5000/api/messages/${messageId}/activity-updates`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      toast.success("Activity photo uploaded successfully!");
      setActivityPhotoFile(null);
      setActivityCaption("");
      fetchActivityUpdates(messageId);
    } catch (error) {
      console.error("Error uploading activity photo:", error);
      const serverMsg = error?.response?.data?.message;
      toast.error(serverMsg || "Failed to upload activity photo");
    } finally {
      setUploadingActivity(false);
    }
  };

  const handleDeleteActivityUpdate = async (updateId) => {
    if (!window.confirm("Delete this activity photo?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/messages/activity-updates/${updateId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      toast.success("Activity photo deleted successfully!");
      const messageId = selectedDocument.document?._id || selectedDocument._id;
      fetchActivityUpdates(messageId);
    } catch (error) {
      console.error("Error deleting activity update:", error);
      toast.error("Failed to delete activity photo");
    }
  };

  const fetchFolderModalActivityUpdates = async (documentId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:5000/api/messages/${documentId}/activity-updates`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setFolderModalActivityUpdates(res.data.updates || []);
    } catch (error) {
      console.error("Error fetching activity updates:", error);
      setFolderModalActivityUpdates([]);
    }
  };

  const handleFolderModalUploadActivity = async (e) => {
    e.preventDefault();
    if (!folderModalSelectedDoc)
      return toast.warning("Select a document first");
    if (!folderModalUploadPhoto) return toast.warning("Please select a photo");

    try {
      setFolderModalUploadingActivity(true);
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("photo", folderModalUploadPhoto);
      formData.append("caption", folderModalUploadCaption);
      formData.append("barangayId", selectedBarangay);

      const messageId =
        folderModalSelectedDoc.document?._id || folderModalSelectedDoc._id;
      await axios.post(
        `http://localhost:5000/api/messages/${messageId}/activity-updates`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      toast.success("Activity update uploaded successfully!");
      setFolderModalUploadPhoto(null);
      setFolderModalUploadCaption("");
      setFolderModalShowUploadForm(false);
      fetchFolderModalActivityUpdates(messageId);
    } catch (error) {
      console.error("Error uploading activity update:", error);
      const serverMsg = error?.response?.data?.message;
      toast.error(serverMsg || "Failed to upload activity update");
    } finally {
      setFolderModalUploadingActivity(false);
    }
  };

  const userBarangayId = user?.barangay?._id || user?.barangay || null;
  const filteredBarangays = barangays.filter((b) => {
    const matchesSearch = b.barangayName
      ?.toLowerCase()
      .includes(search.toLowerCase());
    const matchesProvince = filterProvince
      ? b.province === filterProvince
      : true;
    const matchesCity = filterCity ? b.city === filterCity : true;
    return matchesSearch && matchesProvince && matchesCity;
  });

  const matchesFolderSearch = (folder) => {
    if (!docSearch || !docSearch.trim()) return true;
    const q = docSearch.trim().toLowerCase();

    if (folder.name?.toLowerCase().includes(q)) return true;
    if ((folder.status || "").toLowerCase().includes(q)) return true;

    const folderDocs = storage.filter(
      (item) => item.folder?._id === folder._id,
    );

    return folderDocs.some((item) => {
      const docName = item.documentName || "";
      const docSubject = item.document?.subject || "";
      const docBody = item.document?.body || "";
      const content = `${docName} ${docSubject} ${docBody}`.toLowerCase();
      return content.includes(q);
    });
  };

  const matchesFolderStatus = (folder) => {
    if (!docStatusFilter) return true;
    return (
      (folder.status || "").toLowerCase() === docStatusFilter.toLowerCase()
    );
  };

  const filteredFolders = folders.filter(
    (folder) =>
      !folder.isDeleted &&
      matchesFolderSearch(folder) &&
      matchesFolderStatus(folder),
  );

  const matchesDocSearch = (item) => {
    if (!docSearch || !docSearch.trim()) return true;
    const q = docSearch.trim().toLowerCase();
    const name = (item.documentName || item.document?.subject || "")
      .toString()
      .toLowerCase();
    const created = new Date(item.createdAt).toLocaleString().toLowerCase();
    return name.includes(q) || created.includes(q);
  };

  const matchesDocStatus = (item) => {
    if (!docStatusFilter) return true;
    const status = item.document?.status || item.status || "";
    return status === docStatusFilter;
  };

  const filterDocuments = (list) =>
    (list || []).filter(
      (item) => matchesDocSearch(item) && matchesDocStatus(item),
    );

  // Update folder status (ongoing/completed)
  const handleUpdateFolderStatus = async (folderId, status) => {
    setStatusConfirm({ open: true, folderId, status });
  };

  const confirmUpdateFolderStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/barangays/${selectedBarangay}/folders/${statusConfirm.folderId}/status`,
        { status: statusConfirm.status },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success(`Folder marked as ${statusConfirm.status}!`);
      fetchFolders(selectedBarangay);
    } catch (error) {
      toast.error("Failed to update folder status.");
    } finally {
      setStatusConfirm({ open: false, folderId: null, status: null });
    }
  };

  const [statusConfirm, setStatusConfirm] = useState({
    open: false,
    folderId: null,
    status: null,
  });

  return (
    <>
      <style>{folderStyles}</style>
      <div className="min-h-screen bg-blue-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
          {/* Enhanced Header */}
          <div className="mb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">
                  Barangay Management
                </h1>
                <p className="text-slate-600 mt-1 text-sm">
                  {" "}
                  Organize and manage barangay documents efficiently
                </p>
              </div>

              <div className="flex items-center gap-3">
                {user?.role === "Admin" && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm shadow-md transition-all flex items-center gap-2"
                    >
                      <HousePlus size={20} />
                      <span>Add Barangay</span>
                    </button>

                    <button
                      onClick={() => navigate("/admin/dashboard")}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm shadow-md transition-all flex items-center gap-2"
                    >
                      <Check size={20} />
                      <span>Approved</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <Suspense fallback={<div>Loading...</div>}>
              <AddBarangay
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={() => {
                  toast.success("Barangay added successfully!");
                  fetchBarangays();
                }}
              />
            </Suspense>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 bg">
            {/* Barangay Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden sticky top-6">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5">
                  <h2 className="text-lg font-bold text-white mb-3">
                    Barangays
                  </h2>
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-200"
                      size={18}
                    />
                    <input
                      type="text"
                      placeholder="Search barangay..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                    />
                  </div>
                </div>

                <div
                  className="overflow-y-auto"
                  style={{ maxHeight: "calc(100vh - 300px)" }}
                >
                  {loading ? (
                    <div className="p-12 text-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mx-auto"></div>
                      <p className="mt-4 text-sm text-slate-500 font-medium">
                        Loading...
                      </p>
                    </div>
                  ) : filteredBarangays.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <HousePlus className="text-slate-400" size={32} />
                      </div>
                      <p className="text-sm text-slate-500 font-medium">
                        No barangays found
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {filteredBarangays.map((b) => {
                        const isSelected = selectedBarangay === b._id;
                        return (
                          <div
                            key={b._id}
                            onClick={() => {
                              let currentUser = user;
                              if (!currentUser) {
                                try {
                                  const raw = localStorage.getItem("user");
                                  if (
                                    raw &&
                                    raw !== "undefined" &&
                                    raw !== "null"
                                  ) {
                                    currentUser = JSON.parse(raw);
                                  }
                                } catch {}
                              }
                              fetchStorageDocuments(b._id, currentUser);
                            }}
                            className={`p-4 cursor-pointer transition-all duration-200 ${
                              isSelected
                                ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex justify-between items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <h3
                                  className={`font-semibold truncate ${
                                    isSelected
                                      ? "text-blue-900"
                                      : "text-slate-900"
                                  }`}
                                >
                                  {b.barangayName || b.barangay || "—"}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1 truncate">
                                  {b.city}, {b.province}
                                </p>
                              </div>
                              {user?.role === "Admin" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteBarangay(b._id);
                                  }}
                                  className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete barangay"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                {selectedBarangay ? (
                  <div className="space-y-6">
                    {/* Documents Section */}
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                          <h2 className="text-xl font-bold text-slate-900">
                            Stored Documents
                          </h2>
                          <p className="text-sm text-slate-600 mt-1">
                            Manage and organize your documents
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <div className="relative flex-1 min-w-[200px]">
                            <Search
                              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                              size={18}
                            />
                            <input
                              type="text"
                              placeholder="Search folders by name, status, or content..."
                              value={docSearch}
                              onChange={(e) => setDocSearch(e.target.value)}
                              className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                          </div>

                          <div className="relative">
                            <Filter
                              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                              size={18}
                            />
                            <select
                              value={docStatusFilter}
                              onChange={(e) =>
                                setDocStatusFilter(e.target.value)
                              }
                              className="pl-10 pr-8 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all appearance-none cursor-pointer"
                            >
                              <option value="">All Status</option>
                              <option value="pending">Pending</option>
                              <option value="ongoing">Ongoing</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>

                          {user?.role === "Official" &&
                            (user.position === "Secretary" ||
                              user.position === "Treasurer" ||
                              user.position === "Chairman") && (
                              <button
                                onClick={() => setShowCreateFolderModal(true)}
                                className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                              >
                                <FolderPlus size={18} />
                                <span>New Folder</span>
                              </button>
                            )}
                        </div>
                      </div>

                      {/* Folders Grid */}
                      {filteredFolders.length > 0 && (
                        <div className="mb-8">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-900">
                              Folders
                            </h3>
                            {selectedFolder && (
                              <button
                                onClick={() => setSelectedFolder(null)}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
                              >
                                <span>←</span> Back to All
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
                            {filteredFolders.map((folder) => {
                              const folderDocuments = filterDocuments(
                                storage.filter(
                                  (item) =>
                                    item.folder &&
                                    item.folder._id === folder._id,
                                ),
                              );
                              const isSelectedFolder =
                                selectedFolder &&
                                selectedFolder._id === folder._id;
                              return (
                                <div
                                  key={folder._id}
                                  className="flex justify-center"
                                >
                                  <div
                                    className="folder-container relative"
                                    onClick={() => {
                                      const folderDocs = filterDocuments(
                                        storage.filter(
                                          (item) =>
                                            item.folder &&
                                            item.folder._id === folder._id,
                                        ),
                                      );
                                      setFolderViewData({
                                        folder,
                                        documents: folderDocs,
                                      });
                                      setShowFolderViewModal(true);
                                    }}
                                  >
                                    <div className="animated-folder">
                                      {/* File cards */}
                                      <div className="file one"></div>
                                      <div className="file two"></div>
                                      <div className="file three"></div>
                                    </div>

                                    {/* Controls */}
                                    {user?.role === "Official" &&
                                      (user.position === "Secretary" ||
                                        user.position === "Treasurer" ||
                                        user.position === "Chairman") && (
                                        <div className="absolute -top-1 -right-4 flex gap-1.5 z-50">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedFolderForUpload(
                                                folder._id,
                                              );
                                              setShowFolderComposeModal(true);
                                            }}
                                            className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all hover:scale-110"
                                            title="Add document"
                                          >
                                            <Plus size={14} />
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteFolder(
                                                folder._id,
                                                folder.name,
                                              );
                                            }}
                                            className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all hover:scale-110"
                                            title="Delete folder"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </div>
                                      )}

                                    {/* Folder Label */}
                                    <div className="folder-name">
                                      {folder.name}
                                    </div>
                                    <div className="folder-count">
                                      {folderDocuments.length} item
                                      {folderDocuments.length !== 1 ? "s" : ""}
                                    </div>

                                    {/* Status badge */}
                                    <div className="mt-2 flex flex-col items-center justify-center gap-2">
                                      <div className="text-sm font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                                        {folder.status
                                          ? folder.status
                                              .charAt(0)
                                              .toUpperCase() +
                                            folder.status.slice(1)
                                          : "Pending"}
                                      </div>
                                      {/* Status change buttons for officials */}
                                      {user?.role === "Official" && (
                                        <div className="flex gap-2 mt-1">
                                          {folder.status !== "ongoing" && (
                                            <button
                                              className="px-3 py-1 bg-amber-100 text-amber-800 rounded text-xs font-semibold border border-amber-300 hover:bg-amber-200 transition"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleUpdateFolderStatus(
                                                  folder._id,
                                                  "ongoing",
                                                );
                                              }}
                                            >
                                              Set Ongoing
                                            </button>
                                          )}
                                          {folder.status !== "completed" && (
                                            <button
                                              className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded text-xs font-semibold border border-emerald-300 hover:bg-emerald-200 transition"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleUpdateFolderStatus(
                                                  folder._id,
                                                  "completed",
                                                );
                                              }}
                                            >
                                              Set Completed
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    {isSelectedFolder && (
                                      <div className="mt-2 text-xs text-blue-600 font-semibold text-center">
                                        ✓ Selected
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Document List */}
                      {selectedFolder ? (
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 mb-4">
                            Documents in "{selectedFolder.name}"
                          </h3>
                          {(() => {
                            const folderDocuments = filterDocuments(
                              storage.filter(
                                (item) =>
                                  item.folder &&
                                  item.folder._id === selectedFolder._id,
                              ),
                            );
                            return folderDocuments.length === 0 ? (
                              <div className="text-center py-16">
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <svg
                                    className="h-10 w-10 text-slate-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                </div>
                                <p className="text-slate-500 font-medium">
                                  No documents in this folder
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {folderDocuments.map((item) => (
                                  <DocumentItem
                                    key={item._id}
                                    item={item}
                                    user={user}
                                    folders={folders}
                                    handleUpdateStatus={handleUpdateStatus}
                                    handleMoveToFolder={handleMoveToFolder}
                                    selectedBarangay={selectedBarangay}
                                    setStorage={setStorage}
                                    storage={storage}
                                    setSelectedDocument={setSelectedDocument}
                                    fetchActivityUpdates={fetchActivityUpdates}
                                    showUsersModal={showUsersModal}
                                    setShowUsersModal={setShowUsersModal}
                                    fileInputRef={fileInputRef}
                                    confirmationModal={confirmationModal}
                                    openConfirmationModal={
                                      openConfirmationModal
                                    }
                                    closeConfirmationModal={
                                      closeConfirmationModal
                                    }
                                    handleConfirmAction={handleConfirmAction}
                                    showPreviewModal={showPreviewModal}
                                    setShowPreviewModal={setShowPreviewModal}
                                    previewUrl={previewUrl}
                                    setPreviewUrl={setPreviewUrl}
                                    toast={toast}
                                  />
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <>
                          {(() => {
                            const unassignedDocuments = filterDocuments(
                              storage.filter((item) => !item.folder),
                            );
                            return unassignedDocuments.length === 0 ? null : (
                              <div className="space-y-4">
                                {unassignedDocuments.map((item) => (
                                  <DocumentItem
                                    key={item._id}
                                    item={item}
                                    user={user}
                                    folders={folders}
                                    handleUpdateStatus={handleUpdateStatus}
                                    handleMoveToFolder={handleMoveToFolder}
                                    selectedBarangay={selectedBarangay}
                                    setStorage={setStorage}
                                    storage={storage}
                                    setSelectedDocument={setSelectedDocument}
                                    fetchActivityUpdates={fetchActivityUpdates}
                                    showUsersModal={showUsersModal}
                                    setShowUsersModal={setShowUsersModal}
                                    fileInputRef={fileInputRef}
                                    confirmationModal={confirmationModal}
                                    openConfirmationModal={
                                      openConfirmationModal
                                    }
                                    closeConfirmationModal={
                                      closeConfirmationModal
                                    }
                                    handleConfirmAction={handleConfirmAction}
                                    showPreviewModal={showPreviewModal}
                                    setShowPreviewModal={setShowPreviewModal}
                                    previewUrl={previewUrl}
                                    setPreviewUrl={setPreviewUrl}
                                    toast={toast}
                                  />
                                ))}
                              </div>
                            );
                          })()}
                        </>
                      )}
                    </div>

                    {/* Users Section */}
                    {user?.role === "Admin" && (
                      <div className="border-t-2 border-slate-200 pt-8">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">
                          Assigned Users
                        </h2>

                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-6 mb-6">
                          <label className="block text-sm font-bold text-slate-900 mb-3">
                            Add User to Barangay
                          </label>
                          <div className="flex gap-3">
                            <select
                              value={selectedUserToAdd}
                              onChange={(e) =>
                                setSelectedUserToAdd(e.target.value)
                              }
                              className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                            >
                              <option value="">Select a user...</option>
                              {availableUsers
                                .filter((u) => u.role !== "Admin")
                                .map((u) => (
                                  <option key={u._id} value={u._id}>
                                    {u.firstname} {u.lastname} ({u.username}) -{" "}
                                    {u.role}
                                  </option>
                                ))}
                            </select>
                            <button
                              onClick={handleAssignUser}
                              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all"
                            >
                              Add User
                            </button>
                          </div>
                        </div>

                        {usersInBarangay.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                              <svg
                                className="w-8 h-8 text-slate-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                              </svg>
                            </div>
                            <p className="text-sm text-slate-500 font-medium">
                              No users assigned yet
                            </p>
                          </div>
                        ) : (
                          <div className="overflow-hidden border-2 border-slate-200 rounded-xl">
                            <table className="w-full">
                              <thead className="bg-gradient-to-r from-slate-100 to-slate-50">
                                <tr>
                                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Username
                                  </th>
                                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Name
                                  </th>
                                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Role
                                  </th>
                                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Position
                                  </th>
                                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-slate-200">
                                {usersInBarangay.map((u) => (
                                  <tr
                                    key={u._id}
                                    className="hover:bg-slate-50 transition-colors"
                                  >
                                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                      {u.username}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-700">
                                      {u.firstname} {u.lastname}
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                        {u.role}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-700">
                                      {u.position || "—"}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      {user?.position !== "Chairman" && (
                                        <button
                                          onClick={() =>
                                            handleRemoveUser(u._id)
                                          }
                                          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition-colors"
                                        >
                                          Remove
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Activity Updates Section */}
                    {selectedDocument &&
                      user?.role &&
                      (user.role === "Official" || user.role === "Admin") && (
                        <div className="border-t-2 border-slate-200 pt-8">
                          <div className="flex justify-between items-center mb-6">
                            <div>
                              <h2 className="text-xl font-bold text-slate-900">
                                Activity Updates
                              </h2>
                              <p className="text-sm text-slate-600 mt-1">
                                {selectedDocument.documentName ||
                                  selectedDocument.document?.subject ||
                                  "Document"}
                              </p>
                            </div>
                            <button
                              onClick={() => setSelectedDocument(null)}
                              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <X size={20} className="text-slate-500" />
                            </button>
                          </div>

                          {user?.role === "Official" && (
                            <form
                              onSubmit={handleUploadActivityPhoto}
                              className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 mb-6"
                            >
                              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                                  <ImageIcon className="text-white" size={16} />
                                </div>
                                Post Activity Photo Update
                              </h3>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-bold text-slate-900 mb-2">
                                    Photo
                                  </label>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                      setActivityPhotoFile(
                                        e.target.files?.[0] || null,
                                      )
                                    }
                                    className="block w-full text-sm text-slate-500
                      file:mr-4 file:py-2.5 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-purple-100 file:text-purple-700
                      hover:file:bg-purple-200 transition-all cursor-pointer"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-bold text-slate-900 mb-2">
                                    Caption
                                  </label>
                                  <textarea
                                    value={activityCaption}
                                    onChange={(e) =>
                                      setActivityCaption(e.target.value)
                                    }
                                    placeholder="Add a caption for this update..."
                                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                                    rows={3}
                                  />
                                </div>
                                <div className="flex gap-3">
                                  <button
                                    type="submit"
                                    disabled={uploadingActivity}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all"
                                  >
                                    {uploadingActivity
                                      ? "Uploading..."
                                      : "Upload Photo"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActivityPhotoFile(null);
                                      setActivityCaption("");
                                    }}
                                    className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-sm font-semibold transition-all"
                                  >
                                    Clear
                                  </button>
                                </div>
                              </div>
                            </form>
                          )}

                          <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-4">
                              Updates ({activityUpdates.length})
                            </h3>
                            {activityUpdates.length === 0 ? (
                              <div className="text-center py-12">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                  <ImageIcon
                                    className="text-slate-400"
                                    size={32}
                                  />
                                </div>
                                <p className="text-sm text-slate-500 font-medium">
                                  No activity updates yet
                                </p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {activityUpdates.map((update) => (
                                  <div
                                    key={update._id}
                                    className="border-2 border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                                  >
                                    <img
                                      src={`http://localhost:5000${update.photoUrl}`}
                                      alt="Activity update"
                                      className="w-full h-48 object-cover"
                                    />
                                    <div className="p-4">
                                      <div className="flex justify-between items-start mb-2">
                                        <div>
                                          <p className="text-sm font-bold text-slate-900">
                                            {update.uploadedBy?.firstname}{" "}
                                            {update.uploadedBy?.lastname}
                                          </p>
                                          <p className="text-xs text-slate-500">
                                            {new Date(
                                              update.createdAt,
                                            ).toLocaleDateString()}{" "}
                                            {new Date(
                                              update.createdAt,
                                            ).toLocaleTimeString()}
                                          </p>
                                        </div>
                                        {String(update.uploadedBy?._id) ===
                                          String(user?._id) && (
                                          <button
                                            onClick={() =>
                                              handleDeleteActivityUpdate(
                                                update._id,
                                              )
                                            }
                                            className="px-3 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-semibold transition-colors"
                                          >
                                            Delete
                                          </button>
                                        )}
                                      </div>
                                      {update.caption && (
                                        <p className="text-sm text-slate-700 mt-2">
                                          {update.caption}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                      <svg
                        className="h-12 w-12 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-xl font-bold text-slate-900 mb-2">
                      Select a barangay
                    </p>
                    <p className="text-sm text-slate-500">
                      Choose a barangay from the list to view documents
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ==================== COMPOSE MESSAGE MODAL ==================== */}
      {showComposeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 ">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-white">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <PenSquare size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Compose Message</h2>
                    <p className="text-indigo-100 text-sm">
                      Send a document to your barangay
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseCompose}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X size={22} className="text-white" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Subject */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
                  <Tag size={15} className="text-indigo-600" />
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="e.g., Monthly Report Submission"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Body */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
                  <AlignLeft size={15} className="text-indigo-600" />
                  Message Body <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Write your message here..."
                  rows={5}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                />
              </div>

              {/* Attachment */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
                  <Paperclip size={15} className="text-indigo-600" />
                  Attachment{" "}
                  <span className="text-slate-400 font-normal text-xs">
                    (optional)
                  </span>
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 hover:border-indigo-400 transition-colors">
                  <input
                    type="file"
                    onChange={(e) =>
                      setComposeFile(e.target.files?.[0] || null)
                    }
                    className="block w-full text-sm text-slate-500
                      file:mr-4 file:py-2.5 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-indigo-100 file:text-indigo-700
                      hover:file:bg-indigo-200 transition-all cursor-pointer"
                  />
                  {composeFile && (
                    <div className="mt-3 flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
                      <span className="text-xs font-semibold text-indigo-700 truncate">
                        {composeFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setComposeFile(null)}
                        className="ml-2 text-indigo-400 hover:text-indigo-600 flex-shrink-0"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Info note */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <p className="text-amber-800 text-sm font-medium">
                  Your message will be sent to the admin for approval before it
                  is stored in the barangay documents.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t-2 border-slate-200 bg-slate-50 flex gap-3 flex-shrink-0">
              <button
                onClick={handleSendToBarangay}
                disabled={!composeSubject.trim() || !composeBody.trim()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
              >
                <Send size={18} />
                <span>Send Message</span>
              </button>
              <button
                type="button"
                onClick={handleCloseCompose}
                className="px-6 py-3 bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-300 rounded-xl font-bold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Folder Compose Modal */}
      {showFolderComposeModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-white">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <PenSquare size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">
                      Create Document for Folder
                    </h2>
                    <p className="text-blue-100 text-sm">
                      Add a document directly to your folder
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowFolderComposeModal(false);
                    setFolderComposeData({ subject: "", body: "" });
                    setFolderComposeFiles([]);
                  }}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X size={22} className="text-white" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Subject */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
                  <Tag size={15} className="text-blue-600" />
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={folderComposeData.subject}
                  onChange={(e) =>
                    setFolderComposeData({
                      ...folderComposeData,
                      subject: e.target.value,
                    })
                  }
                  placeholder="e.g., Minutes of Meeting"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Body */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
                  <AlignLeft size={15} className="text-blue-600" />
                  Message Body <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={folderComposeData.body}
                  onChange={(e) =>
                    setFolderComposeData({
                      ...folderComposeData,
                      body: e.target.value,
                    })
                  }
                  placeholder="Write your document content here..."
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                />
              </div>

              {/* Attachment */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
                  <Paperclip size={15} className="text-blue-600" />
                  Attachment{" "}
                  <span className="text-slate-400 font-normal text-xs">
                    (optional)
                  </span>
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      const newFiles = Array.from(e.target.files || []);
                      setFolderComposeFiles((prev) => [...prev, ...newFiles]);
                    }}
                    className="block w-full text-sm text-slate-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-100 file:text-blue-700
                      hover:file:bg-blue-200 transition-all cursor-pointer"
                  />
                  {folderComposeFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-semibold text-blue-700">
                        {folderComposeFiles.length} file
                        {folderComposeFiles.length !== 1 ? "s" : ""} selected
                      </p>
                      <div className="space-y-2">
                        {folderComposeFiles.map((file, index) => (
                          <div
                            key={`${file.name}-${index}`}
                            className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2"
                          >
                            <span className="text-xs font-semibold text-blue-700 truncate flex-1">
                              {file.name}
                            </span>
                            <span className="text-xs text-blue-600 mx-2 flex-shrink-0">
                              {(file.size / 1024).toFixed(1)} KB
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setFolderComposeFiles((prev) =>
                                  prev.filter((_, i) => i !== index),
                                )
                              }
                              className="text-blue-400 hover:text-blue-600 flex-shrink-0 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Info note */}
              <div className="flex items-start gap-3 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={12} className="text-white" />
                </div>
                <p className="text-green-800 text-sm font-medium">
                  This document will be sent for admin approval and stored in
                  the folder once approved.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t-2 border-slate-200 bg-slate-50 flex gap-3 flex-shrink-0">
              <button
                onClick={() =>
                  handleUploadToFolderCompose(selectedFolderForUpload)
                }
                disabled={
                  !folderComposeData.subject.trim() ||
                  !folderComposeData.body.trim() ||
                  uploadingToFolder
                }
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
              >
                {uploadingToFolder ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-r-transparent rounded-full"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    <span>Create Document</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFolderComposeModal(false);
                  setFolderComposeData({ subject: "", body: "" });
                  setFolderComposeFiles([]);
                }}
                className="px-6 py-3 bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-300 rounded-xl font-bold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Hidden File Input for Folder Upload */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && selectedFolderForUpload) {
            handleUploadToFolder(selectedFolderForUpload, file);
          }
        }}
        accept="*/*"
      />
      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 bg-black/40  flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-white">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <FolderPlus size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Create New Folder</h2>
                    <p className="text-indigo-100 text-sm">Name your folder</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCreateFolderModal(false);
                    setNewFolderName("");
                  }}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X size={22} className="text-white" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3">
                  <FolderPlus size={15} className="text-indigo-600" />
                  Folder Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g., Meeting Minutes"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && newFolderName.trim()) {
                      handleCreateFolder(newFolderName);
                      setShowCreateFolderModal(false);
                      setNewFolderName("");
                    }
                  }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t-2 border-slate-200 bg-slate-50 flex gap-3">
              <button
                onClick={() => {
                  if (newFolderName.trim()) {
                    handleCreateFolder(newFolderName);
                    setShowCreateFolderModal(false);
                    setNewFolderName("");
                  }
                }}
                disabled={!newFolderName.trim()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
              >
                <Check size={18} />
                <span>Create Folder</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateFolderModal(false);
                  setNewFolderName("");
                }}
                className="px-6 py-3 bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-300 rounded-xl font-bold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ==================== FOLDER VIEW MODAL - UPDATED ====================
       Replace the existing FOLDER VIEW MODAL section in
      BarangayStorage.jsx with this code  */}
      {showFolderViewModal && folderViewData && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {folderViewData.folder.name}
                  </h2>
                  <p className="text-blue-100 text-sm">
                    {folderViewData.documents.length} document
                    {folderViewData.documents.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Back button - Only show when viewing document details */}
                {folderModalSelectedDoc && (
                  <button
                    onClick={() => {
                      setFolderModalSelectedDoc(null);
                      setFolderModalViewType(null);
                      setFolderModalShowUploadForm(false);
                    }}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors flex items-center gap-2 font-semibold text-sm"
                  >
                    <ArrowLeft size={16} />
                    <span>Back to List</span>
                  </button>
                )}

                {/* Close button */}
                <button
                  onClick={() => {
                    setShowFolderViewModal(false);
                    setFolderViewData(null);
                    setFolderModalSelectedDoc(null);
                    setFolderModalViewType(null);
                    setFolderModalShowUploadForm(false);
                    setFolderSearchQuery("");
                  }}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X size={22} className="text-white" />
                </button>
              </div>
            </div>

            {/* Modal Body - Conditional Panel Display */}
            <div className="flex-1 overflow-y-auto">
              {/* LEFT PANEL - Document List (Show when no document selected) */}
              {!folderModalSelectedDoc && (
                <div className="w-full h-full overflow-y-auto p-6">
                  <div className="max-w-4xl mx-auto">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">
                      Documents in this folder
                    </h3>

                    {/* Search Bar */}
                    <div className="mb-6">
                      <input
                        type="text"
                        placeholder="Search documents by name..."
                        value={folderSearchQuery}
                        onChange={(e) => setFolderSearchQuery(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>

                    {folderViewData.documents.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FileText className="h-10 w-10 text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-medium">
                          No documents in this folder
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {folderViewData.documents
                          .filter((item) => {
                            const documentName = (
                              item.documentName ||
                              item.document?.subject ||
                              "Document"
                            ).toLowerCase();
                            return documentName.includes(
                              folderSearchQuery.toLowerCase(),
                            );
                          })
                          .map((item) => {
                            const messageId = item.document?._id || item._id;
                            const canDeleteMessage =
                              user?.role === "Official" &&
                              (user.position === "Secretary" ||
                                user.position === "Treasurer" ||
                                user.position === "Chairman");

                            return (
                              <div
                                key={item._id}
                                onClick={() => {
                                  setFolderModalSelectedDoc(item);
                                  setFolderModalViewType("details"); // Auto-show details
                                }}
                                className="relative border-2 border-slate-200 rounded-xl p-4 cursor-pointer transition-all hover:border-blue-500 hover:shadow-lg bg-slate-50 hover:bg-blue-50"
                              >
                                {canDeleteMessage && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteMessage(messageId);
                                    }}
                                    className="absolute top-3 right-3 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all"
                                    title="Delete document"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}

                                <div className="flex items-start gap-3">
                                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-6 h-6 text-blue-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-slate-900 text-sm mb-1 truncate">
                                      {item.documentName ||
                                        item.document?.subject ||
                                        "Document"}
                                    </h3>
                                    <p className="text-xs text-slate-600 mb-2">
                                      From:{" "}
                                      <span className="font-semibold">
                                        {item.document?.sender?.username ||
                                          item.uploadedBy?.username}
                                      </span>
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`inline-block px-2 py-1 rounded-md text-xs font-bold ${
                                          item.document?.status === "completed"
                                            ? "bg-emerald-100 text-emerald-700"
                                            : item.document?.status ===
                                                "ongoing"
                                              ? "bg-amber-100 text-amber-700"
                                              : "bg-slate-100 text-slate-700"
                                        }`}
                                      >
                                        {item.document?.status || item.status}
                                      </span>
                                      <span className="text-xs text-slate-500">
                                        {new Date(
                                          item.createdAt,
                                        ).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}

                    {folderViewData.documents.filter((item) => {
                      const documentName = (
                        item.documentName ||
                        item.document?.subject ||
                        "Document"
                      ).toLowerCase();
                      return documentName.includes(
                        folderSearchQuery.toLowerCase(),
                      );
                    }).length === 0 &&
                      folderViewData.documents.length > 0 && (
                        <div className="text-center py-16">
                          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="h-10 w-10 text-slate-400" />
                          </div>
                          <p className="text-slate-500 font-medium">
                            No documents match your search
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* RIGHT PANEL - Document Details (Show when document selected) */}
              {folderModalSelectedDoc && (
                <div className="w-full h-full overflow-y-auto p-6">
                  <div className="max-w-4xl mx-auto space-y-4">
                    {/* Document Header Card */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <FileText className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-xl text-slate-900 mb-2">
                            {folderModalSelectedDoc.documentName ||
                              folderModalSelectedDoc.document?.subject ||
                              "Document"}
                          </h3>
                          <p className="text-sm text-slate-600 mb-2">
                            From:{" "}
                            <span className="font-semibold">
                              {folderModalSelectedDoc.document?.sender
                                ?.username ||
                                folderModalSelectedDoc.uploadedBy?.username}
                            </span>
                          </p>
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${
                                folderModalSelectedDoc.document?.status ===
                                "completed"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : folderModalSelectedDoc.document?.status ===
                                      "ongoing"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {folderModalSelectedDoc.document?.status ||
                                folderModalSelectedDoc.status}
                            </span>
                            <span className="text-sm text-slate-600">
                              {new Date(
                                folderModalSelectedDoc.createdAt,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Tabs */}
                    <div className="flex items-center gap-2 border-b-2 border-slate-200 pb-2">
                      <button
                        onClick={() => setFolderModalViewType("details")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                          folderModalViewType === "details"
                            ? "bg-blue-600 text-white shadow-md"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        <Eye size={16} />
                        <span>Details</span>
                      </button>

                      <button
                        onClick={() => {
                          fetchFolderModalActivityUpdates(
                            folderModalSelectedDoc.document?._id ||
                              folderModalSelectedDoc._id,
                          );
                          setFolderModalViewType("updates");
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                          folderModalViewType === "updates"
                            ? "bg-purple-600 text-white shadow-md"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        <Activity size={16} />
                        <span>Activity Updates</span>
                      </button>

                      {folderModalSelectedDoc.document?.attachment && (
                        <button
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem("token");
                              const response = await axios.get(
                                `http://localhost:5000/api/messages/${folderModalSelectedDoc.document._id}/attachment`,
                                {
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                  },
                                  responseType: "blob",
                                },
                              );

                              const url = window.URL.createObjectURL(
                                new Blob([response.data]),
                              );
                              const link = document.createElement("a");
                              link.href = url;
                              link.setAttribute(
                                "download",
                                folderModalSelectedDoc.document.attachment
                                  .originalName || "attachment",
                              );
                              document.body.appendChild(link);
                              link.click();
                              link.remove();
                              window.URL.revokeObjectURL(url);
                              toast.success("File downloaded successfully!");
                            } catch (error) {
                              console.error("Download failed:", error);
                              toast.error("Failed to download attachment");
                            }
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg text-sm font-semibold transition-all"
                        >
                          <Download size={16} />
                          <span>Download Attachment</span>
                        </button>
                      )}

                      {user?.role === "Official" && (
                        <>
                          <button
                            onClick={() => {
                              setFolderModalShowUploadForm(
                                !folderModalShowUploadForm,
                              );
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                              folderModalShowUploadForm
                                ? "bg-indigo-600 text-white shadow-md"
                                : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                            }`}
                          >
                            <Plus size={16} />
                            <span>Post Update</span>
                          </button>

                          {/* status change buttons inline */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                openConfirmationModal(
                                  "pending",
                                  folderModalSelectedDoc.document._id,
                                  null,
                                  "Mark as Pending",
                                  "Change document status to pending?",
                                )
                              }
                              className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
                            >
                              Pending
                            </button>
                            <button
                              onClick={() =>
                                openConfirmationModal(
                                  "ongoing",
                                  folderModalSelectedDoc.document._id,
                                  null,
                                  "Mark as Ongoing",
                                  "Change document status to ongoing?",
                                )
                              }
                              className="px-3 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 transition-all"
                            >
                              Ongoing
                            </button>
                            <button
                              onClick={() =>
                                openConfirmationModal(
                                  "completed",
                                  folderModalSelectedDoc.document._id,
                                  null,
                                  "Mark as Completed",
                                  "Change document status to completed?",
                                )
                              }
                              className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-all"
                            >
                              Completed
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Upload Activity Form */}
                    {folderModalShowUploadForm && user?.role === "Official" && (
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border-2 border-purple-200">
                        <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                            <Plus className="w-4 h-4 text-white" />
                          </div>
                          Upload Activity Update
                        </h4>
                        <form
                          onSubmit={handleFolderModalUploadActivity}
                          className="space-y-4"
                        >
                          {/* Photo Upload */}
                          <div>
                            <label className="block text-sm font-bold text-slate-900 mb-2">
                              Select Photo *
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                setFolderModalUploadPhoto(
                                  e.target.files?.[0] || null,
                                )
                              }
                              className="block w-full text-sm text-slate-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-lg file:border-0
                          file:text-sm file:font-semibold
                          file:bg-purple-100 file:text-purple-700
                          hover:file:bg-purple-200 transition-all cursor-pointer"
                            />
                            {folderModalUploadPhoto && (
                              <div className="mt-3 relative inline-block">
                                <img
                                  src={URL.createObjectURL(
                                    folderModalUploadPhoto,
                                  )}
                                  alt="Preview"
                                  className="h-32 w-32 object-cover rounded-lg border-2 border-purple-200"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setFolderModalUploadPhoto(null)
                                  }
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold hover:bg-red-600 transition-colors"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Caption */}
                          <div>
                            <label className="block text-sm font-bold text-slate-900 mb-2">
                              Caption (optional)
                            </label>
                            <textarea
                              value={folderModalUploadCaption}
                              onChange={(e) =>
                                setFolderModalUploadCaption(e.target.value)
                              }
                              placeholder="Add a caption for this update..."
                              rows={3}
                              className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none text-sm"
                            />
                          </div>

                          {/* Submit Buttons */}
                          <div className="flex gap-3">
                            <button
                              type="submit"
                              disabled={
                                !folderModalUploadPhoto ||
                                folderModalUploadingActivity
                              }
                              className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                            >
                              {folderModalUploadingActivity ? (
                                <>
                                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-r-transparent rounded-full"></span>
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Check size={16} />
                                  Upload Photo
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFolderModalShowUploadForm(false);
                                setFolderModalUploadPhoto(null);
                                setFolderModalUploadCaption("");
                              }}
                              className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-bold transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* DETAILS VIEW */}
                    {folderModalViewType === "details" && (
                      <div className="bg-white rounded-xl p-5 border-2 border-slate-200">
                        <h4 className="font-bold text-lg text-slate-900 mb-4">
                          Document Information
                        </h4>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-bold text-slate-600 mb-1">
                                Created Date
                              </p>
                              <p className="text-sm text-slate-900 font-semibold">
                                {new Date(
                                  folderModalSelectedDoc.createdAt ||
                                    folderModalSelectedDoc.document?.createdAt,
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-600 mb-1">
                                Status
                              </p>
                              <p className="text-sm text-slate-900 font-semibold capitalize">
                                {folderModalSelectedDoc.document?.status ||
                                  folderModalSelectedDoc.status}
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs font-bold text-slate-600 mb-2">
                              Document Content
                            </p>
                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                              <p className="text-sm text-slate-800 whitespace-pre-wrap">
                                {folderModalSelectedDoc.description ||
                                  folderModalSelectedDoc.document?.body ||
                                  "No content available"}
                              </p>
                            </div>
                          </div>

                          {folderModalSelectedDoc.document?.attachmentUrl && (
                            <div>
                              <p className="text-xs font-bold text-slate-600 mb-2">
                                Attachment
                              </p>
                              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <FileText size={24} className="text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-slate-900 truncate">
                                    {folderModalSelectedDoc.document
                                      .attachmentName ||
                                      folderModalSelectedDoc.document.attachment
                                        ?.originalName ||
                                      "Attachment"}
                                  </p>
                                  <p className="text-xs text-slate-600">
                                    Click to view or download
                                  </p>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                  <button
                                    onClick={() => {
                                      setPreviewUrl(
                                        `http://localhost:5000${folderModalSelectedDoc.document.attachmentUrl}`,
                                      );
                                      setShowPreviewModal(true);
                                    }}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
                                  >
                                    View
                                  </button>
                                  <a
                                    href={`http://localhost:5000${folderModalSelectedDoc.document.attachmentUrl}`}
                                    download={
                                      folderModalSelectedDoc.document
                                        .attachmentName ||
                                      folderModalSelectedDoc.document.attachment
                                        ?.originalName
                                    }
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors"
                                  >
                                    Download
                                  </a>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ACTIVITY UPDATES VIEW */}
                    {folderModalViewType === "updates" && (
                      <div className="bg-white rounded-xl p-5 border-2 border-slate-200">
                        <h4 className="font-bold text-lg text-slate-900 mb-4">
                          Activity Updates ({folderModalActivityUpdates.length})
                        </h4>
                        {folderModalActivityUpdates.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Activity className="w-8 h-8 text-slate-400" />
                            </div>
                            <p className="text-sm text-slate-600 font-medium">
                              No activity updates yet
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {folderModalActivityUpdates.map((update) => (
                              <div
                                key={update._id}
                                className="border-2 border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                              >
                                {update.photoUrl && (
                                  <img
                                    src={`http://localhost:5000${update.photoUrl}`}
                                    alt="Activity Update"
                                    className="w-full h-48 object-cover"
                                  />
                                )}
                                <div className="p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <div>
                                      <p className="text-sm font-bold text-slate-900">
                                        {update.uploadedBy?.firstname}{" "}
                                        {update.uploadedBy?.lastname}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        {new Date(
                                          update.createdAt,
                                        ).toLocaleDateString()}{" "}
                                        {new Date(
                                          update.createdAt,
                                        ).toLocaleTimeString()}
                                      </p>
                                    </div>
                                  </div>
                                  {update.caption && (
                                    <p className="text-sm text-slate-700 mt-2">
                                      {update.caption}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t-2 border-slate-200 bg-slate-50 flex gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  setShowFolderViewModal(false);
                  setFolderViewData(null);
                  setFolderModalSelectedDoc(null);
                  setFolderModalViewType(null);
                  setFolderModalShowUploadForm(false);
                  setFolderSearchQuery("");
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Document/Message Status Confirmation Modal */}
      {confirmationModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4 text-slate-900">
              {confirmationModal.title}
            </h2>
            <p className="mb-6 text-slate-700 text-sm">
              {confirmationModal.message}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeConfirmationModal}
                className="px-6 py-2 bg-slate-200 rounded-lg font-semibold text-slate-700 hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Folder Status Confirmation Modal */}
      {statusConfirm.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-sm w-full">
            <h2 className="text-lg font-bold mb-4 text-slate-900">
              Confirm Status Change
            </h2>
            <p className="mb-6 text-slate-700">
              Are you sure you want to set this folder as{" "}
              <span className="font-semibold">
                {statusConfirm.status.charAt(0).toUpperCase() +
                  statusConfirm.status.slice(1)}
              </span>
              ?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 bg-slate-200 rounded font-semibold text-slate-700 hover:bg-slate-300"
                onClick={() =>
                  setStatusConfirm({
                    open: false,
                    folderId: null,
                    status: null,
                  })
                }
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700"
                onClick={confirmUpdateFolderStatus}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Enhanced Document Item Component

export default BarangayStorage;
