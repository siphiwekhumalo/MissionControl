# Local Development Setup - Fixed Version

This guide helps you run the MissionControl application locally with working ping functionality.

## Quick Start

### Backend (API Server)
Run the simplified local development server:

**Windows Command Prompt:**
```cmd
dev-local.bat
```

**Windows PowerShell:**
```powershell
.\dev-local.ps1
```

**Manual (any system):**
```bash
node server-local-simple.js
```

### Frontend (React App)
In a separate terminal, start the frontend:

**Option 1 - Using Vite directly:**
```bash
npx vite
```

**Option 2 - Using existing script:**
```bash
start-frontend.bat
```

## Demo Users
The local server comes with these pre-configured users:

- **Username:** `siphiwe` **Password:** `1924@Khumalo`
- **Username:** `agent007` **Password:** `secret123`
- **Username:** `fieldagent` **Password:** `field123`

## Server Configuration

### Backend Server
- **Port:** 3001
- **URL:** http://localhost:3001
- **CORS:** Configured for ports 5000 and 5173

### Frontend Server
- **Vite Default Port:** 5173
- **Alternative Port:** 5000
- **URL:** http://localhost:5173 or http://localhost:5000

## Ping Functionality Testing

1. Start both backend and frontend servers
2. Open http://localhost:5173 in your browser
3. Log in with any demo user credentials
4. Navigate to "Send Ping" from the dashboard
5. Click "Generate Coordinates" to create random coordinates
6. Add an optional message
7. Click "Transmit Ping"
8. View your pings in the dashboard

## API Endpoints Available

- `GET /api/health` - Server health check
- `POST /api/login` - User authentication
- `POST /api/register` - User registration
- `GET /api/user` - Get current user info
- `POST /api/pings` - Create new ping
- `GET /api/pings` - Get user's pings
- `GET /api/pings/latest` - Get latest 3 pings
- `POST /api/pings/:id` - Respond to existing ping

## Environment Detection

The frontend automatically detects the environment:
- **Local:** Uses `http://localhost:3001` for API calls
- **Replit:** Uses relative URLs for API calls

## Troubleshooting

### CORS Issues
The local server is configured with proper CORS headers for both ports 5000 and 5173.

### Authentication Issues
If you get 401 errors, ensure:
1. You're logged in with valid credentials
2. The backend server is running on port 3001
3. The frontend can reach the backend API

### Port Conflicts
If port 3001 is in use, modify the port in `server-local-simple.js` and update the frontend configuration in `client/src/lib/environmentConfig.ts`.

## File Structure
- `server-local-simple.js` - Simplified Node.js backend server
- `dev-local.bat` - Windows batch file to start backend
- `dev-local.ps1` - PowerShell script to start backend
- `start-frontend.bat` - Start frontend on Windows

## Production vs Development
- **Replit (Production):** Uses TypeScript with SimpleMemoryStorage
- **Local (Development):** Uses JavaScript server with in-memory storage
- Both environments share the same demo users and functionality