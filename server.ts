import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, '../dist')));

import fs from 'fs';
import cron from 'node-cron';
import fetch from 'node-fetch';

// Dynamically import and register API routes
const registerApiRoutes = async (dir: string, prefix = '/api') => {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      await registerApiRoutes(fullPath, `${prefix}/${file.name}`);
    } else if (file.name.endsWith('.js')) {
      let routeName = file.name.slice(0, -3);
      // Convert Vercel-style [param] to Express-style :param
      routeName = routeName.replace(/\[(\w+)\]/g, ':$1');
      const routePath = `${prefix}/${routeName}`;

      const module = await import(fullPath);
      if (module.default) {
        app.all(routePath, module.default);
        console.log(`Registered API route: ${routePath}`);
      }
    }
  }
};

(async () => {
  const apiDir = path.join(__dirname, 'api');
  await registerApiRoutes(apiDir);
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
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
