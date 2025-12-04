import User from "../models/UserModel.js";
import Message from "../models/MessageModel.js";

// Admin search: find users matching query and messages they sent
export const searchAll = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    console.log("Search request received with query:", q);

    if (!q) return res.status(400).json({ message: "Query required" });

    const regex = new RegExp(q, "i");

    // find users that match username / email / firstname / lastname
    const users = await User.find({
      $or: [
        { username: regex },
        { email: regex },
        { firstname: regex },
        { lastname: regex },
      ],
    }).select("_id username firstname lastname email role");

    console.log("Found users:", users.length);

    // for each matched user, fetch recent messages they sent
    const userResults = await Promise.all(
      users.map(async (u) => {
        const messages = await Message.find({ sender: u._id })
          .sort({ createdAt: -1 })
          .limit(20)
          .select("_id subject body createdAt status attachmentName");
        return { user: u, messages };
      })
    );

    // also include messages that match subject/body directly (so admin can search content)
    const messagesMatches = await Message.find({
      $or: [{ subject: regex }, { body: regex }],
    })
      .limit(50)
      .sort({ createdAt: -1 })
      .populate("sender", "username firstname lastname");

    console.log("Found messages:", messagesMatches.length);

    res.status(200).json({ users: userResults, messagesMatches });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: error.message });
  }
};

export default { searchAll };
