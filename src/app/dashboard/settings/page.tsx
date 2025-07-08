
"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash2 } from "lucide-react";
import React from 'react';
import { useHints } from '@/context/HintContext';
import { useBackNavigation } from "@/hooks/use-back-navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SETTINGS_KEY = 'macro-settings';

const formSchema = z.object({
  games: z.array(z.object({
    value: z.string().min(1, "Directory path cannot be empty."),
  })).min(1, "At least one game directory is required."),
  media: z.string().optional(),
  apps: z.string().optional(),
  plugins: z.string().optional(),
  browser: z.string().optional(),
  moonlightPath: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof formSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const { setHints } = useHints();
  useBackNavigation('/dashboard');
  
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      games: [{ value: "" }],
      media: "",
      apps: "",
      plugins: "",
      browser: "chrome.exe",
      moonlightPath: ""
    },
  });

  React.useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings) as SettingsFormValues;
        form.reset(parsedSettings);
      }
    } catch (error) {
        console.error("Failed to load settings from localStorage", error);
    }
  }, [form]);

  React.useEffect(() => {
    setHints([
      { key: '↕', action: 'Navigate' },
      { key: 'A', action: 'Interact' },
      { key: 'B', action: 'Back' },
      { key: 'Q', action: 'Prev Tab' },
      { key: 'E', action: 'Next Tab' },
    ]);
    return () => setHints([]);
  }, [setHints]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "games"
  });

  function onSubmit(values: SettingsFormValues) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(values));
      toast({
        title: "Settings saved!",
        description: "Your directory configurations have been updated.",
      });
      // Optionally, trigger a refresh of game data context if needed
      window.dispatchEvent(new Event('settings-updated'));
    } catch (error) {
       toast({
        title: "Error saving settings",
        description: "Could not save settings to local storage.",
        variant: "destructive"
      });
    }
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Configure the directories for your games, media, applications, and plugins. These paths are local to the machine running the server.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div>
                <FormLabel>Game Directories</FormLabel>
                <FormDescription className="mb-4">
                  Add the folders where your games are installed. Macro will scan each folder for sub-directories, treating each as a separate game.
                </FormDescription>
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <FormField
                      key={field.id}
                      control={form.control}
                      name={`games.${index}.value`}
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Input placeholder="C:/Games" {...field} />
                            </FormControl>
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => remove(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => append({ value: "" })}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Directory
                </Button>
                 <FormField
                    control={form.control}
                    name="games"
                    render={() => <FormMessage className="mt-2" />}
                  />
              </div>

               <FormField
                control={form.control}
                name="browser"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Browser</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a default browser for web apps" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="chrome.exe">Google Chrome</SelectItem>
                          <SelectItem value="msedge.exe">Microsoft Edge</SelectItem>
                          <SelectItem value="firefox.exe">Mozilla Firefox</SelectItem>
                        </SelectContent>
                      </Select>
                    <FormDescription>
                      This browser will be used to open web apps from the dashboard.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="moonlightPath"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moonlight Executable Path</FormLabel>
                    <FormControl>
                      <Input placeholder="C:/path/to/Moonlight.exe" {...field} />
                    </FormControl>
                    <FormDescription>
                      Provide the full path to the Moonlight executable if it's installed via a custom path.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="media"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Media Directory</FormLabel>
                    <FormControl>
                      <Input placeholder="/path/to/your/media" {...field} />
                    </FormControl>
                    <FormDescription>
                      The folder where your movies and shows are stored. (Not yet implemented)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="apps"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application Directory</FormLabel>
                    <FormControl>
                      <Input placeholder="/path/to/your/applications" {...field} />
                    </FormControl>
                    <FormDescription>
                      The folder for other applications. (Not yet implemented)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="plugins"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plugin Directory</FormLabel>
                    <FormControl>
                      <Input placeholder="/path/to/your/plugins" {...field} />
                    </FormControl>
                    <FormDescription>
                      The folder for Macro plugins. (Not yet implemented)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Save Configuration</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
