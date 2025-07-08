
'use server';

import { exec } from 'child_process';
import { launchWebApp } from './webapp-launcher';

/**
 * Promisified version of child_process.exec
 */
function execPromise(command: string): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                // We don't reject here because taskkill throws an error if the process isn't found,
                // which is not a critical failure for our use case. We resolve and let the caller decide.
                resolve({ stdout, stderr });
                return;
            }
            resolve({ stdout, stderr });
        });
    });
}

/**
 * Kills all instances of a given browser process and then relaunches the browser 
 * to the Macro application URL.
 * @param browserProcessName The name of the browser executable (e.g., 'chrome.exe').
 */
export async function killBrowserAndRelaunch(browserProcessName: string): Promise<{ success: boolean; error?: string }> {
    if (!browserProcessName) {
        return { success: false, error: "Browser process name not provided." };
    }
    
    // This command is specific to Windows.
    if (process.platform !== 'win32') {
        const errorMsg = "Process killing is only supported on Windows.";
        console.error(errorMsg);
        return { success: false, error: errorMsg };
    }

    try {
        console.log(`Attempting to kill process: ${browserProcessName}`);
        // The /F flag forces termination, /IM specifies the image (process) name, and /T kills child processes.
        const { stderr } = await execPromise(`taskkill /F /IM ${browserProcessName} /T`);

        if (stderr && !stderr.includes("not found")) {
            // Log stderr if it's not the expected "process not found" message.
            console.warn(`taskkill stderr for ${browserProcessName}: ${stderr}`);
        }

        console.log(`Process ${browserProcessName} terminated. Relaunching Macro...`);

        // Add a short delay to ensure the OS has time to free up resources
        await new Promise(resolve => setTimeout(resolve, 500));

        // Relaunch the browser to the Macro UI
        // Note: The port should match your development server's port.
        await launchWebApp('http://localhost:9002', browserProcessName);

        return { success: true };

    } catch (error: any) {
        console.error(`Failed during kill/relaunch process for ${browserProcessName}:`, error);
        return { success: false, error: error.message };
    }
}
