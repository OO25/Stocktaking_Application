import "dotenv/config"; // loads .env from process.cwd() — run server from project root
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import router from "./routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser/undefined origin requests (health checks, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS origin not allowed"));
    },
  }),
);
app.use(express.json({ limit: "1mb" }));

app.use("/api", router);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Serve built React client in production
if (!process.env.VERCEL) {
  const clientDist = path.join(__dirname, "../../client/dist");

  app.use(express.static(clientDist));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
