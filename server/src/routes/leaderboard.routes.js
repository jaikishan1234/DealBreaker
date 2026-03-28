import express from "express";
import {
  saveScore,
  getLeaderboard,
} from "../controllers/leaderboard.controller.js";

import protect from "../middleware/auth.middleware.js";

const router = express.Router();


// Save score (protected route)
router.post("/save", protect, saveScore);


// Get leaderboard (public)
router.get("/", getLeaderboard);

export default router;