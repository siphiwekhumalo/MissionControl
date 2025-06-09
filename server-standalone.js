import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import compression from 'compression';
import { createServer } from 'http';
import { hashPassword, verifyPassword, generateToken, verifyToken } from './server/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(compression());
app.use(express.json());
app.use(express.static(join(__dirname, 'dist/public')));

// Basic storage (in-memory for this setup)
const users = new Map();
const pings = new Map();
let nextUserId = 1;
let nextPingId = 1;

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
      return res.status(401).json({ message: 'Access denied: Invalid credentials' });
    }

    const user = users.get(decoded.userId);
    if (!user) {
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

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    
    // Check if user exists
    const existingUser = Array.from(users.values()).find(u => u.username === username);
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

    users.set(user.id, user);
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
    
    const user = Array.from(users.values()).find(u => u.username === username);
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
    const user = users.get(req.userId);
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

    pings.set(ping.id, ping);
    console.log(`[SECURITY] Agent ${req.userId} created transmission #${ping.id} at coordinates [${latitude}, ${longitude}]`);
    res.status(201).json(ping);
  } catch (error) {
    console.error('Create ping error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/pings', authenticate, async (req, res) => {
  try {
    const userPings = Array.from(pings.values()).filter(p => p.userId === req.userId);
    console.log(`[SECURITY] Agent ${req.userId} accessed ${userPings.length} transmissions`);
    res.json(userPings);
  } catch (error) {
    console.error('Get pings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/pings/latest', authenticate, async (req, res) => {
  try {
    const userPings = Array.from(pings.values())
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

app.post('/api/pings/:id', authenticate, async (req, res) => {
  try {
    const pingId = parseInt(req.params.id);
    const { latitude, longitude, message } = req.body;
    
    const parentPing = pings.get(pingId);
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

    pings.set(ping.id, ping);
    console.log(`[SECURITY] Agent ${req.userId} responded to transmission #${pingId} with new transmission #${ping.id}`);
    res.status(201).json(ping);
  } catch (error) {
    console.error('Respond to ping error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist/public', 'index.html'));
});

const server = createServer(app);

server.listen(PORT, () => {
  console.log('🚀 MissionControl Server Operational');
  console.log(`🛡️  Security protocols active on port ${PORT}`);
  console.log('📡 Bond transmission system ready');
  console.log(`🌐 Access at: http://localhost:${PORT}`);
  console.log('🔒 All transmissions secured with JWT authentication\n');
});