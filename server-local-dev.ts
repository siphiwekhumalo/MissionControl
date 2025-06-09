import express from "express";
import type { Request, Response, NextFunction } from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createServer } from "vite";
import compression from "compression";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || "5000");
const JWT_SECRET = process.env.JWT_SECRET || 'mission-control-secret-key-007';

// In-memory storage for local development
let users: any[] = [];
let pings: any[] = [];
let nextUserId = 1;
let nextPingId = 1;

// Auth functions
const hashPassword = async (password: string) => await bcrypt.hash(password, 10);
const verifyPassword = async (password: string, hash: string) => await bcrypt.compare(password, hash);
const generateToken = (userId: number) => jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
const verifyToken = (token: string) => {
  try { return jwt.verify(token, JWT_SECRET) as { userId: number }; }
  catch (error) { return null; }
};

// Auth middleware
interface AuthRequest extends Request {
  userId?: number;
}

const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const user = users.find(u => u.id === decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

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

  // Middleware
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: false, limit: '10mb' }));

  // Use Vite's middleware
  app.use(vite.middlewares);

  // API Routes
  app.post('/api/register', async (req: Request, res: Response) => {
    try {
      const { username, email, password, firstName, lastName } = req.body;
      
      const existingUser = users.find(u => u.username === username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      const hashedPassword = await hashPassword(password);
      const user = {
        id: nextUserId++,
        username,
        email: email || null,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      users.push(user);
      const token = generateToken(user.id);
      const { password: _, ...userWithoutPassword } = user;
      
      console.log(`[AUTH] New user registered: ${username} (ID: ${user.id})`);
      res.status(201).json({ token, user: userWithoutPassword });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      const user = users.find(u => u.username === username);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = generateToken(user.id);
      const { password: _, ...userWithoutPassword } = user;
      
      console.log(`[AUTH] User ${username} logged in successfully`);
      res.json({ token, user: userWithoutPassword });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/user', authenticate, (req: AuthRequest, res: Response) => {
    try {
      const user = users.find(u => u.id === req.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/pings', authenticate, (req: AuthRequest, res: Response) => {
    try {
      const { latitude, longitude, message } = req.body;
      const ping = {
        id: nextPingId++,
        userId: req.userId,
        latitude,
        longitude,
        message: message || null,
        parentPingId: null,
        createdAt: new Date()
      };
      pings.push(ping);
      console.log(`[DATA] User ${req.userId} created ping #${ping.id}`);
      res.status(201).json(ping);
    } catch (error) {
      console.error('Create ping error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/pings', authenticate, (req: AuthRequest, res: Response) => {
    try {
      const userPings = pings.filter(p => p.userId === req.userId);
      console.log(`[DATA] User ${req.userId} accessed ${userPings.length} pings`);
      res.json(userPings);
    } catch (error) {
      console.error('Get pings error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/pings/latest', authenticate, (req: AuthRequest, res: Response) => {
    try {
      const userPings = pings
        .filter(p => p.userId === req.userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);
      console.log(`[DATA] User ${req.userId} accessed latest pings`);
      res.json(userPings);
    } catch (error) {
      console.error('Get latest pings error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/pings/:id', authenticate, (req: AuthRequest, res: Response) => {
    try {
      const pingId = parseInt(req.params.id);
      const { latitude, longitude, message } = req.body;
      
      const parentPing = pings.find(p => p.id === pingId);
      if (!parentPing) {
        return res.status(404).json({ message: 'Parent ping not found' });
      }
      if (parentPing.userId !== req.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const ping = {
        id: nextPingId++,
        userId: req.userId,
        latitude,
        longitude,
        message: message || null,
        parentPingId: pingId,
        createdAt: new Date()
      };
      pings.push(ping);
      console.log(`[DATA] User ${req.userId} responded to ping #${pingId}`);
      res.status(201).json(ping);
    } catch (error) {
      console.error('Respond to ping error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Error handling
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 MissionControl Local Development Server`);
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`🔐 Authentication: JWT (local storage)`);
    console.log(`💾 Data: In-memory storage`);
    console.log(`⚡ Hot reload: Enabled`);
  });
}

startServer().catch(console.error);