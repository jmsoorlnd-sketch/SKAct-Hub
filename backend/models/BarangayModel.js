import mongoose from "mongoose";

const barangaySchema = new mongoose.Schema({
  barangay: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  province: {
    type: String,
    required: true,
  },
  region: {
    type: String,
    required: true,
  },
});

const Barangay = mongoose.model("Barangay", barangaySchema);
export default Barangay;
