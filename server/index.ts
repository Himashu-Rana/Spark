import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { validateApiKey, listActors, getActorSchema, executeActor } from "./routes/apify";

export function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  app.post("/api/apify/validate", validateApiKey);
  app.get("/api/apify/actors", listActors);
  app.get("/api/apify/actors/:actorId/schema", getActorSchema);
  app.post("/api/apify/actors/:actorId/execute", executeActor);

  return app;
}
