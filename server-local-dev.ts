import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./server/routes";

const app = express();

// CORS configuration for local development
app.use(cors({
  origin: 'http://localhost:5000', // Vite frontend
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cache-Control', 'Pragma']
}));

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging for development
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

(async () => {
  // Register API routes
  await registerRoutes(app);

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error(`Error ${status}:`, message);
    res.status(status).json({ message });
  });

  // Start server on port 3001 for local development
  const port = 3001;
  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Local development API server running on http://localhost:${port}`);
    console.log(`Frontend should run on http://localhost:5000`);
  });
})().catch(console.error);