import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import compression from 'compression';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001; // Use different port to avoid conflicts
const JWT_SECRET = process.env.JWT_SECRET || 'mission-control-secret-key-007';

// In-memory storage
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

// Serve static files from client directory for development
app.use('/src', express.static(join(__dirname, 'client/src')));
app.use('/assets', express.static(join(__dirname, 'attached_assets')));
app.use(express.static(join(__dirname, 'client')));

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

// Ping routes
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

// Serve the main HTML file for all non-API routes
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  
  // Create a basic HTML template for the React app
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MissionControl - Intelligence Operations</title>
    <style>
        body { 
            margin: 0; 
            font-family: 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #000000 0%, #0a0a1a 100%);
            color: #ffffff;
        }
        .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            flex-direction: column;
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(0, 255, 136, 0.1);
            border-top: 3px solid #00ff88;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="loading">
        <div class="spinner"></div>
        <p style="margin-top: 20px; color: #00ff88;">Initializing MissionControl...</p>
    </div>
    
    <script>
        // Basic message for development
        setTimeout(() => {
            document.querySelector('.loading').innerHTML = \`
                <div style="text-align: center; padding: 40px;">
                    <h1 style="color: #00ff88; margin-bottom: 20px;">🕴️ MissionControl</h1>
                    <h2 style="color: #ffffff; font-weight: 300;">Intelligence Operations Network</h2>
                    <p style="color: #cccccc; margin: 20px 0;">Backend API operational on port ${PORT}</p>
                    <div style="margin-top: 30px; padding: 20px; background: rgba(0,255,136,0.1); border-radius: 8px;">
                        <h3 style="color: #00ff88; margin-bottom: 15px;">Available API Endpoints:</h3>
                        <div style="text-align: left; max-width: 400px; margin: 0 auto;">
                            <p><strong>POST</strong> /api/register - Agent registration</p>
                            <p><strong>POST</strong> /api/login - Agent authentication</p>
                            <p><strong>GET</strong> /api/user - User profile</p>
                            <p><strong>POST</strong> /api/pings - Create transmission</p>
                            <p><strong>GET</strong> /api/pings - List transmissions</p>
                            <p><strong>GET</strong> /api/pings/latest - Latest transmissions</p>
                        </div>
                    </div>
                    <p style="color: #888; margin-top: 30px; font-size: 14px;">
                        For full frontend experience, build and deploy the React application
                    </p>
                </div>
            \`;
        }, 1500);
    </script>
</body>
</html>`;
  
  res.send(html);
});

app.listen(PORT, () => {
  console.log('🚀 MissionControl Server Operational');
  console.log(`🛡️  Security protocols active on port ${PORT}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
  console.log('🔒 All transmissions secured with JWT authentication\n');
});