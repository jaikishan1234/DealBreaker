import express from "express";
import cors from "cors";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import gameRoutes from "./routes/game.routes.js";
import leaderboardRoutes from "./routes/leaderboard.routes.js";
import errorHandler from "./middleware/error.middleware.js";

const app = express();


// Enable CORS for all requests
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

// Log incoming requests (method, url, status)
app.use(morgan("dev"));


// API routes
app.use("/api/auth", authRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/leaderboard", leaderboardRoutes);


// Health check route
app.get("/", (req, res) => {
  res.send("API is running");
});

// Handle unknown routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler (MUST be last)
app.use(errorHandler);


export default app;