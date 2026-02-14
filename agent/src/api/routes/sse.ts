import { Router, Request, Response } from "express";
import { stateStore } from "../server.js";

export const sseRoutes = Router();

// GET /api/events - Server-Sent Events stream for live updates
sseRoutes.get("/", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  // Send initial connection event
  res.write(
    `event: connected\ndata: ${JSON.stringify({ time: Date.now() })}\n\n`,
  );

  // Add to SSE clients list
  stateStore.sseClients.push(res);

  // Remove on disconnect
  req.on("close", () => {
    const idx = stateStore.sseClients.indexOf(res);
    if (idx !== -1) stateStore.sseClients.splice(idx, 1);
  });
});
