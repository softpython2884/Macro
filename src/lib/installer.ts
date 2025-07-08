
'use server';

import fs from 'fs/promises';
import path from 'path';
import extract from 'extract-zip';

type ScanResult = {
    success: boolean;
    message: string;
    gamesInstalled: number;
}

export async function scanAndInstallGames(downloadsPath: string, localGamesPath: string): Promise<ScanResult> {
    console.log(`[INSTALLER] Starting scan. Downloads: ${downloadsPath}, Local Games: ${localGamesPath}`);
    let gamesInstalled = 0;

    try {
        await fs.access(downloadsPath);
        await fs.access(localGamesPath);
    } catch (error) {
        const errorMessage = "Downloads or Local Games directory not found. Please check paths in Settings.";
        console.error(`[INSTALLER] Error: ${errorMessage}`, error);
        return { success: false, message: errorMessage, gamesInstalled: 0 };
    }

    try {
        const files = await fs.readdir(downloadsPath);
        const zipFiles = files.filter(file => file.toLowerCase().endsWith('.zip'));

        if (zipFiles.length === 0) {
            console.log("[INSTALLER] No new zip files found.");
            return { success: true, message: "No new games found in downloads.", gamesInstalled: 0 };
        }

        for (const zipFile of zipFiles) {
            const sourcePath = path.join(downloadsPath, zipFile);
            // On Windows, file paths can have backslashes, but we want to treat them as directories
            // so we create a name for the folder based on the zip file name
            const gameName = path.basename(zipFile, '.zip');
            const destPath = path.join(localGamesPath, gameName);

            try {
                console.log(`[INSTALLER] Extracting ${sourcePath} to ${destPath}...`);
                await fs.mkdir(destPath, { recursive: true });
                await extract(sourcePath, { dir: destPath });
                console.log(`[INSTALLER] Successfully extracted ${zipFile}.`);
                
                console.log(`[INSTALLER] Deleting archive ${sourcePath}...`);
                await fs.unlink(sourcePath);
                console.log(`[INSTALLER] Successfully deleted ${zipFile}.`);

                gamesInstalled++;
            } catch (extractError) {
                console.error(`[INSTALLER] Failed to extract or delete ${zipFile}:`, extractError);
                // Don't stop the whole process, just skip this file and report a partial success later.
            }
        }

        if (gamesInstalled > 0) {
            const message = `Successfully installed ${gamesInstalled} new game(s). Your library will refresh automatically.`;
            console.log(`[INSTALLER] Scan complete. ${message}`);
            return { success: true, message, gamesInstalled };
        } else {
            const message = "Scan finished, but failed to install any games from the found archives. Check server logs for details.";
            console.log(`[INSTALLER] ${message}`);
            return { success: false, message: message, gamesInstalled: 0 };
        }


    } catch (error) {
         const errorMessage = "An unexpected error occurred while scanning for new games.";
         console.error(`[INSTALLER] Error: ${errorMessage}`, error);
         return { success: false, message: errorMessage, gamesInstalled: 0 };
    }
}
