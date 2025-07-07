
"use client";

import { useForm } from "react-hook-form";
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

const formSchema = z.object({
  games: z.string().min(1, "Game directory is required."),
  media: z.string().min(1, "Media directory is required."),
  apps: z.string().min(1, "Application directory is required."),
  plugins: z.string().min(1, "Plugin directory is required."),
});

export default function SettingsPage() {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      games: "",
      media: "",
      apps: "",
      plugins: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast({
      title: "Settings saved!",
      description: "Your directory configurations have been updated.",
    });
  }

  return (
    <div className="animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Configure the directories for your games, media, applications, and plugins.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="games"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Game Directory</FormLabel>
                    <FormControl>
                      <Input placeholder="/path/to/your/games" {...field} />
                    </FormControl>
                    <FormDescription>
                      The folder where your games are installed.
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
                      The folder where your movies and shows are stored.
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
                      The folder for other applications.
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
                      The folder for Macro plugins.
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
