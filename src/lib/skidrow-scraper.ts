
'use server';

import * as cheerio from 'cheerio';
import { getGrids, searchGame } from './steamgrid';
import type { User } from './data';

const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
};

const BASE_URL = "https://www.skidrowreloaded.com";

export interface SkidrowSearchResult {
    title: string;
    url: string;
    posterUrl?: string | null;
}

export interface SkidrowGameDetails {
    title: string;
    description: string;
    size: string;
    allLinks: Record<string, string>;
    priorityLink: string | null;
    pixeldrainApi: string | null;
}

export async function searchSkidrow(query: string, currentUser: User): Promise<SkidrowSearchResult[]> {
    if (!query) return [];

    const searchUrl = `${BASE_URL}/?s=${encodeURIComponent(query)}`;
    console.log(`[SCRAPER] Searching Skidrow: ${searchUrl}`);

    try {
        const response = await fetch(searchUrl, { headers: HEADERS, next: { revalidate: 3600 } });
        if (!response.ok) {
            console.error(`[SCRAPER] Failed to fetch skidrow search page: ${response.statusText}`);
            return [];
        }
        const html = await response.text();
        const $ = cheerio.load(html);

        const posts = $("div.post").slice(0, 18);
        const results: {title: string, url: string}[] = [];

        posts.each((i, el) => {
            const h2 = $(el).find("h2");
            const aTag = h2.find("a");
            const title = aTag.text().trim();
            const url = aTag.attr("href");
            if (title && url) {
                results.push({ title, url });
            }
        });
        
        const { nsfwEnabled, prioritizeNsfw } = currentUser.permissions;
        const nsfwApiSetting = nsfwEnabled ? 'any' : 'false';

        const enrichedResults = await Promise.all(results.map(async (result) => {
            try {
                const steamgridGame = await searchGame(result.title, nsfwApiSetting, prioritizeNsfw);
                if (steamgridGame) {
                    const grids = await getGrids(steamgridGame.id, ['600x900'], nsfwApiSetting, prioritizeNsfw);
                    if (grids && grids.length > 0) {
                        return { ...result, posterUrl: grids[0].url };
                    }
                }
            } catch (e) {
                console.error(`[SCRAPER] Error enriching '${result.title}' with poster:`, e);
            }
            return { ...result, posterUrl: undefined };
        }));

        return enrichedResults;

    } catch (error) {
        console.error("[SCRAPER] Error searching Skidrow:", error);
        return [];
    }
}

export async function getSkidrowGameDetails(url: string): Promise<Omit<SkidrowGameDetails, 'title'> | null> {
    if (!url) return null;
    console.log(`[SCRAPER] Parsing game page: ${url}`);

    try {
        const response = await fetch(url, { headers: HEADERS });
        if (!response.ok) {
            console.error(`[SCRAPER] Failed to fetch game details page: ${response.statusText}`);
            return null;
        }
        const html = await response.text();
        const $ = cheerio.load(html);

        const aboutHeader = $("h5").filter((i, el) => $(el).text().toUpperCase().includes("ABOUT THE GAME"));
        const description = aboutHeader.next("p").text().trim() || "No description found.";
        
        const sizeMatch = html.match(/Size:\s*([0-9.]+\s*[MGT]B)/i);
        const size = sizeMatch ? sizeMatch[1] : "Unknown";

        const allLinks: Record<string, string> = {};
        let priorityLink: string | null = null;
        let pixeldrainApi: string | null = null;
        
        const knownHosts = [
            "MEGA", "1FICHIER", "GOFILE", "MEDIAFIRE", "RANOZ", "DROPAPK", "BOWFILE",
            "SENDCM", "FREEDLINK", "MIXDROP", "CHOMIKUJ", "VIKINGFILE", "DOWNMEDIALOAD", "HEXLOAD",
            "1CLOUDFILE", "USERSDRIVE", "FILEFACTORY", "MEGAUP", "CLICKNUPLOAD", "DAILYUPLOAD",
            "RAPIDGATOR", "NITROFLARE", "TURBOBIT", "HITFILE", "KATFILE", "MULTIUP", "MULTI LINKS"
        ];
        
        $("p").each((i, p_el) => {
            const pEl = $(p_el);
            const strongTag = pEl.find('strong');

            if (strongTag.length > 0) {
                const strongText = strongTag.text().trim().toUpperCase();
                const host = knownHosts.find(h => strongText.includes(h));

                if (host) {
                    const linkTag = pEl.find('a');
                    const link = linkTag.attr('href');

                    if(link) {
                        let standardizedHost = host;
                        if (host === "MULTI LINKS") standardizedHost = "MULTIUP";
                        if (host === "CHOMIKUJ") standardizedHost = "CHOMIKUJ.PL";
                        
                        if (!allLinks[standardizedHost]) {
                            allLinks[standardizedHost] = link;
                            
                            if (standardizedHost === "PIXELDRAIN") {
                                const match = link.match(/\/u\/([a-zA-Z0-9]+)/);
                                if (match) {
                                    pixeldrainApi = `https://pixeldrain.com/api/file/${match[1]}`;
                                    if (!priorityLink) priorityLink = link;
                                }
                            } else if (standardizedHost === "MEGA" && !priorityLink) {
                                priorityLink = link;
                            }
                        }
                    }
                }
            }
        });

        return {
            description,
            size,
            allLinks,
            priorityLink,
            pixeldrainApi
        };

    } catch (error) {
        console.error(`[SCRAPER] Error parsing game page ${url}:`, error);
        return null;
    }
}
