import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./server/routes";

// Override storage for local development - this needs to happen before routes import
import "./server/simpleStorage";

// Set up environment for local development with in-memory storage
process.env.NODE_ENV = 'development';
process.env.SESSION_SECRET = 'demo-secret-for-local-development';

console.log('Starting local development server with in-memory storage...');
console.log('Demo users available:');
console.log('  - Username: siphiwe, Password: 1924@Khumalo');
console.log('  - Username: agent007, Password: secret123');
console.log('  - Username: fieldagent, Password: field123');

const app = express();

// Manual CORS configuration for local development (without cors package)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = ['http://localhost:5000', 'http://localhost:5173'];
  
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, Expires, X-Agent-Session');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

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