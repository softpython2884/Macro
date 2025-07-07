
'use client';

import { Card } from "@/components/ui/card";
import { Gamepad2, LayoutGrid, User, Settings } from 'lucide-react';
import Link from 'next/link';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { useHints } from '@/context/HintContext';

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
    <Link href={href} className="block group w-full h-full rounded-lg focus:outline-none" tabIndex={-1}>
      <Card className="bg-black/20 backdrop-blur-lg border border-white/10 group-hover:backdrop-blur-xl group-focus-within:backdrop-blur-xl group-hover:drop-shadow-glow group-focus-within:drop-shadow-glow transition-all duration-300 ease-in-out h-full w-full flex flex-col justify-end p-8 aspect-[16/9] overflow-hidden group-focus-within:scale-100 group-hover:scale-100">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-40 group-focus-within:opacity-40 transition-opacity" 
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
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)
  const { setHints } = useHints();
  const carouselContainerRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  React.useEffect(() => {
    setHints([
        { key: '↔', action: 'Navigate' },
        { key: 'A', action: 'Select' },
        { key: 'Q', action: 'Prev Tab' },
        { key: 'E', action: 'Next Tab' },
    ]);

    // Focus the carousel container to enable keyboard navigation
    carouselContainerRef.current?.focus();

    return () => setHints([]);
  }, [setHints]);

  React.useEffect(() => {
    if (!api) {
      return
    }

    setCurrent(api.selectedScrollSnap())

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap())
    }

    api.on("select", onSelect)

    return () => {
      api.off("select", onSelect)
    }
  }, [api])

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (document.activeElement !== carouselContainerRef.current) {
            return;
        }

        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const targetHref = mainMenuItems[current]?.href;
            if (targetHref) {
                router.push(targetHref);
            }
        }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    };
  }, [current, router]);

  return (
    <div className="flex flex-1 items-center justify-center animate-zoom-in-fade w-full">
        <Carousel 
            ref={carouselContainerRef}
            setApi={setApi}
            opts={{ align: "center", loop: true }} 
            className="w-full max-w-6xl focus:outline-none"
            tabIndex={0} // Make it focusable
        >
          <CarouselContent className="-ml-8 py-12">
            {mainMenuItems.map((item, index) => (
              <CarouselItem key={index} className="pl-8 md:basis-1/2 lg:basis-[50%]">
                  <div className={cn(
                    "transition-all duration-500 ease-in-out transform",
                    index === current ? 'scale-100 opacity-100' : 'scale-75 opacity-50'
                  )}>
                    <MenuCard {...item} />
                  </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-[-4rem] z-10" />
          <CarouselNext className="right-[-4rem] z-10" />
        </Carousel>
    </div>
  );
}
