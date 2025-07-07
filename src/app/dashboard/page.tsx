import { Card } from "@/components/ui/card";
import { Film, Youtube, Twitch, Globe, Settings, Music, Power } from 'lucide-react';
import Link from 'next/link';
import { SiAlexa, SiSteam } from '@icons-pack/react-simple-icons';

const applications = [
  { name: 'Netflix', icon: Film, href: 'https://netflix.com', description: 'Stream movies & shows' },
  { name: 'YouTube', icon: Youtube, href: 'https://youtube.com', description: 'Watch & share videos' },
  { name: 'Twitch', icon: Twitch, href: 'https://twitch.tv', description: 'Live streaming for gamers' },
  { name: 'Brave', icon: Globe, href: 'https://brave.com', description: 'Secure & private browser' },
  { name: 'Alexa', icon: (props: any) => <SiAlexa {...props} />, href: 'https://alexa.amazon.com', description: 'Manage your assistant' },
];

const mainShortcuts = [
    { name: 'Steam', icon: (props: any) => <SiSteam {...props} />, href: 'steam://open/main', description: 'Access your game library' },
    { name: 'Spotify', icon: Music, href: 'spotify:', description: 'Open your music' },
    { name: 'Settings', icon: Settings, href: '/dashboard/settings', description: 'Configure your system' },
    { name: 'Shutdown', icon: Power, href: '#', description: 'Shutdown the PC' },
]

const AppCard = ({ name, icon: Icon, href, description }: { name: string, icon: React.ElementType, href: string, description: string }) => (
    <Link 
        href={href} 
        target={href.startsWith('http') ? '_blank' : '_self'} 
        rel="noopener noreferrer" 
        className="block group rounded-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card className="bg-black/20 backdrop-blur-lg border border-white/10 group-hover:bg-white/20 group-hover:border-primary group-focus:bg-white/20 group-focus:border-primary transition-all duration-300 ease-in-out h-full flex flex-col justify-center items-center p-6 aspect-video transform group-hover:scale-105 group-focus:scale-105">
        <Icon className="h-16 w-16 text-primary drop-shadow-[0_0_8px_hsl(var(--primary))] transition-all duration-300 group-hover:scale-110 group-focus:scale-110" />
        <h3 className="mt-4 text-xl font-bold text-card-foreground">{name}</h3>
        <p className="mt-1 text-sm text-muted-foreground text-center">
          {description}
        </p>
      </Card>
    </Link>
  );


export default function DashboardPage() {
  return (
    <div className="animate-fade-in space-y-12">
      <div>
        <h2 className="text-4xl font-bold tracking-tight text-glow mb-6">Quick Actions</h2>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
            {mainShortcuts.map(app => <AppCard key={app.name} {...app} />)}
        </div>
      </div>

      <div>
        <h2 className="text-4xl font-bold tracking-tight text-glow mb-6">Applications</h2>
        <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {applications.map(app => <AppCard key={app.name} {...app} />)}
        </div>
      </div>
    </div>
  );
}
