
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Puzzle } from "lucide-react";

export default function PluginsPage() {
  return (
    <div className="flex flex-1 items-center justify-center animate-fade-in">
        <Card className="w-full max-w-2xl text-center">
            <CardHeader>
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                    <Puzzle className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="mt-4">Plugins & Add-ons</CardTitle>
                <CardDescription>
                    This is where you'll manage custom plugins to extend Macro's functionality.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    This feature is under construction. Stay tuned!
                </p>
            </CardContent>
        </Card>
    </div>
  );
}
