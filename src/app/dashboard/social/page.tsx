
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2, LogOut, RefreshCw, User as UserIcon, UserCheck, UserX } from "lucide-react";
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
    getSocialActivities, 
    loginUser, 
    registerUser, 
    type SocialActivity, 
    getPendingRequests,
    respondToFriendRequest,
    type PendingRequest
} from "@/lib/social-service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSound } from "@/context/SoundContext";

type SocialUser = {
  id: number;
  username: string;
};

const FriendRequests = ({ userId, onAction }: { userId: number, onAction: () => void }) => {
    const [requests, setRequests] = useState<PendingRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchRequests = useCallback(async () => {
        setIsLoading(true);
        const requestData = await getPendingRequests(userId);
        setRequests(requestData);
        setIsLoading(false);
    }, [userId]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);
    
    const handleResponse = async (requesterId: number, action: 'accept' | 'decline') => {
        const result = await respondToFriendRequest(userId, requesterId, action);
        toast({
            title: result.success ? "Success" : "Error",
            description: result.message,
            variant: result.success ? "default" : "destructive",
        });
        if (result.success) {
            onAction(); // Triggers a re-fetch in the parent
        }
    };

    if (isLoading) return <Skeleton className="h-24 w-full" />;
    if (requests.length === 0) return null;

    return (
        <Card className="mb-4 bg-background/50">
            <CardHeader>
                <CardTitle>Friend Requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {requests.map(req => (
                    <div key={req.id} className="flex items-center justify-between p-2 rounded-md hover:bg-white/5">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarImage />
                                <AvatarFallback>{req.username.substring(0, 1).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span>{req.username}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button size="icon" variant="outline" className="h-8 w-8 bg-green-500/10 text-green-400 hover:bg-green-500/20 hover:text-green-300" onClick={() => handleResponse(req.id, 'accept')}>
                                <UserCheck className="h-4 w-4" />
                            </Button>
                             <Button size="icon" variant="outline" className="h-8 w-8 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300" onClick={() => handleResponse(req.id, 'decline')}>
                                <UserX className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};

const SocialHub = ({ user, onLogout }: { user: SocialUser, onLogout: () => void }) => {
  const [activities, setActivities] = useState<SocialActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { playSound } = useSound();

  const fetchActivities = useCallback(async () => {
    setIsLoading(true);
    const activityData = await getSocialActivities();
    // Filter out the current user from the main activity feed
    setActivities(activityData.filter(act => act.user_id !== user.id));
    setIsLoading(false);
  }, [user.id]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const renderStatus = (activity: SocialActivity) => {
    if (activity.activity_status === 'playing' && activity.activity_details) {
      return (
        <span className="flex items-center gap-2 text-primary">
          <Gamepad2 className="h-4 w-4" />
          Playing {activity.activity_details}
        </span>
      );
    }
    return <span className="text-muted-foreground">Online</span>;
  };

  return (
    <Card className="w-full max-w-2xl animate-fade-in">
        <CardHeader className="flex flex-row justify-between items-center">
            <div>
                <CardTitle>Macro Social Hub</CardTitle>
                <CardDescription>Welcome, {user.username}! See what others are up to.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                 <Button variant="ghost" size="icon" onClick={fetchActivities} disabled={isLoading}>
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                </Button>
                <Button onClick={onLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            <FriendRequests userId={user.id} onAction={fetchActivities} />

            <ScrollArea className="h-96 pr-4">
                <div className="space-y-2">
                    {isLoading 
                        ? (Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                </div>
                                <Skeleton className="h-4 w-20" />
                            </div>
                        )))
                        : activities.length > 0 ? (
                        activities.map(activity => (
                             <Link key={activity.user_id} href={`/dashboard/social/${activity.user_id}`} onClick={() => playSound('select')} className="block rounded-lg transition-colors hover:bg-white/5 focus:bg-white/10 focus:outline-none">
                                <div className="flex items-center justify-between p-3">
                                    <div className="flex items-center gap-4">
                                        <Avatar>
                                            <AvatarImage />
                                            <AvatarFallback>{activity.username.substring(0, 1).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{activity.username}</p>
                                            <div className="text-sm">
                                                {renderStatus(activity)}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(activity.updated_at).toLocaleTimeString()}
                                    </p>
                                </div>
                             </Link>
                        ))
                    ) : (
                        <div className="text-center text-muted-foreground py-12">
                            <p>It's quiet in here... for now.</p>
                            <p className="text-sm">Why not invite some friends?</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </CardContent>
    </Card>
  );
};


export default function SocialPage() {
  const [socialUser, setSocialUser] = useState<SocialUser | null>(null);

  // Sign Up state
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');

  // Sign In state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in from a previous session
    try {
      const storedUser = localStorage.getItem('macro-social-user');
      if (storedUser) {
        setSocialUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to parse social user from localStorage", e);
    }
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await registerUser({
      username: signUpUsername,
      email: signUpEmail,
      password: signUpPassword,
    });
    toast({
      title: result.success ? "Account Created!" : "Registration Failed",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await loginUser({ email: signInEmail, password: signInPassword });
    toast({
      title: result.success ? "Login Successful!" : "Login Failed",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });
    if (result.success && result.user) {
      const userToStore = { id: result.user.id, username: result.user.username };
      setSocialUser(userToStore);
      localStorage.setItem('macro-social-user', JSON.stringify(userToStore));
    }
  };

  const handleLogout = () => {
    setSocialUser(null);
    localStorage.removeItem('macro-social-user');
    toast({ title: "Logged Out", description: "You have been logged out from the social hub." });
  };

  if (socialUser) {
    return (
      <div className="flex flex-1 items-center justify-center animate-fade-in">
        <SocialHub user={socialUser} onLogout={handleLogout} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center animate-fade-in">
      <Tabs defaultValue="sign-in" className="w-[400px]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sign-in">Sign In</TabsTrigger>
          <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="sign-in">
          <Card>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>Access your social profile to track stats and achievements.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input id="signin-email" type="email" placeholder="m@example.com" value={signInEmail} onChange={e => setSignInEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input id="signin-password" type="password" value={signInPassword} onChange={e => setSignInPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full">Sign In</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sign-up">
          <Card>
            <CardHeader>
              <CardTitle>Sign Up</CardTitle>
              <CardDescription>Create a new social profile to join the community.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="signup-username">Username</Label>
                    <Input id="signup-username" type="text" placeholder="Your Gamer Tag" value={signUpUsername} onChange={e => setSignUpUsername(e.target.value)} required />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" placeholder="m@example.com" value={signUpEmail} onChange={e => setSignUpEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" type="password" value={signUpPassword} onChange={e => setSignUpPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full">Create Account</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    