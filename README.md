# MissionControl - Spy-Themed Ping Transmission System

A secure, spy-themed web application for ping transmission and trail management, designed to provide an immersive intelligence operations experience with real-time communication tracking.

![Security Status](https://img.shields.io/badge/Security-Classified-red)
![Build Status](https://img.shields.io/badge/Build-Operational-green)
![Agent Status](https://img.shields.io/badge/Agents-Active-blue)

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm package manager

### Installation and Setup

1. **Clone and install dependencies**
```bash
git clone <your-repo-url>
cd MissionControl
npm install
```

2. **Start the application**
```bash
npm run dev
```

The application runs on `http://localhost:5000` with both frontend and backend on a single port.

## 🔐 Demo Agent Credentials

| Username    | Password      | Role          |
|-------------|---------------|---------------|
| `siphiwe`   | `1924@Khumalo`| Senior Agent  |
| `agent007`  | `secret123`   | Field Agent   |
| `fieldagent`| `field123`    | Operations    |

## 🎯 Core Features

### Ping Transmission System
- **Send Encrypted Pings**: Create secure transmissions with GPS coordinates
- **Trail Networks**: Build interconnected response chains through ping replies
- **Real-time Dashboard**: Monitor all ping activity and transmission trails
- **Response Management**: Latest-ping-only response enforcement for security

### Authentication & Security
- **JWT Authentication**: Secure token-based access control
- **User Isolation**: Agents can only access their own transmissions
- **Audit Logging**: Real-time security event monitoring
- **Session Management**: Secure session handling with proper expiration

## ⚡ Quick Testing Guide

1. **Login**: Use demo credentials to authenticate
2. **Send Ping**: Navigate to "Send Ping" and create a transmission
3. **Generate Coordinates**: Use the coordinate generator for random GPS locations
4. **View Trails**: Check "Mission Trails" to see ping networks
5. **Create Responses**: Reply to existing pings to build trail networks

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for development and building
- TailwindCSS with custom spy theme
- Three.js for immersive 3D backgrounds
- TanStack Query for data management
- Wouter for lightweight routing
- Shadcn/ui components

**Backend:**
- Express.js with TypeScript
- JWT authentication system
- In-memory storage with demo data
- Compression and security middleware
- RESTful API design

### Project Structure

```
MissionControl/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── ui/         # Shadcn/ui component library
│   │   │   ├── AppHeader.tsx
│   │   │   └── ThreeBackground.tsx
│   │   ├── hooks/          # Custom React hooks
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
│   │   │   └── Landing.tsx
│   │   ├── App.tsx         # Main application component
│   │   ├── main.tsx        # Application entry point
│   │   └── index.css       # Global styles and theme
│   └── index.html          # HTML template
├── server/                 # Backend Express application
│   ├── auth.ts             # JWT authentication system
│   ├── memoryStorage.ts    # In-memory data storage
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Storage interface
│   ├── index.ts            # Server entry point
│   └── vite.ts             # Vite integration
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Data models and validation
└── package.json            # Dependencies and scripts
```

## 📡 API Endpoints

### Authentication
- `POST /api/register` - Register new agent
- `POST /api/login` - Agent authentication
- `GET /api/user` - Get current agent profile

### Ping Operations
- `POST /api/pings` - Create new transmission
- `GET /api/pings` - Get all agent transmissions
- `GET /api/pings/latest` - Get latest transmissions
- `POST /api/pings/:id` - Respond to existing transmission

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

## 🎨 Theme & Styling

The application uses a custom James Bond-inspired design system:

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

### Design Features
- Glass morphism effects with backdrop blur
- Gradient borders and animations
- Three.js animated backgrounds
- Responsive mobile-first design
- Accessibility-focused UI components

## 🔧 Development

### Available Scripts

```bash
# Start development server (frontend + backend)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check
```

### Environment Configuration

Create a `.env` file for custom configuration:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Development
NODE_ENV=development
PORT=5000
```

### Adding New Features

#### New Pages
1. Create component in `client/src/pages/`
2. Add route to `client/src/App.tsx`
3. Update navigation in `client/src/components/AppHeader.tsx`

#### New API Endpoints
1. Define route in `server/routes.ts`
2. Add authentication middleware
3. Update storage interface in `server/storage.ts`
4. Add types to `shared/schema.ts`

## 🛠️ Troubleshooting

### Common Issues

**Authentication Problems**
- Clear browser storage: F12 → Application → Clear Storage
- Use incognito/private browsing mode
- Verify JWT_SECRET environment variable

**Port Conflicts**
```bash
# Kill process on port 5000
npx kill-port 5000

# On Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Build Issues**
```bash
# Clear dependencies and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Performance Features

- Response compression (gzip)
- Intelligent caching headers
- Query result caching
- Optimized bundle splitting
- Three.js performance optimization

## 🔍 Security Features

### Authentication System
- JWT token-based authentication
- Secure password hashing with bcrypt
- Session expiration management
- Protected route middleware

### Audit Logging
Monitor security events in the console:
```
[SECURITY] Agent 1 authenticated from 172.31.128.9 at 2025-06-10T12:37:49.228Z
[SECURITY] Agent 1 created transmission #101 at coordinates [4.5485, 103.6833]
```

### Data Protection
- User data isolation
- Secure storage interfaces
- Input validation and sanitization
- XSS protection headers

## 📱 User Interface

### Pages Overview
- **Landing**: Welcome page with authentication
- **Dashboard**: Mission overview with ping statistics
- **Send Ping**: Create new transmissions with coordinates
- **All Pings**: View all transmissions with details
- **Mission Trails**: Interactive trail visualization and management

### Key Features
- **Trail Networks**: Visual representation of ping response chains
- **Real-time Updates**: Live data synchronization
- **Mobile Responsive**: Optimized for all device sizes
- **3D Backgrounds**: Immersive particle and animation effects

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/ping-enhancement`)
3. Commit changes (`git commit -m 'Add ping trail visualization'`)
4. Push to branch (`git push origin feature/ping-enhancement`)
5. Create Pull Request

## 📄 License

This project is classified under intelligence security protocols.

---

**Mission Status**: Operational ✅  
**Security Level**: Classified 🔴  
**Agent Access**: Authorized Personnel Only 🛡️

*"The name's Bond... James Bond."*