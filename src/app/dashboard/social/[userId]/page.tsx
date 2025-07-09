
'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { getSocialProfile, type SocialProfile } from '@/lib/social-service';
import { useBackNavigation } from '@/hooks/use-back-navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Gamepad2, Award, Tv, Loader2, Rocket, Album, Library, Users, UserPlus, type LucideIcon, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const iconMap: Record<string, LucideIcon> = {
    Rocket,
    Album,
    Library,
    Users,
    Download,
    Award, // Fallback
};

const AchievementIcon = ({ name, className }: { name: string, className?: string }) => {
    const Icon = iconMap[name] || Award;
    return <Icon className={className} />;
};

export default function SocialProfilePage() {
    const params = useParams();
    const router = useRouter();
    const userId = typeof params.userId === 'string' ? Number(params.userId) : null;
    
    const [profile, setProfile] = useState<SocialProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useBackNavigation('/dashboard/social');

    useEffect(() => {
        if (!userId) {
            setIsLoading(false);
            return;
        }
        
        const fetchProfile = async () => {
            setIsLoading(true);
            const profileData = await getSocialProfile(userId);
            setProfile(profileData);
            setIsLoading(false);
        };

        fetchProfile();

    }, [userId]);

    const renderStatus = () => {
        if (!profile) return null;

        if (profile.activity_status === 'playing' && profile.activity_details) {
            return (
                <div className="flex items-center gap-2 text-primary">
                    <Gamepad2 className="h-5 w-5" />
                    <span>Playing <strong>{profile.activity_details}</strong></span>
                </div>
            );
        }
        return (
            <div className="flex items-center gap-2 text-muted-foreground">
                <Tv className="h-5 w-5" />
                <span>Online</span>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex h-full w-full flex-1 items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex flex-col h-full w-full flex-1 items-center justify-center text-center gap-4">
                <p className="text-xl text-destructive">Profile not found.</p>
                <Button variant="outline" onClick={() => router.push('/dashboard/social')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Social Hub
                </Button>
            </div>
        );
    }
    
    return (
        <div className="animate-fade-in">
            <div className="mb-4 flex items-center justify-between">
                 <Button variant="outline" size="sm" onClick={() => router.back()} >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Social Hub
                </Button>
                 <Button variant="outline" size="sm">
                    <UserPlus className="mr-2 h-4 w-4" /> Add Friend
                </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader className="items-center text-center">
                            <Avatar className="w-24 h-24 mb-4">
                                <AvatarImage />
                                <AvatarFallback className="text-4xl">{profile.username.substring(0, 1).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <CardTitle className="text-3xl">{profile.username}</CardTitle>
                            <CardDescription>Member since {new Date(profile.created_at).toLocaleDateString()}</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                            {renderStatus()}
                        </CardContent>
                    </Card>
                </div>
                 <div className="lg:col-span-2">
                     <Tabs defaultValue="achievements" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="achievements">Achievements ({profile.achievements.length})</TabsTrigger>
                            <TabsTrigger value="friends" disabled>Friends (Coming Soon)</TabsTrigger>
                        </TabsList>
                        <TabsContent value="achievements">
                             <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Award className="h-6 w-6" /> Accomplishments
                                    </CardTitle>
                                    <CardDescription>A collection of this user's unlocked achievements.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {profile.achievements.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {profile.achievements.map((ach) => (
                                                <div key={ach.id} className="flex items-start gap-4 p-4 rounded-lg bg-background/50">
                                                    <AchievementIcon name={ach.icon} className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
                                                    <div>
                                                        <p className="font-bold">{ach.name}</p>
                                                        <p className="text-sm text-muted-foreground">{ach.description}</p>
                                                        <p className="text-xs text-muted-foreground/70 mt-1">
                                                            Unlocked on {new Date(ach.unlocked_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-32 text-muted-foreground">
                                            <p>No achievements unlocked yet.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="friends">
                             <Card>
                                <CardHeader>
                                    <CardTitle>Friends</CardTitle>
                                    <CardDescription>This user's network on Macro.</CardDescription>
                                </CardHeader>
                                <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
                                    <p>Friends list coming soon!</p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
