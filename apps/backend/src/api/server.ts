import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { client, getDb } from "../db/client";
import { applyBootstrap } from "../db/applyBootstrap";
import { medicationRouter } from "./routes/medications";
import { scheduleRouter } from "./routes/schedules";
import { doseRouter } from "./routes/doses";
import { adherenceRouter } from "./routes/adherence";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

// Routes
app.use("/medications", medicationRouter);
app.use("/medications", scheduleRouter);
app.use("/doses", doseRouter);
app.use("/adherence", adherenceRouter);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: "NOT_FOUND", message: "Route not found." });
});

const PORT = process.env.PORT ?? 3000;

async function start() {
  const db = await getDb();
  console.log("✅  Connected to MongoDB.");

  // Ensure indexes exist
  await applyBootstrap(db);
  console.log("✅  Indexes bootstrapped.");

  app.listen(PORT, () => {
    console.log(`🚀  API server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("💥  Failed to start server:", err);
  client.close();
  process.exit(1);
});

export default app;
