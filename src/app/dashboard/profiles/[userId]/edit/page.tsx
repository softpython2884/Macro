'use client';

import { ProfileForm } from "@/components/profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/context/UserContext";
import { useBackNavigation } from "@/hooks/use-back-navigation";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function EditProfilePage() {
  useBackNavigation('/dashboard/profiles');
  const params = useParams();
  const router = useRouter();
  const { users } = useUser();
  const userId = typeof params.userId === 'string' ? params.userId : '';
  const userToEdit = users.find(u => u.id === userId);

  if (!userToEdit) {
    // Optionally, show a loading or not found state
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-lg">Profile not found.</p>
            <Button asChild variant="link" className="mt-4">
                <Link href="/dashboard/profiles">
                    Return to Profiles
                </Link>
            </Button>
        </div>
    );
  }

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
          <CardTitle>Edit Local Profile: {userToEdit.name}</CardTitle>
          <CardDescription>
            Modify the details for this local profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm userToEdit={userToEdit} onFinished={() => router.push('/dashboard/profiles')} />
        </CardContent>
      </Card>
    </div>
  );
}
