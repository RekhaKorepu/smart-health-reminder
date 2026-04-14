import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { client, getDb } from "../db/client";
import { applyBootstrap } from "../db/applyBootstrap";
import { medicationRouter } from "./routes/medications";
import { scheduleRouter } from "./routes/schedules";
import { doseRouter } from "./routes/doses";
import { adherenceRouter } from "./routes/adherence";
import { hydrationRouter } from "./routes/hydration";

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
app.use("/hydration", hydrationRouter);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: "NOT_FOUND", message: "Route not found." });
});

import os from "node:os";

const PORT = process.env.PORT ?? 3000;

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]!) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return "localhost";
}

async function start() {
  const db = await getDb();
  console.log("✅  Connected to MongoDB.");

  // Ensure indexes exist
  await applyBootstrap(db);
  console.log("✅  Indexes bootstrapped.");

  app.listen(Number(PORT), "0.0.0.0", () => {
    const localIp = getLocalIp();
    console.log(`🚀  API server running on:`);
    console.log(`    - Local:   http://localhost:${PORT}`);
    console.log(`    - Network: http://${localIp}:${PORT}`);
  });
}

start().catch((err) => {
  console.error("💥  Failed to start server:", err);
  client.close();
  process.exit(1);
});

export default app;
