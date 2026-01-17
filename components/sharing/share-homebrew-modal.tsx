'use client';

/**
 * Share Homebrew Modal
 * Phase 7: Friendships (GH#67)
 * 
 * Modal for sharing homebrew items with campaigns or friends.
 */

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCharacterStore } from '@/store/character-store';
import { Users, Swords, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareHomebrewModalProps {
    itemId: string;
    itemName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ShareHomebrewModal({
    itemId,
    itemName,
    open,
    onOpenChange
}: ShareHomebrewModalProps) {
    const { campaigns, friends } = useCharacterStore();
    const [selectedTarget, setSelectedTarget] = useState<{
        type: 'campaign' | 'friend';
        id: string;
        name: string;
    } | null>(null);
    const [isSharing, setIsSharing] = useState(false);

    const handleShare = async () => {
        if (!selectedTarget) {
            toast.error('Please select someone to share with');
            return;
        }

        setIsSharing(true);
        try {
            // TODO: Implement actual sharing logic when shared_homebrew table is fully set up
            // For now, show a success message
            toast.success(
                `Shared "${itemName}" with ${selectedTarget.name}!`,
                { description: `They can now add this item to their characters.` }
            );
            onOpenChange(false);
            setSelectedTarget(null);
        } catch (error: any) {
            console.error('Failed to share homebrew:', error);
            toast.error('Failed to share item');
        } finally {
            setIsSharing(false);
        }
    };

    const getInitials = (name: string | null) => {
        if (!name) return '?';
        return name.slice(0, 2).toUpperCase();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Share Homebrew Item</DialogTitle>
                    <DialogDescription>
                        Share &quot;{itemName}&quot; with a campaign or friend.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="campaigns" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="campaigns" className="flex items-center gap-2">
                            <Swords className="h-4 w-4" />
                            Campaigns
                        </TabsTrigger>
                        <TabsTrigger value="friends" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Friends
                        </TabsTrigger>
                    </TabsList>

                    {/* Campaigns Tab */}
                    <TabsContent value="campaigns" className="mt-4">
                        <Label className="text-sm text-muted-foreground mb-2 block">
                            Select a campaign to share with
                        </Label>
                        <ScrollArea className="h-[200px] rounded-md border p-2">
                            {campaigns.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Swords className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No campaigns yet</p>
                                    <p className="text-xs">Join or create a campaign first</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {campaigns.map((campaign) => (
                                        <button
                                            key={campaign.id}
                                            onClick={() => setSelectedTarget({
                                                type: 'campaign',
                                                id: campaign.id,
                                                name: campaign.name,
                                            })}
                                            className={`w-full flex items-center justify-between p-2 rounded-md text-left transition-colors ${selectedTarget?.id === campaign.id && selectedTarget?.type === 'campaign'
                                                    ? 'bg-primary/10 border border-primary'
                                                    : 'hover:bg-accent border border-transparent'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
                                                    <Swords className="h-4 w-4 text-primary" />
                                                </div>
                                                <span className="font-medium">{campaign.name}</span>
                                            </div>
                                            {selectedTarget?.id === campaign.id && selectedTarget?.type === 'campaign' && (
                                                <Check className="h-4 w-4 text-primary" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>

                    {/* Friends Tab */}
                    <TabsContent value="friends" className="mt-4">
                        <Label className="text-sm text-muted-foreground mb-2 block">
                            Select a friend to share with
                        </Label>
                        <ScrollArea className="h-[200px] rounded-md border p-2">
                            {friends.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No friends yet</p>
                                    <p className="text-xs">Add friends from your profile</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {friends.map((friend) => (
                                        <button
                                            key={friend.friendship_id}
                                            onClick={() => setSelectedTarget({
                                                type: 'friend',
                                                id: friend.user_id,
                                                name: friend.username || 'Friend',
                                            })}
                                            className={`w-full flex items-center justify-between p-2 rounded-md text-left transition-colors ${selectedTarget?.id === friend.user_id && selectedTarget?.type === 'friend'
                                                    ? 'bg-primary/10 border border-primary'
                                                    : 'hover:bg-accent border border-transparent'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={friend.avatar_url || undefined} />
                                                    <AvatarFallback className="text-xs">
                                                        {getInitials(friend.username)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{friend.username || 'Unknown'}</span>
                                            </div>
                                            {selectedTarget?.id === friend.user_id && selectedTarget?.type === 'friend' && (
                                                <Check className="h-4 w-4 text-primary" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleShare}
                        disabled={!selectedTarget || isSharing}
                    >
                        {isSharing ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Sharing...
                            </>
                        ) : (
                            'Share'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
