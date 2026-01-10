'use client';

/**
 * INVENTORY ITEM CARD COMPONENT
 * ----------------------------------------------------------------------------
 * A reusable card component for displaying inventory items (weapons, armor,
 * consumables, misc items). Displays item details, modifiers, equip controls,
 * and custom artwork thumbnail.
 *
 * FEATURES:
 * - Consistent styling for all inventory item types
 * - Gear button for manage/edit (opens homebrew editor with delete option)
 * - Art button for custom artwork management
 * - Equip/unequip controls for weapons and armor
 * - Modifier tags display
 * - Custom artwork thumbnail (when set)
 */

import React, { useState } from 'react';
import Image from 'next/image';
import { Sword, Shield, ArrowRightLeft, ImageIcon, Settings, Info, Pill } from 'lucide-react';
import clsx from 'clsx';
import { CharacterInventoryItem } from '@/store/character-store';
import { MarkdownText } from '@/components/shared/markdown-text';

export interface InventoryItemCardProps {
    /** The inventory item to display */
    item: CharacterInventoryItem;
    /** Callback when equipping/unequipping the item */
    onEquip: (id: string, slot: 'equipped_primary' | 'equipped_secondary' | 'equipped_armor' | 'backpack') => void;
    /** Callback when the manage button is clicked (opens homebrew editor) */
    onManage: (item: CharacterInventoryItem) => void;
    /** Callback when the art button is clicked (opens art modal) */
    onEditArt: (item: CharacterInventoryItem) => void;
    /** Optional callback when using a consumable item */
    onUse?: (item: CharacterInventoryItem) => void;
}

