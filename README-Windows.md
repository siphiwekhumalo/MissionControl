# Windows Setup Guide for MissionControl

## Quick Start for Windows

### Option 1: Using cross-env (Recommended)
```bash
# Development
npx cross-env NODE_ENV=development tsx server/index.ts

# Production (after building)
npx cross-env NODE_ENV=production node dist/index.js
```

### Option 2: Using Batch Files (Command Prompt)
```cmd
# Development
dev.bat

# Production
start.bat
```

### Option 3: Using PowerShell Scripts
```powershell
# Development
.\dev.ps1

# Production  
.\start.ps1
```

### Option 4: Manual Environment Variable Setting

**Command Prompt:**
```cmd
set NODE_ENV=development
npx tsx server/index.ts
```

**PowerShell:**
```powershell
$env:NODE_ENV = "development"
npx tsx server/index.ts
```

## Building for Production

```bash
npm run build
```

This creates a `dist` folder with the compiled application.

## Troubleshooting Windows Issues

### NODE_ENV Error
If you see `'NODE_ENV' is not recognized as an internal or external command`:
- Use any of the options above instead of the standard npm scripts
- The cross-env package has been installed to handle this

### Port Already in Use
```bash
# Kill processes on port 5000
npx kill-port 5000
```

### Permission Issues (PowerShell)
If PowerShell blocks script execution:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Development vs Production

- **Development**: Runs with hot reloading and Vite dev server
- **Production**: Runs the built static files with Express

## Environment Variables

Create a `.env` file if you need custom configuration:
```
NODE_ENV=development
PORT=5000
JWT_SECRET=your-secret-key
```