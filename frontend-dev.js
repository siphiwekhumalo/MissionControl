import { createServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Vite dev server for frontend only
const server = await createServer({
  root: resolve(__dirname, 'client'),
  server: {
    port: 3000,
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'client/src'),
      '@shared': resolve(__dirname, 'shared'),
      '@assets': resolve(__dirname, 'attached_assets'),
    }
  }
});

await server.listen();

console.log('🎯 MissionControl Frontend Active');
console.log('🌐 Frontend: http://localhost:3000');
console.log('📡 Backend API: http://localhost:5000');
console.log('🔗 Proxy configured for API requests\n');

server.printUrls();