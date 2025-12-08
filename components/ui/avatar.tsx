"use client"

/**
 * AVATAR COMPONENT
 * ----------------------------------------------------------------------------
 * This is a reusable UI component built on top of Radix UI's Avatar primitive.
 * It provides a standardized way to display user or character avatars across the application.
 * 
 * COMPOSITION:
 * - Avatar: The root container that handles the circular shape and overflow.
 * - AvatarImage: The component for rendering the actual image source.
 * - AvatarFallback: A fallback element displayed when the image fails to load or acts as a placeholder
 *   (e.g., displaying initials).
 * 
 * Styling uses Tailwind classes via the `cn` utility for easy customization and consistent design.
 */

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-secondary flex size-full items-center justify-center rounded-[inherit] text-xs",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarFallback, AvatarImage }
