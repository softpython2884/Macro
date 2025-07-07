
'use client';

import { Card } from "@/components/ui/card";
import { Gamepad2, LayoutGrid, User, Settings } from 'lucide-react';
import Link from 'next/link';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const mainMenuItems = [
    { 
        title: 'Games', 
        description: 'Access your game library', 
        href: '/dashboard/games', 
        icon: Gamepad2, 
        hint: 'gaming controller' 
    },
    { 
        title: 'Applications', 
        description: 'Launch your favorite apps', 
        href: '/dashboard/applications', 
        icon: LayoutGrid, 
        hint: 'app grid' 
    },
    { 
        title: 'Profiles', 
        description: 'Manage user profiles', 
        href: '/dashboard/profiles', 
        icon: User, 
        hint: 'user avatar' 
    },
    { 
        title: 'Settings', 
        description: 'Configure Macro', 
        href: '/dashboard/settings', 
        icon: Settings, 
        hint: 'cogwheel gear' 
    },
];

const MenuCard = ({ title, description, icon: Icon, href, hint }: typeof mainMenuItems[0]) => {
  return (
    <Link href={href} className="block group w-full h-full rounded-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
      <Card className="bg-black/30 backdrop-blur-md border border-white/10 group-hover:bg-primary/30 group-focus:bg-primary/30 group-hover:backdrop-blur-lg group-focus:backdrop-blur-lg group-hover:drop-shadow-glow group-focus:drop-shadow-glow transition-all duration-300 ease-in-out h-full w-full flex flex-col justify-end p-8 aspect-[16/9] transform group-hover:scale-105 group-focus:scale-105 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-30 group-focus:opacity-30 transition-opacity" 
          style={{backgroundImage: `url(https://placehold.co/1280x720.png)`}} 
          data-ai-hint={hint}
        />
        <div className="relative z-10">
          <Icon className="h-12 w-12 mb-4 text-primary drop-shadow-glow" />
          <h2 className="text-4xl font-bold text-white text-glow">{title}</h2>
          <p className="text-lg text-muted-foreground">{description}</p>
        </div>
      </Card>
    </Link>
  );
};


export default function DashboardPage() {
  return (
    <div className="flex flex-1 items-center justify-center animate-fade-in">
        <Carousel 
            opts={{ align: "start", loop: true }} 
            className="w-full max-w-5xl"
        >
          <CarouselContent className="-ml-8">
            {mainMenuItems.map((item, index) => (
              <CarouselItem key={index} className="pl-8 md:basis-1/2 lg:basis-2/3">
                  <MenuCard {...item} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-[-50px]" />
          <CarouselNext className="right-[-50px]" />
        </Carousel>
    </div>
  );
}
