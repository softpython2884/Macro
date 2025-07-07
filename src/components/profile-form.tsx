'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import type { User } from '@/lib/data';
import { ALL_APPS, INITIAL_GAMES } from '@/lib/data';
import { useUser } from '@/context/UserContext';
import { ScrollArea } from './ui/scroll-area';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  avatar: z.string().url('Must be a valid URL.').optional().or(z.literal('')),
  pin: z.string().length(4, 'PIN must be 4 digits.').optional().or(z.literal('')),
  permissions: z.object({
    apps: z.array(z.string()),
    games: z.array(z.string()),
  }),
});

interface ProfileFormProps {
  userToEdit?: User | null;
  onFinished: () => void;
}

export const ProfileForm = ({ userToEdit, onFinished }: ProfileFormProps) => {
  const { addUser, updateUser } = useUser();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: userToEdit?.name || '',
      avatar: userToEdit?.avatar || '',
      pin: userToEdit?.pin || '',
      permissions: {
        apps: userToEdit?.permissions.apps || [],
        games: userToEdit?.permissions.games || [],
      },
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const userData = {
        name: values.name,
        avatar: values.avatar || 'https://icon-library.com/images/netflix-icon-black/netflix-icon-black-19.jpg',
        pin: values.pin,
        permissions: values.permissions,
    };

    if (userToEdit) {
      updateUser({ ...userData, id: userToEdit.id });
    } else {
      addUser(userData as Omit<User, 'id'>);
    }
    onFinished();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    {INITIAL_GAMES.map((game) => (
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
                    ))}
                    </ScrollArea>
                    <FormMessage />
                </FormItem>
            )} />
        </div>

        <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onFinished}>Cancel</Button>
            <Button type="submit">{userToEdit ? 'Save Changes' : 'Create Profile'}</Button>
        </div>
      </form>
    </Form>
  );
};