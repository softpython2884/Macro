
'use server';

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function putComputerToSleep(): Promise<{ success: boolean; error?: string }> {
    const platform = process.platform;
    let command: string;

    if (platform === 'win32') {
        // This command puts the computer to sleep. If sleep is not available, it might hibernate.
        command = 'rundll32.exe powrprof.dll,SetSuspendState 0,1,0';
    } else if (platform === 'darwin') {
        command = 'pmset sleepnow';
    } else if (platform === 'linux') {
        // Note: This requires the user running the server to have permission to suspend the system.
        command = 'systemctl suspend';
    } else {
        const errorMsg = `Unsupported platform for sleep command: ${platform}`;
        console.error(errorMsg);
        return { success: false, error: errorMsg };
    }

    try {
        console.log(`[SYSTEM] Executing sleep command: ${command}`);
        const { stdout, stderr } = await execAsync(command);
        if (stderr) {
            console.warn(`[SYSTEM] Sleep command stderr: ${stderr}`);
        }
        console.log(`[SYSTEM] Sleep command executed successfully.`);
        return { success: true };
    } catch (error: any) {
        console.error(`[SYSTEM] Failed to execute sleep command: ${error.message}`);
        return { success: false, error: error.message };
    }
}
