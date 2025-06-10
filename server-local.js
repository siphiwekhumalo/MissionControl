import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import compression from 'compression';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'mission-control-secret-key-007';

// In-memory storage for local development
let users = [];
let pings = [];
let nextUserId = 1;
let nextPingId = 1;

// Auth functions
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Static files for production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist/public')));
}

// Auth middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied: Invalid credentials' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      console.log(`[SECURITY ALERT] Invalid token from ${req.ip} - JWT verification failed`);
      return res.status(401).json({ message: 'Access denied: Invalid credentials' });
    }

    const user = users.find(u => u.id === decoded.userId);
    if (!user) {
      console.log(`[SECURITY ALERT] Token for non-existent agent ${decoded.userId} from ${req.ip}`);
      return res.status(401).json({ message: 'Access denied: Agent credentials revoked' });
    }

    req.userId = decoded.userId;
    console.log(`[SECURITY] Agent ${decoded.userId} authenticated from ${req.ip} at ${new Date().toISOString()}`);
    next();
  } catch (error) {
    console.log(`[SECURITY ERROR] Authentication failure from ${req.ip}:`, error);
    res.status(401).json({ message: 'Access denied: Authentication failed' });
  }
};

// Auth routes
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

app.get('/api/user', authenticate, async (req, res) => {
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

// Ping routes
app.post('/api/pings', authenticate, async (req, res) => {
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
    console.log(`[SECURITY] Agent ${req.userId} created transmission #${ping.id} at coordinates [${latitude}, ${longitude}]`);
    res.status(201).json(ping);
  } catch (error) {
    console.error('Create ping error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/pings', authenticate, async (req, res) => {
  try {
    const userPings = pings.filter(p => p.userId === req.userId);
    console.log(`[SECURITY] Agent ${req.userId} accessed ${userPings.length} transmissions at ${new Date().toISOString()}`);
    res.json(userPings);
  } catch (error) {
    console.error('Get pings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/pings/latest', authenticate, async (req, res) => {
  try {
    const userPings = pings
      .filter(p => p.userId === req.userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);
    
    console.log(`[SECURITY] Agent ${req.userId} accessed latest transmissions at ${new Date().toISOString()}`);
    res.json(userPings);
  } catch (error) {
    console.error('Get latest pings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/pings/:id', authenticate, async (req, res) => {
  try {
    const pingId = parseInt(req.params.id);
    const { latitude, longitude, message } = req.body;
    
    const parentPing = pings.find(p => p.id === pingId);
    if (!parentPing) {
      return res.status(404).json({ message: 'Parent ping not found' });
    }

    if (parentPing.userId !== req.userId) {
      return res.status(403).json({ message: 'Access denied: Cannot respond to another agent\'s transmission' });
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
    console.log(`[SECURITY] Agent ${req.userId} responded to transmission #${pingId} with new transmission #${ping.id}`);
    res.status(201).json(ping);
  } catch (error) {
    console.error('Respond to ping error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Serve frontend for all other routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/public', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log('🚀 MissionControl Server Operational');
  console.log(`🛡️  Security protocols active on port ${PORT}`);
  console.log('📡 Bond transmission system ready');
  console.log(`🌐 Access at: http://localhost:${PORT}`);
  console.log('🔒 All transmissions secured with JWT authentication\n');
});