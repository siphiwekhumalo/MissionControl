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
app.use('/node_modules', express.static(join(__dirname, 'node_modules')));
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

// Serve the React frontend for all non-API routes
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  
  // Serve the React application HTML
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <title>MissionControl - Intelligence Operations</title>
    <script type="importmap">
    {
      "imports": {
        "react": "/node_modules/react/index.js",
        "react-dom": "/node_modules/react-dom/index.js",
        "react-dom/client": "/node_modules/react-dom/client.js",
        "three": "/node_modules/three/build/three.module.js",
        "wouter": "/node_modules/wouter/index.js",
        "@tanstack/react-query": "/node_modules/@tanstack/react-query/build/modern/index.js"
      }
    }
    </script>
    <script>
      // Enable JSX transformation for development
      window.process = { env: { NODE_ENV: 'development' } };
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">
      // Simple JSX transformer for development
      import { createElement as h } from 'react';
      import { createRoot } from 'react-dom/client';
      
      // Basic App component loading screen
      const App = () => {
        return h('div', {
          style: {
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #000000 0%, #0a0a1a 100%)',
            color: '#ffffff',
            fontFamily: "'SF Pro Display', 'Helvetica Neue', Arial, sans-serif",
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column'
          }
        }, [
          h('div', {
            key: 'spinner',
            style: {
              width: '40px',
              height: '40px',
              border: '3px solid rgba(0, 255, 136, 0.1)',
              borderTop: '3px solid #00ff88',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }
          }),
          h('h1', {
            key: 'title',
            style: { color: '#00ff88', marginTop: '20px' }
          }, 'MissionControl'),
          h('p', {
            key: 'subtitle',
            style: { color: '#cccccc' }
          }, 'Intelligence Operations Network'),
          h('p', {
            key: 'status',
            style: { color: '#888', fontSize: '14px', marginTop: '20px' }
          }, 'Backend API operational on port ${PORT}'),
          h('style', {
            key: 'styles'
          }, '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }')
        ]);
      };
      
      const root = createRoot(document.getElementById('root'));
      root.render(h(App));
      
      // Try to load the actual React app after a delay
      setTimeout(() => {
        fetch('/src/main.tsx')
          .then(response => {
            if (response.ok) {
              // If main.tsx exists, try to load it
              const script = document.createElement('script');
              script.type = 'module';
              script.src = '/src/main.tsx';
              document.head.appendChild(script);
            }
          })
          .catch(() => {
            // If main.tsx doesn't load, show API documentation
            const apiDocs = h('div', {
              style: {
                textAlign: 'center',
                padding: '40px',
                maxWidth: '600px'
              }
            }, [
              h('h2', { key: 'api-title', style: { color: '#00ff88' } }, 'API Endpoints Available'),
              h('div', {
                key: 'endpoints',
                style: {
                  background: 'rgba(0,255,136,0.1)',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'left'
                }
              }, [
                h('p', { key: 'register' }, 'POST /api/register - Agent registration'),
                h('p', { key: 'login' }, 'POST /api/login - Agent authentication'),
                h('p', { key: 'user' }, 'GET /api/user - User profile'),
                h('p', { key: 'pings' }, 'POST /api/pings - Create transmission'),
                h('p', { key: 'get-pings' }, 'GET /api/pings - List transmissions'),
                h('p', { key: 'latest' }, 'GET /api/pings/latest - Latest transmissions')
              ])
            ]);
            
            root.render(apiDocs);
          });
      }, 2000);
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