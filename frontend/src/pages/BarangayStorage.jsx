import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../layout/Layout";

const BarangayStorage = () => {
  const [user, setUser] = useState(null);
  const [barangays, setBarangays] = useState([]);
  const [selectedBarangay, setSelectedBarangay] = useState(null);
  const [storage, setStorage] = useState([]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          }
        );
        setBarangays(res.data.barangays || []);
      } else {
        try {
          const meRes = await axios.get(
            "http://localhost:5000/api/barangays/me/barangay",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
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
            err?.response?.data || err.message
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

    // Debug: log token info
    console.log("fetchStorageDocuments - token exists:", !!token);
    console.log(
      "fetchStorageDocuments - token starts with Bearer:",
      token?.startsWith("Bearer")
    );
    console.log("fetchStorageDocuments - currentUser:", currentUser);
    console.log("fetchStorageDocuments - currentUser.role:", currentUser?.role);

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
          }
        );
        setStorage(res.data.storage || []);
      } else {
        const res = await axios.get(
          `http://localhost:5000/api/barangays/${barangayId}/storage`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setStorage(res.data.storage || []);
        setSelectedBarangay(barangayId);
        await fetchUsersInBarangay(barangayId);
        await fetchAvailableUsers();
      }
    } catch (error) {
      console.error("Error fetching storage:", error);
      console.error("Error response:", error?.response?.data);
      console.error("Error status:", error?.response?.status);
      setStorage([]);
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
        }
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
    // Prevent client-side creation if admin already reached the limit
    if (user?.role === "Admin") {
      const createdByThisAdmin = barangays.filter(
        (b) => b?.chairmanId && String(b.chairmanId) === String(user._id)
      ).length;
      if (createdByThisAdmin >= ADMIN_LIMIT) {
        return alert(
          `Creation limit reached. Each admin can create up to ${ADMIN_LIMIT} barangays.`
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
        { headers: { Authorization: `Bearer ${token}` } }
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
      alert("Barangay deleted successfully!");
      fetchBarangays();
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

    // find the selected user's previous barangay (if any)
    const prevUser = availableUsers.find((u) => u._id === selectedUserToAdd);
    const prevBarangayId = prevUser?.barangay
      ? String(prevUser.barangay)
      : null;
    const prevBarangayName = prevUser?.barangayName || null;

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/barangays/assign-user",
        { userId: selectedUserToAdd, barangayId: selectedBarangay },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // refresh lists
      await fetchUsersInBarangay(selectedBarangay);
      await fetchAvailableUsers();

      // find the target barangay display name
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
          }" to "${targetName}". Previous access revoked.`
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
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("User removed from barangay");
      fetchUsersInBarangay(selectedBarangay);
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
        }
      );
      alert("Sent to barangay");
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

  const handleUpdateStatus = async (messageId, status) => {
    if (!messageId) return;
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/messages/${messageId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchStorageDocuments(selectedBarangay);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status.");
    }
  };

  const userBarangayId = user?.barangay?._id || user?.barangay || null;

  return (
    <Layout>
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Barangay Management</h1>
          {user?.role === "Admin" && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              {showForm ? "Cancel" : "+ Create"}
            </button>
          )}
        </div>

        {showForm && user?.role === "Admin" && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-bold mb-4">Create New Barangay</h2>
            <form
              className="grid grid-cols-2 gap-4"
              onSubmit={handleCreateBarangay}
            >
              <input
                type="text"
                name="barangay"
                placeholder="Barangay Name"
                value={formData.barangay}
                onChange={handleChange}
                required
                className="border border-gray-300 rounded px-3 py-2"
              />
              <input
                type="text"
                name="city"
                placeholder="City"
                value="Ormoc City"
                readOnly
                className="border border-gray-300 rounded px-3 py-2 bg-gray-100"
              />
              <input
                type="text"
                name="province"
                placeholder="Province"
                value="Leyte"
                readOnly
                className="border border-gray-300 rounded px-3 py-2 bg-gray-100"
              />
              <input
                type="text"
                name="region"
                placeholder="Region"
                value="Region 8"
                readOnly
                className="border border-gray-300 rounded px-3 py-2 bg-gray-100"
              />
              <button
                type="submit"
                className="col-span-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded font-medium"
              >
                Create Barangay
              </button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1 bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Barangays</h2>
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : barangays.length === 0 ? (
              <p className="text-gray-500">No barangays yet.</p>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[70vh]">
                {barangays.map((b) => (
                  <div
                    key={b._id}
                    onClick={() => {
                      // Re-fetch user from localStorage to ensure current state
                      let currentUser = user;
                      if (!currentUser) {
                        try {
                          const raw = localStorage.getItem("user");
                          if (raw && raw !== "undefined" && raw !== "null") {
                            currentUser = JSON.parse(raw);
                          }
                        } catch (err) {
                          console.warn(
                            "Failed to parse user from localStorage",
                            err
                          );
                        }
                      }
                      fetchStorageDocuments(b._id, currentUser);
                    }}
                    className={`p-3 rounded-lg cursor-pointer transition ${
                      selectedBarangay === b._id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    <p className="font-semibold text-sm">
                      {b.barangayName || b.barangay || "—"}
                    </p>
                    <p className="text-xs opacity-75">
                      {b.city}, {b.province}
                    </p>
                    {user?.role === "Admin" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBarangay(b._id);
                        }}
                        className="mt-2 text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="col-span-2 bg-white p-6 rounded-lg shadow">
            {selectedBarangay ? (
              <div className="space-y-6 max-h-[70vh] overflow-y-auto">
                <div>
                  {/* Compose UI for users to send a message/document to the selected barangay */}
                  {user &&
                    user.role !== "Admin" &&
                    String(userBarangayId) === String(selectedBarangay) && (
                      <div className="mb-6 bg-gray-50 p-4 rounded border border-gray-200">
                        <h3 className="font-semibold mb-2">
                          Compose to Barangay
                        </h3>
                        <input
                          value={composeSubject}
                          onChange={(e) => setComposeSubject(e.target.value)}
                          placeholder="Subject"
                          className="w-full border p-2 rounded mb-2"
                        />
                        <textarea
                          value={composeBody}
                          onChange={(e) => setComposeBody(e.target.value)}
                          placeholder="Message body"
                          className="w-full border p-2 rounded mb-2"
                          rows={3}
                        />
                        <input
                          type="file"
                          onChange={(e) =>
                            setComposeFile(e.target.files?.[0] || null)
                          }
                          className="mb-2"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSendToBarangay}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                          >
                            Send
                          </button>
                          <button
                            onClick={() => {
                              setComposeSubject("");
                              setComposeBody("");
                              setComposeFile(null);
                            }}
                            className="bg-gray-300 px-3 py-1 rounded"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    )}

                  <h2 className="text-2xl font-bold mb-4">Stored Documents</h2>
                  {storage.length === 0 ? (
                    <p className="text-gray-500">No documents stored yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {storage.map((item) => (
                        <div
                          key={item._id}
                          className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold text-lg">
                                {item.documentName ||
                                  item.document?.subject ||
                                  "Document"}
                              </p>
                              <p className="text-sm text-gray-600 font-medium">
                                From:{" "}
                                {item.document?.sender?.username ||
                                  item.uploadedBy?.username}{" "}
                                (
                                {item.document?.sender?.firstname ||
                                  item.uploadedBy?.firstname}{" "}
                                {item.document?.sender?.lastname ||
                                  item.uploadedBy?.lastname}
                                )
                              </p>
                              <p className="text-sm text-gray-600">
                                Status: {item.document?.status || item.status}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(item.createdAt).toLocaleString()}
                              </p>
                              {item.description && (
                                <p className="text-sm text-gray-700 mt-2">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            {item.documentUrl && (
                              <a
                                href={`http://localhost:5000${item.documentUrl}`}
                                download={item.documentName}
                                className="text-blue-600 hover:underline text-sm"
                                target="_blank"
                                rel="noreferrer"
                              >
                                Download
                              </a>
                            )}
                          </div>

                          <div className="mt-3 flex gap-2">
                            {String(item.document?.sender?._id) ===
                              String(user?._id) && (
                              <>
                                <button
                                  onClick={() =>
                                    handleUpdateStatus(
                                      item.document?._id,
                                      "ongoing"
                                    )
                                  }
                                  className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded"
                                >
                                  Mark Ongoing
                                </button>
                                <button
                                  onClick={() =>
                                    handleUpdateStatus(
                                      item.document?._id,
                                      "completed"
                                    )
                                  }
                                  className="text-sm bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                                >
                                  Mark Completed
                                </button>
                              </>
                            )}

                            {user?.role === "Admin" && (
                              <button
                                onClick={async () => {
                                  if (
                                    !window.confirm(
                                      "Remove this message from the barangay?"
                                    )
                                  )
                                    return;
                                  try {
                                    const token = localStorage.getItem("token");
                                    const docId =
                                      item.document?._id || item.document;
                                    await axios.delete(
                                      `http://localhost:5000/api/barangays/${selectedBarangay}/attach-message/${docId}`,
                                      {
                                        headers: {
                                          Authorization: `Bearer ${token}`,
                                        },
                                      }
                                    );
                                    // remove from UI
                                    setStorage((prev) =>
                                      prev.filter(
                                        (s) =>
                                          String(s._id) !== String(item._id)
                                      )
                                    );
                                    // notify other components (dashboard) to refresh inbox
                                    window.dispatchEvent(
                                      new Event("messageDetached")
                                    );
                                    alert(
                                      "Message removed from barangay and returned to inbox"
                                    );
                                  } catch (err) {
                                    console.error("Detach failed", err);
                                    alert(
                                      "Failed to remove message from barangay"
                                    );
                                  }
                                }}
                                className="text-sm bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                              >
                                Remove from Barangay
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {user?.role === "Admin" && (
                  <div className="border-t pt-6">
                    <h2 className="text-2xl font-bold mb-4">Assigned Users</h2>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
                      <label className="block text-sm font-semibold mb-2">
                        Add User to Barangay
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={selectedUserToAdd}
                          onChange={(e) => setSelectedUserToAdd(e.target.value)}
                          className="flex-1 border border-gray-300 rounded px-3 py-2"
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
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {usersInBarangay.length === 0 ? (
                      <p className="text-gray-500">No users assigned yet.</p>
                    ) : (
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-200">
                            <th className="border p-2 text-left">Username</th>
                            <th className="border p-2 text-left">First Name</th>
                            <th className="border p-2 text-left">Last Name</th>
                            <th className="border p-2 text-left">Role</th>
                            <th className="border p-2 text-left">Position</th>
                            <th className="border p-2 text-left">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usersInBarangay.map((u) => (
                            <tr key={u._id} className="border hover:bg-gray-50">
                              <td className="border p-2">{u.username}</td>
                              <td className="border p-2">
                                {u.firstname || "—"}
                              </td>
                              <td className="border p-2">
                                {u.lastname || "—"}
                              </td>
                              <td className="border p-2">{u.role}</td>
                              <td className="border p-2">
                                {u.position || "—"}
                              </td>
                              <td className="border p-2 text-right">
                                <button
                                  onClick={() => handleRemoveUser(u._id)}
                                  className="text-sm bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>Select a barangay to view documents</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BarangayStorage;
