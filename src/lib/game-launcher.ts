
'use server';

import { spawn } from 'child_process';
import path from 'path';

export async function launchGame(gamePath: string, executable: string): Promise<{ success: boolean; error?: string }> {
    if (!gamePath || !executable) {
        return { success: false, error: 'Game path or executable is missing.' };
    }

    // Set CWD to the executable's directory. This is often necessary for games to find their assets.
    const cwd = path.dirname(path.join(gamePath, executable));
    const fullPath = path.join(gamePath, executable);

    console.log(`Attempting to launch: ${fullPath} from CWD: ${cwd}`);

    try {
        const child = spawn(fullPath, [], {
            detached: true,
            stdio: 'ignore',
            cwd: cwd,
        });

        // Unref() allows the parent process (our server) to exit independently of the child.
        child.unref();

        // Add an error listener for spawn errors (e.g., file not found)
        child.on('error', (err) => {
            console.error(`Failed to start subprocess: ${err.message}`);
        });

        console.log(`Successfully launched process for: ${fullPath}`);
        return { success: true };

    } catch (error: any) {
        console.error(`Failed to spawn process: ${fullPath}`, error);
        return { success: false, error: error.message };
    }
}
