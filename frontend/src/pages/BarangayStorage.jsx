import React, { useEffect, useState, useRef, useContext } from "react";
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
} from "lucide-react";
import AddBarangay from "../components/popforms/barangay/AddBarangay";
import { AuthContext } from "../context/AuthContext";
import { useToast } from "../components/Toast";

/* ===================== CUSTOM FOLDER STYLES ===================== */
const folderStyles = `
  .folder-container {
    perspective: 1000px;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
  }

  .animated-folder {
    position: relative;
    width: 100px;
    height: 60px;
    background: #3b82f6; /* blue folder color */
    border: 3px solid #2563eb;
    border-radius: 5px;
    transition: all 0.3s ease-in-out;
    transform-style: preserve-3d;
  }

  .animated-folder::before {
    content: "";
    position: absolute;
    top: -23%;
    left: -3px;
    width: 30px;
    height: 14px;
    background-color: #2563eb;
    border-radius: 5px 5px 0 0;
    z-index: 1;
  }

  .animated-folder::after {
    content: "";
    position: absolute;
    width: 104%;
    height: 103%;
    background-color: #2563eb;
    border: 3px solid #2563eb;
    border-radius: 5px;
    left: -2px;
    top: -1px;
    transform: rotateX(0deg);
    transform-origin: top;
    transition: transform 0.3s ease-in-out;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  .folder-container:hover .animated-folder::after {
    transform: rotateX(-30deg);
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
    max-width: 160px;
    overflow: visible;
    text-overflow: unset;
    white-space: normal;
    word-break: break-word;
    line-height: 1.2;
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
  const { user, setUser } = useContext(AuthContext);
  const role = (user?.role || "").toLowerCase();
  const isOfficial = role === "official";
  const isAdmin = role === "admin";
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  const [folderComposeFile, setFolderComposeFile] = useState(null);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showFolderSuccessModal, setShowFolderSuccessModal] = useState(false);
  const [createdFolderName, setCreatedFolderName] = useState("");
  const [folderStatusModal, setFolderStatusModal] = useState({
    isOpen: false,
    folderId: null,
    status: null,
    folderName: "",
  });
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

  const fetchBarangays = async (currentUser = user) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      if (currentUser && (currentUser.role || "").toLowerCase() === "admin") {
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
      if (currentUser && (currentUser.role || "").toLowerCase() !== "admin") {
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
      setFolders(res.data.folders || []);
    } catch (error) {
      console.error("Error fetching folders:", error);
      setFolders([]);
    }
  };

  const fetchUsersInBarangay = async (barangayId) => {
    try {
      const token = localStorage.getItem("token");
      if (!user || (user.role || "").toLowerCase() !== "admin") return;
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

  const handleCreateFolder = async (folderName) => {
    if (!selectedBarangay || !folderName.trim()) return;
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/barangays/${selectedBarangay}/folders`,
        { name: folderName },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setCreatedFolderName(folderName);
      setShowFolderSuccessModal(true);
      fetchFolders(selectedBarangay);
    } catch (error) {
      console.error("Error creating folder:", error);
      toast.error("Failed to create folder.");
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

    if (action === "ongoing" || action === "completed") {
      await handleUpdateStatus(messageId, action);
    } else if (action === "remove") {
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
        console.error("Detach failed:", err);
        toast.error("Failed to remove message from barangay");
      }
    }

    closeConfirmationModal();
  };

  const handleDeleteFolder = async (folderId, folderName) => {
    const documentsInFolder = storage.filter(
      (item) => item.folder && item.folder._id === folderId,
    );

    let confirmMessage = `Delete folder "${folderName}"?`;
    if (documentsInFolder.length > 0) {
      confirmMessage += `\n\nThis folder contains ${documentsInFolder.length} document(s). They will be moved to stored documents.`;
    }

    if (!window.confirm(confirmMessage)) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/barangays/${selectedBarangay}/folders/${folderId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success(
        `Folder deleted successfully${
          documentsInFolder.length > 0
            ? `! ${documentsInFolder.length} document(s) returned to stored documents.`
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
  };

  const handleUpdateFolderStatus = async (folderId, status) => {
    if (!selectedBarangay || !folderId) return;
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/barangays/${selectedBarangay}/folders/${folderId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Folder status updated");
      fetchFolders(selectedBarangay);
    } catch (error) {
      console.error("Error updating folder status:", error);
      toast.error("Failed to update folder status.");
    }
  };

  const openFolderStatusModal = (folderId, status, folderName) => {
    setFolderStatusModal({ isOpen: true, folderId, status, folderName });
  };

  const closeFolderStatusModal = () => {
    setFolderStatusModal({
      isOpen: false,
      folderId: null,
      status: null,
      folderName: "",
    });
  };

  const confirmFolderStatusChange = async () => {
    const { folderId, status } = folderStatusModal;
    if (!folderId || !status) return closeFolderStatusModal();
    await handleUpdateFolderStatus(folderId, status);
    closeFolderStatusModal();
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
      if (folderComposeFile) fd.append("attachment", folderComposeFile);

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
      setFolderComposeFile(null);
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

  return (
    <>
      <style>{folderStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Enhanced Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold ">Barangay Management</h1>
                <p className="text-slate-600 mt-1 text-sm">
                  {" "}
                  Organize and manage barangay documents efficiently
                </p>
              </div>

              <div className="flex items-center gap-3">
                {isAdmin && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-blue-600  hover:bg-blue-700 text-white rounded-lg font-semibold text-sm shadow-md transition-all flex items-center gap-2"
                  >
                    <HousePlus size={20} />
                    <span>Add Barangay</span>
                  </button>
                )}

                <button
                  onClick={() => navigate("/admin/dashboard")}
                  className="px-4 py-2 bg-emerald-600  hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm shadow-md transition-all flex items-center gap-2"
                >
                  <Check size={20} />
                  <span>Approved</span>
                </button>

                {!isAdmin &&
                  user &&
                  selectedBarangay &&
                  String(user?.barangay?._id || user?.barangay) ===
                    String(selectedBarangay) && (
                    <button
                      onClick={handleOpenCompose}
                      className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                    >
                      <PenSquare size={20} />
                      <span>Compose</span>
                    </button>
                  )}
              </div>
            </div>

            <AddBarangay
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSubmit={() => {
                toast.success("Barangay added successfully!");
                fetchBarangays();
              }}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
                              placeholder="Search documents..."
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
                              <option value="approved">Approved</option>
                              <option value="ongoing">Ongoing</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>

                          {user?.role === "Official" && (
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
                      {folders.length > 0 && (
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
                            {folders.map((folder) => {
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
                                    onClick={() => setSelectedFolder(folder)}
                                  >
                                    <div className="animated-folder">
                                      {/* File cards */}
                                      <div className="file one"></div>
                                      <div className="file two"></div>
                                      <div className="file three"></div>
                                    </div>

                                    {/* Controls */}
                                    {user?.role === "Official" && (
                                      <div className="absolute top-2 right-2 flex gap-1.5 z-50">
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
                                    {/* Status badge and admin visible status */}
                                    <div className="mt-2 flex items-center justify-center gap-2">
                                      <div className="text-sm font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                                        {folder.status
                                          ? folder.status
                                              .charAt(0)
                                              .toUpperCase() +
                                            folder.status.slice(1)
                                          : "Ongoing"}
                                      </div>
                                    </div>

                                    {/* Official controls: toggle status (Admin can only view) */}
                                    {user?.role === "Official" && (
                                      <div className="mt-2 flex items-center justify-center gap-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openFolderStatusModal(
                                              folder._id,
                                              folder.status || "pending",
                                              folder.name,
                                            );
                                          }}
                                          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-xs font-semibold"
                                        >
                                          Change Status
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
                            return unassignedDocuments.length === 0 ? (
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
                                  No documents stored yet
                                </p>
                              </div>
                            ) : (
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
                                      <button
                                        onClick={() => handleRemoveUser(u._id)}
                                        className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition-colors"
                                      >
                                        Remove
                                      </button>
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
                      (isOfficial || isAdmin) && (
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
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 transition-all cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
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
                      file:mr-4 file:py-2 file:px-4
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
                    setFolderComposeFile(null);
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
                    onChange={(e) =>
                      setFolderComposeFile(e.target.files?.[0] || null)
                    }
                    className="block w-full text-sm text-slate-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-100 file:text-blue-700
                      hover:file:bg-blue-200 transition-all cursor-pointer"
                  />
                  {folderComposeFile && (
                    <div className="mt-3 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                      <span className="text-xs font-semibold text-blue-700 truncate">
                        {folderComposeFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFolderComposeFile(null)}
                        className="ml-2 text-blue-400 hover:text-blue-600 flex-shrink-0"
                      >
                        <X size={14} />
                      </button>
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
                  setFolderComposeFile(null);
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
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

      {/* Folder Success Modal */}
      {showFolderSuccessModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            {/* Modal Body */}
            <div className="p-8 text-center space-y-4 flex flex-col items-center justify-center">
              {/* Success Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center animate-pulse">
                <Check size={32} className="text-white" />
              </div>

              {/* Success Message */}
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Folder Created!
                </h2>
                <p className="text-slate-600 text-sm">
                  "{createdFolderName}" has been successfully created and is
                  ready to use.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-4 border-t-2 border-slate-200 bg-slate-50 flex gap-3">
              <button
                onClick={() => {
                  setShowFolderSuccessModal(false);
                  setCreatedFolderName("");
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Check size={18} />
                <span>Done</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Folder Status Confirmation Modal */}
      {folderStatusModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-5 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-white text-lg font-bold">Confirm</h3>
                <button
                  onClick={closeFolderStatusModal}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <p className="text-slate-700 font-semibold">
                  Change status for "{folderStatusModal.folderName}"
                </p>
                <select
                  value={folderStatusModal.status || "pending"}
                  onChange={(e) =>
                    setFolderStatusModal((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                  className="w-full p-2 border rounded"
                >
                  <option value="pending">Pending</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t-2 border-slate-200 bg-slate-50 flex gap-3 justify-end">
              <button
                onClick={closeFolderStatusModal}
                className="px-6 py-2 bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-300 rounded-xl font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmFolderStatusChange}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <Check size={16} />
                <span>Confirm</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Enhanced Document Item Component
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
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showFolderSubmenu, setShowFolderSubmenu] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarFormData, setCalendarFormData] = useState({
    startDate: "",
    endDate: "",
  });
  const [addingToCalendar, setAddingToCalendar] = useState(false);

  // Derive role flags from user
  const isOfficial = user?.role?.toLowerCase() === "official";
  const isAdmin = user?.role?.toLowerCase() === "admin";

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
        "http://localhost:5000/api/messages/send",
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
    switch (status) {
      case "completed":
        return "bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border-emerald-200";
      case "ongoing":
        return "bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="border-2 border-slate-200 rounded-xl p-5 hover:shadow-lg hover:border-blue-300 transition-all duration-200 bg-white">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 text-lg mb-2">
            {item.documentName || item.document?.subject || "Document"}
          </h3>
          <p className="text-sm text-slate-600 mb-3">
            From:{" "}
            <span className="font-semibold">
              {item.document?.sender?.username || item.uploadedBy?.username}
            </span>{" "}
            ({item.document?.sender?.firstname || item.uploadedBy?.firstname}{" "}
            {item.document?.sender?.lastname || item.uploadedBy?.lastname})
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${getStatusColor(
                item.document?.status || item.status,
              )}`}
            >
              {item.document?.status || item.status}
            </span>
            <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">
              {new Date(item.createdAt).toLocaleDateString()}
            </span>
          </div>
          {item.description && (
            <p className="text-xs text-slate-700 mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200 line-clamp-2">
              {item.description}
            </p>
          )}
        </div>
        <div className="ml-4 flex items-start gap-2">
          {user?.role && (isOfficial || isAdmin) && (
            <button
              onClick={() => {
                setSelectedDocument(item);
                fetchActivityUpdates(item.document?._id || item._id);
              }}
              className="px-4 py-2 bg-gradient-to-r from-purple-100 to-purple-50 hover:from-purple-200 hover:to-purple-100 text-purple-700 rounded-lg text-sm font-semibold border-2 border-purple-200 transition-all"
            >
              Activity
            </button>
          )}
          {item.documentUrl && (
            <a
              href={`http://localhost:5000${item.documentUrl}`}
              download={item.documentName}
              className="px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-50 hover:from-blue-200 hover:to-blue-100 text-blue-700 rounded-lg text-sm font-semibold border-2 border-blue-200 transition-all"
              target="_blank"
              rel="noreferrer"
            >
              Download
            </a>
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

      <div className="flex flex-wrap gap-2 pt-6 border-t-2 border-slate-100 mt-6">
        {(String(item.document?.sender?._id) === String(user?._id) ||
          user?.role === "Official") && (
          <>
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
              className="px-4 py-2 bg-gradient-to-r from-amber-100 to-amber-50 hover:from-amber-200 hover:to-amber-100 text-amber-700 rounded-lg text-sm font-semibold border-2 border-amber-200 transition-all"
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
              className="px-4 py-2 bg-gradient-to-r from-emerald-100 to-emerald-50 hover:from-emerald-200 hover:to-emerald-100 text-emerald-700 rounded-lg text-sm font-semibold border-2 border-emerald-200 transition-all"
            >
              Mark Completed
            </button>
          </>
        )}

        {user?.role === "Official" && (
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
              className="px-4 py-2 bg-gradient-to-r from-red-100 to-red-50 hover:from-red-200 hover:to-red-100 text-red-700 rounded-lg text-sm font-semibold border-2 border-red-200 transition-all"
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
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-2xl">
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
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-400 disabled:to-slate-500 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
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
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-2xl">
              <h3 className="text-xl font-bold text-white">
                {confirmationModal.title}
              </h3>
            </div>

            <div className="p-6">
              <p className="text-slate-700 text-base mb-6">
                {confirmationModal.message}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleConfirmAction}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
                >
                  Confirm
                </button>
                <button
                  onClick={closeConfirmationModal}
                  className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarangayStorage;
