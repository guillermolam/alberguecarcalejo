import express from "express";
import { createRoutes } from "./routes";
import { MemStorage } from "./storage";

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static("dist")); // Serve built frontend

// Initialize storage
const storage = new MemStorage();

// API routes
app.use("/api", createRoutes(storage));

// Fallback to frontend for SPA routing
app.get("*", (req, res) => {
  res.sendFile("index.html", { root: "dist" });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});