import express from "express";
import type { Request, Response, NextFunction } from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createServer } from "vite";
import { registerRoutes } from "./server/routes.js";
import { setupAuth } from "./server/replitAuth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || "5000");

async function startServer() {
  // Create Vite dev server with Node.js v18 compatible config
  const vite = await createServer({
    configFile: false,
    root: join(__dirname, "client"),
    server: { middlewareMode: true },
    resolve: {
      alias: {
        "@": join(__dirname, "client", "src"),
        "@shared": join(__dirname, "shared"),
        "@assets": join(__dirname, "attached_assets"),
      }
    },
    plugins: [
      (await import("@vitejs/plugin-react")).default(),
      (await import("@replit/vite-plugin-runtime-error-modal")).default(),
    ]
  });

  // Use Vite's middleware
  app.use(vite.middlewares);

  // Setup authentication
  await setupAuth(app);

  // Register API routes
  const server = await registerRoutes(app);

  // Error handling
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 MissionControl operational on port ${PORT}`);
    console.log(`🛡️ Security protocols active`);
    console.log(`🌐 Frontend: http://localhost:${PORT}`);
    console.log(`📡 Backend API: http://localhost:${PORT}/api`);
  });
}

startServer().catch(console.error);