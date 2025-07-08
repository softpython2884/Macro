
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
}

export interface SteamGridDbImage {
    id: number;
    score: number;
    style: string;
    url: string;
    thumb: string;
}

export const searchGame = async (name: string, nsfw: boolean = false): Promise<SteamGridDbGame | null> => {
    if (!checkApiKey()) return null;
    
    try {
        const response = await fetch(`${BASE_URL}/search/autocomplete/${encodeURIComponent(name)}?nsfw=${nsfw}`, options);
        if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
        const result = await response.json();
        return result.success && result.data.length > 0 ? result.data[0] : null;
    } catch (error) {
        console.error(`Failed to search for game "${name}":`, error);
        return null;
    }
};

export const getGrids = async (gameId: number, dimensions: string[], nsfw: boolean = false): Promise<SteamGridDbImage[]> => {
    if (!checkApiKey() || !gameId) return [];
    try {
        const response = await fetch(`${BASE_URL}/grids/game/${gameId}?dimensions=${dimensions.join(',')}&nsfw=${nsfw}`, options);
        if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
        const result = await response.json();
        return result.success ? result.data : [];
    } catch (error) {
        console.error(`Failed to fetch grids for gameId ${gameId}:`, error);
        return [];
    }
}

export const getHeroes = async (gameId: number, nsfw: boolean = false): Promise<SteamGridDbImage[]> => {
    if (!checkApiKey() || !gameId) return [];
    try {
        const response = await fetch(`${BASE_URL}/heroes/game/${gameId}?nsfw=${nsfw}`, options);
        if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
        const result = await response.json();
        return result.success ? result.data : [];
    } catch (error) {
        console.error(`Failed to fetch heroes for gameId ${gameId}:`, error);
        return [];
    }
};

export const getLogos = async (gameId: number, nsfw: boolean = false): Promise<SteamGridDbImage[]> => {
    if (!checkApiKey() || !gameId) return [];
    try {
        const response = await fetch(`${BASE_URL}/logos/game/${gameId}?nsfw=${nsfw}`, options);
        if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
        const result = await response.json();
        return result.success ? result.data : [];
    } catch (error) {
        console.error(`Failed to fetch logos for gameId ${gameId}:`, error);
        return [];
    }
};
