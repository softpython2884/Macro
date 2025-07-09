
'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { getSocialProfile, type SocialProfile, sendFriendRequest, getFriendshipStatus, type FriendshipStatus, checkAndAwardAchievements, type Achievement } from '@/lib/social-service';
import { useBackNavigation } from '@/hooks/use-back-navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Gamepad2, Award, Tv, Loader2, Rocket, Album, Library, Users, UserPlus, type LucideIcon, UserCheck, Clock, UserX, Download, LayoutGrid } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useSound } from '@/context/SoundContext';
import { useHints } from '@/context/HintContext';
import { useGridNavigation } from '@/hooks/use-grid-navigation';
import { cn } from '@/lib/utils';

const iconMap: Record<string, LucideIcon> = {
    Rocket,
    Album,
    Library,
    Users,
    UserPlus,
    Download,
    LayoutGrid,
    Award, // Fallback
};

const AchievementIcon = ({ name, className }: { name: string, className?: string }) => {
    const Icon = iconMap[name] || Award;
    return <Icon className={className} />;
};

const FriendActionButton = ({ status, onAction }: { status: FriendshipStatus; onAction: () => void }) => {
    const { playSound } = useSound();
    
    const handleClick = () => {
        playSound('select');
        onAction();
    };

    switch (status) {
        case 'not_friends':
            return <Button variant="outline" size="sm" onClick={handleClick}><UserPlus className="mr-2 h-4 w-4" /> Add Friend</Button>;
        case 'pending_sent':
            return <Button variant="outline" size="sm" disabled><Clock className="mr-2 h-4 w-4" /> Request Sent</Button>;
        case 'pending_received':
             return <Button variant="outline" size="sm" onClick={handleClick}><UserCheck className="mr-2 h-4 w-4" /> Accept Request</Button>;
        case 'friends':
            return <Button variant="outline" size="sm" disabled><UserCheck className="mr-2 h-4 w-4" /> Friends</Button>;
        case 'self':
        default:
            return null;
    }
};

export default function SocialProfilePage() {
    const params = useParams();
    const router = useRouter();
    const pageRef = useRef<HTMLDivElement>(null);
    const userId = typeof params.userId === 'string' ? Number(params.userId) : null;
    
    const [profile, setProfile] = useState<SocialProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentSocialUserId, setCurrentSocialUserId] = useState<number | null>(null);
    const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus | null>(null);

    const { toast } = useToast();
    useBackNavigation('/dashboard/social');
    useGridNavigation({ gridRef: pageRef });
    const { setHints } = useHints();
    const { playSound } = useSound();

    useEffect(() => {
        setHints([
            { key: '↕↔', action: 'Navigate' },
            { key: 'A', action: 'Select' },
            { key: 'B', action: 'Back' },
        ]);
        if (!isLoading) {
             pageRef.current?.querySelector('button')?.focus();
        }
    }, [setHints, isLoading]);

    useEffect(() => {
        try {
            const userJson = localStorage.getItem('macro-social-user');
            if (userJson) {
                setCurrentSocialUserId(JSON.parse(userJson).id);
            }
        } catch (e) {
            console.error("Failed to parse social user from localStorage", e);
        }
    }, []);

    const fetchProfileData = useCallback(async () => {
        if (!userId) {
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        const profileData = await getSocialProfile(userId);
        setProfile(profileData);
        
        if (currentSocialUserId) {
            const status = await getFriendshipStatus(currentSocialUserId, userId);
            setFriendshipStatus(status);
        }
        
        setIsLoading(false);
    }, [userId, currentSocialUserId]);

    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]);

    const handleFriendAction = async () => {
        if (!currentSocialUserId || !userId || !friendshipStatus) return;

        let result;
        if (friendshipStatus === 'not_friends') {
            result = await sendFriendRequest(currentSocialUserId, userId);
        } else if (friendshipStatus === 'pending_received') {
            result = await respondToFriendRequest(userId, currentSocialUserId, 'accept');
        } else {
            return;
        }

        toast({
            title: result.success ? "Success" : "Error",
            description: result.message,
            variant: result.success ? "default" : "destructive",
        });

        if (result.success) {
            fetchProfileData();
            if (result.newAchievements && result.newAchievements.length > 0) {
                 toast({
                    title: "Achievement Unlocked!",
                    description: `You've earned: ${result.newAchievements.join(', ')}`,
                    action: <Award className="h-6 w-6 text-yellow-400" />,
                });
            }
        }
    };
    
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
        <div ref={pageRef} className="animate-fade-in">
            <div className="mb-4 flex items-center justify-between">
                 <Button variant="outline" size="sm" onClick={() => router.back()} >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Social Hub
                </Button>
                {friendshipStatus && <FriendActionButton status={friendshipStatus} onAction={handleFriendAction} />}
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
                            <TabsTrigger value="achievements">Achievements ({profile.achievements.filter(a => a.unlocked_at).length} / {profile.achievements.length})</TabsTrigger>
                            <TabsTrigger value="friends">Friends ({profile.friends.length})</TabsTrigger>
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
                                                <div key={ach.id} className={cn("flex items-start gap-4 p-4 rounded-lg bg-background/50 transition-all", !ach.unlocked_at && "opacity-40 grayscale")}>
                                                    <AchievementIcon name={ach.icon} className={cn("h-8 w-8 text-primary mt-1 flex-shrink-0", !ach.unlocked_at && "text-muted-foreground")} />
                                                    <div>
                                                        <p className="font-bold">{ach.name}</p>
                                                        <p className="text-sm text-muted-foreground">{ach.description}</p>
                                                        {ach.unlocked_at ? (
                                                            <p className="text-xs text-muted-foreground/70 mt-1">
                                                                Unlocked on {new Date(ach.unlocked_at).toLocaleDateString()}
                                                            </p>
                                                        ) : (
                                                            <p className="text-xs text-muted-foreground/70 mt-1">Locked</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-32 text-muted-foreground">
                                            <p>No achievements defined yet.</p>
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
                                <CardContent>
                                     {profile.friends.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            {profile.friends.map((friend) => (
                                                <Button key={friend.id} variant="outline" asChild className="justify-start">
                                                    <Link href={`/dashboard/social/${friend.id}`}>
                                                        <Avatar className="w-6 h-6 mr-3">
                                                            <AvatarImage />
                                                            <AvatarFallback>{friend.username.substring(0,1).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        {friend.username}
                                                    </Link>
                                                </Button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-32 text-muted-foreground">
                                            <p>This user hasn't added any friends yet.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
