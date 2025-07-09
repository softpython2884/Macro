
'use server';

import fs from 'fs/promises';
import path from 'path';
import ini from 'ini';

const ROOT_CONFIG_PATH = path.join(process.cwd(), 'config.ini');
const SCRIPTS_CONFIG_PATH = path.join(process.cwd(), 'SystemScripts', 'config.ini');

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

// Generic function to ensure a config file exists at a given path
async function ensureConfigFile(filePath: string) {
    try {
        await fs.access(filePath);
    } catch {
        // File doesn't exist, create it with default values
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(filePath, ini.stringify(defaultConfig), 'utf-8');
    }
}

export async function getConfig(): Promise<AppConfig> {
    // This function primarily reads from the root config file.
    await ensureConfigFile(ROOT_CONFIG_PATH);
    try {
        const fileContent = await fs.readFile(ROOT_CONFIG_PATH, 'utf-8');
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
    // This function will now update both the root and the SystemScripts config files.
    
    // 1. Get the current configuration state to merge with new values.
    const currentConfig = await getConfig();
    const updatedGeneral = { ...currentConfig, ...newValues };
    
    // 2. Prepare the full config object for the root file (to preserve other sections).
    const rootFileContent = await fs.readFile(ROOT_CONFIG_PATH, 'utf-8').catch(() => ini.stringify(defaultConfig));
    const fullRootConfig = ini.parse(rootFileContent);
    fullRootConfig.general = { ...fullRootConfig.general, ...updatedGeneral };
    
    // 3. Prepare the config for the scripts file. We just need the [general] section.
    // The script only cares about browser and setupconfig.
    const scriptsGeneralConfig = {
        browser: fullRootConfig.general.browser,
        setupconfig: fullRootConfig.general.setupconfig
    };
    const fullScriptsConfig = { general: scriptsGeneralConfig };

    // 4. Ensure the SystemScripts config file exists before writing.
    await ensureConfigFile(SCRIPTS_CONFIG_PATH);

    // 5. Write the updated configurations to both files.
    await Promise.all([
        fs.writeFile(ROOT_CONFIG_PATH, ini.stringify(fullRootConfig), 'utf-8'),
        fs.writeFile(SCRIPTS_CONFIG_PATH, ini.stringify(fullScriptsConfig), 'utf-8')
    ]);
}
