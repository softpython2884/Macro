
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PlusCircle } from 'lucide-react';

const users = [
  { id: "user1", name: "Galaxy Wanderer", email: "wanderer@space.com", hint: "astronaut helmet" },
  { id: "user2", name: "Starlight Seeker", email: "seeker@stars.com", hint: "nebula space" },
  { id: "user3", name: "Cosmic Voyager", email: "voyager@cosmos.com", hint: "spaceship cockpit" },
  { id: "user4", name: "Guest", email: "guest@local.host", hint: "planet earth" },
];

export default function ProfilesPage() {
  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-accent">Manage Profiles</h2>
          <p className="text-muted-foreground mt-2">Add, edit, or remove user profiles.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Profile
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {users.map(user => (
          <Card key={user.id} className="bg-card/80 backdrop-blur-sm border border-transparent hover:border-primary transition-colors">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src="https://placehold.co/100x100.png" data-ai-hint={user.hint} alt={user.name} />
                  <AvatarFallback className="text-2xl">{user.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{user.name}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Edit Profile</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
