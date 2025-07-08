
'use server';

// IMPORTANT: To use this service, you need to get an API key from https://www.steamgriddb.com/profile/api
// Once you have your key, create a file named .env.local in the root of your project
// and add the following line:
// STEAMGRIDDB_API_KEY=YOUR_API_KEY_HERE

const API_KEY = process.env.STEAMGRIDDB_API_KEY;
const BASE_URL = 'https://www.steamgriddb.com/api/v2';

const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
};

const checkApiKey = () => {
    if (!API_KEY) {
        console.error("SteamGridDB API Key is missing. Make sure it's set in a .env.local file as STEAMGRIDDB_API_KEY=YOUR_KEY_HERE (no NEXT_PUBLIC_ prefix).");
        return false;
    }
    return true;
}

export interface SteamGridDbGame {
    id: number;
    name: string;
    nsfw: boolean;
}

export interface SteamGridDbImage {
    id: number;
    score: number;
    style: string;
    url: string;
    thumb: string;
    nsfw: boolean;
}

export const searchGame = async (name: string, nsfw: 'true' | 'false' | 'any' = 'false', prioritizeNsfw: boolean = false): Promise<SteamGridDbGame | null> => {
    if (!checkApiKey()) return null;
    
    try {
        const response = await fetch(`${BASE_URL}/search/autocomplete/${encodeURIComponent(name)}?nsfw=${nsfw}`, options);
        if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
        const result = await response.json();
        
        if (!result.success || result.data.length === 0) return null;
        
        let games: SteamGridDbGame[] = result.data;

        if (prioritizeNsfw && nsfw !== 'false' && games.length > 1) {
            games.sort((a, b) => {
                if (a.nsfw === b.nsfw) return 0;
                return a.nsfw ? -1 : 1;
            });
        }
        
        return games[0];

    } catch (error) {
        console.error(`Failed to search for game "${name}":`, error);
        return null;
    }
};

async function fetchAndSortImages(url: string, prioritizeNsfw: boolean): Promise<SteamGridDbImage[]> {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
    const result = await response.json();
    
    if (!result.success) return [];
    let images: SteamGridDbImage[] = result.data;

    if (prioritizeNsfw && images.length > 0) {
        const nsfwImages = images.filter(img => img.nsfw);
        if (nsfwImages.length > 0) {
            // If we found any NSFW images, return them sorted by score
            return nsfwImages;
        }
        // If no NSFW images were found in a prioritized search, fall back to SFW.
    }
    
    // For non-prioritized or fallback, just return SFW images from the list.
    return images.filter(img => !img.nsfw);
}

// Fallback logic for prioritized search to ensure an image is always returned if possible.
async function getImagesWithFallback(
    type: 'grids' | 'heroes' | 'logos', 
    gameId: number, 
    nsfw: 'true' | 'false' | 'any', 
    prioritizeNsfw: boolean,
    params: string = ''
): Promise<SteamGridDbImage[]> {
    if (prioritizeNsfw && nsfw !== 'false') {
        const nsfwUrl = `${BASE_URL}/${type}/game/${gameId}?nsfw=true${params}`;
        const nsfwImages = await fetchAndSortImages(nsfwUrl, true);
        if (nsfwImages.length > 0) {
            return nsfwImages;
        }
    }
    // Fallback to SFW if prioritize is on but no NSFW found, or if not prioritizing.
    const sfwUrl = `${BASE_URL}/${type}/game/${gameId}?nsfw=false${params}`;
    return fetchAndSortImages(sfwUrl, false);
}


export const getGrids = async (gameId: number, dimensions: string[], nsfw: 'true' | 'false' | 'any' = 'false', prioritizeNsfw: boolean = false): Promise<SteamGridDbImage[]> => {
    if (!checkApiKey() || !gameId) return [];
    try {
        const params = `&dimensions=${dimensions.join(',')}`;
        return await getImagesWithFallback('grids', gameId, nsfw, prioritizeNsfw, params);
    } catch (error) {
        console.error(`Failed to fetch grids for gameId ${gameId}:`, error);
        return [];
    }
}

export const getHeroes = async (gameId: number, nsfw: 'true' | 'false' | 'any' = 'false', prioritizeNsfw: boolean = false): Promise<SteamGridDbImage[]> => {
    if (!checkApiKey() || !gameId) return [];
     try {
        return await getImagesWithFallback('heroes', gameId, nsfw, prioritizeNsfw);
    } catch (error) {
        console.error(`Failed to fetch heroes for gameId ${gameId}:`, error);
        return [];
    }
};

export const getLogos = async (gameId: number, nsfw: 'true' | 'false' | 'any' = 'false', prioritizeNsfw: boolean = false): Promise<SteamGridDbImage[]> => {
    if (!checkApiKey() || !gameId) return [];
     try {
        return await getImagesWithFallback('logos', gameId, nsfw, prioritizeNsfw);
    } catch (error) {
        console.error(`Failed to fetch logos for gameId ${gameId}:`, error);
        return [];
    }
};
