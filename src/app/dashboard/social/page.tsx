
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2, LogOut, Search, User as UserIcon, UserCheck, UserX, UserPlus, Clock, Loader2 } from "lucide-react";
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    getSocialProfile,
    loginUser, 
    registerUser, 
    type SocialProfile,
    getPendingRequests,
    respondToFriendRequest,
    type PendingRequest,
    searchUsers,
    type SearchedUser,
    sendFriendRequest,
    type SocialFriendWithActivity,
} from "@/lib/social-service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useSound } from "@/context/SoundContext";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";

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
            onAction(); 
        }
    };

    if (isLoading) return <Skeleton className="h-24 w-full" />;
    if (requests.length === 0) return null;

    return (
        <Card className="bg-background/50">
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

const FindFriends = ({ currentUser, onFriendRequestSent }: { currentUser: SocialUser, onFriendRequestSent: () => void }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSearch = async (e?: React.FormEvent) => {
        if(e) e.preventDefault();
        if (!searchQuery) return;
        setIsLoading(true);
        const results = await searchUsers(searchQuery, currentUser.id);
        setSearchResults(results);
        setIsLoading(false);
    };

    const handleAddFriend = async (addresseeId: number) => {
        const result = await sendFriendRequest(currentUser.id, addresseeId);
        toast({
            title: result.success ? "Success" : "Error",
            description: result.message,
            variant: result.success ? "default" : "destructive",
        });
        if (result.success) {
            handleSearch();
            onFriendRequestSent();
        }
    };
    
    const getButtonForStatus = (user: SearchedUser) => {
        switch (user.friendshipStatus) {
            case 'friends':
                return <Button size="sm" variant="outline" disabled><UserCheck className="mr-2 h-4 w-4" /> Friends</Button>;
            case 'pending_sent':
                return <Button size="sm" variant="outline" disabled><Clock className="mr-2 h-4 w-4" /> Sent</Button>;
            case 'pending_received':
                 return <Button size="sm" onClick={() => handleAddFriend(user.id)}><UserCheck className="mr-2 h-4 w-4" /> Accept</Button>;
            default:
                return <Button size="sm" onClick={() => handleAddFriend(user.id)}><UserPlus className="mr-2 h-4 w-4" /> Add</Button>;
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Find Friends</CardTitle>
                <CardDescription>Search for other users on Macro to connect with.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSearch} className="flex items-center gap-2 mb-4">
                    <Input 
                        placeholder="Search by username..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                        Search
                    </Button>
                </form>
                <ScrollArea className="h-40">
                    <div className="space-y-2 pr-4">
                        {isLoading && <Skeleton className="h-10 w-full" />}
                        {!isLoading && searchResults.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">Enter a username to search.</p>}
                        {!isLoading && searchResults.map(user => (
                             <div key={user.id} className="flex items-center justify-between p-2 rounded-md hover:bg-white/5">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage />
                                        <AvatarFallback>{user.username.substring(0, 1).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <span>{user.username}</span>
                                </div>
                                {getButtonForStatus(user)}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};

const SocialHub = ({ user, onLogout }: { user: SocialUser, onLogout: () => void }) => {
    const [profile, setProfile] = useState<SocialProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { playSound } = useSound();
    const router = useRouter();

    const fetchProfileData = useCallback(async () => {
        setIsLoading(true);
        const profileData = await getSocialProfile(user.id);
        setProfile(profileData);
        setIsLoading(false);
    }, [user.id]);

    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]);
    
    const renderStatus = (activity: SocialFriendWithActivity) => {
        if (activity.activity_status === 'playing' && activity.activity_details) {
          return (
            <span className="flex items-center gap-1 text-xs text-primary truncate">
              <Gamepad2 className="h-3 w-3" />
              {activity.activity_details}
            </span>
          );
        }
        return <span className="text-xs text-green-400">Online</span>;
    };

    if (isLoading || !profile) {
        return (
             <div className="flex h-[60vh] w-full flex-1 items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in">
            <aside className="lg:col-span-1 space-y-6">
                <Card className="text-center">
                    <CardHeader>
                        <Avatar className="w-20 h-20 mx-auto mb-2">
                            <AvatarImage />
                            <AvatarFallback className="text-3xl">{user.username.substring(0,1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <CardTitle>{user.username}</CardTitle>
                        <CardDescription>Your personal hub</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                        <Button asChild variant="secondary" className="w-full">
                           <Link href={`/dashboard/social/${user.id}`} onClick={() => playSound('select')}>
                                <UserIcon className="mr-2 h-4 w-4" /> View My Profile
                           </Link>
                        </Button>
                         <Button onClick={onLogout} className="w-full">
                            <LogOut className="mr-2 h-4 w-4" />
                            Log Out
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Friends ({profile.friends.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-64">
                            <div className="space-y-1 pr-2">
                                {profile.friends.length > 0 ? profile.friends.map(friend => (
                                    <Link key={friend.id} href={`/dashboard/social/${friend.id}`} className="block p-2 rounded-md transition-colors hover:bg-white/5 focus:bg-white/10 focus:outline-none">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage />
                                                <AvatarFallback>{friend.username.substring(0,1).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="overflow-hidden">
                                                <p className="font-semibold text-sm truncate">{friend.username}</p>
                                                {renderStatus(friend)}
                                            </div>
                                        </div>
                                    </Link>
                                )) : <p className="text-sm text-center text-muted-foreground py-8">Your friends list is empty. Find some friends!</p>}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </aside>

            <main className="lg:col-span-3 space-y-6">
                <FriendRequests userId={user.id} onAction={fetchProfileData} />
                <FindFriends currentUser={user} onFriendRequestSent={fetchProfileData} />
            </main>
        </div>
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
      <div className="flex flex-1 items-start justify-center animate-fade-in pt-8">
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
