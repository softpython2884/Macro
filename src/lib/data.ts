import type { LucideIcon } from 'lucide-react';
import { Film, Youtube, Twitch, Globe, Settings, Music, Power, Moon } from 'lucide-react';
import { SiAmazonalexa, SiSteam } from '@icons-pack/react-simple-icons';
import type { IconType } from '@icons-pack/react-simple-icons/types';

export type AppInfo = {
  id: string;
  name: string;
  icon: LucideIcon | IconType;
  href?: string;
  onClick?: () => void;
  description: string;
};

export type Game = {
  id: string; // e.g., 'cyberpunk'
  name: string; // e.g., 'Cyberpunk 2077'
  path: string; // e.g., 'C:/Games/Cyberpunk 2077'
  executables: string[]; // e.g., ['Cyberpunk2077.exe', 'launcher.exe']
  posterUrl?: string;
  heroUrl?: string;
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
  };
};

export const ALL_APPS: AppInfo[] = [
  { id: 'xalaflix', name: 'Xalaflix', icon: Film, href: 'https://xalaflix.io', description: 'Movies & TV shows' },
  { id: 'netflix', name: 'Netflix', icon: Film, href: 'https://netflix.com', description: 'Stream movies & shows' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, href: 'https://youtube.com', description: 'Watch & share videos' },
  { id: 'twitch', name: 'Twitch', icon: Twitch, href: 'https://twitch.tv', description: 'Live streaming for gamers' },
  { id: 'moonlight', name: 'Moonlight', icon: Moon, href: 'https://moonlight-stream.org/', description: 'Stream games from your PC' },
  { id: 'brave', name: 'Brave', icon: Globe, href: 'https://brave.com', description: 'Secure & private browser' },
  { id: 'alexa', name: 'Alexa', icon: SiAmazonalexa, href: 'https://alexa.amazon.com', description: 'Manage your assistant' },
  { id: 'steam', name: 'Steam', icon: SiSteam, href: 'steam://open/main', description: 'Access your game library' },
  { id: 'spotify', name: 'Spotify', icon: Music, href: 'spotify:', description: 'Open your music' },
  { id: 'settings', name: 'Settings', icon: Settings, href: '/dashboard/settings', description: 'Configure your system' },
  { id: 'shutdown', name: 'Shutdown', icon: Power, onClick: () => console.log('Shutdown initiated'), description: 'Shutdown the PC' },
];

// This simulates the result of scanning the filesystem.
// In a real app, this would be generated dynamically.
export const INITIAL_GAMES: Game[] = [
  { id: 'cyberpunk', name: 'Cyberpunk 2077', path: 'D:/Games/Cyberpunk 2077', executables: ['bin/x64/Cyberpunk2077.exe', 'redprelauncher.exe'] },
  { id: 'witcher3', name: 'The Witcher 3', path: 'D:/Games/The Witcher 3', executables: ['bin/x64/witcher3.exe'] },
  { id: 'rdr2', name: 'Red Dead Redemption 2', path: 'D:/Games/Red Dead Redemption 2', executables: ['RDR2.exe', 'PlayRDR2.exe'] },
  { id: 'eldenring', name: 'Elden Ring', path: 'D:/Games/Elden Ring', executables: ['game/eldenring.exe'] },
  { id: 'bg3', name: 'Baldur\'s Gate 3', path: 'D:/Games/Baldurs Gate 3', executables: ['bin/bg3.exe', 'bin/bg3_dx11.exe'] },
  { id: 'starfield', name: 'Starfield', path: 'D:/Games/Starfield', executables: ['Starfield.exe'] },
  { id: 'forza5', name: 'Forza Horizon 5', path: 'D:/Games/Forza Horizon 5', executables: ['ForzaHorizon5.exe'] },
  { id: 'helldivers2', name: 'Helldivers 2', path: 'D:/Games/Helldivers 2', executables: ['bin/helldivers2.exe'] },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user-1',
    name: 'Admin',
    avatar: 'https://icon-library.com/images/netflix-icon-black/netflix-icon-black-19.jpg',
    pin: '1234',
    permissions: {
      apps: ALL_APPS.map(app => app.id),
      games: INITIAL_GAMES.map(game => game.id),
    },
  },
  {
    id: 'user-2',
    name: 'Guest',
    avatar: 'https://static.wikia.nocookie.net/925fa2de-087e-47f4-8aed-4f5487f0a78c/scale-to-width/755',
    permissions: {
      apps: ['netflix', 'youtube', 'spotify'],
      games: ['forza5'],
    },
  },
];
