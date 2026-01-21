import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Layout from "../layout/Layout";
import { Trash2, HousePlus, MoreVertical } from "lucide-react";
import AddBarangay from "../components/popforms/barangay/AddBarangay";

const BarangayStorage = () => {
  const navigate = useNavigate();
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
  const [filterProvince, setFilterProvince] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [activityUpdates, setActivityUpdates] = useState([]);
  const [activityPhotoFile, setActivityPhotoFile] = useState(null);
  const [activityCaption, setActivityCaption] = useState("");
  const [uploadingActivity, setUploadingActivity] = useState(false);

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
        return alert(
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
    if (isDuplicate) return alert("A barangay with this name already exists!");
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
      alert("Barangay created successfully!");
      setFormData({ barangay: "", city: "", province: "", region: "" });
      setShowForm(false);
      fetchBarangays();
    } catch (error) {
      console.error("Error creating barangay:", error);
      const serverMsg = error?.response?.data?.message;
      if (serverMsg) {
        alert(serverMsg);
      } else {
        alert("Failed to create barangay.");
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
      // Remove from state immediately
      setBarangays(barangays.filter((b) => b._id !== barangayId));
      alert("Barangay deleted successfully!");
      setSelectedBarangay(null);
      setStorage([]);
    } catch (error) {
      console.error("Error deleting barangay:", error);
      alert("Failed to delete barangay.");
    }
  };

  const handleAssignUser = async () => {
    if (!selectedUserToAdd || !selectedBarangay)
      return alert("Please select a user to assign.");

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
        alert(
          `User reassigned from "${
            prevBarangayName || prevBarangayId
          }" to "${targetName}". Previous access revoked.`,
        );
      } else {
        alert("User assigned successfully!");
      }

      setSelectedUserToAdd("");
    } catch (error) {
      console.error("Error assigning user:", error);
      alert("Failed to assign user.");
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
      // Remove from state immediately
      setUsersInBarangay(usersInBarangay.filter((u) => u._id !== userId));
      alert("User removed from barangay");
    } catch (error) {
      console.error("Error removing user:", error);
      alert("Failed to remove user from barangay.");
    }
  };

  const handleSendToBarangay = async () => {
    if (!selectedBarangay) return alert("Select a barangay first");
    if (!composeSubject || !composeBody)
      return alert("Subject and message are required");
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
      alert(
        "Message sent to admin for approval. It will be stored after approval.",
      );
      setComposeSubject("");
      setComposeBody("");
      setComposeFile(null);
      fetchStorageDocuments(selectedBarangay);
    } catch (error) {
      console.error("Error sending to barangay:", error);
      const serverMsg = error?.response?.data?.message;
      if (serverMsg) alert(serverMsg);
      else alert("Failed to send.");
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
      alert("Folder created successfully!");
      fetchFolders(selectedBarangay);
    } catch (error) {
      console.error("Error creating folder:", error);
      alert("Failed to create folder.");
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
      alert("Document moved to folder!");
      fetchStorageDocuments(selectedBarangay);
    } catch (error) {
      console.error("Error moving document:", error);
      alert("Failed to move document.");
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
      alert("Failed to update status.");
    }
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
      alert(
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
      alert("Failed to delete folder.");
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
    if (!selectedDocument) return alert("Select a document first");
    if (!activityPhotoFile) return alert("Please select a photo");

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

      alert("Activity photo uploaded successfully!");
      setActivityPhotoFile(null);
      setActivityCaption("");
      fetchActivityUpdates(messageId);
    } catch (error) {
      console.error("Error uploading activity photo:", error);
      const serverMsg = error?.response?.data?.message;
      alert(serverMsg || "Failed to upload activity photo");
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

      alert("Activity photo deleted successfully!");
      const messageId = selectedDocument.document?._id || selectedDocument._id;
      fetchActivityUpdates(messageId);
    } catch (error) {
      console.error("Error deleting activity update:", error);
      alert("Failed to delete activity photo");
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

  return (
    <Layout>
      <div className="min-h-full bg-gray-50 p-10">
        <div className="max-w-full mx-auto ">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 mb-4">
            <div className="flex items-center">
              {/* LEFT SIDE */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Barangay Management
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Manage barangays and their documents
                </p>
              </div>

              {/* RIGHT SIDE */}
              <div className="ml-auto flex items-center gap-3">
                {user?.role === "Admin" && (
                  <>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                    >
                      <HousePlus size={20} /> Add Barangay
                    </button>

                    <button
                      onClick={() => navigate("/admin/dashboard")}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200 "
                    >
                      To Approve
                    </button>
                  </>
                )}
              </div>

              <AddBarangay
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={() => {
                  alert("Barangay added successfully!");
                  fetchBarangays();
                }}
              />
            </div>
          </div>

          {/* Create Form */}
          {/* {showForm && user?.role === "Admin" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Create New Barangay
              </h2>
              <form onSubmit={handleCreateBarangay} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Barangay Name
                    </label>
                    <input
                      type="text"
                      name="barangay"
                      placeholder="Enter barangay name"
                      value={formData.barangay}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value="Ormoc City"
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Province
                    </label>
                    <input
                      type="text"
                      value="Leyte"
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Region
                    </label>
                    <input
                      type="text"
                      value="Region 8"
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  Create Barangay
                </button>
              </form>
            </div>
          )} */}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Barangay List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    Barangays
                  </h2>
                  <input
                    type="text"
                    placeholder="Search barangay..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div
                  className="overflow-y-auto"
                  style={{ maxHeight: "calc(100vh - 300px)" }}
                >
                  {loading ? (
                    <div className="p-8 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-sm">Loading...</p>
                    </div>
                  ) : filteredBarangays.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <p className="text-sm">No barangays found</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
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
                            className={`p-4 cursor-pointer transition-colors duration-150 ${
                              isSelected
                                ? "bg-blue-200 border-l-4 border-blue-100"
                                : "hover:bg-blue-100"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3
                                  className={`font-medium ${
                                    isSelected
                                      ? "text-blue-900"
                                      : "text-gray-900"
                                  }`}
                                >
                                  {b.barangayName || b.barangay || "—"}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">
                                  {b.city}, {b.province}
                                </p>
                              </div>
                              {user?.role === "Admin" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteBarangay(b._id);
                                  }}
                                  className="ml-2 px-2 py-1 text-xs bg-red-50 hover:bg-red-300 text-red-600 rounded transition-colors duration-150"
                                >
                                  <Trash2 size={20} />
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

            {/* Details Panel */}
            <div className="lg:col-span-2 ">
              <div className="bg-white  rounded-xl shadow-sm border border-gray-200 p-6">
                {selectedBarangay ? (
                  <div className="space-y-6">
                    {/* Compose Section */}
                    {user &&
                      user.role !== "Admin" &&
                      String(userBarangayId) === String(selectedBarangay) && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-3">
                            Compose Message
                          </h3>
                          <div className="space-y-3">
                            <input
                              value={composeSubject}
                              onChange={(e) =>
                                setComposeSubject(e.target.value)
                              }
                              placeholder="Subject"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <textarea
                              value={composeBody}
                              onChange={(e) => setComposeBody(e.target.value)}
                              placeholder="Message body"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              rows={3}
                            />
                            <input
                              type="file"
                              onChange={(e) =>
                                setComposeFile(e.target.files?.[0] || null)
                              }
                              className="text-sm"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={handleSendToBarangay}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                              >
                                Send
                              </button>
                              <button
                                onClick={() => {
                                  setComposeSubject("");
                                  setComposeBody("");
                                  setComposeFile(null);
                                }}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors duration-200"
                              >
                                Clear
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Documents Section */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                          Stored Documents
                        </h2>
                        {user?.role === "Admin" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const folderName = prompt("Enter folder name:");
                                if (folderName) handleCreateFolder(folderName);
                              }}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                            >
                              Create Folder
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Folders List */}
                      {folders.length > 0 && (
                        <div className="mb-6">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-md font-semibold text-gray-900">
                              Folders
                            </h3>
                            {selectedFolder && (
                              <button
                                onClick={() => setSelectedFolder(null)}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                ← Back to All Documents
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {folders.map((folder) => {
                              const folderDocuments = storage.filter(
                                (item) =>
                                  item.folder && item.folder._id === folder._id,
                              );
                              return (
                                <div
                                  key={folder._id}
                                  className={`border border-gray-200 rounded-lg p-4 cursor-pointer transition-colors relative group ${
                                    selectedFolder &&
                                    selectedFolder._id === folder._id
                                      ? "bg-blue-50 border-blue-300"
                                      : "bg-gray-50 hover:bg-gray-100"
                                  }`}
                                >
                                  {/* Delete button */}
                                  {user?.role === "Admin" && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteFolder(
                                          folder._id,
                                          folder.name,
                                        );
                                      }}
                                      className="absolute top-2 right-2 p-2 text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                      title="Delete folder"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  )}

                                  <div
                                    onClick={() => setSelectedFolder(folder)}
                                  >
                                    <h4 className="font-medium text-gray-900">
                                      {folder.name}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                      {folderDocuments.length} document
                                      {folderDocuments.length !== 1 ? "s" : ""}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Created by: {folder.createdBy?.firstname}{" "}
                                      {folder.createdBy?.lastname}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(
                                        folder.createdAt,
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Folder Contents or All Documents */}
                      {selectedFolder ? (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Documents in "{selectedFolder.name}"
                          </h3>
                          {(() => {
                            const folderDocuments = storage.filter(
                              (item) =>
                                item.folder &&
                                item.folder._id === selectedFolder._id,
                            );
                            return folderDocuments.length === 0 ? (
                              <div className="text-center py-12 text-gray-500">
                                <svg
                                  className="mx-auto h-12 w-12 text-gray-400"
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
                                <p className="mt-2 text-sm">
                                  No documents in this folder
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-3">
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
                                  />
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <>
                          {(() => {
                            const unassignedDocuments = storage.filter(
                              (item) => !item.folder,
                            );
                            return unassignedDocuments.length === 0 ? (
                              <div className="text-center py-12 text-gray-500">
                                <svg
                                  className="mx-auto h-12 w-12 text-gray-400"
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
                                <p className="mt-2 text-sm">
                                  No documents stored yet
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-3">
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
                      <div className="border-t pt-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                          Assigned Users
                        </h2>

                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Add User to Barangay
                          </label>
                          <div className="flex gap-2">
                            <select
                              value={selectedUserToAdd}
                              onChange={(e) =>
                                setSelectedUserToAdd(e.target.value)
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                            >
                              Add
                            </button>
                          </div>
                        </div>

                        {usersInBarangay.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-6">
                            No users assigned yet
                          </p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                                    Username
                                  </th>
                                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                                    First Name
                                  </th>
                                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                                    Last Name
                                  </th>
                                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                                    Role
                                  </th>
                                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                                    Position
                                  </th>
                                  <th className="px-4 py-3 text-center font-medium text-gray-700">
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {usersInBarangay.map((u) => (
                                  <tr key={u._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-900">
                                      {u.username}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">
                                      {u.firstname || "—"}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">
                                      {u.lastname || "—"}
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                        {u.role}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">
                                      {u.position || "—"}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <button
                                        onClick={() => handleRemoveUser(u._id)}
                                        className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-xs font-medium transition-colors duration-150"
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

                    {/* Activity Updates Sub-Storage (Officials can upload, Admins can view) */}
                    {selectedDocument &&
                      user?.role &&
                      (user.role === "Official" || user.role === "Admin") && (
                        <div className="border-t pt-6">
                          <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">
                              Activity Updates -{" "}
                              {selectedDocument.documentName ||
                                selectedDocument.document?.subject ||
                                "Document"}
                            </h2>
                            <button
                              onClick={() => setSelectedDocument(null)}
                              className="text-sm text-gray-500 hover:text-gray-700"
                            >
                              ✕ Close
                            </button>
                          </div>

                          {/* Upload Photo Form - Officials only */}
                          {user?.role === "Official" && (
                            <form
                              onSubmit={handleUploadActivityPhoto}
                              className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
                            >
                              <h3 className="font-semibold text-gray-900 mb-3">
                                Post Activity Photo Update
                              </h3>
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Caption
                                  </label>
                                  <textarea
                                    value={activityCaption}
                                    onChange={(e) =>
                                      setActivityCaption(e.target.value)
                                    }
                                    placeholder="Add a caption for this update..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={2}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="submit"
                                    disabled={uploadingActivity}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors duration-200"
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
                                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors duration-200"
                                  >
                                    Clear
                                  </button>
                                </div>
                              </div>
                            </form>
                          )}

                          {/* Activity Updates Display */}
                          <div>
                            <h3 className="text-md font-semibold text-gray-900 mb-3">
                              Updates ({activityUpdates.length})
                            </h3>
                            {activityUpdates.length === 0 ? (
                              <div className="text-center py-8 text-gray-500">
                                <p className="text-sm">
                                  No activity updates yet
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {activityUpdates.map((update) => (
                                  <div
                                    key={update._id}
                                    className="border border-gray-200 rounded-lg p-4"
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">
                                          {update.uploadedBy?.firstname}{" "}
                                          {update.uploadedBy?.lastname}
                                        </p>
                                        <p className="text-xs text-gray-500">
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
                                          className="px-2 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded transition-colors"
                                        >
                                          Delete
                                        </button>
                                      )}
                                    </div>
                                    <img
                                      src={`http://localhost:5000${update.photoUrl}`}
                                      alt="Activity update"
                                      className="w-full h-auto rounded-md mb-2 max-h-96 object-cover"
                                    />
                                    {update.caption && (
                                      <p className="text-sm text-gray-700">
                                        {update.caption}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                    <svg
                      className="h-16 w-16 text-gray-300 mb-4"
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
                    <p className="text-lg font-medium">Select a barangay</p>
                    <p className="text-sm mt-1">
                      Choose a barangay from the list to view documents
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

// Reusable Document Item Component
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
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarFormData, setCalendarFormData] = useState({
    startDate: "",
    endDate: "",
  });
  const [addingToCalendar, setAddingToCalendar] = useState(false);

  const handleAddToCalendar = async (e) => {
    e.preventDefault();
    if (!calendarFormData.startDate) {
      alert("Please fill in the start date and time");
      return;
    }

    try {
      setAddingToCalendar(true);
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Authentication token not found. Please log in again.");
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

      alert("Document added to calendar successfully");
      setShowCalendarModal(false);
      setCalendarFormData({ startDate: "", endDate: "" });
      setShowMenu(false);
    } catch (error) {
      console.error("Failed to add to calendar:", error);
      alert("Failed to add document to calendar");
    } finally {
      setAddingToCalendar(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">
            {item.documentName || item.document?.subject || "Document"}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            From: {item.document?.sender?.username || item.uploadedBy?.username}{" "}
            ({item.document?.sender?.firstname || item.uploadedBy?.firstname}{" "}
            {item.document?.sender?.lastname || item.uploadedBy?.lastname})
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span
              className={`px-2 py-1 rounded-full ${
                (item.document?.status || item.status) === "completed"
                  ? "bg-green-100 text-green-700"
                  : (item.document?.status || item.status) === "ongoing"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-700"
              }`}
            >
              {item.document?.status || item.status}
            </span>
            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
          </div>
          {item.description && (
            <p className="text-sm text-gray-700 mt-2">{item.description}</p>
          )}
        </div>
        <div className="ml-3 flex items-center gap-2">
          {user?.role &&
            (user.role === "Official" || user.role === "Admin") && (
              <button
                onClick={() => {
                  setSelectedDocument(item);
                  fetchActivityUpdates(item.document?._id || item._id);
                }}
                className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded text-sm font-medium transition-colors duration-150"
              >
                Activity Updates
              </button>
            )}
          {item.documentUrl && (
            <a
              href={`http://localhost:5000${item.documentUrl}`}
              download={item.documentName}
              className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded text-sm font-medium transition-colors duration-150"
              target="_blank"
              rel="noreferrer"
            >
              Download
            </a>
          )}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="More options"
            >
              <MoreVertical size={18} className="text-gray-600" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <button
                  onClick={() => {
                    setShowCalendarModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 font-medium border-b border-gray-200 last:border-b-0"
                >
                  Add to Calendar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {String(item.document?.sender?._id) === String(user?._id) && (
          <>
            <button
              onClick={() => handleUpdateStatus(item.document?._id, "ongoing")}
              className="px-3 py-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded text-sm font-medium transition-colors duration-150"
            >
              Mark Ongoing
            </button>
            <button
              onClick={() =>
                handleUpdateStatus(item.document?._id, "completed")
              }
              className="px-3 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded text-sm font-medium transition-colors duration-150"
            >
              Mark Completed
            </button>
          </>
        )}

        {user?.role === "Admin" && (
          <>
            <select
              onChange={(e) => {
                const folderId = e.target.value;
                handleMoveToFolder(item._id, folderId || null);
                e.target.value = "";
              }}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
              defaultValue=""
            >
              <option value="">Move to Folder</option>
              <option value="">No Folder</option>
              {folders.map((folder) => (
                <option key={folder._id} value={folder._id}>
                  {folder.name}
                </option>
              ))}
            </select>
            <button
              onClick={async () => {
                if (!window.confirm("Remove this message from the barangay?"))
                  return;
                try {
                  const token = localStorage.getItem("token");
                  const docId = item.document?._id || item.document;
                  const url = `http://localhost:5000/api/barangays/${selectedBarangay}/attach-message/${docId}`;
                  console.log("Deleting from URL:", url);
                  await axios.delete(url, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  // Remove from state immediately
                  setStorage(
                    storage.filter(
                      (s) => (s.document?._id || s.document) !== docId,
                    ),
                  );
                  alert("Message removed from barangay and returned to inbox");
                } catch (err) {
                  console.error("Detach failed - Full Error:", {
                    status: err.response?.status,
                    data: err.response?.data,
                    message: err.message,
                    error: err,
                  });
                  alert("Failed to remove message from barangay");
                }
              }}
              className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-sm font-medium transition-colors duration-150"
            >
              Remove
            </button>
          </>
        )}
      </div>

      {/* Add to Calendar Modal */}
      {showCalendarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Add to Calendar
              </h3>
              <button
                onClick={() => setShowCalendarModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddToCalendar} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={addingToCalendar}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  {addingToCalendar ? "Adding..." : "Add to Calendar"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCalendarModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarangayStorage;
