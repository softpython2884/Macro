# Macro Plugin System

This directory contains plugins that extend the functionality of the Macro application.

## How it Works

- Each subdirectory within this `plugins` folder represents a single plugin.
- Each plugin should have an `index.ts` (or `index.js`) file as its entry point.
- This entry point must export a manifest object that describes the plugin and what it provides.

## Plugin Manifest Example (`plugins/weather/index.ts`)

A plugin manifest tells Macro what the plugin is and what features (like new applications) it adds.

```typescript
import type { AppInfo } from '@/lib/data';
import { Sun } from 'lucide-react';

export const WeatherPlugin = {
  id: 'weather-plugin',
  name: 'Weather',
  version: '1.0.0',
  // The 'apps' array allows the plugin to add new icons to the 'Applications' page.
  apps: [
    {
      id: 'weather',
      name: 'Weather',
      icon: Sun,
      href: '/dashboard/plugins/weather', // The route to the plugin's page.
      description: 'Check the current weather',
    }
  ] as AppInfo[],
};

```

## Registering a Plugin

Currently, plugins must be manually "registered" within the main application to be loaded. This is done by importing them into `src/lib/plugins.ts`. This approach may be automated in the future.
