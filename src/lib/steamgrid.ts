
'use server';

// IMPORTANT: To use this service, you need to get an API key from https://www.steamgriddb.com/profile/api
// Once you have your key, create a file named .env.local in the root of your project
// and add the following line:
// STEAMGRIDDB_API_KEY=YOUR_API_KEY_HERE

const API_KEY = process.env.STEAMGRIDDB_API_KEY;
const BASE_URL = 'https://www.steamgriddb.com/api/v2';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
};

type CacheEntry<T> = {
    timestamp: number;
    data: T;
};

// --- Caching Layer ---
function getFromCache<T>(key: string): T | null {
    try {
        const item = localStorage.getItem(key);
        if (!item) return null;

        const entry: CacheEntry<T> = JSON.parse(item);
        if (Date.now() - entry.timestamp > CACHE_TTL) {
            localStorage.removeItem(key);
            return null;
        }
        return entry.data;
    } catch (error) {
        console.warn(`[CACHE] Could not read from cache for key "${key}":`, error);
        return null;
    }
}

function setInCache<T>(key: string, data: T) {
    try {
        const entry: CacheEntry<T> = {
            timestamp: Date.now(),
            data: data
        };
        localStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
        console.warn(`[CACHE] Could not write to cache for key "${key}":`, error);
    }
}

const checkApiKey = () => {
    if (!API_KEY) {
        console.error("SteamGridDB API Key is missing. Make sure it's set in a .env.local file as STEAMGRIDDB_API_KEY=YOUR_KEY_HERE (no NEXT_PUBLIC_ prefix).");
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

// --- API Functions with Caching ---

export const searchGame = async (name: string, nsfw: 'true' | 'false' | 'any' = 'false', prioritizeNsfw: boolean = false): Promise<SteamGridDbGame | null> => {
    if (!checkApiKey()) return null;

    const cacheKey = `steamgrid_search_${name}_${nsfw}_${prioritizeNsfw}`;
    const cachedData = getFromCache<SteamGridDbGame | null>(cacheKey);
    if (cachedData !== null) return cachedData; // Return cached data (even if it's null)
    
    try {
        const response = await fetch(`${BASE_URL}/search/autocomplete/${encodeURIComponent(name)}?nsfw=${nsfw}`, options);
        if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
        const result = await response.json();
        
        if (!result.success || result.data.length === 0) {
            setInCache(cacheKey, null);
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
        setInCache(cacheKey, game);
        return game;

    } catch (error) {
        console.error(`Failed to search for game "${name}":`, error);
        return null;
    }
};

async function fetchImages(url: string, cacheKey: string): Promise<SteamGridDbImage[]> {
    const cachedData = getFromCache<SteamGridDbImage[]>(cacheKey);
    if (cachedData) return cachedData;

    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
    const result = await response.json();
    
    if (!result.success) return [];
    
    const images: SteamGridDbImage[] = result.data;
    setInCache(cacheKey, images);
    return images;
}

async function getImagesWithFallback(
    type: 'grids' | 'heroes' | 'logos', 
    gameId: number, 
    nsfw: 'true' | 'false' | 'any', 
    prioritizeNsfw: boolean,
    params: string = ''
): Promise<SteamGridDbImage[]> {
    if (prioritizeNsfw && nsfw !== 'false') {
        const nsfwCacheKey = `steamgrid_${type}_${gameId}_nsfw${params}`;
        const nsfwUrl = `${BASE_URL}/${type}/game/${gameId}?nsfw=true${params}`;
        const nsfwImages = await fetchImages(nsfwUrl, nsfwCacheKey);
        
        if (nsfwImages.length > 0) return nsfwImages.filter(img => img.nsfw);
    }
    
    const sfwCacheKey = `steamgrid_${type}_${gameId}_sfw${params}`;
    const sfwUrl = `${BASE_URL}/${type}/game/${gameId}?nsfw=false${params}`;
    const sfwImages = await fetchImages(sfwUrl, sfwCacheKey);
    return sfwImages.filter(img => !img.nsfw);
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
        return await getImagesWithFallback('heroes', gameId, nsfw, prioritizeNsfw, `&mimes=image/png,image/jpeg,image/webp`);
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
