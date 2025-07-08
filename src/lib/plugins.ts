/**
 * @fileOverview Plugin registry for Macro.
 * This file acts as a central point to import and register all active plugins.
 * In a more advanced system, this could be automated, but for now, we manually import.
 */

import type { AppInfo } from './data';

// Import plugin manifests here
import { WeatherPlugin } from '../../plugins/weather';

// Add all imported plugin manifests to this array
const ALL_PLUGINS = [
    WeatherPlugin,
];

/**
 * Retrieves all applications contributed by the registered plugins.
 * @returns An array of AppInfo objects.
 */
export const getPluginApps = (): AppInfo[] => {
    return ALL_PLUGINS.flatMap(plugin => plugin.apps || []);
};

/**
 * Retrieves all registered plugins.
 * @returns An array of all plugin manifest objects.
 */
export const getAllPlugins = () => {
    return ALL_PLUGINS;
}
