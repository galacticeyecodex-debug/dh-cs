'use client';

/**
 * PROFILE VIEW
 * ----------------------------------------------------------------------------
 * A dedicated profile view accessible from the More menu. Contains:
 * - User account information (avatar, name, email)
 * - Friends management panel
 * - Content Access settings (SRD, Playtest, Homebrew campaigns)
 * - Logout functionality
 * 
 * DESIGN:
 * - Follows the same styling conventions as other More menu views
 * - Uses ViewHeader for consistent header styling
 * - Uses dagger-panel styling for card sections
 */

import React, { useEffect } from 'react';
import { User, Users, LogOut } from '@/lib/icon-utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { FriendsPanel } from '@/components/friends';
import ContentAccessSettings from '@/components/modals/content-access-settings';
import ViewHeader from '@/components/shared/view-header';
import { useCharacterStore } from '@/store/character-store';
import useUser from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { LOGIN_PATH } from '@/constants/common';

export default function ProfileView() {
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

    const displayEmail = user.email || 'No email available';
    const userInitial = user.email ? user.email[0].toUpperCase() : 'U';
    const fullName = user.user_metadata?.full_name || 'User';
    const avatarUrl = user.user_metadata?.avatar_url;

    return (
        <div className="p-4 space-y-6 pb-24">
            {/* Header */}
            <ViewHeader
                icon={User}
                title="Profile"
                subtitle="Manage your account and connections"
            />

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
    );
}
