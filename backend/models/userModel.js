import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },

  firstname: {
    type: String,
  },
  lastname: {
    type: String,
  },

  age: {
    type: Number,
    min: 0,
  },
  gender: {
    type: String,
    enum: ["Male", "Female"],
  },

  address: {
    type: String,
  },

  Role: {
    type: String,
    enum: ["Admin", "Chairman", "Secretary", "Treasurer"],
    require: true,
  },
  civil: {
    type: String,
    enum: ["married", "unmarried"],
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);
export default User;
