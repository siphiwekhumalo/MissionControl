import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set environment variable
process.env.NODE_ENV = 'development';

console.log('🚀 Starting MissionControl development server...');
console.log('🛡️  Security protocols activated');
console.log('📡 Initializing Bond transmission system...\n');

// Start the server
const serverPath = join(__dirname, 'server', 'index.ts');
const server = spawn('npx', ['tsx', serverPath], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_ENV: 'development' }
});

server.on('error', (error) => {
  console.error('❌ Server startup failed:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Server exited with code ${code}`);
    process.exit(code);
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🔒 Shutting down MissionControl...');
  server.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🔒 Shutting down MissionControl...');
  server.kill('SIGTERM');
  process.exit(0);
});