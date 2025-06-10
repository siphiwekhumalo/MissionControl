# Windows Setup Guide for MissionControl

## Permanent Fix: Node.js v18 Compatibility

The application now includes multiple compatibility layers to ensure it works on Windows with any Node.js version:

### ✅ Solutions Implemented:
- **Node.js v18 Compatible Server**: Bypasses `import.meta.dirname` issues
- **Cross-platform Environment Variables**: Uses cross-env for Windows compatibility  
- **Alternative Vite Configuration**: Node.js v18 compatible config file
- **Multiple Start Methods**: Batch files, PowerShell scripts, and manual options

## Quick Start for Windows (Node.js v18 Compatible)

### Option 1: Using Batch Files (Command Prompt) - Recommended
```cmd
# Development
dev.bat
```
Then open: http://localhost:5000

### Option 2: Using PowerShell Scripts  
```powershell
# Development
.\dev.ps1
```
Then open: http://localhost:5000

### Option 3: Manual Environment Variable Setting

**Command Prompt:**
```cmd
set NODE_ENV=development
node server-local.js
```

**PowerShell:**
```powershell
$env:NODE_ENV = "development"
node server-local.js
```

**Git Bash (if you prefer):**
```bash
NODE_ENV=development node server-local.js
```

### Option 4: Using cross-env (Alternative)
```bash
# Development
npx cross-env NODE_ENV=development node server-local.js

# Production (after building)
npx cross-env NODE_ENV=production node server-local.js
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