import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function SocialPage() {
  return (
    <div className="flex flex-1 items-center justify-center animate-fade-in">
        <Card className="w-full max-w-2xl text-center">
            <CardHeader>
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                    <Users className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="mt-4">Macro Social Hub</CardTitle>
                <CardDescription>
                    Connect with others, track achievements, and show off your stats.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    This feature is under construction. Authentication and profile creation coming soon!
                </p>
            </CardContent>
        </Card>
    </div>
  );
}
