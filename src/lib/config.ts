'use server';

import fs from 'fs/promises';
import path from 'path';
import ini from 'ini';

const CONFIG_PATH = path.join(process.cwd(), 'config.ini');

interface AppConfig {
    browser?: string;
    setupconfig?: boolean;
}

const defaultConfig: { general: AppConfig } = {
    general: {
        browser: 'chrome.exe',
        setupconfig: false
    }
};

async function ensureConfigFile() {
    try {
        await fs.access(CONFIG_PATH);
    } catch {
        // File doesn't exist, create it with default values
        await fs.writeFile(CONFIG_PATH, ini.stringify(defaultConfig), 'utf-8');
    }
}

export async function getConfig(): Promise<AppConfig> {
    await ensureConfigFile();
    try {
        const fileContent = await fs.readFile(CONFIG_PATH, 'utf-8');
        const parsedConfig = ini.parse(fileContent);
        // Normalize boolean values
        if (parsedConfig.general && typeof parsedConfig.general.setupconfig === 'string') {
            parsedConfig.general.setupconfig = parsedConfig.general.setupconfig.toLowerCase() === 'true';
        }
        return parsedConfig.general || {};
    } catch (error) {
        console.error("Error reading or parsing config.ini:", error);
        return defaultConfig.general;
    }
}

export async function updateConfig(newValues: Partial<AppConfig>): Promise<void> {
    const currentConfig = await getConfig();
    const updatedGeneral = { ...currentConfig, ...newValues };
    
    // Read the whole file to preserve other sections if they exist
    const fileContent = await fs.readFile(CONFIG_PATH, 'utf-8');
    const fullConfig = ini.parse(fileContent);

    fullConfig.general = updatedGeneral;

    await fs.writeFile(CONFIG_PATH, ini.stringify(fullConfig), 'utf-8');
}
