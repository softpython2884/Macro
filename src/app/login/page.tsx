import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const users = [
  { id: "user1", name: "Galaxy Wanderer", hint: "astronaut helmet" },
  { id: "user2", name: "Starlight Seeker", hint: "nebula space" },
  { id: "user3", name: "Cosmic Voyager", hint: "spaceship cockpit" },
  { id: "user4", name: "Guest", hint: "planet earth" },
];

export default function LoginPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-transparent animate-fade-in p-4">
      <div className="text-center">
        <h2 className="text-7xl font-bold tracking-tight text-glow mb-4 animate-fade-in-slow">
          Who's Watching?
        </h2>
        <p className="text-muted-foreground mb-16 text-lg animate-fade-in-slow delay-200">
          Select a profile to launch
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
        {users.map((user, index) => (
          <Link
            href="/dashboard"
            key={user.id}
            className="block group rounded-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background"
            style={{ animationDelay: `${200 + index * 100}ms` }}
          >
            <div className="flex flex-col items-center gap-4 transition-all duration-300 group-hover:scale-110 group-focus:scale-110">
              <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-transparent group-hover:border-primary group-focus:border-primary transition-all duration-300 rounded-lg shadow-lg">
                <AvatarImage
                  src={`https://placehold.co/160x160.png`}
                  data-ai-hint={user.hint}
                  alt={user.name}
                />
                <AvatarFallback className="text-4xl rounded-lg">
                  {user.name.substring(0, 1)}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-semibold text-foreground transition-colors group-hover:text-primary group-focus:text-primary">
                {user.name}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
