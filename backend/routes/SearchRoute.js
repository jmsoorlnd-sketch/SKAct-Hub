import express from "express";
import { searchAll } from "../controllers/SearchController.js";
import { requireAuth, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// GET /api/search?q=term  (admin only)
router.get("/", requireAuth, adminOnly, searchAll);

export default router;
