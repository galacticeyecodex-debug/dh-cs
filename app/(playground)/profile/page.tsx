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

import { useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AuthButton from "@/components/auth/auth-buttons";
import ContentAccessSettings from "@/components/modals/content-access-settings";
import { FriendsPanel } from "@/components/friends";
import { useCharacterStore } from "@/store/character-store";
import useUser from "@/hooks/useUser";
import { Users, User } from "lucide-react";

export default function ProfilePage() {
  const { user } = useUser();
  const {
    pendingRequests,
    myFriendCode,
    setMyFriendCode,
    fetchAllFriendshipData
  } = useCharacterStore();

  // Fetch friend code from profile on mount
  useEffect(() => {
    const fetchFriendCode = async () => {
      if (!user) return;
      try {
        const { dataService } = await import('@/lib/data-service');
        const profile = await dataService.profile.get(user.id);
        if (profile?.friend_code) {
          setMyFriendCode(profile.friend_code);
        }
      } catch (err) {
        console.error('Failed to fetch friend code:', err);
      }
    };
    fetchFriendCode();
    fetchAllFriendshipData();
  }, [user, setMyFriendCode, fetchAllFriendshipData]);

  if (!user) return null;

  const displayEmail = user.email || "No email available";
  const userInitial = user.email ? user.email[0].toUpperCase() : "U";
  const fullName = user.user_metadata?.full_name || "User";
  const avatarUrl = user.user_metadata?.avatar_url;

  return (
    <section className="max-w-4xl mx-auto space-y-4 p-4">
      {/* Profile Card */}
      <div className="bg-dagger-panel border border-white/10 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-5 w-5 text-dagger-gold" />
            <h2 className="text-lg font-semibold text-white">Profile</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-white/10">
              <AvatarImage
                src={avatarUrl}
                alt={fullName}
              />
              <AvatarFallback className="bg-dagger-gold/20 text-dagger-gold text-xl">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white font-medium">
                {fullName}
              </p>
              <p className="text-gray-400 text-sm">
                {displayEmail}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <AuthButton />
          </div>
        </div>
      </div>

      {/* Friends Section */}
      <div className="bg-dagger-panel border border-white/10 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-dagger-gold" />
            <h2 className="text-lg font-semibold text-white">Friends</h2>
            {pendingRequests.length > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-dagger-gold/20 text-dagger-gold text-xs font-medium">
                {pendingRequests.length} new
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Connect with other players and share homebrew content.
          </p>
        </div>
        <div className="p-6">
          <FriendsPanel />
        </div>
      </div>

      {/* Content Access Settings */}
      <ContentAccessSettings />
    </section>
  );
}
