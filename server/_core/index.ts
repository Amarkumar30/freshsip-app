import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initializeWebSocket } from "../websocket";
import { registerRazorpayWebhook } from "../razorpayWebhook";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  initializeWebSocket(server);
  
  // Health check endpoint FIRST - before body parsing (lightweight, no body needed)
  app.get("/health", (_req, res) => {
    res.status(200).send("ok");
  });
  
  // Configure body parser with error handling for aborted requests
  app.use((req, res, next) => {
    express.json({ limit: "50mb" })(req, res, (err) => {
      if (err && (err.type === 'request.aborted' || err.message === 'request aborted')) {
        // Silently ignore aborted requests (Railway health checks, client disconnects)
        return;
      }
      if (err) return next(err);
      next();
    });
  });
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Register Razorpay webhook (before other routes)
  registerRazorpayWebhook(app);
  
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Global error handler - must be LAST (catches any unhandled errors)
  app.use((err: any, _req: any, res: any, _next: any) => {
    // Silently handle aborted/reset connections
    if (err.type === 'request.aborted' || err.code === 'ECONNRESET' || err.message === 'request aborted') {
      return;
    }
    // Log other errors but don't crash
    console.error('[Server Error]', err.message || err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";
  
  server.listen(port, host, () => {
    console.log(`Server running on http://${host}:${port}/`);
    console.log(`WebSocket server initialized for real-time updates`);
  });
}

startServer().catch(console.error);
