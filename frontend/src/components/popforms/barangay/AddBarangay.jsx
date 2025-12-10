import React, { useState } from "react";
import axios from "axios";

const AddBarangay = ({ onSubmit, isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    barangayName: "",
    city: "Ormoc City",
    province: "Leyte",
    region: "Region 8",
  });

  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        "http://localhost:5000/api/barangays/add-barangay",
        formData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      onSubmit(response.data); // send back new barangay
      onClose(); // close modal
    } catch (err) {
      setError(err.response?.data?.message);
      console.log(formData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-md rounded-lg shadow-xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-blue-700">
          Add Barangay
        </h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <div className="w-1/2">
              <label>City</label>
              <input
                name="city"
                value="Ormoc City"
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
                readOnly
              />
            </div>

            <div className="w-1/2">
              <label>Barangay Name</label>
              <input
                name="barangayName"
                value={formData.barangayName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-1/2">
              <label>Province</label>
              <input
                name="city"
                value="Leyte"
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
                readOnly
              />
            </div>
            <div className="w-1/2">
              <label>Region</label>
              <input
                name="city"
                value="Region VIII"
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
                readOnly
              />
            </div>
          </div>

          {/* <div>
            <label>Province</label>
            <select
            name="province"
            value="Leyte"
            onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Select Province</option>
              <option value="Leyte">Leyte</option>
              <option value="Cebu">Cebu</option>
              <option value="Bohol">Bohol</option>
            </select>
          </div>

          <div>
            <label>Region</label>
            <select
              name="region"
              value="Region VIII"
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Select Region</option>
              <option value="Region V">Region V</option>
              <option value="Region VI">Region VI</option>
              <option value="Region VII">Region VII</option>
            </select>
          </div> */}

          <div className="flex justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBarangay;
