'use client';

import { ProfileForm } from "@/components/profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBackNavigation } from "@/hooks/use-back-navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function NewProfilePage() {
  useBackNavigation('/dashboard/profiles');
  const router = useRouter();

  return (
    <div className="animate-fade-in">
        <Button asChild variant="outline" size="sm" className="mb-4">
            <Link href="/dashboard/profiles">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Profiles
            </Link>
        </Button>
      <Card>
        <CardHeader>
          <CardTitle>Create New Profile</CardTitle>
          <CardDescription>
            Fill in the details for the new profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm onFinished={() => router.push('/dashboard/profiles')} />
        </CardContent>
      </Card>
    </div>
  );
}
