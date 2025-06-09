import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

// Serve static files from client directory
app.use('/src', express.static(join(__dirname, 'client/src')));
app.use('/assets', express.static(join(__dirname, 'attached_assets')));

// Create a simple HTML that loads the React app
const createDevHTML = () => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MissionControl - Bond Operations</title>
  <script type="module">
    import { createElement } from 'https://esm.sh/react@18';
    import { createRoot } from 'https://esm.sh/react-dom@18/client';
    
    // Simple frontend for testing API
    const App = () => {
      return createElement('div', {
        style: {
          fontFamily: 'Arial, sans-serif',
          background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
          color: 'white',
          minHeight: '100vh',
          padding: '20px'
        }
      }, [
        createElement('h1', { key: 'title' }, '🕴️ MissionControl - Local Development'),
        createElement('p', { key: 'info' }, 'Backend running on port 5000, Frontend on port 3000'),
        createElement('div', { key: 'links', style: { marginTop: '20px' } }, [
          createElement('a', {
            key: 'backend',
            href: 'http://localhost:5000',
            style: { color: '#00ff88', marginRight: '20px' }
          }, 'Backend API (Port 5000)'),
          createElement('a', {
            key: 'replit',
            href: 'https://replit.com',
            style: { color: '#00ff88' }
          }, 'Full App on Replit')
        ])
      ]);
    };
    
    const root = createRoot(document.getElementById('root'));
    root.render(createElement(App));
  </script>
</head>
<body>
  <div id="root"></div>
</body>
</html>`;

  return html;
};

// Main route
app.get('/', (req, res) => {
  res.send(createDevHTML());
});

// API proxy to backend
app.use('/api/*', (req, res) => {
  res.json({
    message: 'Frontend running on port 3000',
    backend: 'http://localhost:5000',
    note: 'Use the Replit app for full functionality'
  });
});

app.listen(PORT, () => {
  console.log(`Frontend dev server running on http://localhost:${PORT}`);
  console.log(`Backend should be running on http://localhost:5000`);
  console.log(`For full functionality, use the Replit environment`);
});