const InventoryItemCard = React.memo(function InventoryItemCard({
    item,
    onEquip,
    onManage,
    onEditArt,
    onUse,
}: InventoryItemCardProps) {
    const type = item.library_item?.type;
    const isEquipped = item.location.startsWith('equipped');
    const data = item.library_item?.data;
    const isHomebrew = !!item.homebrew_item_id;
    const [showDescription, setShowDescription] = useState(false);

    // Get the full description text
    const fullDescription = item.description || data?.markdown || data?.description || '';

    let locationLabel = '';
    if (item.location === 'equipped_primary') locationLabel = 'Primary';
    if (item.location === 'equipped_secondary') locationLabel = 'Secondary';
    if (item.location === 'equipped_armor') locationLabel = 'Armor';

    return (
        <div className={clsx(
            "flex flex-col gap-2 p-3 rounded-lg border transition-all relative",
            isEquipped ? "bg-dagger-gold/10 border-dagger-gold/30" : "bg-white/5 border-white/5"
        )}>
            {/* Action Buttons - absolute top right */}
            <div className="absolute top-1 right-1 z-10 flex items-center gap-0.5">
                {fullDescription && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowDescription(!showDescription);
                        }}
                        className={clsx(
                            "transition-colors p-0.5 rounded hover:bg-white/10",
                            showDescription ? "text-dagger-gold" : "text-gray-500 hover:text-gray-300"
                        )}
                        aria-label={`${showDescription ? 'Hide' : 'Show'} ${item.name} description`}
                        title={showDescription ? "Hide description" : "Show description"}
                    >
                        <Info size={12} />
                    </button>
                )}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEditArt(item);
                    }}
                    className="text-gray-500 hover:text-dagger-gold transition-colors p-0.5 rounded hover:bg-white/10"
                    aria-label={`Edit ${item.name} artwork`}
                    title="Edit Artwork"
                >
                    <ImageIcon size={12} />
                </button>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onManage(item);
                    }}
                    className="text-gray-500 hover:text-gray-300 transition-colors p-0.5 rounded hover:bg-white/10"
                    aria-label={`Manage ${item.name}`}
                    title="Manage Item"
                >
                    <Settings size={12} />
                </button>
            </div>

            <div className="flex justify-between items-start">
                <div className="flex-1 mr-8">
                    {/* Item Name and Badges */}
                    <div className="font-medium text-white flex items-center gap-2 flex-wrap">
                        {item.name}
                        {isEquipped && (
                            <span className="text-[10px] font-bold uppercase bg-dagger-gold text-black px-1.5 py-0.5 rounded">
                                {locationLabel}
                            </span>
                        )}
                        {isHomebrew && (
                            <span className="text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                                Custom
                            </span>
                        )}
                    </div>

                    {/* Item Details */}
                    <div className="text-xs text-gray-400 mt-1">
                        {type === 'armor' && data ? (
                            <>
                                {data.feature?.name && <span className="font-bold text-gray-300">{data.feature.name}: </span>}
                                {data.feature?.text && (
                                    <MarkdownText className="inline-block">{data.feature.text}</MarkdownText>
                                )}
                                <span className="block mt-0.5 text-gray-500">Score: {data.base_score}, Thresholds: {data.base_thresholds}</span>
                            </>
                        ) : type === 'weapon' && data ? (
                            <>
                                <span className="block mb-0.5">
                                    {data.trait} • {data.range} • {data.damage?.replace(/\*\*/g, '')} {data.type === 'Physical' ? 'Phy' : data.type === 'Magic' ? 'Mag' : data.type}
                                </span>
                                {data.feature?.name && <span className="font-bold text-gray-300">{data.feature.name}: </span>}
                                {data.feature?.text && (
                                    <MarkdownText className="inline-block">{data.feature.text}</MarkdownText>
                                )}
                            </>
                        ) : (
                            <MarkdownText>
                                {item.description || data?.markdown || 'No description'}
                            </MarkdownText>
                        )}
                    </div>

                    {/* Modifiers Tags */}
                    {data?.modifiers && Array.isArray(data.modifiers) && data.modifiers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {data.modifiers.map((mod: any, idx: number) => {
                                const isPositive = mod.value > 0;
                                const sign = mod.value > 0 ? '+' : '';
                                const label = `${sign}${mod.value} ${mod.target.charAt(0).toUpperCase() + mod.target.slice(1)}`;

                                return (
                                    <span
                                        key={idx}
                                        className={clsx(
                                            "text-[10px] px-1.5 py-0.5 rounded border uppercase font-bold",
                                            isPositive
                                                ? "bg-green-500/10 border-green-500/30 text-green-400"
                                                : "bg-red-500/10 border-red-500/30 text-red-400"
                                        )}
                                    >
                                        {label}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right side: Quantity */}
                {item.quantity > 1 && (
                    <div className="px-2 py-1 bg-black/30 rounded text-xs font-bold text-gray-300">
                        x{item.quantity}
                    </div>
                )}
            </div>

            {/* Collapsible Description Section */}
            {showDescription && fullDescription && (
                <div className="mt-2 p-3 bg-white/5 rounded-lg border border-white/5 text-sm text-gray-300">
                    <MarkdownText>{fullDescription}</MarkdownText>
                </div>
            )}

            {/* Equip Controls */}
            <div className="flex gap-2 mt-1">
                {/* Consumable Use Button */}
                {type === 'consumable' && onUse && (
                    <button
                        onClick={() => onUse(item)}
                        className="text-[10px] font-bold uppercase px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded flex items-center gap-1 border border-green-500/30"
                        aria-label={`Use ${item.name}`}
                    >
                        <Pill size={12} /> Use
                    </button>
                )}

                {type === 'weapon' && (
                    <>
                        {item.location !== 'equipped_primary' && (
                            <button
                                onClick={() => onEquip(item.id, 'equipped_primary')}
                                className="text-[10px] font-bold uppercase px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-white flex items-center gap-1"
                                aria-label={`Equip ${item.name} to primary slot`}
                            >
                                <Sword size={12} /> Primary
                            </button>
                        )}
                        {item.location !== 'equipped_secondary' && (
                            <button
                                onClick={() => onEquip(item.id, 'equipped_secondary')}
                                className="text-[10px] font-bold uppercase px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-white flex items-center gap-1"
                                aria-label={`Equip ${item.name} to secondary slot`}
                            >
                                <Sword size={12} /> Secondary
                            </button>
                        )}
                    </>
                )}

                {type === 'armor' && item.location !== 'equipped_armor' && (
                    <button
                        onClick={() => onEquip(item.id, 'equipped_armor')}
                        className="text-[10px] font-bold uppercase px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-white flex items-center gap-1"
                        aria-label={`Equip ${item.name}`}
                    >
                        <Shield size={12} /> Equip
                    </button>
                )}

                {isEquipped && (
                    <button
                        onClick={() => onEquip(item.id, 'backpack')}
                        className="text-[10px] font-bold uppercase px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded flex items-center gap-1 ml-auto"
                        aria-label={`Unequip ${item.name}`}
                    >
                        <ArrowRightLeft size={12} /> Unequip
                    </button>
                )}
            </div>

            {/* Art Thumbnail - only show if custom image exists */}
            {item.state?.custom_image_url && (
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/5">
                    <div
                        className={clsx(
                            "w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0",
                            isEquipped ? "border-dagger-gold/30" : "border-white/10"
                        )}
                    >
                        <Image
                            src={item.state.custom_image_url}
                            alt={item.name}
                            width={64}
                            height={64}
                            className="object-cover w-full h-full"
                            style={{
                                objectPosition: `${item.state?.custom_image_position_x ?? 50}% ${item.state?.custom_image_position_y ?? 50}%`
                            }}
                        />
                    </div>
                    <div className="text-xs text-gray-500">Item Artwork</div>
                </div>
            )}
        </div>
    );
});

export default InventoryItemCard;
