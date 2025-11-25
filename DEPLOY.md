# Deployment Guide

This module is designed to be integrated into the `blkoutuk/comms-blkout` monorepo.

## 1. Push to GitHub

Initialize the repository and push to the target remote:

```bash
# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "feat: Initial release of SocialSync Content Generation Studio"

# Add the remote repository
git remote add origin https://github.com/blkoutuk/comms-blkout.git

# Push to the feature branch (recommended) or main
git checkout -b feature/social-sync-studio
git push -u origin feature/social-sync-studio
```

## 2. Integration with Admin Dashboard

Since this is a sub-module, ensure it is placed in the correct directory structure if moving manually:

```bash
mv social-sync-studio /path/to/comms-blkout/packages/
```

## 3. Production Deployment

This project uses standard React + Vite. It is configured to run in environments supporting ES Modules.

### Environment Variables
Ensure the following variables are set in your deployment provider (Vercel, Netlify, etc.):

- `API_KEY`: Your Google GenAI API Key (Paid tier for Veo/Pro).

### Build Command
```bash
npm run build
```

### Output Directory
```bash
dist
```
