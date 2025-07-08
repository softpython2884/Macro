'use client';

import { ALL_APPS } from "@/lib/data";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Rocket } from "lucide-react";
import { useHints } from "@/context/HintContext";
import { useBackNavigation } from "@/hooks/use-back-navigation";

export default function AppLaunchingPage() {
    const params = useParams();
    const router = useRouter();
    const { setHints } = useHints();
    
    const appId = typeof params.appId === 'string' ? params.appId : '';
    const app = React.useMemo(() => ALL_APPS.find(a => a.id === appId), [appId]);

    useBackNavigation('/dashboard/applications');

    useEffect(() => {
        setHints([
            { key: 'B', action: 'Back to Apps' },
        ]);
        
        return () => {
            setHints([]);
        };
    }, [setHints]);

    if (!app) {
        // Optional: handle case where app is not found
        return null;
    }

    const { name: appName, icon: Icon } = app;

    return (
        <div className="relative h-full min-h-[calc(100vh-10rem)] flex flex-col justify-center items-center p-8 text-white space-y-8 animate-fade-in">
            {Icon ? (
                <Icon className="h-32 w-32 text-primary drop-shadow-[0_0_12px_hsl(var(--primary))] mb-4" />
            ) : (
                <h1 className="text-6xl font-bold text-glow">{appName}</h1>
            )}
            
            <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                <Rocket className="w-12 h-12 animate-pulse text-primary mb-4" />
                <p className="text-2xl text-foreground">Launching {appName}...</p>
                <p className="mt-2 text-sm">The application should now be running. Press B to return to Macro.</p>
            </div>

            <Button variant="outline" onClick={() => router.push('/dashboard/applications')} className="bg-black/30 hover:bg-black/50 border-white/20">
                <ArrowLeft className="mr-2 h-4 w-4" /> Return to Applications
            </Button>
        </div>
    );
}
