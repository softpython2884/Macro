
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

const formSchema = z.object({
  games: z.array(z.object({
    value: z.string().min(1, "Directory path cannot be empty."),
  })).min(1, "At least one game directory is required."),
  media: z.string().min(1, "Media directory is required."),
  apps: z.string().min(1, "Application directory is required."),
  plugins: z.string().min(1, "Plugin directory is required."),
});

export default function SettingsPage() {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      games: [{ value: "" }],
      media: "",
      apps: "",
      plugins: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "games"
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
              <div>
                <FormLabel>Game Directories</FormLabel>
                <FormDescription className="mb-4">
                  Add the folders where your games are installed.
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
                              <Input placeholder="/path/to/your/games" {...field} />
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
