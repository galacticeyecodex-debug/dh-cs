'use client';

/**
 * Add Friend Form Component
 * Input form for sending friend requests by friend code
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
                <Label htmlFor="friend-code" className="text-sm font-medium">
                    Friend Code
                </Label>
                <div className="flex gap-2">
                    <Input
                        id="friend-code"
                        type="text"
                        value={friendCode}
                        onChange={handleInputChange}
                        placeholder="e.g. ABCD1234"
                        className="font-mono text-center tracking-wider"
                        maxLength={8}
                        disabled={isLoading || isSubmitting}
                    />
                    <Button
                        type="submit"
                        disabled={friendCode.length !== 8 || isLoading || isSubmitting}
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add
                            </>
                        )}
                    </Button>
                </div>
            </div>
            <p className="text-xs text-muted-foreground">
                Enter your friend&apos;s 8-character code to send them a friend request.
            </p>
        </form>
    );
}
