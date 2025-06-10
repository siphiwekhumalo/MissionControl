# Local Development Setup

This project is configured to work in both local development and Replit environments.

## Local Development

For local development, you need to run the frontend and backend on separate ports:

### 1. Start the Backend API Server
```bash
# Run the backend on port 3001
npx tsx server-local-dev.ts
```

### 2. Start the Frontend Dev Server
```bash
# Run the frontend on port 5000
npm run dev
```

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

### Database

The application uses PostgreSQL. Make sure you have the DATABASE_URL environment variable set.

### Authentication

Test accounts:
- Username: `siphiwe`, Password: `1924@Khumalo`
- Create new accounts via the registration form