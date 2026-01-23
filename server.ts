import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

import fs from 'fs';
import cron from 'node-cron';
// Note: Using native fetch (Node.js 18+), no need for node-fetch package

// Dynamically import and register API routes
const apiDir = path.join(__dirname, 'api');
(async () => {
  const apiFiles = fs.readdirSync(apiDir);
  for (const file of apiFiles) {
    // Support both .js and .ts files (tsx runs .ts directly)
    if (file.endsWith('.js') || file.endsWith('.ts')) {
      const routeName = file.slice(0, -3);
      const module = await import(path.join(apiDir, file));
      if (module.default) {
        app.all(`/api/${routeName}`, module.default);
        console.log(`✅ Registered route: /api/${routeName}`);
      }
    }
  }
  console.log(`🚀 All API routes registered`);
})();

// Schedule the cron job to fetch news every day at 6am and 6pm
cron.schedule('0 6,18 * * *', async () => {
  console.log('Running cron job: fetching news...');
  try {
    const response = await fetch(`http://localhost:${port}/api/fetch-news`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      }
    });
    if (response.ok) {
      console.log('Cron job completed successfully.');
    } else {
      console.error('Cron job failed:', response.statusText);
    }
  } catch (error) {
    console.error('Cron job error:', error);
  }
});

// SPA fallback: serve index.html for any request that doesn't match an API route or a static file
// Note: Using app.use() instead of app.get('*') for Express 5.x compatibility
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
