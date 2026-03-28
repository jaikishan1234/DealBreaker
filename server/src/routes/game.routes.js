import express from "express";
import { startGame, negotiate } from "../controllers/game.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/start", protect, startGame);
router.post("/negotiate", protect, negotiate);

export default router;