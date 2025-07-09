import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { UserProvider } from "@/context/UserContext";
import { SoundProvider } from "@/context/SoundContext";
import "./globals.css";
import { getConfig } from "@/lib/config";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Macro",
  description: "Your personal application and media hub.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const headersList = headers();
  const pathname = headersList.get('x-pathname') || '';

  // The setup check logic, previously in middleware, is now here.
  // This is because Server Components can access Node.js APIs (like the file system),
  // whereas Edge middleware cannot.
  try {
    // Avoid running this logic for static assets that might slip through the matcher
    const isAsset = pathname.includes('.') && !pathname.startsWith('/_next');
    if (!isAsset) {
        const config = await getConfig();
        const setupComplete = config.setupconfig === true;

        if (!setupComplete && pathname !== '/setup') {
          redirect('/setup');
        }

        if (setupComplete && pathname === '/setup') {
          redirect('/login');
        }
    }
  } catch (error) {
    console.error("RootLayout error reading config:", error);
  }


  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="overflow-hidden">
        <UserProvider>
          <SoundProvider>
            <div className="relative z-10">
            {children}
            </div>
            <Toaster />
          </SoundProvider>
        </UserProvider>
      </body>
    </html>
  );
}
