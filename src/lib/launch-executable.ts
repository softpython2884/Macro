
'use server';

import { spawn } from 'child_process';
import path from 'path';

export async function launchExecutable(fullPath: string): Promise<{ success: boolean; error?: string }> {
    if (!fullPath) {
        return { success: false, error: 'Executable path is missing.' };
    }

    const cwd = path.dirname(fullPath);

    console.log(`Attempting to launch executable: ${fullPath} from CWD: ${cwd}`);

    try {
        const child = spawn(fullPath, [], {
            detached: true,
            stdio: 'ignore',
            cwd: cwd,
        });

        child.unref();

        child.on('error', (err) => {
            console.error(`Failed to start subprocess: ${err.message}. Ensure the path is correct and has execution permissions.`);
        });

        console.log(`Successfully launched process for: ${fullPath}`);
        return { success: true };

    } catch (error: any) {
        console.error(`Failed to spawn process: ${fullPath}`, error);
        return { success: false, error: error.message };
    }
}
