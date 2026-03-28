import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import gameRoutes from "./routes/game.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/game", gameRoutes);

app.get("/", (req, res) => {
  res.send("API is running");
});

export default app;