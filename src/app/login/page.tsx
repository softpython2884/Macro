import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { MacroLogo } from "@/components/macro-logo";

const users = [
  { id: "user1", name: "Galaxy Wanderer", hint: "astronaut helmet" },
  { id: "user2", name: "Starlight Seeker", hint: "nebula space" },
  { id: "user3", name: "Cosmic Voyager", hint: "spaceship cockpit" },
  { id: "user4", name: "Guest", hint: "planet earth" },
];

export default function LoginPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background animate-fade-in p-4">
      <div className="absolute top-8 left-8 flex items-center gap-2 text-foreground">
         <MacroLogo className="h-8 w-8 text-primary" />
         <h1 className="text-2xl font-bold">Macro</h1>
      </div>
      <div className="text-center">
        <h2 className="text-5xl font-bold tracking-tight text-accent mb-4">Who's Watching?</h2>
        <p className="text-muted-foreground mb-12 text-lg">Select a profile to begin your journey.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {users.map(user => (
          <Link href="/dashboard" key={user.id} className="block group focus:outline-none focus:ring-4 focus:ring-primary rounded-lg">
            <div className="flex flex-col items-center gap-4 transition-transform duration-300 group-hover:scale-105">
              <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-background group-hover:border-primary transition-all duration-300 rounded-lg">
                <AvatarImage src={`https://placehold.co/160x160.png`} data-ai-hint={user.hint} alt={user.name} />
                <AvatarFallback className="text-4xl rounded-lg">{user.name.substring(0, 1)}</AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">{user.name}</h3>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
