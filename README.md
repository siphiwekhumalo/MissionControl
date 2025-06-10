# MissionControl - James Bond Ping Transmission System

A secure, spy-themed web application for mission tracking and communication, designed to provide an immersive intelligence operations experience with enhanced user interaction and dynamic mission management.

![Security Status](https://img.shields.io/badge/Security-Classified-red)
![Build Status](https://img.shields.io/badge/Build-Operational-green)
![Agent Status](https://img.shields.io/badge/Agents-Active-blue)

## 🚀 Quick Start - Local Development

### Prerequisites
- Node.js (v18 or higher)
- Git

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd MissionControl
npm install
```

### 2. Start Backend Server

**Windows Command Prompt:**
```cmd
start-local-dev.bat
```

**Windows PowerShell:**
```powershell
.\dev-local.ps1
```

**Manual (any platform):**
```bash
node server-local-simple.js
```

Backend runs on: `http://localhost:3001`

### 3. Start Frontend (new terminal)
```bash
npx vite
```

Frontend runs on: `http://localhost:5173`

### 4. Access Application
Open `http://localhost:5173` in your browser

## 🔐 Demo Agent Credentials

| Username    | Password      | Clearance Level |
|-------------|---------------|-----------------|
| `siphiwe`   | `1924@Khumalo`| Senior Agent    |
| `agent007`  | `secret123`   | Field Agent     |
| `fieldagent`| `field123`    | Operations      |

## 🎯 Mission Overview

MissionControl is a sophisticated web application that allows intelligence agents to:
- Send encrypted ping transmissions with GPS coordinates
- Create interconnected mission trails through response networks
- Monitor real-time security status and audit logs
- Manage classified operations through a secure dashboard

## ⚡ Testing Ping Operations

1. **Authentication**: Log in with demo credentials
2. **Navigation**: Access "Send Ping" from dashboard
3. **Coordinate Generation**: Click "Generate Coordinates" for random GPS
4. **Message Encryption**: Add optional classified message
5. **Transmission**: Click "Transmit Ping"
6. **Trail Management**: View and respond to pings in dashboard
7. **Response Networks**: Create interconnected mission trails

## 🛠️ Troubleshooting

### Authentication Errors
If seeing "Token for non-existent agent" errors:
- Clear browser storage: F12 → Application → Clear Storage
- Use incognito/private browsing mode
- Log in fresh with demo credentials

### Port Conflicts
- Backend: port 3001 (modify in `server-local-simple.js`)
- Frontend: port 5173 (Vite default)

### CORS Configuration
Local server pre-configured for ports 5000 and 5173

## 🛡️ Security Features

- **JWT Authentication**: Multi-layer token-based security system
- **User Isolation**: Agents can only access their own transmissions
- **Audit Logging**: Real-time security event monitoring
- **Access Controls**: Ownership verification for all operations
- **Secure Headers**: XSS protection and content security policies
- **Encrypted Storage**: Persistent file-based storage with security audit trails

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or 20+
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd missioncontrol
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   
   **For Windows (Command Prompt):**
   ```bash
   dev.bat
   ```
   
   **For Windows (PowerShell):**
   ```bash
   .\dev.ps1
   ```
   
   **For macOS/Linux:**
   ```bash
   NODE_ENV=development tsx server/index.ts
   ```
   
   **Alternative (cross-platform):**
   ```bash
   npx cross-env NODE_ENV=development tsx server/index.ts
   ```

4. **Access the application**
   - Open your browser to `http://localhost:5000`
   - The app runs on a single port with both frontend and backend

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for development and building
- TailwindCSS for styling with custom Bond theme
- Three.js for immersive 3D backgrounds
- TanStack Query for data fetching and caching
- Wouter for lightweight routing
- Shadcn/ui components with custom styling

**Backend:**
- Express.js with TypeScript
- Custom JWT authentication system
- File-based persistent storage
- Compression middleware for performance
- Security audit logging

**Key Features:**
- Glass morphism UI design
- Real-time security monitoring
- Trail-based mission networks
- Responsive design for all devices

### Project Structure

```
missioncontrol/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── ui/         # Shadcn/ui components
│   │   │   ├── AppHeader.tsx
│   │   │   ├── SecurityIndicator.tsx
│   │   │   └── ThreeBackground.tsx
│   │   ├── hooks/          # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useJWTAuth.ts
│   │   │   └── use-toast.ts
│   │   ├── lib/            # Utility functions
│   │   │   ├── queryClient.ts
│   │   │   ├── authUtils.ts
│   │   │   └── utils.ts
│   │   ├── pages/          # Application pages
│   │   │   ├── AuthPage.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── SendPing.tsx
│   │   │   ├── AllPings.tsx
│   │   │   ├── TrailView.tsx
│   │   │   └── SecurityDashboard.tsx
│   │   ├── App.tsx         # Main application component
│   │   ├── main.tsx        # Application entry point
│   │   └── index.css       # Global styles
│   └── index.html          # HTML template
├── server/                 # Backend Express application
│   ├── auth.ts             # JWT authentication system
│   ├── db.ts               # Database configuration
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Persistent storage implementation
│   ├── index.ts            # Server entry point
│   └── vite.ts             # Vite integration
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Data models and validation
├── data/                   # Persistent storage files
│   └── storage.json        # User and ping data
└── package.json            # Dependencies and scripts
```

## 🔐 Authentication System

The application uses a custom JWT-based authentication system:

### User Registration
```bash
POST /api/register
Content-Type: application/json

{
  "username": "agent.bond",
  "email": "james.bond@mi6.gov.uk",
  "password": "classified007",
  "firstName": "James",
  "lastName": "Bond"
}
```

### User Login
```bash
POST /api/login
Content-Type: application/json

{
  "username": "agent.bond",
  "password": "classified007"
}
```

Response includes JWT token for subsequent requests:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "agent.bond",
    "email": "james.bond@mi6.gov.uk",
    "firstName": "James",
    "lastName": "Bond"
  }
}
```

## 📡 API Endpoints

### Authentication
- `POST /api/register` - Register new agent
- `POST /api/login` - Agent authentication
- `GET /api/user` - Get current agent profile

### Ping Operations
- `POST /api/pings` - Create new transmission
- `GET /api/pings` - Get all agent transmissions
- `GET /api/pings/latest` - Get latest 3 transmissions
- `POST /api/pings/:id` - Respond to existing transmission (create trail)

### Example: Creating a Transmission
```bash
POST /api/pings
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "latitude": "51.5074",
  "longitude": "-0.1278",
  "message": "Agent in position at target location"
}
```

### Example: Responding to a Transmission
```bash
POST /api/pings/5
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "latitude": "51.5085",
  "longitude": "-0.1290",
  "message": "Surveillance confirmed, proceeding to extraction point"
}
```

## 🎨 Styling System

The application uses a custom James Bond-inspired theme:

### Color Palette
```css
:root {
  --mission-dark: hsl(220, 15%, 8%);        /* Deep navy background */
  --mission-surface: hsl(220, 10%, 15%);    /* Surface elements */
  --mission-green: hsl(142, 76%, 36%);      /* Primary accent */
  --mission-blue: hsl(217, 91%, 60%);       /* Secondary accent */
  --mission-gold: hsl(45, 93%, 58%);        /* Warning/highlight */
  --mission-silver: hsl(220, 10%, 60%);     /* Muted text */
  --mission-navy: hsl(217, 32%, 35%);       /* Dark blue elements */
}
```

### Custom Components
- Glass morphism effects with backdrop blur
- Gradient borders and hover animations
- Three.js animated backgrounds (particles, radar, matrix)
- Custom security badges and indicators

## 🔧 Development

### Available Scripts

```bash
# Start development server (frontend + backend)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run type checking
npm run type-check

