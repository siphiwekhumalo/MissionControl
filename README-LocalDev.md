# Local Development Setup

This project is configured to work in both local development and Replit environments.

## Local Development

For local development, you need to run the frontend and backend on separate ports:

### 1. Start the Backend API Server
```bash
# Run the backend on port 3001
npx tsx server-local-dev.ts
```

### 2. Start the Frontend Dev Server (in a separate terminal)
```bash
# Run the frontend on port 5000
npm run dev
```

### Windows Batch Script
You can also use the provided batch script:
```cmd
dev.bat
```

This will automatically start the local development server on port 3001.

### Environment Configuration

The system automatically detects the environment:

- **Local Development**: 
  - Frontend: `http://localhost:5000` (Vite dev server)
  - Backend API: `http://localhost:3001` (Express server)
  
- **Replit Environment**: 
  - Both frontend and backend run on the same domain
  - Uses relative URLs for API calls

### Test the Setup

1. Backend API health check:
```bash
curl http://localhost:3001/api/health
```

2. Test authentication:
```bash
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"siphiwe","password":"1924@Khumalo"}'
```

### Database Setup

The application requires a PostgreSQL database. You have two options:

#### Option 1: Use Replit (Recommended)
The Replit environment already has a database configured and working. No additional setup required.

#### Option 2: Local PostgreSQL Setup
1. Install PostgreSQL locally
2. Create a database: `createdb missioncontrol`
3. Create a `.env.local` file in the project root:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/missioncontrol
SESSION_SECRET=your-secret-key-here
NODE_ENV=development
```
4. Run database migrations: `npm run db:push`

**Note**: Local database setup requires additional PostgreSQL installation and configuration. For quick testing, the Replit environment is easier to use.

### Authentication

Test accounts:
- Username: `siphiwe`, Password: `1924@Khumalo`
- Create new accounts via the registration form