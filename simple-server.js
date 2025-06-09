import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 5000;
const JWT_SECRET = 'mission-control-secret-key-007';

// In-memory storage
let users = [];
let pings = [];
let nextUserId = 1;
let nextPingId = 1;

// Middleware
app.use(express.json());
app.use(express.static('public'));

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

// Auth middleware
const authenticate = (req, res, next) => {
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
  console.log(`[SECURITY] Agent ${decoded.userId} authenticated at ${new Date().toISOString()}`);
  next();
};

// Routes
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
    
    console.log(`[SECURITY] New agent registered: ${username}`);
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
    
    console.log(`[SECURITY] Agent ${username} logged in`);
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/user', authenticate, (req, res) => {
  const user = users.find(u => u.id === req.userId);
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

app.post('/api/pings', authenticate, (req, res) => {
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
});

app.get('/api/pings', authenticate, (req, res) => {
  const userPings = pings.filter(p => p.userId === req.userId);
  console.log(`[SECURITY] Agent ${req.userId} accessed ${userPings.length} transmissions`);
  res.json(userPings);
});

app.get('/api/pings/latest', authenticate, (req, res) => {
  const userPings = pings
    .filter(p => p.userId === req.userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);
  
  res.json(userPings);
});

app.post('/api/pings/:id', authenticate, (req, res) => {
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
});

// Create a basic HTML file for testing
const createTestHTML = () => {
  const html = `<!DOCTYPE html>
<html>
<head>
    <title>MissionControl - Agent Login</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            background: linear-gradient(135deg, #1a1a2e, #16213e); 
            color: white; 
            margin: 0; 
            padding: 20px; 
        }
        .container { 
            max-width: 400px; 
            margin: 50px auto; 
            padding: 30px; 
            background: rgba(255,255,255,0.1); 
            border-radius: 10px; 
            backdrop-filter: blur(10px); 
        }
        h1 { text-align: center; color: #00ff88; }
        input { 
            width: 100%; 
            padding: 10px; 
            margin: 10px 0; 
            border: 1px solid #333; 
            border-radius: 5px; 
            background: rgba(255,255,255,0.1); 
            color: white; 
        }
        button { 
            width: 100%; 
            padding: 12px; 
            background: #00ff88; 
            color: black; 
            border: none; 
            border-radius: 5px; 
            cursor: pointer; 
            font-weight: bold; 
        }
        button:hover { background: #00cc66; }
        .result { margin-top: 20px; padding: 10px; border-radius: 5px; }
        .success { background: rgba(0,255,136,0.2); }
        .error { background: rgba(255,0,0,0.2); }
    </style>
</head>
<body>
    <div class="container">
        <h1>🕴️ MissionControl</h1>
        <h2>Agent Authentication</h2>
        
        <div id="registerForm">
            <h3>Register New Agent</h3>
            <input type="text" id="regUsername" placeholder="Username" />
            <input type="email" id="regEmail" placeholder="Email (optional)" />
            <input type="password" id="regPassword" placeholder="Password" />
            <input type="text" id="regFirstName" placeholder="First Name (optional)" />
            <input type="text" id="regLastName" placeholder="Last Name (optional)" />
            <button onclick="register()">Register Agent</button>
        </div>
        
        <hr style="margin: 30px 0; border-color: #333;">
        
        <div id="loginForm">
            <h3>Agent Login</h3>
            <input type="text" id="loginUsername" placeholder="Username" />
            <input type="password" id="loginPassword" placeholder="Password" />
            <button onclick="login()">Access System</button>
        </div>
        
        <div id="result"></div>
        
        <div id="dashboard" style="display: none;">
            <h3>Mission Dashboard</h3>
            <button onclick="createPing()">Send Ping</button>
            <button onclick="getPings()">View Transmissions</button>
            <div id="pingData"></div>
        </div>
    </div>

    <script>
        let authToken = '';
        
        async function register() {
            const data = {
                username: document.getElementById('regUsername').value,
                email: document.getElementById('regEmail').value,
                password: document.getElementById('regPassword').value,
                firstName: document.getElementById('regFirstName').value,
                lastName: document.getElementById('regLastName').value
            };
            
            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    authToken = result.token;
                    showResult('Agent registered successfully!', 'success');
                    showDashboard();
                } else {
                    showResult('Registration failed: ' + result.message, 'error');
                }
            } catch (error) {
                showResult('Error: ' + error.message, 'error');
            }
        }
        
        async function login() {
            const data = {
                username: document.getElementById('loginUsername').value,
                password: document.getElementById('loginPassword').value
            };
            
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    authToken = result.token;
                    showResult('Authentication successful!', 'success');
                    showDashboard();
                } else {
                    showResult('Login failed: ' + result.message, 'error');
                }
            } catch (error) {
                showResult('Error: ' + error.message, 'error');
            }
        }
        
        async function createPing() {
            const lat = (Math.random() * 180 - 90).toFixed(4);
            const lng = (Math.random() * 360 - 180).toFixed(4);
            
            try {
                const response = await fetch('/api/pings', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + authToken
                    },
                    body: JSON.stringify({
                        latitude: lat,
                        longitude: lng,
                        message: 'Mission coordinates transmitted'
                    })
                });
                
                const result = await response.json();
                showResult('Ping transmitted successfully!', 'success');
                getPings();
            } catch (error) {
                showResult('Error: ' + error.message, 'error');
            }
        }
        
        async function getPings() {
            try {
                const response = await fetch('/api/pings', {
                    headers: { 'Authorization': 'Bearer ' + authToken }
                });
                
                const pings = await response.json();
                const pingHtml = pings.map(p => 
                    \`<div style="border: 1px solid #333; padding: 10px; margin: 5px 0; border-radius: 5px;">
                        <strong>Ping #\${p.id}</strong><br>
                        Coordinates: \${p.latitude}, \${p.longitude}<br>
                        Message: \${p.message || 'None'}<br>
                        Time: \${new Date(p.createdAt).toLocaleString()}
                    </div>\`
                ).join('');
                
                document.getElementById('pingData').innerHTML = pingHtml;
            } catch (error) {
                showResult('Error: ' + error.message, 'error');
            }
        }
        
        function showResult(message, type) {
            const result = document.getElementById('result');
            result.innerHTML = message;
            result.className = 'result ' + type;
        }
        
        function showDashboard() {
            document.getElementById('registerForm').style.display = 'none';
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
        }
    </script>
</body>
</html>`;

  if (!fs.existsSync('public')) {
    fs.mkdirSync('public');
  }
  fs.writeFileSync('public/index.html', html);
};

// Create test HTML file
createTestHTML();

app.listen(PORT, () => {
  console.log('🚀 MissionControl Server Active');
  console.log(`🛡️  Security protocols enabled on port ${PORT}`);
  console.log(`🌐 Access: http://localhost:${PORT}`);
  console.log('📡 Bond transmission system operational\n');
});