# Database operations (if using Drizzle)
npm run db:push
npm run db:generate
npm run db:migrate
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Session Configuration  
SESSION_SECRET=your-session-secret-here

# Development
NODE_ENV=development
PORT=5000
```

### Custom Development

#### Adding New Pages
1. Create page component in `client/src/pages/`
2. Add route to `client/src/App.tsx`
3. Update navigation in `client/src/components/AppHeader.tsx`

#### Adding New API Endpoints
1. Define route in `server/routes.ts`
2. Add authentication middleware if needed
3. Update storage interface in `server/storage.ts`
4. Add types to `shared/schema.ts`

#### Customizing Security
- Modify authentication logic in `server/auth.ts`
- Update audit logging in route handlers
- Configure security headers in `server/routes.ts`

## 🛠️ Troubleshooting

### Common Issues

**Windows Environment Variable Error**
If you get `'NODE_ENV' is not recognized as an internal or external command`:
```bash
# Use the provided Windows batch file
dev.bat

# Or use the PowerShell script
.\dev.ps1

# Or install cross-env globally
npm install -g cross-env
npx cross-env NODE_ENV=development tsx server/index.ts
```

**Port Already in Use**
```bash
# Kill process on port 5000
npx kill-port 5000

# On Windows, find and kill the process
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Authentication Issues**
- Check JWT_SECRET environment variable
- Verify token expiration (24 hours default)
- Clear localStorage and re-authenticate

**Storage Issues**
- Check `data/storage.json` file permissions
- Verify file path accessibility
- Review storage audit logs

**Build Issues**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Performance Optimization

The application includes several performance optimizations:
- Response compression (gzip)
- Intelligent caching with private headers
- Debounced file I/O operations
- Query result caching
- Optimized bundle splitting

## 🔍 Security Audit Logs

Monitor security events in real-time through the console:

```
[SECURITY] Agent 2 authenticated from 172.31.128.46 at 2025-06-09T20:21:23.007Z
[SECURITY] Agent 2 accessed 5 transmissions at 2025-06-09T20:21:23.364Z
[SECURITY] Agent 2 created transmission #7 at coordinates [35.7208, 164.0319]
[SECURITY] Agent 2 responded to transmission #7 with new transmission #8
```

Access the Security Dashboard at `/security` for comprehensive monitoring.

## 📱 Features

### Core Functionality
- **Agent Dashboard**: Mission overview with statistics
- **Send Ping**: Create new transmissions with coordinates
- **All Pings**: View all transmissions with security indicators
- **Mission Trails**: Interactive trail visualization and extension
- **Security Center**: Real-time security monitoring and audit logs

### Advanced Features
- **Trail Networks**: Create branching response chains
- **Visual Security**: Classification indicators for all transmissions  
- **Real-time Updates**: Live data synchronization
- **Responsive Design**: Mobile and desktop optimized
- **3D Backgrounds**: Immersive Three.js animations

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-mission`)
3. Commit changes (`git commit -m 'Add new mission capability'`)
4. Push to branch (`git push origin feature/new-mission`)
5. Create Pull Request

## 📄 License

This project is classified under MI6 security protocols. Unauthorized access is prohibited.

---

**Mission Status**: Operational ✅  
**Security Level**: Classified 🔴  
**Agent Access**: Authorized Personnel Only 🛡️

*"The name's Bond... James Bond."*