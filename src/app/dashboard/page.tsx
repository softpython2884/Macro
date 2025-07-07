
import { Card } from "@/components/ui/card";
import { Film, Youtube, Twitch, Globe, Gamepad2, Settings } from 'lucide-react';
import Link from 'next/link';

const applications = [
  { name: 'Xalaflix', icon: Film, href: 'https://xalaflix.io', description: 'Community movie hub' },
  { name: 'Netflix', icon: Film, href: 'https://netflix.com', description: 'Stream movies & shows' },
  { name: 'YouTube', icon: Youtube, href: 'https://youtube.com', description: 'Watch & share videos' },
  { name: 'Twitch', icon: Twitch, href: 'https://twitch.tv', description: 'Live streaming for gamers' },
  { name: 'Brave', icon: Globe, href: 'https://brave.com', description: 'Secure & private browser' },
];

const mainShortcuts = [
    { name: 'Games', icon: Gamepad2, href: '#', description: 'Access your game library' },
    { name: 'Settings', icon: Settings, href: '/dashboard/settings', description: 'Configure your system' },
]

const AppCard = ({ name, icon: Icon, href, description }: { name: string, icon: React.ElementType, href: string, description: string }) => (
    <Link href={href} target={href.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer" className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background rounded-lg group block">
      <Card className="bg-card/80 backdrop-blur-sm hover:bg-card/100 hover:border-primary transition-all duration-300 ease-in-out h-full flex flex-col justify-center items-center p-6 aspect-video">
        <Icon className="h-16 w-16 text-primary group-hover:scale-110 transition-transform duration-300" />
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
        <h2 className="text-3xl font-bold tracking-tight text-accent mb-6">Quick Access</h2>
        <div className="grid gap-6 sm:grid-cols-2">
            {mainShortcuts.map(app => <AppCard key={app.name} {...app} />)}
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-bold tracking-tight text-accent mb-6">Applications</h2>
        <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {applications.map(app => <AppCard key={app.name} {...app} />)}
        </div>
      </div>
    </div>
  );
}
