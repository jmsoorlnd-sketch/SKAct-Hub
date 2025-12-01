import mongoose from "mongoose";

const barangaySchema = new mongoose.Schema({
  barangayName: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  chairmanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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
