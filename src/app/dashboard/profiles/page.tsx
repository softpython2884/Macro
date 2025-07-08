'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React, { useRef, useEffect, useState } from 'react';
import { useHints } from '@/context/HintContext';
import { useGridNavigation } from "@/hooks/use-grid-navigation";
import { useBackNavigation } from "@/hooks/use-back-navigation";
import { useUser } from "@/context/UserContext";
import type { User } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, Edit, LogIn, KeyRound, LogOut } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PinInputPad } from "@/components/pin-input";
import { useRouter } from "next/navigation";
import { useSound } from "@/context/SoundContext";
import Link from "next/link";

export default function ProfilesPage() {
  const { setHints } = useHints();
  const gridRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { users, currentUser, login, logout, deleteUser } = useUser();
  const { playSound } = useSound();

  const [userToSwitch, setUserToSwitch] = useState<User | null>(null);
  const [showPinPad, setShowPinPad] = useState(false);
  const [pinError, setPinError] = useState(false);

  useGridNavigation({ gridRef });
  useBackNavigation('/dashboard');

  useEffect(() => {
    setHints([
      { key: '↕↔', action: 'Navigate Cards' },
      { key: 'A', action: 'Interact' },
      { key: 'B', action: 'Back' },
    ]);
    const firstElement = gridRef.current?.querySelector('button, a') as HTMLElement;
    firstElement?.focus();
    
    return () => setHints([]);
  }, [setHints]);

  const handleSwitchProfile = (user: User) => {
    playSound('select');
    if (user.pin) {
      setUserToSwitch(user);
      setShowPinPad(true);
    } else {
      if (login(user)) {
        router.push('/dashboard');
      }
    }
  };

  const handlePinComplete = (pin: string) => {
    if (userToSwitch) {
      if (login(userToSwitch, pin)) {
        playSound('select');
        setShowPinPad(false);
        setUserToSwitch(null);
        setPinError(false);
        router.push('/dashboard');
      } else {
        playSound('error');
        setPinError(true);
      }
    }
  };

  const handleCancelPin = () => {
    playSound('back');
    setShowPinPad(false);
    setUserToSwitch(null);
    setPinError(false);
    const firstElement = gridRef.current?.querySelector('button, a') as HTMLElement;
    firstElement?.focus();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-glow">Manage Profiles</h2>
          <p className="text-muted-foreground mt-2">Add, edit, or switch profiles.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button onClick={() => { playSound('select'); logout(); }} variant="outline">
                <LogOut className="mr-2 h-4 w-4" /> Change User
            </Button>
            <Button asChild>
                <Link href="/dashboard/profiles/new" onClick={() => playSound('select')}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Profile
                </Link>
            </Button>
        </div>
      </div>

      <div ref={gridRef} className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {users.map(user => (
          <Card key={user.id} className="bg-black/20 backdrop-blur-lg border border-white/10 hover:border-primary focus-within:border-primary focus-within:ring-2 focus-within:ring-primary transition-all duration-300 ease-in-out transform hover:scale-105 focus-within:scale-105 h-full flex flex-col group">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="text-2xl">{user.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                        {user.name}
                        {user.pin && <KeyRound className="w-4 h-4 text-muted-foreground" />}
                    </CardTitle>
                    <CardDescription>{user.id === currentUser?.id ? 'Currently Active' : 'Inactive'}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow flex items-end justify-between">
                <div className="flex gap-2">
                    <Button asChild variant="outline" size="icon" aria-label={`Edit ${user.name}`}>
                      <Link href={`/dashboard/profiles/${user.id}/edit`} onClick={() => playSound('select')}>
                          <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" aria-label={`Delete ${user.name}`} disabled={users.length <= 1} onClick={() => playSound('select')}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete the profile for "{user.name}". This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => playSound('back')}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => { playSound('select'); deleteUser(user.id); }}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
                <Button onClick={() => handleSwitchProfile(user)} disabled={user.id === currentUser?.id} aria-label={`Switch to ${user.name}`}>
                    <LogIn className="mr-2 h-4 w-4" /> Switch
                </Button>
              </CardContent>
            </Card>
        ))}
      </div>

      <Dialog open={showPinPad} onOpenChange={(isOpen) => { if(!isOpen) handleCancelPin(); }}>
        <DialogContent className="bg-card/90 backdrop-blur-lg max-w-sm">
          <DialogHeader>
            <DialogTitle>Enter PIN for {userToSwitch?.name}</DialogTitle>
            <DialogDescription>
              This profile is protected. Please enter the 4-digit PIN.
            </DialogDescription>
          </DialogHeader>
          <PinInputPad onPinComplete={handlePinComplete} onCancel={handleCancelPin} showError={pinError} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
