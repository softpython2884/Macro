
'use server';

import { exec } from 'child_process';

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
 * Kills all instances of a given browser process.
 * @param browserProcessName The name of the browser executable (e.g., 'chrome.exe').
 */
export async function killBrowserProcess(browserProcessName: string): Promise<{ success: boolean; error?: string }> {
    if (!browserProcessName) {
        const errorMsg = "Browser process name not provided to killBrowserProcess.";
        console.error(errorMsg);
        return { success: false, error: errorMsg };
    }
    
    if (process.platform !== 'win32') {
        const errorMsg = "Process killing is only supported on Windows.";
        console.error(errorMsg);
        return { success: false, error: errorMsg };
    }

    try {
        console.log(`[PROCESS_MANAGER] Attempting to kill process: ${browserProcessName}`);
        const { stdout, stderr } = await execPromise(`taskkill /F /IM ${browserProcessName} /T`);

        if (stdout) console.log(`[PROCESS_MANAGER] taskkill stdout: ${stdout}`);
        if (stderr && !stderr.includes("could not be found")) {
            // Log stderr if it's not the expected "process not found" message.
            console.warn(`[PROCESS_MANAGER] taskkill stderr for ${browserProcessName}: ${stderr}`);
        } else {
            console.log(`[PROCESS_MANAGER] Process ${browserProcessName} terminated or was not running.`);
        }
        
        return { success: true };

    } catch (error: any) {
        console.error(`[PROCESS_MANAGER] Failed during kill for ${browserProcessName}:`, error);
        return { success: false, error: error.message };
    }
}
