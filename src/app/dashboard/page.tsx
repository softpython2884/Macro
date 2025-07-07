
'use client';

import { Card } from "@/components/ui/card";
import { Film, Youtube, Twitch, Globe, Settings, Music, Power } from 'lucide-react';
import Link from 'next/link';
import { SiAmazonalexa, SiSteam } from '@icons-pack/react-simple-icons';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const applications = [
  { name: 'Xalaflix', icon: Film, href: 'https://xalaflix.io', description: 'Movies & TV shows' },
  { name: 'Netflix', icon: Film, href: 'https://netflix.com', description: 'Stream movies & shows' },
  { name: 'YouTube', icon: Youtube, href: 'https://youtube.com', description: 'Watch & share videos' },
  { name: 'Twitch', icon: Twitch, href: 'https://twitch.tv', description: 'Live streaming for gamers' },
  { name: 'Brave', icon: Globe, href: 'https://brave.com', description: 'Secure & private browser' },
  { name: 'Alexa', icon: SiAmazonalexa, href: 'https://alexa.amazon.com', description: 'Manage your assistant' },
];

type AppCardProps = {
  name: string;
  icon: React.ElementType;
  description: string;
  href?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

const AppCard = ({ name, icon: Icon, href, description, onClick }: AppCardProps) => {
    const cardContent = (
      <Card className="bg-black/20 backdrop-blur-lg border border-white/10 group-hover:bg-white/20 group-hover:border-primary group-focus:bg-white/20 group-focus:border-primary transition-all duration-300 ease-in-out h-full w-full flex flex-col justify-center items-center p-6 aspect-video transform group-hover:scale-105 group-focus:scale-105">
        <Icon className="h-16 w-16 text-primary drop-shadow-[0_0_8px_hsl(var(--primary))] transition-all duration-300 group-hover:scale-110 group-focus:scale-110" />
        <h3 className="mt-4 text-xl font-bold text-card-foreground">{name}</h3>
        <p className="mt-1 text-sm text-muted-foreground text-center">
          {description}
        </p>
      </Card>
    );

    const commonProps = {
        className:"block group w-full h-full rounded-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    };

    if (href) {
        const isExternal = href.startsWith('http') || href.startsWith('steam') || href.startsWith('spotify');
        return (
            <Link 
                href={href} 
                target={isExternal ? '_blank' : '_self'} 
                rel="noopener noreferrer" 
                {...commonProps}
            >
              {cardContent}
            </Link>
        )
    }

    return (
        <button onClick={onClick} {...commonProps} type="button">
            {cardContent}
        </button>
    )
  };


export default function DashboardPage() {
  const handleShutdown = () => {
    console.log('Action triggered: Shutdown PC. This would call the local server API.');
    // In a real implementation, you would make an API call here, e.g.:
    // fetch('http://localhost:YOUR_SERVER_PORT/api/system/shutdown', { method: 'POST' });
  };
  
  const mainShortcuts: AppCardProps[] = [
      { name: 'Steam', icon: SiSteam, href: 'steam://open/main', description: 'Access your game library' },
      { name: 'Spotify', icon: Music, href: 'spotify:', description: 'Open your music' },
      { name: 'Settings', icon: Settings, href: '/dashboard/settings', description: 'Configure your system'
      },
      { name: 'Shutdown', icon: Power, onClick: handleShutdown, description: 'Shutdown the PC' },
  ];

  return (
    <div className="animate-fade-in space-y-12">
      <div>
        <h2 className="text-4xl font-bold tracking-tight text-glow mb-6">Quick Actions</h2>
        <Carousel opts={{ align: "start", slidesToScroll: 'auto' }} className="w-full">
          <CarouselContent>
            {mainShortcuts.map((app, index) => (
              <CarouselItem key={index} className="sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                  <AppCard {...app} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>

      <div>
        <h2 className="text-4xl font-bold tracking-tight text-glow mb-6">Applications</h2>
         <Carousel opts={{ align: "start", slidesToScroll: 'auto' }} className="w-full">
          <CarouselContent>
            {applications.map((app, index) => (
              <CarouselItem key={index} className="sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                <AppCard {...app} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </div>
  );
}
