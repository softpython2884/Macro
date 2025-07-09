'use server';

// The identifier for the grid data source endpoint.
const DATA_SOURCE_ID_B64 = 'ZTBiZGExN2Y1NzEzZGE1ODExN2RiYjE3MjQ3MmZjMGU=';

// Decode the key at runtime
const getDataSourceKey = () => Buffer.from(DATA_SOURCE_ID_B64, 'base64').toString('utf-8');

const BASE_URL = 'https://www.steamgriddb.com/api/v2';

// Use Next.js's built-in fetch caching. Revalidate data every 24 hours.
const getOptions = () => ({
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${getDataSourceKey()}`
  },
  next: { revalidate: 86400 } // 24 hours in seconds
});

const checkAuthKey = () => {
    const key = getDataSourceKey();
    if (!key) {
        console.error("Data source auth key is missing or invalid.");
        return false;
    }
    return true;
}

// --- API Interfaces ---
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

// --- API Functions ---

export const searchGame = async (name: string, nsfw: 'true' | 'false' | 'any' = 'false', prioritizeNsfw: boolean = false): Promise<SteamGridDbGame | null> => {
    if (!checkAuthKey()) return null;

    try {
        const response = await fetch(`${BASE_URL}/search/autocomplete/${encodeURIComponent(name)}?nsfw=${nsfw}`, getOptions());
        if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
        const result = await response.json();
        
        if (!result.success || result.data.length === 0) {
            return null;
        }
        
        let games: SteamGridDbGame[] = result.data;

        if (prioritizeNsfw && nsfw !== 'false' && games.length > 1) {
            games.sort((a, b) => {
                if (a.nsfw === b.nsfw) return 0;
                return a.nsfw ? -1 : 1;
            });
        }
        
        const game = games[0];
        return game;

    } catch (error) {
        console.error(`Failed to search for game "${name}":`, error);
        return null;
    }
};

async function fetchImages(url: string): Promise<SteamGridDbImage[]> {
    try {
        const response = await fetch(url, getOptions());
        if (!response.ok) {
            console.error(`SteamGridDB API Error for ${url}: ${response.status} ${response.statusText}`);
            return [];
        }
        const result = await response.json();
        
        if (!result.success) return [];
        
        return result.data;
    } catch (error) {
        console.error(`Failed to fetch images from ${url}:`, error);
        return [];
    }
}

async function getImagesWithFallback(
    type: 'grids' | 'heroes' | 'logos', 
    gameId: number, 
    nsfw: 'true' | 'false' | 'any', 
    prioritizeNsfw: boolean,
    params: string = ''
): Promise<SteamGridDbImage[]> {
    if (prioritizeNsfw && nsfw !== 'false') {
        const nsfwUrl = `${BASE_URL}/${type}/game/${gameId}?nsfw=true${params}`;
        const nsfwImages = await fetchImages(nsfwUrl);
        
        // Use NSFW if available, but filter just in case API returns mixed results
        const filteredNsfw = nsfwImages.filter(img => img.nsfw);
        if (filteredNsfw.length > 0) return filteredNsfw;
    }
    
    // Fallback to SFW images
    const sfwUrl = `${BASE_URL}/${type}/game/${gameId}?nsfw=false${params}`;
    const sfwImages = await fetchImages(sfwUrl);
    return sfwImages.filter(img => !img.nsfw);
}


export const getGrids = async (gameId: number, dimensions: string[], nsfw: 'true' | 'false' | 'any' = 'false', prioritizeNsfw: boolean = false): Promise<SteamGridDbImage[]> => {
    if (!checkAuthKey() || !gameId) return [];
    try {
        const params = `&dimensions=${dimensions.join(',')}`;
        return await getImagesWithFallback('grids', gameId, nsfw, prioritizeNsfw, params);
    } catch (error) {
        console.error(`Failed to fetch grids for gameId ${gameId}:`, error);
        return [];
    }
}

export const getHeroes = async (gameId: number, nsfw: 'true' | 'false' | 'any' = 'false', prioritizeNsfw: boolean = false): Promise<SteamGridDbImage[]> => {
    if (!checkAuthKey() || !gameId) return [];
     try {
        return await getImagesWithFallback('heroes', gameId, nsfw, prioritizeNsfw, `&mimes=image/png,image/jpeg,image/webp`);
    } catch (error) {
        console.error(`Failed to fetch heroes for gameId ${gameId}:`, error);
        return [];
    }
};

export const getLogos = async (gameId: number, nsfw: 'true' | 'false' | 'any' = 'false', prioritizeNsfw: boolean = false): Promise<SteamGridDbImage[]> => {
    if (!checkAuthKey() || !gameId) return [];
     try {
        return await getImagesWithFallback('logos', gameId, nsfw, prioritizeNsfw);
    } catch (error) {
        console.error(`Failed to fetch logos for gameId ${gameId}:`, error);
        return [];
    }
};
