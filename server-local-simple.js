const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

console.log('Starting simple local development server...');
console.log('Demo users available:');
console.log('  - Username: siphiwe, Password: 1924@Khumalo');
console.log('  - Username: agent007, Password: secret123');
console.log('  - Username: fieldagent, Password: field123');

const app = express();

// CORS configuration for local development
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = ['http://localhost:5000', 'http://localhost:5173'];
  
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, Expires, X-Agent-Session');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// In-memory storage
const users = new Map();
const pings = new Map();
let nextUserId = 1;
let nextPingId = 1;

// Demo users setup
const demoUsers = [
  { username: 'siphiwe', password: '1924@Khumalo', email: 'siphiwe@mission.control', firstName: 'Siphiwe', lastName: 'Khumalo' },
  { username: 'agent007', password: 'secret123', email: 'bond@mi6.gov.uk', firstName: 'James', lastName: 'Bond' },
  { username: 'fieldagent', password: 'field123', email: 'field@mission.control', firstName: 'Field', lastName: 'Agent' }
];

// Initialize demo users
demoUsers.forEach(userData => {
  const hashedPassword = bcrypt.hashSync(userData.password, 10);
  const user = {
    id: nextUserId++,
    username: userData.username,
    email: userData.email,
    password: hashedPassword,
    firstName: userData.firstName,
    lastName: userData.lastName,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  users.set(user.id, user);
});

// Helper functions
function getUserByUsername(username) {
  for (const user of users.values()) {
    if (user.username === username) {
      return user;
    }
  }
  return null;
}

function generateToken(userId) {
  return jwt.sign({ userId }, 'demo-secret-for-local-development', { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, 'demo-secret-for-local-development');
  } catch (error) {
    return null;
  }
}

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  req.userId = decoded.userId;
  next();
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, email, firstName, lastName } = req.body;
    
    if (getUserByUsername(username)) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
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
    
    res.status(201).json({ 
      user: userWithoutPassword, 
      token,
      expires: Date.now() + (7 * 24 * 60 * 60 * 1000)
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user.id);
    const { password: _, ...userWithoutPassword } = user;
    
    console.log(`[SECURITY] Agent ${user.id} (${user.username}) authenticated from local development`);
    
    res.json({ 
      user: userWithoutPassword, 
      token,
      expires: Date.now() + (7 * 24 * 60 * 60 * 1000)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// User route
app.get('/api/user', authenticate, (req, res) => {
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

// Ping routes
app.post('/api/pings', authenticate, (req, res) => {
  try {
    const { latitude, longitude, message, parentPingId } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const ping = {
      id: nextPingId++,
      userId: req.userId,
      latitude,
      longitude,
      message: message || null,
      parentPingId: parentPingId || null,
      createdAt: new Date()
    };

    pings.set(ping.id, ping);
    
    console.log(`[SECURITY] Agent ${req.userId} created transmission #${ping.id} at coordinates [${ping.latitude}, ${ping.longitude}]`);
    
    res.status(201).json(ping);
  } catch (error) {
    console.error('Create ping error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/pings', authenticate, (req, res) => {
  try {
    const userPings = Array.from(pings.values())
      .filter(ping => ping.userId === req.userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    console.log(`[SECURITY] Agent ${req.userId} accessed ${userPings.length} transmissions`);
    
    res.json(userPings);
  } catch (error) {
    console.error('Get pings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/pings/latest', authenticate, (req, res) => {
  try {
    const userPings = Array.from(pings.values())
      .filter(ping => ping.userId === req.userId)
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

// Error handler
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error(`Error ${status}:`, message);
  res.status(status).json({ message });
});

// Start server
const port = 3001;
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Simple local development API server running on http://localhost:${port}`);
  console.log(`Frontend should run on http://localhost:5173 or http://localhost:5000`);
  console.log(`CORS configured for both ports`);
});