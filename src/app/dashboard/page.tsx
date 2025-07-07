
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Film, Youtube, Twitch, Globe, Gamepad2, Settings } from 'lucide-react';
import Link from 'next/link';

const applications = [
  { name: 'Xalaflix', icon: Film, href: 'https://xalaflix.io', description: 'Community-driven movie hub' },
  { name: 'Netflix', icon: Film, href: 'https://netflix.com', description: 'Stream movies and TV shows' },
  { name: 'YouTube', icon: Youtube, href: 'https://youtube.com', description: 'Watch and share videos' },
  { name: 'Twitch', icon: Twitch, href: 'https://twitch.tv', description: 'Live streaming for gamers' },
  { name: 'Brave', icon: Globe, href: 'https://brave.com', description: 'Secure, fast, and private browser' },
];

const mainShortcuts = [
    { name: 'Games', icon: Gamepad2, href: '#', description: 'Access your game library' },
    { name: 'Settings', icon: Settings, href: '/dashboard/settings', description: 'Configure your system' },
]

const AppCard = ({ name, icon: Icon, href, description }: { name: string, icon: React.ElementType, href: string, description: string }) => (
  <Link href={href} target={href.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer">
    <Card className="hover:bg-card/60 hover:border-primary transition-all duration-300 ease-in-out hover:-translate-y-1 shadow-lg hover:shadow-primary/30 h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{name}</CardTitle>
        <Icon className="h-6 w-6 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="text-xs text-muted-foreground">
          {description}
        </div>
      </CardContent>
    </Card>
  </Link>
);


export default function DashboardPage() {
  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-accent mb-4">Quick Access</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {mainShortcuts.map(app => <AppCard key={app.name} {...app} />)}
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-bold tracking-tight text-accent mb-4">Applications</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {applications.map(app => <AppCard key={app.name} {...app} />)}
        </div>
      </div>
    </div>
  );
}
