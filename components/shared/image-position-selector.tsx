'use client';

/**
 * IMAGE POSITION SELECTOR
 * ----------------------------------------------------------------------------
 * A draggable viewport component that allows users to select which portion
 * of an image should be displayed on a domain card.
 * 
 * FUNCTIONALITY:
 * - Shows the full image with a draggable selection box overlay
 * - The selection box maintains the same aspect ratio as the domain card art area
 * - Outputs position as percentages (0-100) for resolution-independent positioning
 * - Position can be applied via CSS object-position on the domain card
 * 
 * USAGE:
 * <ImagePositionSelector
 *   imageUrl="/path/to/image.png"
 *   position={{ x: 50, y: 0 }}
 *   onChange={(pos) => console.log(pos.x, pos.y)}
 * />
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import clsx from 'clsx';

interface Position {
    x: number; // 0-100 percentage (0 = left edge, 100 = right edge)
    y: number; // 0-100 percentage (0 = top edge, 100 = bottom edge)
}

interface ImagePositionSelectorProps {
    imageUrl: string;
    position?: Position;
    onChange: (position: Position) => void;
    /** Aspect ratio of the visible area (width/height). Domain card art = ~1.5 */
    aspectRatio?: number;
    className?: string;
}

export default function ImagePositionSelector({
    imageUrl,
    position = { x: 50, y: 0 },
    onChange,
    aspectRatio = 1.5, // 240:160 = 1.5 for thumbnail domain card art
    className,
}: ImagePositionSelectorProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    // Calculate selector box dimensions based on container and aspect ratio
    const getSelectorSize = useCallback(() => {
        if (!containerSize.width || !containerSize.height) return { width: 0, height: 0 };

        const containerAspect = containerSize.width / containerSize.height;

        // Determine the selector size - it should fit within the container
        // while maintaining the target aspect ratio
        // We want the selector to be proportionally sized based on typical coverage
        const selectorCoverageRatio = 0.6; // Selector covers ~60% of the shorter dimension

        let selectorWidth: number;
        let selectorHeight: number;

        if (containerAspect > aspectRatio) {
            // Container is wider than selector aspect - fit to height
            selectorHeight = containerSize.height * selectorCoverageRatio;
            selectorWidth = selectorHeight * aspectRatio;
        } else {
            // Container is taller than selector aspect - fit to width
            selectorWidth = containerSize.width * selectorCoverageRatio;
            selectorHeight = selectorWidth / aspectRatio;
        }

        return { width: selectorWidth, height: selectorHeight };
    }, [containerSize, aspectRatio]);

    const selectorSize = getSelectorSize();

    // Convert position percentage to pixel offset
    const getPixelPosition = useCallback((pos: Position) => {
        const maxX = containerSize.width - selectorSize.width;
        const maxY = containerSize.height - selectorSize.height;
        return {
            x: (pos.x / 100) * maxX,
            y: (pos.y / 100) * maxY,
        };
    }, [containerSize, selectorSize]);

    // Convert pixel offset to position percentage
    const getPercentPosition = useCallback((pixelX: number, pixelY: number): Position => {
        const maxX = containerSize.width - selectorSize.width;
        const maxY = containerSize.height - selectorSize.height;
        return {
            x: maxX > 0 ? Math.max(0, Math.min(100, (pixelX / maxX) * 100)) : 50,
            y: maxY > 0 ? Math.max(0, Math.min(100, (pixelY / maxY) * 100)) : 50,
        };
    }, [containerSize, selectorSize]);

    const pixelPos = getPixelPosition(position);

    // Update container size on mount and resize
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setContainerSize({ width: rect.width, height: rect.height });
            }
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Handle drag
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - selectorSize.width / 2;
        const mouseY = e.clientY - rect.top - selectorSize.height / 2;

        // Clamp to container bounds
        const clampedX = Math.max(0, Math.min(containerSize.width - selectorSize.width, mouseX));
        const clampedY = Math.max(0, Math.min(containerSize.height - selectorSize.height, mouseY));

        const newPos = getPercentPosition(clampedX, clampedY);
        onChange(newPos);
    }, [isDragging, containerSize, selectorSize, getPercentPosition, onChange]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Touch support
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isDragging || !containerRef.current) return;

        const touch = e.touches[0];
        const rect = containerRef.current.getBoundingClientRect();
        const touchX = touch.clientX - rect.left - selectorSize.width / 2;
        const touchY = touch.clientY - rect.top - selectorSize.height / 2;

        const clampedX = Math.max(0, Math.min(containerSize.width - selectorSize.width, touchX));
        const clampedY = Math.max(0, Math.min(containerSize.height - selectorSize.height, touchY));

        const newPos = getPercentPosition(clampedX, clampedY);
        onChange(newPos);
    }, [isDragging, containerSize, selectorSize, getPercentPosition, onChange]);

    const handleTouchEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    return (
        <div
            ref={containerRef}
            className={clsx(
                'relative overflow-hidden rounded-lg bg-black/50 cursor-crosshair select-none',
                className
            )}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Full Image */}
            <Image
                src={imageUrl}
                alt="Position selector"
                fill
                className="object-contain pointer-events-none"
                sizes="400px"
            />

            {/* Dark overlay outside selection */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Top overlay */}
                <div
                    className="absolute left-0 right-0 bg-black/50"
                    style={{ top: 0, height: pixelPos.y }}
                />
                {/* Bottom overlay */}
                <div
                    className="absolute left-0 right-0 bg-black/50"
                    style={{ top: pixelPos.y + selectorSize.height, bottom: 0 }}
                />
                {/* Left overlay */}
                <div
                    className="absolute bg-black/50"
                    style={{
                        left: 0,
                        width: pixelPos.x,
                        top: pixelPos.y,
                        height: selectorSize.height,
                    }}
                />
                {/* Right overlay */}
                <div
                    className="absolute bg-black/50"
                    style={{
                        right: 0,
                        left: pixelPos.x + selectorSize.width,
                        top: pixelPos.y,
                        height: selectorSize.height,
                    }}
                />
            </div>

            {/* Selector Box */}
            <div
                className={clsx(
                    'absolute border-2 border-white rounded shadow-lg cursor-move transition-shadow',
                    isDragging ? 'border-dagger-gold shadow-[0_0_0_2px_rgba(200,155,60,0.5)]' : 'hover:border-dagger-gold/70'
                )}
                style={{
                    left: pixelPos.x,
                    top: pixelPos.y,
                    width: selectorSize.width,
                    height: selectorSize.height,
                }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            >
                {/* Corner handles for visual feedback */}
                <div className="absolute -top-1 -left-1 w-2 h-2 bg-white rounded-full" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full" />
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white rounded-full" />
                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white rounded-full" />

                {/* Center crosshair */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-4 h-[2px] bg-white/50" />
                    <div className="absolute w-[2px] h-4 bg-white/50" />
                </div>
            </div>

            {/* Instructions */}
            <div className="absolute bottom-2 left-2 right-2 text-center">
                <span className="text-xs text-white/70 bg-black/50 px-2 py-1 rounded">
                    Drag to position the visible area
                </span>
            </div>
        </div>
    );
}
