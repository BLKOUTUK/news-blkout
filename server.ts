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

// Dynamically import and register API routes, then start server
const apiDir = path.join(__dirname, 'api');

async function startServer() {
  // Load all API routes first
  const apiFiles = fs.readdirSync(apiDir);
  for (const file of apiFiles) {
    // Support both .js and .ts files (tsx runs .ts directly)
    if (file.endsWith('.js') || file.endsWith('.ts')) {
      const routeName = file.slice(0, -3);
      try {
        const module = await import(path.join(apiDir, file));
        if (module.default) {
          app.all(`/api/${routeName}`, module.default);
          console.log(`✅ Registered route: /api/${routeName}`);
        }
      } catch (error) {
        console.error(`❌ Failed to load route /api/${routeName}:`, error);
      }
    }
  }
  console.log(`🚀 All API routes registered`);

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

  // Schedule fortnightly voting period rotation: every other Sunday at midnight UK time
  // Cron: "0 0 * * 0" = every Sunday at midnight. The endpoint itself is idempotent —
  // it only rotates if the active period's end_date has passed, so running weekly is safe.
  cron.schedule('0 0 * * 0', async () => {
    console.log('Running cron job: checking voting period rotation...');
    try {
      // First check if the active period has ended
      const checkRes = await fetch(`http://localhost:${port}/api/voting-period`);
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.success && checkData.data && checkData.data.daysRemaining <= 0) {
          console.log('Active period has ended — rotating...');
          const rotateRes = await fetch(`http://localhost:${port}/api/rotate-period`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.CRON_SECRET}`
            }
          });
          if (rotateRes.ok) {
            const result = await rotateRes.json();
            console.log('Voting period rotation completed:', JSON.stringify(result.data?.archivedPeriod?.winners || []));
          } else {
            console.error('Period rotation failed:', rotateRes.statusText);
          }
        } else {
          console.log('Active period still has days remaining — skipping rotation.');
        }
      }
    } catch (error) {
      console.error('Period rotation cron error:', error);
    }
  });

  // Retired 10 Sep 2026: the in-app moderation page had no sign-in and its writes
  // now 401 against ivor-core. Moderation lives on comms.blkoutuk.com behind login.
  app.get(['/admin', '/admin/*splat'], (_req, res) => res.redirect(301, 'https://comms.blkoutuk.com/admin/news'));

  // SPA fallback: serve index.html for any request that doesn't match an API route or a static file
  // Note: Using app.use() instead of app.get('*') for Express 5.x compatibility
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });

  // Start server AFTER all routes are registered
  app.listen(port, () => {
    console.log(`🏴‍☠️ News BLKOUT server running on port ${port}`);
    console.log(`📰 API endpoints ready at /api/*`);
  });
}

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
