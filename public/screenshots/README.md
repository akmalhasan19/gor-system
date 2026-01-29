# PWA Screenshots Guide

This directory contains screenshots for the PWA manifest's richer install UI.

## Required Screenshots

| Filename | Dimensions | Form Factor | Description |
|----------|------------|-------------|-------------|
| `dashboard-mobile.png` | 1080x1920 | narrow | Mobile dashboard view |
| `scheduler-mobile.png` | 1080x1920 | narrow | Court scheduling view |
| `pos-mobile.png` | 1080x1920 | narrow | Point of Sale view |
| `dashboard-desktop.png` | 1920x1080 | wide | Desktop dashboard view |

## How to Create Screenshots

### Option 1: Chrome DevTools
1. Open the app at `http://localhost:3000`
2. Press `F12` to open DevTools
3. Click the device toolbar icon (or `Ctrl+Shift+M`)
4. Set viewport to `1080x1920` for mobile, `1920x1080` for desktop
5. Navigate to each page (Dashboard, Scheduler, POS)
6. Press `Ctrl+Shift+P` → type "screenshot" → "Capture full size screenshot"
7. Rename and move to this folder

### Option 2: Browser Extension
Use extensions like "Full Page Screen Capture" or "GoFullPage"

### Option 3: Playwright (Automated)
```bash
npx playwright screenshot http://localhost:3000/dashboard --viewport-size=1080,1920 -o public/screenshots/dashboard-mobile.png
```

## Image Requirements

- Format: PNG or WebP (PNG recommended for compatibility)
- Maximum file size: 1MB per image
- Mobile (narrow): 9:16 aspect ratio (1080x1920 recommended)
- Desktop (wide): 16:9 aspect ratio (1920x1080 recommended)

## Optimization

After creating screenshots, optimize them:
```bash
# Using squoosh-cli
npx @squoosh/cli --oxipng '{level:2}' public/screenshots/*.png

# Or online: https://squoosh.app/
```
