'use server';

import fs from 'fs/promises';
import path from 'path';
import extract from 'extract-zip';
import os from 'os';
import { Readable } from 'stream';
import { finished } from 'stream/promises';

type ScanResult = {
    success: boolean;
    message: string;
    gamesInstalled: number;
}

// This function is for direct download and install from a URL
export async function downloadAndInstallGame(apiUrl: string, gameName: string, installPath: string): Promise<{ success: boolean; message: string }> {
    if (!apiUrl || !gameName || !installPath) {
        return { success: false, message: 'Missing required parameters for installation.' };
    }

    const downloadUrl = `${apiUrl}/data`;
    // Sanitize gameName for use in file paths
    const sanitizedGameName = gameName.replace(/[^a-zA-Z0-9 ._-]/g, '');
    const tempZipPath = path.join(os.tmpdir(), `${sanitizedGameName}-${Date.now()}.zip`);
    const finalDestPath = path.join(installPath, sanitizedGameName);

    try {
        console.log(`[INSTALLER] Starting download from ${downloadUrl}`);
        const response = await fetch(downloadUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
            }
        });

        if (!response.ok || !response.body) {
            throw new Error(`Failed to download file: ${response.statusText}`);
        }

        const fileStream = fs.createWriteStream(tempZipPath);
        // Cast response.body to a Node.js Readable stream
        await finished(Readable.fromWeb(response.body as any).pipe(fileStream));
        console.log(`[INSTALLER] Download complete. File saved to ${tempZipPath}`);

        console.log(`[INSTALLER] Extracting ${tempZipPath} to ${finalDestPath}...`);
        await fs.mkdir(finalDestPath, { recursive: true });
        await extract(tempZipPath, { dir: finalDestPath });
        console.log(`[INSTALLER] Successfully extracted ${sanitizedGameName}.`);

        console.log(`[INSTALLER] Deleting temporary archive ${tempZipPath}...`);
        await fs.unlink(tempZipPath);
        console.log(`[INSTALLER] Successfully deleted temporary archive.`);

        return { success: true, message: `${sanitizedGameName} has been installed successfully. Your library will refresh shortly.` };
    } catch (error: any) {
        console.error(`[INSTALLER] An error occurred during installation for ${gameName}:`, error);
        // Cleanup failed download
        try { await fs.unlink(tempZipPath); } catch { /* ignore */ }
        return { success: false, message: `Failed to install ${gameName}. See server logs for details.` };
    }
}

// This function is for scanning a local directory for existing .zip files
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