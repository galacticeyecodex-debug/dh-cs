/**
 * PROFILE PAGE
 * ----------------------------------------------------------------------------
 * Displays user account information, content access settings, and authentication controls.
 *
 * DESIGN:
 * - Responsive: Uses a centered card layout optimized for both web and mobile.
 * - Shared: Converted to a Client Component to support both Supabase (Web)
 *   and Local Auth (Native).
 */

'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AuthButton from "@/components/auth/auth-buttons";
import ContentAccessSettings from "@/components/modals/content-access-settings";
import useUser from "@/hooks/useUser";

export default function ProfilePage() {
  const { user } = useUser();

  if (!user) return null;

  const displayEmail = user.email || "No email available";
  const userInitial = user.email ? user.email[0].toUpperCase() : "U";
  const fullName = user.user_metadata?.full_name || "User";
  const avatarUrl = user.user_metadata?.avatar_url;

  return (
    <section className="max-w-4xl mx-auto space-y-4 p-4">
      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Avatar>
              <AvatarImage
                src={avatarUrl}
                alt={fullName}
              />
              <AvatarFallback>{userInitial}</AvatarFallback>
            </Avatar>

            <p className="text-foreground truncate text-sm font-medium">
              {fullName}
            </p>
            <p className="text-muted-foreground truncate text-xs font-normal">
              {displayEmail}
            </p>
          </div>

          <div className="pt-4 border-t">
            <AuthButton />
          </div>
        </CardContent>
      </Card>

      {/* Content Access Settings */}
      <ContentAccessSettings />
    </section>
  );
}