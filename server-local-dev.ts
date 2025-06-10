import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./server/routes";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load environment variables manually for local development
try {
  const envPath = resolve('.env.local');
  const envFile = readFileSync(envPath, 'utf8');
  const envVars = envFile.split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .reduce((acc, line) => {
      const [key, value] = line.split('=');
      if (key && value) {
        acc[key.trim()] = value.trim();
      }
      return acc;
    }, {} as Record<string, string>);
  
  // Set environment variables
  Object.assign(process.env, envVars);
} catch (error) {
  // .env.local file doesn't exist, that's okay
}

// Check for required environment variables
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  console.log('For local development, you need to:');
  console.log('   1. Set up a PostgreSQL database');
  console.log('   2. Create a .env.local file with DATABASE_URL');
  console.log('   3. Example: DATABASE_URL=postgresql://user:pass@localhost:5432/dbname');
  console.log('');
  console.log('Alternative: Use the Replit environment which has a database configured');
  process.exit(1);
}

const app = express();

// Manual CORS configuration for local development (without cors package)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
  
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