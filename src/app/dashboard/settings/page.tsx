
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
import { PlusCircle, Trash2, Download } from "lucide-react";
import React from 'react';
import { useHints } from '@/context/HintContext';
import { useBackNavigation } from "@/hooks/use-back-navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { scanAndInstallGames } from "@/lib/installer";

const SETTINGS_KEY = 'macro-settings';

const formSchema = z.object({
  games: z.array(z.object({
    value: z.string().min(1, "Directory path cannot be empty."),
  })).min(1, "At least one game directory is required."),
  plugins: z.array(z.object({
    value: z.string().min(1, "Directory path cannot be empty."),
  })).optional(),
  browser: z.string().optional(),
  moonlightPath: z.string().optional(),
  downloadsPath: z.string().optional(),
  localGamesPath: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof formSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const { setHints } = useHints();
  const [isScanning, setIsScanning] = React.useState(false);
  useBackNavigation('/dashboard');
  
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      games: [{ value: "" }],
      plugins: [{ value: "" }],
      browser: "chrome.exe",
      moonlightPath: "",
      downloadsPath: "",
      localGamesPath: ""
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

  const { fields: gameFields, append: appendGame, remove: removeGame } = useFieldArray({
    control: form.control,
    name: "games"
  });

  const { fields: pluginFields, append: appendPlugin, remove: removePlugin } = useFieldArray({
    control: form.control,
    name: "plugins"
  });

  function onSubmit(values: SettingsFormValues) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(values));
      toast({
        title: "Settings saved!",
        description: "Your directory configurations have been updated.",
      });
      window.dispatchEvent(new Event('settings-updated'));
    } catch (error) {
       toast({
        title: "Error saving settings",
        description: "Could not save settings to local storage.",
        variant: "destructive"
      });
    }
  }

  const handleScan = async () => {
    setIsScanning(true);
    const values = form.getValues();
    const { downloadsPath, localGamesPath } = values;

    if (!downloadsPath || !localGamesPath) {
        toast({
            title: "Paths not configured",
            description: "Please set both Downloads and Local Games directories before scanning.",
            variant: "destructive",
        });
        setIsScanning(false);
        return;
    }

    try {
        const result = await scanAndInstallGames(downloadsPath, localGamesPath);
        
        toast({
            title: result.success ? "Scan Complete" : "Scan Failed",
            description: result.message,
            variant: result.success ? "default" : "destructive",
        });

        if (result.success && result.gamesInstalled > 0) {
            // Re-using this event is fine, as it triggers a game rescan in the context
            window.dispatchEvent(new Event('settings-updated'));
        }
    } catch (error) {
         toast({
            title: "Error during scan",
            description: "An unexpected error occurred. Check the server console for details.",
            variant: "destructive",
        });
    } finally {
        setIsScanning(false);
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Configure the directories for your games and plugins. These paths are local to the machine running the server.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-8">
                <div>
                  <FormLabel>Game Directories</FormLabel>
                  <FormDescription className="mb-4">
                    Add the folders where your games are installed. Macro will scan each folder for sub-directories, treating each as a separate game.
                  </FormDescription>
                  <div className="space-y-4">
                    {gameFields.map((field, index) => (
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
                              {gameFields.length > 1 && (
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => removeGame(index)}
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
                    onClick={() => appendGame({ value: "" })}
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

                <div>
                  <FormLabel>Plugin Directories</FormLabel>
                  <FormDescription className="mb-4">
                    (Future) Add folders where custom plugins are stored.
                  </FormDescription>
                  <div className="space-y-4">
                    {pluginFields.map((field, index) => (
                      <FormField
                        key={field.id}
                        control={form.control}
                        name={`plugins.${index}.value`}
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-2">
                              <FormControl>
                                <Input placeholder="C:/Macro/Plugins" {...field} />
                              </FormControl>
                              {pluginFields.length > 1 && (
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => removePlugin(index)}
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
                    onClick={() => appendPlugin({ value: "" })}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Directory
                  </Button>
                </div>

                <FormField
                  control={form.control}
                  name="downloadsPath"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Downloads Directory</FormLabel>
                      <FormControl>
                        <Input placeholder="C:/Users/YourUser/Downloads" {...field} />
                      </FormControl>
                      <FormDescription>
                        The folder to monitor for new game archives (.zip files).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="localGamesPath"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local Games Extraction Path</FormLabel>
                      <FormControl>
                        <Input placeholder="C:/Games/Local" {...field} />
                      </FormControl>
                      <FormDescription>
                        The folder where downloaded games will be extracted. Add this path to "Game Directories" to include them in your library.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
              </div>

              <div className="flex items-center gap-4">
                <Button type="submit">Save Configuration</Button>
                <Button
                    type="button"
                    onClick={handleScan}
                    disabled={isScanning}
                    variant="outline"
                >
                    <Download className="mr-2 h-4 w-4" />
                    {isScanning ? 'Scanning...' : 'Scan Downloads for New Games'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
