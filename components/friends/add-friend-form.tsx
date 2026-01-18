'use client';

/**
 * Add Friend Form Component
 * Input form for sending friend requests by friend code
 */

import { useState } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';

interface AddFriendFormProps {
    onSubmit: (friendCode: string) => Promise<boolean>;
    isLoading?: boolean;
}

export function AddFriendForm({ onSubmit, isLoading }: AddFriendFormProps) {
    const [friendCode, setFriendCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!friendCode.trim() || isSubmitting) return;

        setIsSubmitting(true);
        const success = await onSubmit(friendCode.trim().toUpperCase());
        setIsSubmitting(false);

        if (success) {
            setFriendCode('');
        }
    };

    // Format input to uppercase and allow only valid characters
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
        setFriendCode(value);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
                <label htmlFor="friend-code" className="text-sm font-medium text-gray-400">
                    Friend Code
                </label>
                <div className="flex gap-2">
                    <input
                        id="friend-code"
                        type="text"
                        value={friendCode}
                        onChange={handleInputChange}
                        placeholder="e.g. ABCD1234"
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-mono text-center tracking-wider placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-dagger-gold/50 focus:border-dagger-gold/50"
                        maxLength={8}
                        disabled={isLoading || isSubmitting}
                    />
                    <button
                        type="submit"
                        disabled={friendCode.length !== 8 || isLoading || isSubmitting}
                        className="px-4 py-2 bg-dagger-gold hover:bg-yellow-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-medium rounded-lg transition-colors flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <UserPlus className="h-4 w-4" />
                                Add
                            </>
                        )}
                    </button>
                </div>
            </div>
            <p className="text-xs text-gray-500">
                Enter your friend&apos;s 8-character code to send them a friend request.
            </p>
        </form>
    );
}
