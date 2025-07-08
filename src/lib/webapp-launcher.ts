
'use server';

import { spawn } from 'child_process';

// A map of process names to their respective command-line arguments for Windows.
const BROWSER_COMMANDS_WIN32: Record<string, { cmd: string; args: string[] }> = {
    'chrome.exe': { cmd: 'start', args: ['chrome', '--start-fullscreen'] },
    'msedge.exe': { cmd: 'start', args: ['msedge', '--start-fullscreen'] },
    'firefox.exe': { cmd: 'start', args: ['firefox', '-kiosk'] }, // Firefox uses -kiosk for fullscreen
};

// This is a simplified example. A robust implementation would need to handle
// different operating systems and browser choices.
const BROWSER_COMMANDS = {
    win32: BROWSER_COMMANDS_WIN32,
    // Future support for other platforms can be added here
    linux: {},
    darwin: {},
};

export async function launchWebApp(url: string, browserProcessName?: string): Promise<{ success: boolean; error?: string }> {
    if (!url) {
        return { success: false, error: 'URL is missing.' };
    }

    const platform = process.platform as keyof typeof BROWSER_COMMANDS;
    const effectiveBrowser = browserProcessName || 'chrome.exe';

    if (platform !== 'win32') {
         const errorMessage = `Unsupported platform: ${platform}. This feature currently only supports Windows.`;
        console.error(errorMessage);
        return { success: false, error: errorMessage };
    }

    const browserCommand = BROWSER_COMMANDS[platform][effectiveBrowser];

    if (!browserCommand) {
        const errorMessage = `Unsupported browser: ${effectiveBrowser} on platform ${platform}.`;
        console.error(errorMessage);
        return { success: false, error: errorMessage };
    }

    console.log(`Attempting to launch URL: ${url} in ${effectiveBrowser} (fullscreen).`);

    try {
        const child = spawn(browserCommand.cmd, [...browserCommand.args, url], {
            detached: true,
            stdio: 'ignore',
            shell: true, // Use shell for 'start' command on Windows
        });

        child.unref();

        child.on('error', (err) => {
            console.error(`Failed to start browser process: ${err.message}. Make sure the selected browser is installed and in your system's PATH.`);
        });

        console.log(`Successfully launched browser for: ${url}`);
        return { success: true };

    } catch (error: any) {
        console.error(`Failed to spawn browser process:`, error);
        return { success: false, error: error.message };
    }
}
