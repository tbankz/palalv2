# Palal v2

Palal v2 is a mobile-first prayer and awareness experience built as a single-page web app. It combines a global prayer map, country-specific prayer profiles, a guided prayer flow, and a personal prayer-tracking experience in one polished interface.

## Overview

This project presents prayer needs around the world through a visually rich experience inspired by spiritual reflection and global engagement. Users can:

- Explore a world map with highlighted countries and prayer-focused locations
- Open country profiles with prayer points, alerts, and context
- Enter a prayer flow with scripture, prompts, and a submission experience
- Visit a sanctuary-style mode for focused prayer and confessions
- Track local prayer activity such as streaks, requests, and confessions

## Key Features

- Interactive world map using Leaflet
- Country and city overlays with prayer-related information
- Prayer modal and prayer-stage experience
- Sanctuary mode with timer and confession input
- Theme toggle between dark and light modes
- Local persistence using browser localStorage
- Responsive layout designed for mobile and small screens

## Tech Stack

- HTML5 for structure
- CSS3 for styling and layout
- Vanilla JavaScript for app logic and UI behavior
- Leaflet.js for map rendering

## Project Structure

- index.html — main app structure and UI layout
- styles.css — visual design, layout, and responsive styling
- script.js — app logic, data, map interactions, prayer flow, and state management
- Readme.md — project overview and usage notes

## Getting Started

This is a static web app, so there is no build step required.

### Option 1: Open directly in a browser

- Open index.html in your browser.

### Option 2: Serve it locally

From the project folder, run:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Usage Notes

- The app is designed primarily for mobile-style viewing.
- Prayer data and local progress are stored in the browser and will persist on the same device.
- Some UI elements such as sign-in controls are present and can be extended for real authentication integration.

## Notes

Palal v2 is primarily a front-end experience focused on presentation, interaction, and storytelling. It is well suited for a prototype, concept demo, or devotional application rather than a full production backend system.