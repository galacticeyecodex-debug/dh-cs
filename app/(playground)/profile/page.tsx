/**
 * PROFILE PAGE
 * ----------------------------------------------------------------------------
 * Standalone profile page accessible without selecting a character.
 * Displays user account information, friends, and content access settings.
 *
 * DESIGN:
 * - Uses the same header pattern as the character selection page
 * - Provides access to Profile/Settings/Sign Out via UserMenu
 * - Full-featured profile view including friends management
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import ContentAccessSettings from "@/components/modals/content-access-settings";
import { FriendsPanel } from "@/components/friends";
import UserMenu from "@/components/core/user-menu";
import { useCharacterStore } from "@/store/character-store";
import useUser from "@/hooks/useUser";
import { Users, User, LogOut, Sword, ArrowLeft } from '@/lib/icon-utils';
import { LOGIN_PATH } from "@/constants/common";

export default function ProfilePage() {
  const { user, signOut } = useUser();
  const router = useRouter();
  const {
    pendingRequests,
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

  const handleLogout = async () => {
    await signOut();
    router.push(LOGIN_PATH);
    router.refresh();
  };

  if (!user) return null;

  const displayEmail = user.email || "No email available";
  const userInitial = user.email ? user.email[0].toUpperCase() : "U";
  const fullName = user.user_metadata?.full_name || "User";
  const avatarUrl = user.user_metadata?.avatar_url;

  return (
    <div className="flex flex-col h-[100dvh] bg-dagger-dark text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-dagger-panel">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-lg font-serif font-bold text-dagger-gold hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <UserMenu />
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 space-y-6">
          {/* Page Header */}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-dagger-gold/10">
              <User size={28} className="text-dagger-gold" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-white">Profile</h1>
              <p className="text-sm text-gray-400">Manage your account and connections</p>
            </div>
          </div>

          {/* Account Card */}
          <div className="bg-dagger-panel border border-white/10 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-5 w-5 text-dagger-gold" />
                <h2 className="text-lg font-semibold text-white">Account</h2>
              </div>
              <p className="text-gray-400 text-sm">
                Your account information and authentication.
              </p>
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
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">
                    {fullName}
                  </p>
                  <p className="text-gray-400 text-sm truncate">
                    {displayEmail}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <Button variant="destructive" onClick={handleLogout} className="w-full sm:w-auto">
                  <span>Logout</span>
                  <LogOut className="opacity-60 ml-2" size={16} aria-hidden="true" />
                </Button>
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
        </div>
      </main>
    </div>
  );
}
