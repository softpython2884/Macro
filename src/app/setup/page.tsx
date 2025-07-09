'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { completeSetup } from './actions';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle, User, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSound } from '@/context/SoundContext';

const adminSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  pin: z.string().length(4, 'PIN must be 4 digits.').optional().or(z.literal('')),
});

const settingsSchema = z.object({
  gamesDirectory: z.string().min(1, "Game directory is required."),
});

type AdminFormValues = z.infer<typeof adminSchema>;
type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SetupPage() {
  const [step, setStep] = useState(0);
  const { users, updateUser } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const { playSound } = useSound();

  const adminForm = useForm<AdminFormValues>({
    resolver: zodResolver(adminSchema),
    defaultValues: { name: 'Admin', pin: '' },
  });

  const settingsForm = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { gamesDirectory: '' },
  });

  const nextStep = () => {
    playSound('select');
    setStep((s) => s + 1);
  };
  const prevStep = () => {
    playSound('back');
    setStep((s) => s - 1);
  };

  const onAdminSubmit = (values: AdminFormValues) => {
    const adminUser = users.find(u => u.name === 'Admin' || u.id === 'user-1');
    if (adminUser) {
      updateUser({
        ...adminUser,
        name: values.name,
        pin: values.pin,
      });
      toast({ title: 'Admin Account Updated', description: 'Proceeding to the next step.' });
      nextStep();
    } else {
      toast({ title: 'Error', description: 'Could not find the default Admin user to update.', variant: 'destructive' });
    }
  };

  const onSettingsSubmit = (values: SettingsFormValues) => {
    try {
      const macroSettings = {
        games: [{ value: values.gamesDirectory }],
        browser: 'chrome.exe'
      };
      localStorage.setItem('macro-settings', JSON.stringify(macroSettings));
      toast({ title: 'Settings Saved', description: 'Your game directory has been configured.' });
      nextStep();
    } catch (e) {
      toast({ title: 'Error', description: 'Could not save settings.', variant: 'destructive' });
    }
  };

  const onFinish = async () => {
    await completeSetup();
    toast({ title: 'Setup Complete!', description: 'Welcome to Macro. Redirecting to login...' });
    router.push('/login');
  };
  
  const steps = [
    { name: 'Welcome', icon: <div className="h-10 w-10 text-lg font-bold">M</div> },
    { name: 'Admin Account', icon: <User /> },
    { name: 'Core Settings', icon: <Settings /> },
    { name: 'Finished', icon: <CheckCircle /> },
  ];

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background text-foreground animate-fade-in">
        
        {step === 0 && (
            <div className="fixed inset-0 z-0">
                <video autoPlay muted loop playsInline className="w-full h-full object-cover" src="/intro.mp4">
                    Your browser does not support the video tag.
                </video>
                 <div className="absolute inset-0 bg-black/50" />
            </div>
        )}

        <div className="relative z-10 w-full max-w-2xl px-4">
            <Card className="bg-background/80 backdrop-blur-lg border-white/10">
                <CardHeader>
                    <div className="flex justify-center items-center gap-4 mb-4">
                        {steps.map((s, index) => (
                           <React.Fragment key={s.name}>
                             <div className="flex flex-col items-center gap-2">
                                <div className={cn(
                                    "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300",
                                    step > index ? 'bg-primary border-primary text-primary-foreground' :
                                    step === index ? 'border-primary scale-110' : 'border-border bg-muted/50 text-muted-foreground'
                                )}>
                                    {s.icon}
                                </div>
                                <span className={cn(
                                    "text-xs transition-colors",
                                    step >= index ? 'text-foreground' : 'text-muted-foreground'
                                )}>{s.name}</span>
                            </div>
                            {index < steps.length - 1 && (
                                <div className={cn(
                                    "flex-1 h-0.5 mt-[-1.25rem] transition-colors duration-500",
                                     step > index ? 'bg-primary' : 'bg-border'
                                )} />
                            )}
                           </React.Fragment>
                        ))}
                    </div>
                </CardHeader>
                <CardContent>
                    {step === 0 && (
                        <div className="text-center space-y-4">
                            <h2 className="text-4xl font-bold text-glow">Welcome to Macro</h2>
                            <p className="text-muted-foreground">Your new personal application and media hub. Let's get you set up.</p>
                            <Button size="lg" onClick={nextStep} className="mt-4">
                                Get Started <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </div>
                    )}
                    {step === 1 && (
                         <div className="animate-fade-in">
                            <CardTitle className="mb-2">Configure Admin Account</CardTitle>
                            <CardDescription className="mb-6">This is the main profile with full access. You can change this later.</CardDescription>
                            <Form {...adminForm}>
                                <form onSubmit={adminForm.handleSubmit(onAdminSubmit)} className="space-y-6">
                                    <FormField control={adminForm.control} name="name" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Admin Name</FormLabel>
                                            <FormControl><Input placeholder="Admin" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={adminForm.control} name="pin" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>4-Digit PIN (Optional)</FormLabel>
                                            <FormControl><Input type="password" maxLength={4} placeholder="e.g., 1234" {...field} /></FormControl>
                                            <FormDescription>Leave blank for no PIN.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <div className="flex justify-end gap-2 pt-4">
                                        <Button type="submit">Next</Button>
                                    </div>
                                </form>
                            </Form>
                         </div>
                    )}
                     {step === 2 && (
                         <div className="animate-fade-in">
                            <CardTitle className="mb-2">Core Settings</CardTitle>
                            <CardDescription className="mb-6">Tell Macro where to find your games. You can add more directories later in settings.</CardDescription>
                            <Form {...settingsForm}>
                                <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-6">
                                    <FormField control={settingsForm.control} name="gamesDirectory" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Main Game Directory</FormLabel>
                                            <FormControl><Input placeholder="C:\Games" {...field} /></FormControl>
                                            <FormDescription>Macro will scan this folder for sub-directories, treating each as a separate game.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <div className="flex justify-between gap-2 pt-4">
                                        <Button type="button" variant="outline" onClick={prevStep}>Back</Button>
                                        <Button type="submit">Next</Button>
                                    </div>
                                </form>
                            </Form>
                         </div>
                    )}
                    {step === 3 && (
                        <div className="text-center space-y-4 animate-fade-in">
                            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                            <h2 className="text-4xl font-bold">Setup Complete!</h2>
                            <p className="text-muted-foreground">Macro is now configured and ready to go. Enjoy your new dashboard.</p>
                            <Button size="lg" onClick={onFinish} className="mt-4">
                                Launch Macro
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
