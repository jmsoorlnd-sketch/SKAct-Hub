import connectDB from "../configDB.js";
import User from "../models/UserModel.js";

/**
 * Backfill script: populate missing firstname/lastname for users.
 * Strategy:
 * - If both firstname and lastname are missing, try to split `username` on non-alphanumeric characters or spaces.
 * - If split yields two or more parts, take first -> firstname, last -> lastname.
 * - Otherwise set firstname = username, leave lastname empty.
 *
 * Run: `node scripts/backfillNames.js` from the `backend` folder.
 */

const run = async () => {
  await connectDB();

  const users = await User.find({
    $or: [
      { firstname: { $in: [null, "", undefined] } },
      { lastname: { $in: [null, "", undefined] } },
    ],
  });

  console.log(`Found ${users.length} users with missing names`);

  for (const u of users) {
    try {
      const username = (u.username || "").trim();
      if (!username) continue;

      // If either firstname or lastname already exists, only fill missing part.
      if (
        (u.firstname && u.firstname.trim()) ||
        (u.lastname && u.lastname.trim())
      ) {
        // fill missing individually
        if (!u.firstname || !u.firstname.trim()) u.firstname = username;
        if (!u.lastname || !u.lastname.trim()) u.lastname = "";
      } else {
        // attempt to split username into names
        const parts = username.split(/[^A-Za-z0-9]+/).filter(Boolean);
        if (parts.length >= 2) {
          u.firstname = parts[0];
          u.lastname = parts.slice(1).join(" ");
        } else {
          u.firstname = username;
          u.lastname = "";
        }
      }

      await u.save();
      console.log(`Updated user ${u._id}: ${u.firstname} ${u.lastname}`);
    } catch (err) {
      console.error(`Failed to update user ${u._id}:`, err.message);
    }
  }

  console.log("Backfill complete.");
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
