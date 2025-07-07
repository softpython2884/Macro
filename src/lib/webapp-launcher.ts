
'use server';

import { spawn } from 'child_process';

// This is a simplified example. A robust implementation would need to handle
// different operating systems and browser choices.
const BROWSER_COMMANDS = {
    win32: { cmd: 'start', args: ['chrome', '--start-fullscreen'] },
    linux: { cmd: 'google-chrome', args: ['--start-fullscreen'] },
    darwin: { cmd: 'open', args: ['-a', 'Google Chrome', '--args', '--start-fullscreen'] },
};

export async function launchWebApp(url: string): Promise<{ success: boolean; error?: string }> {
    if (!url) {
        return { success: false, error: 'URL is missing.' };
    }

    const platform = process.platform as keyof typeof BROWSER_COMMANDS;
    const browserCommand = BROWSER_COMMANDS[platform];

    if (!browserCommand) {
        const errorMessage = `Unsupported platform: ${platform}. Cannot launch web app.`;
        console.error(errorMessage);
        return { success: false, error: errorMessage };
    }

    console.log(`Attempting to launch URL: ${url} in fullscreen.`);

    try {
        const child = spawn(browserCommand.cmd, [...browserCommand.args, url], {
            detached: true,
            stdio: 'ignore',
            shell: platform === 'win32', // Use shell for 'start' command on Windows
        });

        child.unref();

        child.on('error', (err) => {
            console.error(`Failed to start browser process: ${err.message}. Make sure you have Google Chrome installed or adjust the command in webapp-launcher.ts`);
        });

        console.log(`Successfully launched browser for: ${url}`);
        return { success: true };

    } catch (error: any) {
        console.error(`Failed to spawn browser process:`, error);
        return { success: false, error: error.message };
    }
}
