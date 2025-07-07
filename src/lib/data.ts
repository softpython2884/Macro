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
  id: string;
  name: string;
  hint: string;
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

export const ALL_GAMES: Game[] = [
  { id: 'cyberpunk', name: 'Cyberpunk 2077', hint: 'dystopian city' },
  { id: 'witcher3', name: 'The Witcher 3', hint: 'fantasy landscape' },
  { id: 'rdr2', name: 'Red Dead Redemption 2', hint: 'western landscape' },
  { id: 'eldenring', name: 'Elden Ring', hint: 'dark fantasy' },
  { id: 'bg3', name: 'Baldur\'s Gate 3', hint: 'fantasy rpg' },
  { id: 'starfield', name: 'Starfield', hint: 'space exploration' },
  { id: 'forza5', name: 'Forza Horizon 5', hint: 'race car' },
  { id: 'helldivers2', name: 'Helldivers 2', hint: 'sci-fi soldiers' },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user-1',
    name: 'Admin',
    avatar: 'https://icon-library.com/images/netflix-icon-black/netflix-icon-black-19.jpg',
    pin: '1234',
    permissions: {
      apps: ALL_APPS.map(app => app.id),
      games: ALL_GAMES.map(game => game.id),
    },
  },
  {
    id: 'user-2',
    name: 'Guest',
    avatar: 'https://placehold.co/160x160.png',
    permissions: {
      apps: ['netflix', 'youtube', 'spotify'],
      games: ['forza5'],
    },
  },
];
