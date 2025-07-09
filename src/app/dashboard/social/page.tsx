
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { loginUser, registerUser } from "@/lib/social-service";

type SocialUser = {
  id: number;
  username: string;
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
        <Card className="w-full max-w-2xl text-center">
          <CardHeader>
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
              <Users className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="mt-4">Welcome, {socialUser.username}!</CardTitle>
            <CardDescription>
              You are now connected to the Macro Social Hub.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Your profile, achievements, and activity will be available here soon.
            </p>
            <Button onClick={handleLogout}>Log Out</Button>
          </CardContent>
        </Card>
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
