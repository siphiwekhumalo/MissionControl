#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

console.log(`🚀 MissionControl Development Launcher`);
console.log(`📋 Node.js version: ${nodeVersion}`);

// Choose appropriate server based on Node.js version
let serverCommand, serverArgs;

if (majorVersion >= 20) {
  console.log(`✅ Using standard server (Node.js ${majorVersion} compatible)`);
  serverCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  serverArgs = ['cross-env', 'NODE_ENV=development', 'tsx', 'server/index.ts'];
} else if (majorVersion >= 18) {
  console.log(`⚠️  Using local development server (Node.js ${majorVersion})`);
  serverCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  serverArgs = ['cross-env', 'NODE_ENV=development', 'tsx', 'server-local-dev.ts'];
} else {
  console.log(`❌ Node.js ${majorVersion} not supported. Please upgrade to Node.js 18 or higher.`);
  process.exit(1);
}

console.log(`🔧 Starting server...`);
console.log(`💻 Command: ${serverCommand} ${serverArgs.join(' ')}`);

// Start the server
const server = spawn(serverCommand, serverArgs, {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

server.on('error', (error) => {
  console.error(`❌ Failed to start server: ${error.message}`);
  process.exit(1);
});

server.on('close', (code) => {
  if (code !== 0) {
    console.log(`⚠️  Server exited with code ${code}`);
  }
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down MissionControl...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Terminating MissionControl...');
  server.kill('SIGTERM');
});