
'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { getSocialProfile, type SocialProfile } from '@/lib/social-service';
import { useBackNavigation } from '@/hooks/use-back-navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Gamepad2, Award, Tv, Loader2 } from 'lucide-react';

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
            <div className="mb-4">
                 <Button variant="outline" size="sm" onClick={() => router.back()} >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Social Hub
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
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Award className="h-6 w-6" /> Achievements</CardTitle>
                            <CardDescription>A collection of this user's accomplishments across Macro.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center h-32 text-muted-foreground">
                                <p>Achievements feature coming soon!</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
