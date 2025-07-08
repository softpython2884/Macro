
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import type { User } from '@/lib/data';
import { ALL_APPS } from '@/lib/data';
import { useUser } from '@/context/UserContext';
import { ScrollArea } from './ui/scroll-area';
import { useGames } from '@/context/GameContext';
import React from 'react';
import { useSound } from '@/context/SoundContext';
import { Switch } from './ui/switch';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  avatar: z.string().url('Must be a valid URL.').optional().or(z.literal('')),
  pin: z.string().length(4, 'PIN must be 4 digits.').optional().or(z.literal('')),
  permissions: z.object({
    apps: z.array(z.string()),
    games: z.array(z.string()),
    nsfwEnabled: z.boolean().default(true),
    prioritizeNsfw: z.boolean().default(false),
  }),
});

interface ProfileFormProps {
  userToEdit?: User | null;
  onFinished: () => void;
}

export const ProfileForm = ({ userToEdit, onFinished }: ProfileFormProps) => {
  const { addUser, updateUser } = useUser();
  const { allScannedGames } = useGames();
  const { playSound } = useSound();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: userToEdit
      ? userToEdit
      : {
          name: '',
          avatar: '',
          pin: '',
          permissions: {
            apps: ALL_APPS.map((app) => app.id),
            games: [], // Populated by useEffect below
            nsfwEnabled: true,
            prioritizeNsfw: false,
          },
        },
  });

  // For new users, default to all games being enabled when the component mounts
  // and the game list is available. For existing users, this does nothing,
  // preserving their saved permissions.
  React.useEffect(() => {
    if (!userToEdit && allScannedGames.length > 0) {
      form.setValue('permissions.games', allScannedGames.map(game => game.id));
    }
  }, [allScannedGames, userToEdit, form]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    const userData: Omit<User, 'id'> = {
        name: values.name,
        avatar: values.avatar || 'https://icon-library.com/images/netflix-icon-black/netflix-icon-black-19.jpg',
        pin: values.pin,
        permissions: values.permissions,
    };

    if (userToEdit) {
      updateUser({ ...userData, id: userToEdit.id });
    } else {
      addUser(userData);
    }
    playSound('select');
    onFinished();
  }

  const handleCancel = () => {
    playSound('back');
    onFinished();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex flex-col h-full">
        <ScrollArea className="pr-4 flex-grow -mr-4">
            <div className="space-y-6">
                <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                    <FormLabel>Profile Name</FormLabel>
                    <FormControl><Input placeholder="e.g., Galaxy Wanderer" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )} />
                <FormField control={form.control} name="avatar" render={({ field }) => (
                <FormItem>
                    <FormLabel>Avatar URL</FormLabel>
                    <FormControl><Input placeholder="https://example.com/avatar.png" {...field} /></FormControl>
                    <FormDescription>Leave blank to use the default avatar.</FormDescription>
                    <FormMessage />
                </FormItem>
                )} />
                <FormField control={form.control} name="pin" render={({ field }) => (
                <FormItem>
                    <FormLabel>4-Digit PIN</FormLabel>
                    <FormControl><Input type="password" maxLength={4} placeholder="e.g., 1234" {...field} /></FormControl>
                    <FormDescription>Leave blank for no PIN protection.</FormDescription>
                    <FormMessage />
                </FormItem>
                )} />
                
                <div className="grid grid-cols-2 gap-6">
                    <FormField control={form.control} name="permissions.apps" render={() => (
                        <FormItem>
                            <div className="mb-4">
                                <FormLabel>App Permissions</FormLabel>
                                <FormDescription>Select the apps this profile can access.</FormDescription>
                            </div>
                            <ScrollArea className="h-40 rounded-md border p-4">
                            {ALL_APPS.map((app) => (
                                <FormField key={app.id} control={form.control} name="permissions.apps" render={({ field }) => (
                                    <FormItem key={app.id} className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                        checked={field.value?.includes(app.id)}
                                        onCheckedChange={(checked) => {
                                            return checked
                                            ? field.onChange([...field.value, app.id])
                                            : field.onChange(field.value?.filter((value) => value !== app.id));
                                        }}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-normal">{app.name}</FormLabel>
                                    </FormItem>
                                )} />
                            ))}
                            </ScrollArea>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <FormField control={form.control} name="permissions.games" render={() => (
                        <FormItem>
                            <div className="mb-4">
                                <FormLabel>Game Permissions</FormLabel>
                                <FormDescription>Select the games this profile can access.</FormDescription>
                            </div>
                            <ScrollArea className="h-40 rounded-md border p-4">
                            {allScannedGames.length > 0 ? (
                            allScannedGames.map((game) => (
                                <FormField key={game.id} control={form.control} name="permissions.games" render={({ field }) => (
                                    <FormItem key={game.id} className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                        checked={field.value?.includes(game.id)}
                                        onCheckedChange={(checked) => {
                                            return checked
                                            ? field.onChange([...field.value, game.id])
                                            : field.onChange(field.value?.filter((value) => value !== game.id));
                                        }}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-normal">{game.name}</FormLabel>
                                    </FormItem>
                                )} />
                            ))
                            ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No games found. Configure directories in settings.</p>
                            )}
                            </ScrollArea>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                <div className="space-y-4 pt-6 mt-6 border-t">
                <h3 className="text-lg font-medium">Content Preferences</h3>
                <FormField
                    control={form.control}
                    name="permissions.nsfwEnabled"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background/50">
                            <div className="space-y-0.5">
                                <FormLabel>Enable Adult Content (NSFW)</FormLabel>
                                <FormDescription>Allow fetching images and content marked as not safe for work.</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="permissions.prioritizeNsfw"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background/50">
                            <div className="space-y-0.5">
                                <FormLabel>Prioritize NSFW Images</FormLabel>
                                <FormDescription>If available, show NSFW images first.</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />
                </div>
            </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 flex-shrink-0">
            <Button type="button" variant="ghost" onClick={handleCancel}>Cancel</Button>
            <Button type="submit">{userToEdit ? 'Save Changes' : 'Create Profile'}</Button>
        </div>
      </form>
    </Form>
  );
};
