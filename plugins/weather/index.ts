/**
 * @fileOverview Manifest for the Weather Plugin.
 * This file defines the plugin and the new application it adds to Macro.
 */

import type { AppInfo } from '@/lib/data';
import { Sun } from 'lucide-react';

export const WeatherPlugin = {
  id: 'weather-plugin',
  name: 'Weather',
  version: '1.0.0',
  apps: [
    {
      id: 'weather',
      name: 'Weather',
      icon: Sun,
      href: '/dashboard/plugins/weather',
      description: 'Check the current weather',
    }
  ] as AppInfo[],
};
