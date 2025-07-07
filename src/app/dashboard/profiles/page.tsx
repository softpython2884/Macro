
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const users = [
  { id: "user1", name: "Galaxy Wanderer", email: "wanderer@space.com", hint: "astronaut helmet" },
  { id: "user2", name: "Starlight Seeker", email: "seeker@stars.com", hint: "nebula space" },
  { id: "user3", name: "Cosmic Voyager", email: "voyager@cosmos.com", hint: "spaceship cockpit" },
  { id: "user4", name: "Guest", email: "guest@local.host", hint: "planet earth" },
];

export default function ProfilesPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-accent">User Profiles</h2>
          <p className="text-muted-foreground">Manage user profiles and access permissions.</p>
        </div>
        <Button>Add New Profile</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {users.map(user => (
          <Card key={user.id} className="hover:bg-card/60 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src="https://placehold.co/100x100.png" data-ai-hint={user.hint} alt={user.name} />
                  <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
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
