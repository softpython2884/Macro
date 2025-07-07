'use server';

import fs from 'fs/promises';
import path from 'path';
import type { Game } from './data';

// This function recursively finds all .exe files in a directory.
async function findExecutables(dir: string, initialDir: string): Promise<string[]> {
    let executables: string[] = [];
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                executables = executables.concat(await findExecutables(fullPath, initialDir));
            } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.exe')) {
                // Return path relative to the game's root directory
                executables.push(path.relative(initialDir, fullPath));
            }
        }
    } catch (error) {
        console.error(`Error reading directory ${dir}:`, error);
    }
    return executables;
}

// This is the main server action to scan for games.
export async function scanForGames(directories: string[]): Promise<Omit<Game, 'posterUrl' | 'heroUrl' | 'logoUrl'>[]> {
    const allGames: Omit<Game, 'posterUrl' | 'heroUrl' | 'logoUrl'>[] = [];

    for (const dir of directories) {
        if (!dir) continue;
        try {
            const gameFolders = await fs.readdir(dir, { withFileTypes: true });

            for (const gameFolder of gameFolders) {
                if (gameFolder.isDirectory()) {
                    const gamePath = path.join(dir, gameFolder.name);
                    const executables = await findExecutables(gamePath, gamePath);

                    if (executables.length > 0) {
                        const game: Omit<Game, 'posterUrl' | 'heroUrl' | 'logoUrl'> = {
                            id: gameFolder.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
                            name: gameFolder.name,
                            path: gamePath,
                            executables: executables.map(p => p.replace(/\\/g, '/')), // Normalize paths for consistency
                        };
                        allGames.push(game);
                    }
                }
            }
        } catch (error) {
            console.error(`Error scanning directory ${dir}:`, error);
        }
    }

    return allGames;
}
