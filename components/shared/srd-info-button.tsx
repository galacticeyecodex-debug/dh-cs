'use client';

/**
 * SRD INFO BUTTON COMPONENT
 * ----------------------------------------------------------------------------
 * A reusable button that opens an SRD info sheet when clicked.
 *
 * FUNCTIONALITY:
 * - Displays an info icon that matches existing UI patterns
 * - Opens the SRDInfoSheet modal when clicked
 * - Prevents event propagation to avoid triggering parent click handlers
 *
 * USAGE:
 * <SRDInfoButton ruleKey="combat.attackRolls" />
 *
 * UI Pattern: Info button at size 12, gray-400 default, gold when active
 */

import React, { useState } from 'react';
import { AppIcons } from '@/lib/icon-utils';
import SRDInfoSheet from './srd-info-sheet';
import clsx from 'clsx';

interface SRDInfoButtonProps {
  ruleKey: string;
  title?: string; // Optional custom title for the sheet header
  className?: string;
  size?: number;
}

export default function SRDInfoButton({
  ruleKey,
  title,
  className,
  size = 12
}: SRDInfoButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={clsx(
          "p-0.5 hover:bg-white/10 rounded transition-colors",
          isOpen ? "text-dagger-gold" : "text-gray-400 hover:text-gray-300",
          className
        )}
        title="View game rules"
        aria-label="View game rules"
      >
        <AppIcons.ui.info size={size} />
      </button>

      <SRDInfoSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        ruleKey={ruleKey}
        title={title}
      />
    </>
  );
}
