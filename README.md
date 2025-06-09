
A secure web application for coordinate-based ping transmission and tracking, built with a James Bond/MI6 aesthetic. Features user authentication, real-time ping creation, trail responses, and sophisticated Three.js background animations.

## 🎯 Features

- **Secure Authentication**: Replit OAuth integration with session management
- **Ping System**: Create new coordinate-based pings or respond to existing ones
- **Real-time Dashboard**: View latest 3 pings with mission statistics
- **Complete Ping History**: Searchable table with filtering capabilities
- **Three.js Animations**: Unique background animations for each page
  - Dashboard: Radar sweep animation
  - Send Ping: Matrix rain effect
  - All Pings: Particle field animation
- **James Bond Aesthetic**: Glass morphism, gradient borders, and MI6-inspired design

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for development and building
- **TailwindCSS** for styling with custom James Bond theme
- **Three.js** for 3D background animations
- **TanStack React Query** for data fetching and caching
- **Wouter** for client-side routing
- **Shadcn/ui** component library
- **React Hook Form** with Zod validation

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** database with Drizzle ORM
- **Replit Auth** (OpenID Connect) for authentication
- **Session-based** authentication with database storage
- **JWT token** refresh mechanism

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Replit account (for authentication)

## 🚀 Local Development Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd james-bond-ping-system
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/ping_system
PGHOST=localhost
PGPORT=5432
PGUSER=your_username
PGPASSWORD=your_password
PGDATABASE=ping_system

# Authentication
SESSION_SECRET=your-super-secret-session-key-here
REPL_ID=your-replit-app-id
ISSUER_URL=https://replit.com/oidc
REPLIT_DOMAINS=your-domain.replit.dev,localhost:5000

# Development
NODE_ENV=development
```

### 3. Database Setup

#### Option A: Local PostgreSQL
1. Install PostgreSQL locally
2. Create a database named `ping_system`
3. Update the `DATABASE_URL` in your `.env` file

#### Option B: Replit Database (Recommended)
1. Create a PostgreSQL database in your Replit project
2. Use the provided `DATABASE_URL` environment variable

### 4. Database Schema

Run the database migrations:

```bash
npm run db:push
```

This will create the necessary tables:
- `users` - User authentication data
- `pings` - Ping coordinates and messages
- `sessions` - Session storage for authentication

### 5. Authentication Setup

#### Replit OAuth Configuration
1. Go to your Replit project settings
2. Navigate to "Secrets" tab
3. Add the required environment variables
4. Configure OAuth domains in your Replit account

For local development, you may need to:
1. Set up a local OAuth provider, or
2. Use Replit's development environment
3. Configure your local domain in `REPLIT_DOMAINS`

### 6. Start Development Server

```bash
npm run dev
```

This starts both the frontend (Vite) and backend (Express) servers on port 5000.

The application will be available at: `http://localhost:5000`

## 📁 Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── ui/         # Shadcn/ui components
│   │   │   ├── AppHeader.tsx
│   │   │   ├── ThreeBackground.tsx
│   │   │   └── MobileNavigation.tsx
│   │   ├── hooks/          # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   └── use-toast.ts
│   │   ├── lib/            # Utility functions
│   │   │   ├── queryClient.ts
│   │   │   ├── authUtils.ts
│   │   │   └── utils.ts
│   │   ├── pages/          # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── SendPing.tsx
│   │   │   ├── AllPings.tsx
│   │   │   ├── Landing.tsx
│   │   │   └── not-found.tsx
│   │   ├── App.tsx         # Main app component
│   │   ├── main.tsx        # App entry point
│   │   └── index.css       # Global styles & theme
│   └── index.html          # HTML template
├── server/                 # Backend Express application
│   ├── db.ts              # Database connection
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Database operations
│   ├── replitAuth.ts      # Authentication middleware
│   └── vite.ts            # Vite development setup
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Drizzle database schema
├── package.json           # Dependencies and scripts
├── tailwind.config.ts     # TailwindCSS configuration
├── vite.config.ts         # Vite configuration
├── drizzle.config.ts      # Drizzle ORM configuration
└── tsconfig.json          # TypeScript configuration
```

## 🔗 API Endpoints

### Authentication
- `GET /api/auth/user` - Get current user data
- `GET /api/login` - Initiate OAuth login
- `GET /api/logout` - Logout and clear session
- `GET /api/callback` - OAuth callback handler

### Pings
- `POST /api/pings` - Create a new ping
- `GET /api/pings` - Get all user pings
- `GET /api/pings/latest` - Get latest 3 pings
- `POST /api/pings/:id` - Respond to a specific ping (create trail)

All ping endpoints require authentication.

## 🎨 Styling & Theming

### Custom Color Palette
The app uses a custom James Bond-inspired color scheme:

```css
:root {
  --mission-black: hsl(220, 13%, 8%);
  --mission-dark: hsl(220, 13%, 12%);
  --mission-surface: hsl(220, 13%, 16%);
  --mission-secondary: hsl(220, 13%, 18%);
  --mission-silver: hsl(220, 9%, 70%);
  --mission-green: hsl(142, 76%, 36%);
  --mission-blue: hsl(217, 91%, 60%);
}
```

### Glass Morphism Effects
Custom CSS classes for the signature glass effect:
- `.glass` - Base glass morphism
- `.gradient-border` - Animated gradient borders
- `.glow-green` - Green glow effects
- `.transition-all-smooth` - Smooth transitions

## 🚀 Deployment

### Production Build

```bash
npm run build
```

### Replit Deployment
1. Ensure all environment variables are set in Replit Secrets
2. The app will automatically deploy when pushed to main branch
3. Configure custom domain if needed

### Manual Deployment
1. Build the application: `npm run build`
2. Set production environment variables
3. Deploy to your preferred hosting service
4. Ensure PostgreSQL database is accessible
5. Configure OAuth domains for production

## 🛠 Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Push database schema changes
npm run db:push

# Generate database migrations
npm run db:generate

# Run TypeScript type checking
npx tsc --noEmit

# Lint code
npx eslint client/src server/
```

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **Session Security**: Uses secure HTTP-only cookies
3. **Database Security**: All queries use parameterized statements
4. **Authentication**: JWT tokens with refresh mechanism
5. **CORS**: Configured for specific domains only

## 🐛 Troubleshooting

### Common Issues

**Database Connection Errors**
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check firewall settings

**Authentication Issues**
- Verify `REPLIT_DOMAINS` includes your current domain
- Check `SESSION_SECRET` is set
- Ensure OAuth app is properly configured

**Build Errors**
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npx tsc --noEmit`

**Animation Performance**
- Three.js animations may be intensive on older devices
- Consider reducing particle counts in `ThreeBackground.tsx`

## 📝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎯 Mission Briefing

Welcome to the secure ping transmission system, Agent. Your mission, should you choose to accept it, is to maintain operational security while tracking coordinate-based transmissions across global networks. The fate of the mission depends on your discretion.

*This message will self-destruct in 5 seconds... just kidding, it's a README file.*

---

**Built with 💚 for the MI6 Operations Division**
