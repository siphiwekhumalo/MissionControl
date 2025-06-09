import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { createServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// Create Vite dev server
const vite = await createServer({
  root: join(__dirname, 'client'),
  server: { middlewareMode: true },
  resolve: {
    alias: {
      '@': join(__dirname, 'client/src'),
      '@shared': join(__dirname, 'shared'),
      '@assets': join(__dirname, 'attached_assets'),
    }
  }
});

// Use Vite's connect instance as middleware
app.use(vite.middlewares);

// Add our API routes before the catch-all
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'mission-control-secret-key-007';
let users = [];
let pings = [];
let nextUserId = 1;
let nextPingId = 1;

// Auth functions
const hashPassword = async (password) => await bcrypt.hash(password, 10);
const verifyPassword = async (password, hash) => await bcrypt.compare(password, hash);
const generateToken = (userId) => jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
const verifyToken = (token) => {
  try { return jwt.verify(token, JWT_SECRET); }
  catch (error) { return null; }
};

// Middleware
app.use(express.json({ limit: '10mb' }));

// Auth middleware
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied: Invalid credentials' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      console.log(`[SECURITY ALERT] Invalid token from ${req.ip}`);
      return res.status(401).json({ message: 'Access denied: Invalid credentials' });
    }

    const user = users.find(u => u.id === decoded.userId);
    if (!user) {
      console.log(`[SECURITY ALERT] Token for non-existent agent ${decoded.userId}`);
      return res.status(401).json({ message: 'Access denied: Agent credentials revoked' });
    }

    req.userId = decoded.userId;
    console.log(`[SECURITY] Agent ${decoded.userId} authenticated at ${new Date().toISOString()}`);
    next();
  } catch (error) {
    console.log(`[SECURITY ERROR] Authentication failure:`, error);
    res.status(401).json({ message: 'Access denied: Authentication failed' });
  }
};

// API Routes
app.post('/api/register', async (req, res) => {
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
    
    console.log(`[SECURITY] New agent registered: ${username} (ID: ${user.id})`);
    res.status(201).json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/login', async (req, res) => {
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
    
    console.log(`[SECURITY] Agent ${username} logged in successfully`);
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/user', authenticate, (req, res) => {
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

app.post('/api/pings', authenticate, (req, res) => {
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
    console.log(`[SECURITY] Agent ${req.userId} created transmission #${ping.id}`);
    res.status(201).json(ping);
  } catch (error) {
    console.error('Create ping error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/pings', authenticate, (req, res) => {
  try {
    const userPings = pings.filter(p => p.userId === req.userId);
    console.log(`[SECURITY] Agent ${req.userId} accessed ${userPings.length} transmissions`);
    res.json(userPings);
  } catch (error) {
    console.error('Get pings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/pings/latest', authenticate, (req, res) => {
  try {
    const userPings = pings
      .filter(p => p.userId === req.userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);
    console.log(`[SECURITY] Agent ${req.userId} accessed latest transmissions`);
    res.json(userPings);
  } catch (error) {
    console.error('Get latest pings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/pings/:id', authenticate, (req, res) => {
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
    console.log(`[SECURITY] Agent ${req.userId} responded to transmission #${pingId}`);
    res.status(201).json(ping);
  } catch (error) {
    console.error('Respond to ping error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log('🚀 MissionControl Development Server Operational');
  console.log(`🛡️ Security protocols active on port ${PORT}`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`📡 Backend API: http://localhost:${PORT}/api`);
  console.log('🔒 Full React + Three.js application with JWT authentication\n');
});