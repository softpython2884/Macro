
import type { LucideIcon } from 'lucide-react';
import { Film, Youtube, Twitch, Globe, Settings, Music, Power, Moon, Puzzle, Download, Bed, GalleryThumbnails } from 'lucide-react';
import { SiSteam } from '@icons-pack/react-simple-icons';
import type { IconType } from '@icons-pack/react-simple-icons/types';
import { getPluginApps } from './plugins';

export type AppInfo = {
  id: string;
  name: string;
  icon: LucideIcon | IconType;
  href?: string;
  onClick?: () => void;
  description: string;
  searchName?: string; // For better search results on SteamGridDB
  posterUrl?: string; // Will be populated at runtime
};

export type Game = {
  id: string; // e.g., 'cyberpunk'
  name: string; // e.g., 'Cyberpunk 2077'
  path: string; // e.g., 'C:/Games/Cyberpunk 2077'
  executables: string[]; // e.g., ['Cyberpunk2077.exe', 'launcher.exe']
  steamgridGameId?: number; // The ID from SteamGridDB
  posterUrl?: string;
  heroUrls?: string[];
  logoUrl?: string;
};

export type User = {
  id: string;
  name: string;
  avatar: string;
  pin?: string;
  permissions: {
    apps: string[];
    games: string[];
    nsfwEnabled: boolean;
    prioritizeNsfw: boolean;
  };
};

const CORE_APPS: AppInfo[] = [
  { id: 'xalaflix', name: 'Xalaflix', icon: Film, href: 'https://xalaflix.io', description: 'Movies & TV shows' },
  { id: 'netflix', name: 'Netflix', icon: Film, href: 'https://netflix.com', description: 'Stream movies & shows' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, href: 'https://youtube.com', description: 'Watch & share videos' },
  { id: 'twitch', name: 'Twitch', icon: Twitch, href: 'https://twitch.tv', description: 'Live streaming for gamers' },
  { id: 'moonlight', name: 'Moonlight', icon: Moon, searchName: 'Moonlight Game Streaming', description: 'Stream games from your PC' },
  { id: 'steam', name: 'Steam', icon: SiSteam, href: 'steam://open/bigpicture', description: 'Access your game library' },
  { id: 'spotify', name: 'Spotify', icon: Music, href: 'spotify:', description: 'Open your music' },
  { id: 'store', name: 'Store', icon: Download, href: '/dashboard/store', description: 'Find new games', posterUrl: 'https://cdn2.steamgriddb.com/thumb/548ac132d1da8285bfd71130da4ee0fa.jpg' },
  { id: 'settings', name: 'Settings', icon: Settings, href: '/dashboard/settings', description: 'Configure your system' },
  { id: 'plugins', name: 'Plugins', icon: Puzzle, href: '/dashboard/plugins', description: 'Manage plugins & add-ons' },
  { id: 'sleep', name: 'Mettre en Veille', icon: Bed, description: 'Met le PC en veille' },
];

// Combine core apps with apps from plugins
export const ALL_APPS: AppInfo[] = [...CORE_APPS, ...getPluginApps()];


// This simulates the result of scanning the filesystem for the first load.
// It will be replaced by the actual scan result from the user's settings.
export const INITIAL_GAMES: Game[] = [];

export const INITIAL_USERS: User[] = [
  {
    id: 'user-1',
    name: 'Admin',
    avatar: 'https://icon-library.com/images/netflix-icon-black/netflix-icon-black-19.jpg',
    pin: '1234',
    permissions: {
      apps: ALL_APPS.map(app => app.id),
      games: [],
      nsfwEnabled: true,
      prioritizeNsfw: false,
    },
  },
  {
    id: 'user-2',
    name: 'Guest',
    avatar: 'https://static.wikia.nocookie.net/925fa2de-087e-47f4-8aed-4f5487f0a78c/scale-to-width/755',
    permissions: {
      apps: ['netflix', 'youtube', 'spotify'],
      games: [],
      nsfwEnabled: false,
      prioritizeNsfw: false,
    },
  },
];
