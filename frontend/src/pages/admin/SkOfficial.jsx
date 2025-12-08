import { useEffect, useState } from "react";
import Layout from "../../layout/Layout";
import CreateOfficialModal from "../../components/popforms/official/AddOfficial";
import EditOfficial from "../../components/popforms/official/EditOfficial";
import axios from "axios";
import { useToast } from "../../components/Toast";
import { UserPlus } from "lucide-react";

const SkOfficial = () => {
  const { success, error } = useToast();
  const [officials, setOfficials] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [barangay, setBarangay] = useState([]);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [selectedOfficial, setSelectedOfficial] = useState(null);

  const [filters, setFilters] = useState({
    status: "",
    position: "",
    barangay: "",
    search: "",
  });

  // Apply filters to officials
  const applyFilters = (officials) => {
    return officials.filter((official) => {
      if (filters.status && official.status !== filters.status) return false;
      if (filters.position && official.position !== filters.position)
        return false;
      if (filters.barangay && official.barangay !== filters.barangay)
        return false;
      if (
        filters.search &&
        !(
          official.firstname
            .toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          official.lastname
            .toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          official.username
            .toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          official.email.toLowerCase().includes(filters.search.toLowerCase())
        )
      )
        return false;
      return true;
    });
  };

  // Fetch officials from backend
  useEffect(() => {
    const fetchOfficials = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/admins/getofficials",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setOfficials(res.data);
      } catch (err) {
        console.error("Error fetching officials:", err);
      }
    };
    fetchOfficials();
  }, []);

  // Toggle active/inactive status
  const handleToggleStatus = async (official) => {
    const newStatus = official.status === "Active" ? "Inactive" : "Active";

    const confirmMsg =
      newStatus === "Inactive"
        ? "Are you sure you want to deactivate this official?"
        : "Are you sure you want to activate this official?";

    if (!window.confirm(confirmMsg)) return;

    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `http://localhost:5000/api/admins/status-official/${official._id}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Update UI instantly
      setOfficials((prev) =>
        prev.map((o) =>
          o._id === official._id ? { ...o, status: newStatus } : o
        )
      );
    } catch (err) {
      console.error(err);
      error(err.response?.data?.message || "Failed to update status");
    }
  };
  const handleUpdateOfficial = (updatedOfficial) => {
    setOfficials((prev) =>
      prev.map((o) => (o._id === updatedOfficial._id ? updatedOfficial : o))
    );
  };

  //fetch barangay
  useEffect(() => {
    const fetchBarangays = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/barangays/all-barangays",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setBarangay(res.data.barangays || []); // ensure it's always an array
      } catch (err) {
        console.error("Error fetching barangays:", err);
      }
    };
    fetchBarangays();
  }, []);
  return (
    <Layout>
      <div className="bg-white h-full rounded-2xl p-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-3xl font-bold text-gray-800">
            SK Officials Management
          </h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 flex gap-2 text-white rounded-md"
          >
            <UserPlus size={20} />
            Add Official
          </button>
          <CreateOfficialModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={(newOfficial) =>
              setOfficials((prev) => [...prev, newOfficial])
            }
          />
        </div>

        {/* Search + Filters */}
        <div className="p-2   rounded-lg mb-6 flex items-center gap-4">
          <input
            type="text"
            placeholder="Search SK officials..."
            className="flex-1 px-4 py-2 border rounded-lg bg-white"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <select
            className="px-4 py-2 border rounded-lg bg-white"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">Filter by Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <select
            className="px-4 py-2 border rounded-lg bg-white"
            value={filters.position}
            onChange={(e) =>
              setFilters({ ...filters, position: e.target.value })
            }
          >
            <option value="">Filter by Position</option>
            <option>Chairman</option>
            <option>Secretary</option>
            <option>Treasurer</option>
          </select>
          <select
            className="px-4 py-2 border rounded-lg bg-white"
            value={filters.barangay}
            onChange={(e) =>
              setFilters({ ...filters, barangay: e.target.value })
            }
          >
            <option value="">Filter by Barangay</option>

            {barangay.map((barangay) => (
              <option key={barangay._id} value={barangay._id}>
                {barangay.barangayName}
              </option>
            ))}
          </select>
        </div>

        {/* Officials Table */}
        <div className="rounded-lg  overflow-auto">
          <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
            <table className="min-w-full ">
              <thead className="bg-gray-300 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Last Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    First Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Barangay
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {applyFilters(officials).map((official) => (
                  <tr
                    key={official._id}
                    className={`transition-colors duration-500 ${
                      official.status === "Inactive"
                        ? "bg-red-100"
                        : "bg-blue-100"
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {official.lastname}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {official.firstname}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {official.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {official.barangay?.barangayName || ""}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {official.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {official.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          official.status === "Active"
                            ? "bg-blue-200 text-blue-800"
                            : "bg-red-200 text-red-800"
                        }`}
                      >
                        {official.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <div className="flex gap-3 justify-center">
                        <button
                          className="text-blue-600 hover:text-blue-800 font-medium"
                          onClick={() => {
                            setSelectedOfficial(official);
                            setIsResetOpen(true);
                          }}
                        >
                          Edit
                        </button>

                        <button
                          className={`font-medium ${
                            official.status === "Active"
                              ? "text-red-600 hover:text-red-800"
                              : "text-blue-600 hover:text-blue-800"
                          }`}
                          onClick={() => handleToggleStatus(official)}
                        >
                          {official.status === "Active"
                            ? "Deactivate"
                            : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reset Password Modal */}
        <EditOfficial
          isOpen={isResetOpen}
          onClose={() => {
            setIsResetOpen(false);
            setSelectedOfficial(null);
          }}
          official={selectedOfficial}
          onSubmit={handleUpdateOfficial}
        />
      </div>
    </Layout>
  );
};

export default SkOfficial;
