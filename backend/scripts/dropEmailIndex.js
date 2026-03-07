import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../configDB.js";

dotenv.config();

const dropEmailIndex = async () => {
  try {
    await connectDB();

    const collection = mongoose.connection.collection("users");

    // Check existing indexes
    const indexes = await collection.getIndexes();
    console.log("Current indexes:", Object.keys(indexes));

    // Drop the email_1 unique index if it exists
    if (indexes.email_1) {
      await collection.dropIndex("email_1");
      console.log("✓ Dropped email_1 index successfully");
    } else {
      console.log("✗ email_1 index not found");
    }

    // Show updated indexes
    const updatedIndexes = await collection.getIndexes();
    console.log("Updated indexes:", Object.keys(updatedIndexes));

    process.exit(0);
  } catch (error) {
    console.error("Error dropping index:", error);
    process.exit(1);
  }
};

dropEmailIndex();
