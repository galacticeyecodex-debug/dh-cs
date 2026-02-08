'use client';

/**
 * Item Art Modal
 * ----------------------------------------------------------------------------
 * Modal for managing custom artwork on inventory items. Allows users to upload
 * images, select from their character's gallery, and position the artwork.
 * 
 * Reuses the same pattern as the CardDetailModal for domain cards.
 */

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { AppIcons } from '@/lib/icon-utils';
import { useCharacterStore, CharacterInventoryItem } from '@/store/character-store';
import { uploadCharacterImage } from '@/lib/storage-service';
import { toast } from 'sonner';
import { Z_INDEX } from '@/constants/z-index';

const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGE_FILE_SIZE_MB = '5MB';

// Type colors for items
const TYPE_COLORS: Record<string, string> = {
    weapon: 'var(--item-weapon)',
    armor: 'var(--item-armor)',
    consumable: 'var(--item-consumable)',
    item: 'var(--item-general)',
};

interface ItemArtModalProps {
    item: CharacterInventoryItem;
    onClose: () => void;
}

export default function ItemArtModal({ item, onClose }: ItemArtModalProps) {
    const { character, updateInventoryItemImage, updateInventoryItemImagePosition, user } = useCharacterStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Local position state for immediate UI feedback (debounced save to DB)
    const [localPosition, setLocalPosition] = useState({
        x: item.state?.custom_image_position_x ?? 50,
        y: item.state?.custom_image_position_y ?? 50,
    });
    const positionSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const type = item.library_item?.type || 'item';
    const accentColor = TYPE_COLORS[type] || TYPE_COLORS.item;

    // Handle image upload
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user || !character) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        // Validate file size
        if (file.size > MAX_IMAGE_FILE_SIZE) {
            toast.error(`Image must be smaller than ${MAX_IMAGE_FILE_SIZE_MB}`);
            return;
        }

        setIsUploading(true);
        try {
            const result = await uploadCharacterImage(user.id, file, character.id);

            if (result.error || !result.url) {
                toast.error(result.error || 'Failed to upload image');
                return;
            }

            await updateInventoryItemImage(item.id, result.url);
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload image');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Handle image removal
    const handleRemoveImage = async () => {
        await updateInventoryItemImage(item.id, null);
    };

    // Handle position change with debounced save
    const handlePositionChange = (newPosition: { x: number; y: number }) => {
        setLocalPosition(newPosition);

        // Clear existing timeout
        if (positionSaveTimeoutRef.current) {
            clearTimeout(positionSaveTimeoutRef.current);
        }

        // Debounce the save to prevent excessive API calls while dragging
        positionSaveTimeoutRef.current = setTimeout(() => {
            updateInventoryItemImagePosition(item.id, newPosition);
        }, 300);
    };

    // Handle gallery image selection
    const handleGallerySelect = async (galleryUrl: string) => {
        setIsUploading(true);
        try {
            await updateInventoryItemImage(item.id, galleryUrl);
            toast.success('Item art updated from gallery');
        } catch (error) {
            console.error('Failed to set gallery image:', error);
            toast.error('Failed to update item art');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm" 
      onClick={onClose}
      style={{ zIndex: Z_INDEX.MODAL }}
    >
            <div
                className="bg-zinc-800 text-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] relative"
                style={{ borderTop: `4px solid ${accentColor}` }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-white/10">
                    <div>
                        <h2 className="text-lg font-bold font-eveleth text-white flex items-center gap-2">
                            <AppIcons.ui.image size={18} style={{ color: accentColor }} /> Item Artwork
                        </h2>
                        <p className="text-sm text-gray-400">{item.name}</p>
                    </div>
                    <button onClick={onClose} aria-label="Close" className="text-white/70 hover:text-white">
                        <AppIcons.ui.close size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {/* Interactive Image Preview - drag to position */}
                    {item.state?.custom_image_url && (
                        <div className="mb-4">
                            <p className="text-xs text-gray-500 mb-2">
                                Drag the image to adjust position
                            </p>
                            <div
                                className="relative rounded-lg overflow-hidden border-2 cursor-move select-none"
                                style={{
                                    borderColor: accentColor,
                                    aspectRatio: '1 / 1',
                                }}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    const startX = e.clientX;
                                    const startY = e.clientY;
                                    const startPosX = localPosition.x;
                                    const startPosY = localPosition.y;

                                    const handleMouseMove = (moveEvent: MouseEvent) => {
                                        // Calculate delta as percentage of container size
                                        const deltaX = (moveEvent.clientX - startX) / 2; // Sensitivity factor
                                        const deltaY = (moveEvent.clientY - startY) / 2;

                                        // Invert direction: dragging right should move image left (show more right side)
                                        const newX = Math.max(0, Math.min(100, startPosX - deltaX));
                                        const newY = Math.max(0, Math.min(100, startPosY - deltaY));

                                        handlePositionChange({ x: newX, y: newY });
                                    };

                                    const handleMouseUp = () => {
                                        document.removeEventListener('mousemove', handleMouseMove);
                                        document.removeEventListener('mouseup', handleMouseUp);
                                    };

                                    document.addEventListener('mousemove', handleMouseMove);
                                    document.addEventListener('mouseup', handleMouseUp);
                                }}
                                onTouchStart={(e) => {
                                    const touch = e.touches[0];
                                    const startX = touch.clientX;
                                    const startY = touch.clientY;
                                    const startPosX = localPosition.x;
                                    const startPosY = localPosition.y;

                                    const handleTouchMove = (moveEvent: TouchEvent) => {
                                        const touchMove = moveEvent.touches[0];
                                        const deltaX = (touchMove.clientX - startX) / 2;
                                        const deltaY = (touchMove.clientY - startY) / 2;

                                        const newX = Math.max(0, Math.min(100, startPosX - deltaX));
                                        const newY = Math.max(0, Math.min(100, startPosY - deltaY));

                                        handlePositionChange({ x: newX, y: newY });
                                    };

                                    const handleTouchEnd = () => {
                                        document.removeEventListener('touchmove', handleTouchMove);
                                        document.removeEventListener('touchend', handleTouchEnd);
                                    };

                                    document.addEventListener('touchmove', handleTouchMove);
                                    document.addEventListener('touchend', handleTouchEnd);
                                }}
                            >
                                <Image
                                    src={item.state.custom_image_url}
                                    alt={item.name}
                                    fill
                                    className="object-cover pointer-events-none"
                                    style={{ objectPosition: `${localPosition.x}% ${localPosition.y}%` }}
                                    sizes="400px"
                                    draggable={false}
                                />
                                {/* Drag indicator */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20 pointer-events-none">
                                    <div className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                        <AppIcons.ui.image size={12} /> Drag to reposition
                                    </div>
                                </div>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                                <span>Image Position</span>
                                <button
                                    onClick={handleRemoveImage}
                                    className="text-red-400 hover:text-red-300 flex items-center gap-1"
                                >
                                    <AppIcons.ui.delete size={12} /> Remove
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Upload Options */}
                    <div className="space-y-3">
                        <p className="text-xs text-gray-400">
                            {item.state?.custom_image_url ? 'Change the image:' : 'Choose an image for this item:'}
                        </p>

                        {/* Upload Button */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="w-full bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg p-3 text-left transition-colors disabled:opacity-50"
                        >
                            <div className="flex items-start gap-3">
                                <AppIcons.ui.upload size={16} className="mt-0.5" style={{ color: accentColor }} />
                                <div>
                                    <div className="font-bold text-sm">Upload Image</div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        Upload from your device (max {MAX_IMAGE_FILE_SIZE_MB})
                                    </div>
                                </div>
                            </div>
                        </button>

                        {isUploading && (
                            <div className="text-center text-sm text-gray-400 py-2">
                                Uploading...
                            </div>
                        )}

                        {/* Choose from Gallery */}
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                                <AppIcons.ui.image size={12} /> Choose from Gallery
                            </h4>
                            {character?.gallery_images && character.gallery_images.length > 0 ? (
                                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                                    {character.gallery_images.map((galleryUrl, idx) => (
                                        <button
                                            key={idx}
                                            disabled={isUploading}
                                            onClick={() => handleGallerySelect(galleryUrl)}
                                            className="aspect-square relative rounded-lg overflow-hidden border-2 border-transparent hover:border-dagger-gold transition-colors group disabled:opacity-50"
                                        >
                                            <Image
                                                src={galleryUrl}
                                                alt={`Gallery image ${idx + 1}`}
                                                fill
                                                className="object-cover"
                                                sizes="100px"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                                <span className="text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Select
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4 bg-white/5 rounded-lg border border-dashed border-white/10">
                                    <p className="text-sm text-gray-500 italic">No gallery images yet.</p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Upload images in <span className="text-dagger-gold">Character → Gallery</span> to use them here.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                    />
                </div>
            </div>
        </div>
    );
}
