# Local Development Setup - WORKING ✅

This project now supports simplified local development without database dependencies.

## Quick Start

### 1. Start the Backend API Server
```bash
# Using the batch script (recommended)
dev.bat

# Or run directly:
npx cross-env NODE_ENV=development tsx server-local-dev.ts
```

### 2. Start the Frontend Dev Server (in a separate terminal)
```bash
npm run dev
```

### 3. Access the Application
- Frontend: http://localhost:5000
- Backend API: http://localhost:3001

## Demo Users (Ready for Testing)

Three pre-configured users with hashed passwords:

- **Username**: `siphiwe`, **Password**: `1924@Khumalo`
- **Username**: `agent007`, **Password**: `secret123`  
- **Username**: `fieldagent`, **Password**: `field123`

## Architecture

- **Backend**: Express.js on port 3001 with in-memory storage
- **Frontend**: Vite dev server on port 5000 
- **Authentication**: JWT tokens with bcrypt password hashing
- **Storage**: Simple in-memory implementation (no database required)

## Environment Detection

The system automatically detects the environment:

- **Local Development**: Uses `http://localhost:3001` for API calls
- **Replit Environment**: Uses relative URLs for API calls

## Key Features

- No PostgreSQL installation required
- No DATABASE_URL environment variable needed
- Instant setup with demo users
- Full authentication system working
- Hot reload for development

## Test the Setup

1. Backend health check:
```bash
curl http://localhost:3001/api/health
```

2. Test authentication:
```bash
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"siphiwe","password":"1924@Khumalo"}'
```

## Files Added/Modified

- `server-local-dev.ts` - Local development server
- `server/simpleStorage.ts` - In-memory storage implementation
- `server/routes.ts` - Updated to use simple storage
- `client/src/lib/environmentConfig.ts` - Environment detection

## Troubleshooting

- **Port 3001 in use**: Kill existing processes
- **Module errors**: Run `npm install`
- **Auth issues**: Clear browser localStorage