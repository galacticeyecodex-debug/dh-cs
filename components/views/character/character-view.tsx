'use client';

/**
 * CHARACTER VIEW
 * ----------------------------------------------------------------------------
 * This is the main dashboard for viewing a character's core information.
 * 
 * FUNCTIONALITY:
 * - Displays critical character data: Vitals (HP, Stress), Stats (Traits), and Experiences.
 * - Manages sub-panels for "Stats", "Gallery" (character images), and "Lore" (backstory details).
 * - Integrates leveling up and character management interactions via modals.
 * - Handles image uploads for profile and background banners.
 * - Provides quick toggles to show/hide sections for a cleaner interface.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCharacterStore } from '@/store/character-store';
import Image from 'next/image';
import { getStatModifiers } from '@/lib/modifier-aggregator';
import { calculateRollBonus } from '@/lib/roll-utils';
import { getTier } from '@/lib/level-up-helpers';
import StatButton from '@/components/views/character/trait-button';

import { MarkdownText } from '@/components/shared/markdown-text';
import CommonVitalsDisplay from '@/components/vitals/common-vitals-display';
import ExperienceSheet from './experience-manager';
import ExperienceCard from './experience-card';
import LevelUpModal from './level-up/level-up-modal';
import ModifierSheet from '@/components/shared/modifier-sheet';
import ManageCharacterModal from './manage-character-modal';
import SectionHeader from '@/components/shared/section-header';
import AdvancementHistory from './level-up/advancement-history';
import SubclassFeatureCard from './subclass-features/subclass-feature-card';
import CompanionSheet from './subclass-features/beastbound-companion-sheet';
import AttackCard from '@/components/views/combat/attack-card';
import PrayerDiceCard from './class-features/seraph-prayer-dice-card';
import RallyDiceCard from './class-features/bard-rally-card';
import UnstoppableCard from './class-features/guardian-unstoppable-card';
import StrangePatternsCard from './class-features/wizard-strange-patterns-card';
import BeastformCard from './class-features/druid-beastform-card';
import RangerFocusCard from './class-features/ranger-focus-card';
import SlayerDiceCard from './class-features/warrior-slayer-dice-card';
import { AppIcons, getIconByName } from '@/lib/icon-utils';
import clsx from 'clsx';
import { uploadCharacterImage, uploadCharacterAvatar } from '@/lib/storage-service';
import { MAX_IMAGE_FILE_SIZE, MAX_IMAGE_FILE_SIZE_MB } from '@/lib/image-utils';
import { toast } from 'sonner';
import { dataService } from '@/lib/data-service';
import { ErrorBoundary } from '@/components/core/error-boundary';
import { DomainAbilityButton } from '@/components/shared/ability-cost-button';
import { Z_INDEX } from '@/constants/z-index';
import ViewHeader from '@/components/shared/view-header';
import SRDInfoButton from '@/components/shared/srd-info-button';
import { User } from '@/lib/icon-utils';

import MechanicsTray from '@/components/shared/mechanics-tray';
import useContentAccess from '@/hooks/useContentAccess';
import { srdAncestries, srdCommunities, getAllClasses } from '@/lib/content-loaders';
import type { EnhancedAncestry, EnhancedCommunity } from '@/types/cards';

export default function CharacterView() {
  const router = useRouter();
  const { character, user, cardStates, updateModifiers, updateExperiences, updateLore, updateGallery, updateImage, updateBackgroundImage, levelUpCharacter, updateCharacterDetails, updateMarkedTraits, updateCompanion, updatePrayerDice, updateBardRallyDice, updateGuardianUnstoppable, updateWizardStrangePatterns, updateDruidBeastform, updateRangerFocus, updateWarriorSlayerDice, prepareRoll } = useCharacterStore();
  const { includePlaytest } = useContentAccess();
  const [isExperienceSheetOpen, setIsExperienceSheetOpen] = useState(false);
  const [isLevelUpOpen, setIsLevelUpOpen] = useState(false);
  const [isLevelUpLoading, setIsLevelUpLoading] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isManageLoading, setIsManageLoading] = useState(false);
  const [showVitals, setShowVitals] = useState(false);
  const [showTraits, setShowTraits] = useState(true);
  const [showExperiences, setShowExperiences] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'gallery' | 'lore'>('stats');
  const [isUploading, setIsUploading] = useState(false);
  const [domainCards, setDomainCards] = useState<any[]>([]);
  const [subclasses, setSubclasses] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [showAncestry, setShowAncestry] = useState(true);
  const [showCommunity, setShowCommunity] = useState(true);
  const [isTraitModifierSheetOpen, setIsTraitModifierSheetOpen] = useState(false);
  const [showClassFeatures, setShowClassFeatures] = useState(true);
  const [showSubclassFeatures, setShowSubclassFeatures] = useState(true);
  const [showCompanion, setShowCompanion] = useState(true);
  const [isCompanionSheetOpen, setIsCompanionSheetOpen] = useState(false);
  const [ancestryCard, setAncestryCard] = useState<any>(null);
  const [communityCard, setCommunityCard] = useState<any>(null);
  const [transformationCard, setTransformationCard] = useState<any>(null);
  const [showAncestryLore, setShowAncestryLore] = useState(false);
  const [showCommunityLore, setShowCommunityLore] = useState(false);
  const [showTransformation, setShowTransformation] = useState(true);
  const [showTransformationLore, setShowTransformationLore] = useState(true);
  const [showClassLore, setShowClassLore] = useState(false);
  const [showSubclassLore, setShowSubclassLore] = useState(false);
  const [showMulticlassLore, setShowMulticlassLore] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [savingField, setSavingField] = useState<string>('');
  const [savedField, setSavedField] = useState<string>('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showViewHeader, setShowViewHeader] = useState(false); // Toggle for ViewHeader display

  // Resolve dynamic icons for vitals
  const { vitalIcons } = useCharacterStore();
  const HPIcon = getIconByName(vitalIcons.hitPoints, AppIcons.vitals.hitPoints);
  const StressIcon = getIconByName(vitalIcons.stress, AppIcons.vitals.stress);
  const HopeIcon = getIconByName(vitalIcons.hope, AppIcons.vitals.hope);

  // Look up enhanced class data (has costs info for features)
  // Uses getAllClasses to include playtest classes
  const enhancedClassData = useMemo(() => {
    if (!character?.class_data?.name) return null;
    const allClasses = getAllClasses(includePlaytest);
    return allClasses.find(c => c.name === character.class_data?.name) || null;
  }, [character?.class_data?.name, includePlaytest]);

  // Look up enhanced Hope Feature from class data (has costs info)
  const enhancedHopeFeature = useMemo(() => {
    return enhancedClassData?.hope_feat_enhanced || null;
  }, [enhancedClassData]);

  // Look up enhanced class features (class_feats with enhancement data)
  const enhancedClassFeats = useMemo(() => {
    return enhancedClassData?.class_feats || [];
  }, [enhancedClassData]);

  // Helper to look up enhanced ancestry feature by name
  // This ensures we always get enhancement data even if character.ancestry_features is set
  const getEnhancedAncestryFeature = useMemo(() => {
    const enhancedAncestries = (srdAncestries || []) as any[];
    return (ancestryName: string, featureName: string) => {
      const ancestry = enhancedAncestries.find(a => a.name === ancestryName);
      if (!ancestry) return null;
      return (ancestry.feats || []).find((f: any) => f.name === featureName) || null;
    };
  }, []);

  // Helper to look up enhanced community feature by name
  const getEnhancedCommunityFeature = useMemo(() => {
    const enhancedCommunities = (srdCommunities || []) as any[];
    return (communityName: string, featureName: string) => {
      const community = enhancedCommunities.find(c => c.name === communityName);
      if (!community) return null;
      return (community.feats || []).find((f: any) => f.name === featureName) || null;
    };
  }, []);

  // Scroll to a specific section by header text
  const scrollToSection = (title: string) => {
    const doScroll = () => {
      const headers = document.querySelectorAll('h3, h4');
      for (const header of Array.from(headers)) {
        if (header.textContent?.toLowerCase().includes(title.toLowerCase())) {
          header.scrollIntoView({ behavior: 'smooth' });
          break;
        }
      }
    };

    if (activeTab !== 'stats') {
      setActiveTab('stats');
      // Wait for tab transition and render
      setTimeout(doScroll, 100);
    } else {
      doScroll();
    }
  };

  // Memoize trait tabs for centralized ModifierSheet
  const traitTabs = useMemo(() => {
    if (!character) return [];
    return Object.entries(character.stats).map(([key, value]) => {
      const allMods = getStatModifiers(character, key);

      return {
        id: key,
        label: key.charAt(0).toUpperCase() + key.slice(1),
        baseValue: value,
        currentModifiers: allMods,
        onUpdateModifiers: (mods: any[]) => updateModifiers(key, mods)
      };
    });
  }, [character, updateModifiers]);

  // Debounced save handler for lore fields
  const handleLoreChange = (field: string, value: string) => {
    setSavingField(field);
    setSavedField('');

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateLore({ [field]: value } as any);
        setSavingField('');
        setSavedField(field);
        // Clear saved indicator after 2 seconds
        setTimeout(() => setSavedField(''), 2000);
      } catch (err) {
        setSavingField('');
        toast.error(`Failed to save ${field}`);
      }
    }, 800);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Fetch domain cards and other library data from database
  // Ancestry and community use enhanced JSON directly for token support (same as combat-view)
  useEffect(() => {
    const fetchLibraryData = async () => {
      try {
        const data = await dataService.library.getAll({ includePlaytest });

        if (data) {
          // Parse cards
          const cards = data.map((lib: any) => ({
            id: lib.id,
            name: lib.name,
            domain: lib.domain,
            type: lib.type || lib.data?.type || '',
            data: lib.data || {},
          }));

          // Filter domain cards
          const domainCardsList = cards.filter((c: any) => c.domain && c.type);
          setDomainCards(domainCardsList);

          // Filter subclasses
          const subclassesList = cards.filter((c: any) => c.type === 'subclass');
          setSubclasses(subclassesList);

          // Filter classes (for linking subclasses)
          const classesList = cards.filter((c: any) => c.type === 'class');
          setClasses(classesList);

          // Find ancestry card - use enhanced JSON for proper feature data with tokens
          if (character?.ancestry) {
            const enhancedAncestries = (srdAncestries || []) as EnhancedAncestry[];
            const ancestry = enhancedAncestries.find(a => a.name === character.ancestry);
            if (ancestry) {
              setAncestryCard({
                name: ancestry.name,
                description: ancestry.description || '',
                // Character-specific features override default ancestry features (for mixed ancestry)
                features: character.ancestry_features || ancestry.feats || [],
              });
            } else if (character.ancestry_features) {
              // Mixed ancestry case or custom ancestry not in SRD
              setAncestryCard({
                name: character.ancestry,
                description: 'Mixed Ancestry',
                features: character.ancestry_features,
              });
            }
          }

          // Find community card - use enhanced JSON for proper token support
          if (character?.community) {
            const enhancedCommunities = (srdCommunities || []) as EnhancedCommunity[];
            const community = enhancedCommunities.find(c => c.name === character.community);
            if (community) {
              setCommunityCard({
                name: community.name,
                description: community.description || '',
                // Enhanced JSON has feats with enhancement.tokens structure
                features: community.feats || [],
              });
            }
          }

          // Find transformation card from database
          if (character?.transformation) {
            const transformation = data.find((lib: any) => lib.name === character.transformation && lib.type === 'transformation');
            if (transformation) {
              setTransformationCard({
                name: transformation.name,
                description: transformation.data?.description || '',
                features: transformation.data?.features || [],
                questions: transformation.data?.questions || [],
              });
            }
          }
        }
      } catch (error) {
        console.error('Failed to load library data:', error);
      }
    };

    fetchLibraryData();
  }, [character?.ancestry, character?.ancestry_features, character?.community, character?.transformation, includePlaytest]);

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !character || !user) return;

    const file = e.target.files[0];

    if (file.size > MAX_IMAGE_FILE_SIZE) {
      toast.error(`File size must be less than ${MAX_IMAGE_FILE_SIZE_MB}`);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    const { url, error } = await uploadCharacterImage(user.id, file, character.id);

    if (url) {
      await updateBackgroundImage(url);
      // Also add it to our gallery so it's not lost
      const currentGallery = character.gallery_images || [];
      if (!currentGallery.includes(url)) {
        await updateGallery([...currentGallery, url]);
      }
      toast.success('Banner updated successfully');
    } else {
      toast.error(error || 'Failed to upload banner.');
    }

    setIsUploading(true); // Small delay feel
    setTimeout(() => setIsUploading(false), 500);

    if (bannerInputRef.current) {
      bannerInputRef.current.value = '';
    }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !character || !user) return;

    const file = e.target.files[0];

    if (file.size > MAX_IMAGE_FILE_SIZE) {
      toast.error(`File size must be less than ${MAX_IMAGE_FILE_SIZE_MB}`);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    const { url, error } = await uploadCharacterAvatar(user.id, file, character.id);

    if (url) {
      await updateImage(url);
      // Also add it to our gallery so it's not lost
      const currentGallery = character.gallery_images || [];
      if (!currentGallery.includes(url)) {
        await updateGallery([...currentGallery, url]);
      }
      toast.success('Portrait updated successfully');
    } else {
      toast.error(error || 'Failed to upload portrait.');
    }

    setIsUploading(true);
    setTimeout(() => setIsUploading(false), 500);

    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !character || !user) return;

    const file = e.target.files[0];

    if (file.size > MAX_IMAGE_FILE_SIZE) {
      toast.error(`File size must be less than ${MAX_IMAGE_FILE_SIZE_MB}`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    const { url, error } = await uploadCharacterImage(user.id, file, character.id);

    if (url) {
      const currentGallery = character.gallery_images || [];
      await updateGallery([...currentGallery, url]);
      toast.success('Image uploaded successfully');
    } else {
      toast.error(error || 'Failed to upload image.');
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteImage = async (urlToDelete: string) => {
    if (!character) return;
    if (confirm('Are you sure you want to delete this image?')) {
      const currentGallery = character.gallery_images || [];
      const updatedGallery = currentGallery.filter(url => url !== urlToDelete);
      await updateGallery(updatedGallery);
      // Note: We are strictly removing it from the gallery list.
      // Deleting the actual file from storage is optional/advanced as it might be used elsewhere.
    }
  };

  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <div className="animate-pulse">Loading Character...</div>
      </div>
    );
  }

  // Helper to calculate totals and combine modifiers for Traits
  const getStatDetails = (stat: string, base: number) => {
    const allMods = getStatModifiers(character, stat);
    const total = base + allMods.reduce((acc, mod) => acc + mod.value, 0);
    return { total, allMods };
  };

  return (
    <ErrorBoundary>
      <div className="pb-24">
        {/* Header - Optional (controlled by showViewHeader state) */}
        {showViewHeader && (
          <div className="p-4">
            <ViewHeader
              icon={User}
              title="Character"
              subtitle="Manage your character's stats, lore, and art"
            />
          </div>
        )}

        {/* Social Profile Header */}
        <div className="relative w-full h-48 md:h-64 bg-gray-900 overflow-hidden group/header">
          {/* Banner Background */}
          <div className="absolute inset-0 opacity-60 transition-opacity duration-700 group-hover/header:opacity-70">
            <Image
              src={character.background_image_url || '/images/banner-placeholder.jpg'}
              alt="Banner Background"
              fill
              className="object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-dagger-dark via-dagger-dark/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-dagger-dark/40 via-transparent to-transparent hidden md:block" />

          {/* Top Right Controls */}
          <div 
            className="absolute top-4 right-4 flex items-center gap-2"
            style={{ zIndex: Z_INDEX.VIEW_CONTROLS }}
          >
            <input
              type="file"
              ref={bannerInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleUploadBanner}
            />
            <button
              onClick={() => bannerInputRef.current?.click()}
              className="bg-black/40 hover:bg-black/60 text-gray-400 hover:text-dagger-gold transition-colors p-2 rounded-full border border-white/10 shadow-lg"
              aria-label="Edit banner artwork"
              title="Edit Banner Artwork"
              disabled={isUploading}
            >
              <AppIcons.ui.image size={16} />
            </button>
            <button
              onClick={() => setIsManageOpen(true)}
              className="bg-black/40 hover:bg-black/60 text-gray-400 hover:text-dagger-gold transition-colors p-2 rounded-full border border-white/10 shadow-lg"
              aria-label="Manage character settings"
              title="Manage Character"
            >
              <AppIcons.ui.settings size={16} />
            </button>
          </div>

          {/* Profile Avatar & Basic Info */}
          <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 flex flex-col justify-end">
            <div className="flex items-center gap-4 md:gap-6">
              {/* Portrait Avatar Container */}
              <div className="w-[120px] h-[120px] bg-gray-800 rounded-3xl rotate-2 p-1.5 border-4 border-dagger-gold shadow-2xl flex-shrink-0 relative group transition-transform duration-300 overflow-hidden">
                <div className="w-full h-full rounded-2xl overflow-hidden relative">
                  <Image
                    src={character.image_url || '/images/portrait-placeholder.jpg'}
                    alt={character.name || "Character Avatar"}
                    width={120}
                    height={120}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Artwork Edit Button (Art Icon style) */}
                <div 
                  className="absolute top-2 right-2"
                  style={{ zIndex: Z_INDEX.BASE + 1 }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      avatarInputRef.current?.click();
                    }}
                    className="p-1 rounded-lg bg-black/60 text-gray-400 hover:text-dagger-gold border border-white/10 backdrop-blur-sm transition-all shadow-lg"
                    aria-label="Edit character portrait"
                    title="Edit Portrait"
                    disabled={isUploading}
                  >
                    <AppIcons.ui.image size={12} />
                  </button>
                </div>

                <input
                  type="file"
                  ref={avatarInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleUploadAvatar}
                />
              </div>

              {/* Character Info - Compact Single Row */}
              <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                {(() => {
                  const tier = getTier(character.level);
                  const subclassName = character.subclass_data?.name || character.subclass_id || null;

                  return (
                    <>
                      {/* Compact Core Stats Badge */}
                      <div className="flex items-center gap-1.5 text-dagger-gold font-bold text-xs md:text-sm uppercase bg-black/50 px-2 py-1 rounded border border-dagger-gold/30 backdrop-blur-md">
                        <span>Lvl {character.level}</span>
                        <span className="text-dagger-gold/40">•</span>
                        <span className="text-dagger-gold/80">T{tier}</span>
                      </div>

                      {/* Class - Clickable */}
                      <button
                        onClick={() => scrollToSection('Class Features')}
                        className="text-dagger-gold font-bold text-xs md:text-sm uppercase bg-black/40 hover:bg-dagger-gold/10 px-2 py-1 rounded border border-dagger-gold/30 backdrop-blur-md transition-all hover:border-dagger-gold/50 cursor-pointer"
                        title={`View ${character.class_id} features`}
                      >
                        {character.class_id}
                      </button>

                      {/* Subclass - Clickable */}
                      {subclassName && (
                        <button
                          onClick={() => scrollToSection('Subclass Features')}
                          className="text-dagger-gold font-medium text-xs md:text-sm bg-black/40 hover:bg-dagger-gold/10 px-2 py-1 rounded border border-dagger-gold/30 backdrop-blur-md transition-all hover:border-dagger-gold/50 cursor-pointer truncate max-w-[100px] md:max-w-[140px]"
                          title={`View ${subclassName} features`}
                        >
                          {subclassName}
                        </button>
                      )}

                      {/* Divider */}
                      {(character.ancestry || character.community || character.transformation) && (
                        <span className="text-white/20">|</span>
                      )}

                      {/* Ancestry - Clickable */}
                      {character.ancestry && (
                        <button
                          onClick={() => scrollToSection('Ancestry')}
                          className="text-gray-200 text-xs md:text-sm bg-black/30 hover:bg-emerald-900/30 px-2 py-1 rounded border border-white/10 hover:border-emerald-500/40 backdrop-blur-md transition-all cursor-pointer"
                          title="View Ancestry"
                        >
                          {character.ancestry}
                        </button>
                      )}

                      {/* Community - Clickable */}
                      {character.community && (
                        <button
                          onClick={() => scrollToSection('Community')}
                          className="text-gray-200 text-xs md:text-sm bg-black/30 hover:bg-blue-900/30 px-2 py-1 rounded border border-white/10 hover:border-blue-500/40 backdrop-blur-md transition-all cursor-pointer"
                          title="View Community"
                        >
                          {character.community}
                        </button>
                      )}

                      {/* Transformation - Clickable */}
                      {character.transformation && (
                        <button
                          onClick={() => scrollToSection('Transformation')}
                          className="text-purple-200 text-xs md:text-sm bg-purple-900/30 hover:bg-purple-800/40 px-2 py-1 rounded border border-purple-500/30 hover:border-purple-400/50 backdrop-blur-md transition-all cursor-pointer"
                          title="View Transformation"
                        >
                          {character.transformation}
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>



          </div> {/* Closes Profile Avatar & Basic Info */}
        </div> {/* Closes Social Profile Header */}

        {/* Segmented Control (Sticky Tab Bar) */}
        <div 
          className="sticky top-0 bg-dagger-dark/95 backdrop-blur border-b border-white/10 px-4 py-2 flex justify-between items-center shadow-sm"
          style={{ zIndex: Z_INDEX.HEADER }}
        >
          <div className="flex p-1 bg-white/5 rounded-lg w-full">
            <button
              onClick={() => setActiveTab('stats')}
              className={clsx(
                "flex-1 py-1.5 px-3 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                activeTab === 'stats' ? "bg-dagger-gold text-black shadow-sm" : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <AppIcons.ui.stats size={14} /> Stats
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={clsx(
                "flex-1 py-1.5 px-3 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                activeTab === 'gallery' ? "bg-dagger-gold text-black shadow-sm" : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <AppIcons.ui.dashboard size={14} /> Gallery
            </button>
            <button
              onClick={() => setActiveTab('lore')}
              className={clsx(
                "flex-1 py-1.5 px-3 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                activeTab === 'lore' ? "bg-dagger-gold text-black shadow-sm" : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <AppIcons.ui.lore size={14} /> Lore
            </button>
          </div>
        </div>

        <div className="p-4">
          {activeTab === 'stats' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* Vitals Grid */}
              <div className="space-y-2">
                <SectionHeader
                  title="Vitals"
                  isVisible={showVitals}
                  onToggle={() => setShowVitals(!showVitals)}
                />
                {showVitals && <CommonVitalsDisplay character={character} />}
              </div>

              {/* Stats Grid */}
              <div className="space-y-2">
                <SectionHeader
                  title={<>Traits <SRDInfoButton ruleKey="traits.general" title="Traits" /></>}
                  isVisible={showTraits}
                  onToggle={() => setShowTraits(!showTraits)}
                  onManage={() => setIsTraitModifierSheetOpen(true)}
                  manageLabel="Manage"
                />
                {showTraits && (
                  <div className="bg-dagger-panel border border-white/10 rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(character.stats).map(([key, value]) => {
                        const { total, allMods } = getStatDetails(key, value);
                        const spellcastTrait = (character.spellcast_trait || character.subclass_data?.data?.spellcast_trait || 'Instinct').toLowerCase();
                        const isSpellcast = key.toLowerCase() === spellcastTrait;
                        const isMarked = character.marked_traits_jsonb?.[key] || false;

                        const toggleMark = () => {
                          const newMarked = { ...(character.marked_traits_jsonb || {}) };
                          if (isMarked) {
                            delete newMarked[key];
                          } else {
                            newMarked[key] = true;
                          }
                          updateMarkedTraits(newMarked);
                        };

                        return (
                          <div key={key} className="relative">
                            <StatButton
                              label={key}
                              value={total}
                              baseValue={value}
                              modifiers={allMods}
                              onUpdateModifiers={(mods) => updateModifiers(key, mods)}
                              hideModifierButton={true}
                              isSpellcast={isSpellcast}
                              isNested={true}
                            />
                            <button
                              onClick={toggleMark}
                              className={`absolute -top-0.5 -left-0.5 w-4 h-4 rounded-full transition-all border border-gray-500 ${isMarked
                                ? 'bg-dagger-gold'
                                : 'bg-[var(--indicator-unmarked)] hover:bg-[var(--indicator-unmarked-hover)]'
                                }`}
                              aria-label={isMarked ? `Unmark ${key} trait` : `Mark ${key} trait`}
                              title={isMarked ? 'Trait is marked (cannot be increased until tier clear)' : 'Mark trait as used'}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Experiences Section */}
              <div className="space-y-2">
                <SectionHeader
                  title={<>Experiences <SRDInfoButton ruleKey="character.experiences" title="Experiences" /></>}
                  isVisible={showExperiences}
                  onToggle={() => setShowExperiences(!showExperiences)}
                  onManage={() => setIsExperienceSheetOpen(true)}
                  manageLabel="Manage"
                />

                {showExperiences && (
                  <div className="bg-dagger-panel border border-white/10 rounded-xl p-4 space-y-2">
                    {character.experiences && character.experiences.length > 0 ? (
                      character.experiences.map((exp, index) => (
                        <ExperienceCard
                          key={index}
                          name={exp.name}
                          value={exp.value}
                          isNested={true}
                        />
                      ))
                    ) : (
                      <div
                        onClick={() => setIsExperienceSheetOpen(true)}
                        className="text-gray-500 text-sm italic p-4 border border-dashed border-white/10 rounded-lg text-center cursor-pointer hover:bg-white/5"
                      >
                        No experiences recorded. Tap to add.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Ancestry Section */}
              {character.ancestry && (
                <div className="space-y-2">
                  <SectionHeader
                    title={<>Ancestry <SRDInfoButton ruleKey="character.ancestry" title="Ancestry" /></>}
                    isVisible={showAncestry}
                    onToggle={() => setShowAncestry(!showAncestry)}
                  />

                  {showAncestry && (
                    <div className="bg-dagger-panel border border-white/10 rounded-xl p-4 space-y-3">
                      {ancestryCard ? (
                        <>
                          <div className="flex items-center justify-between">
                            <h4 className="font-serif font-bold text-white">{ancestryCard.name}</h4>
                            <button
                              onClick={() => setShowAncestryLore(!showAncestryLore)}
                              className="p-1 hover:bg-white/10 rounded transition-colors"
                              aria-label={showAncestryLore ? `Hide lore for ${ancestryCard.name}` : `Show lore for ${ancestryCard.name}`}
                              title={showAncestryLore ? "Hide lore" : "Show lore"}
                            >
                              <AppIcons.ui.info size={12} className={showAncestryLore ? "text-dagger-gold" : "text-gray-400"} />
                            </button>
                          </div>
                          {showAncestryLore && (
                            <p className="text-sm text-gray-300 whitespace-pre-wrap p-3 bg-white/5 rounded-lg border border-white/5">
                              {ancestryCard.description}
                            </p>
                          )}
                          {ancestryCard.features?.map((feature: any, i: number) => {
                            // Always look up enhancement from enhanced JSON (character.ancestry_features may not have it)
                            const enhancedFeature = getEnhancedAncestryFeature(ancestryCard.name, feature.name);
                            const enhancedData = enhancedFeature;
                            const enhancement = enhancedFeature?.enhancement || feature.enhancement;
                            const hasRoll = enhancement?.roll?.trait;

                            // Calculate roll bonus with proper modifier support
                            const rollResult = hasRoll ? calculateRollBonus(character, enhancement.roll.trait, cardStates) : null;
                            const rollBonus = rollResult?.bonus ?? 0;
                            const rollLabel = hasRoll ? `${rollResult?.label}${enhancement.roll.difficulty ? ` (${enhancement.roll.difficulty})` : ''}` : '';

                            return (
                              <AttackCard
                                key={i}
                                id={`ancestry-${ancestryCard.name}-${feature.name}`}
                                name={feature.name}
                                description={feature.text}
                                enhancedData={enhancedData}
                                context="character"
                                variant="feature"
                                borderVariant="ancestry"
                                totalAttackBonus={rollBonus}
                                onAttackRoll={hasRoll ? () => prepareRoll(`${feature.name} ${rollLabel}`, rollBonus) : undefined}
                              />
                            );
                          })}
                        </>
                      ) : (
                        <div className="text-gray-400 italic text-sm">
                          {character.ancestry} details not found.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Community Section */}
              {character.community && (
                <div className="space-y-2">
                  <SectionHeader
                    title={<>Community <SRDInfoButton ruleKey="character.community" title="Community" /></>}
                    isVisible={showCommunity}
                    onToggle={() => setShowCommunity(!showCommunity)}
                  />

                  {showCommunity && (
                    <div className="bg-dagger-panel border border-white/10 rounded-xl p-4 space-y-3">
                      {communityCard ? (
                        <>
                          <div className="flex items-center justify-between">
                            <h4 className="font-serif font-bold text-white">{communityCard.name}</h4>
                            <button
                              onClick={() => setShowCommunityLore(!showCommunityLore)}
                              className="p-1 hover:bg-white/10 rounded transition-colors"
                              aria-label={showCommunityLore ? `Hide lore for ${communityCard.name}` : `Show lore for ${communityCard.name}`}
                              title={showCommunityLore ? "Hide lore" : "Show lore"}
                            >
                              <AppIcons.ui.info size={12} className={showCommunityLore ? "text-dagger-gold" : "text-gray-400"} />
                            </button>
                          </div>
                          {showCommunityLore && (
                            <p className="text-sm text-gray-300 whitespace-pre-wrap p-3 bg-white/5 rounded-lg border border-white/5">
                              {communityCard.description}
                            </p>
                          )}
                          {communityCard.features?.map((feature: any, i: number) => {
                            // Always look up enhancement from enhanced JSON for safety
                            const enhancedFeature = getEnhancedCommunityFeature(communityCard.name, feature.name);
                            const enhancedData = enhancedFeature;
                            const enhancement = enhancedFeature?.enhancement || feature.enhancement;
                            const hasRoll = enhancement?.roll?.trait;

                            // Calculate roll bonus with proper modifier support
                            const rollResult = hasRoll ? calculateRollBonus(character, enhancement.roll.trait, cardStates) : null;
                            const rollBonus = rollResult?.bonus ?? 0;
                            const rollLabel = hasRoll ? `${rollResult?.label}${enhancement.roll.difficulty ? ` (${enhancement.roll.difficulty})` : ''}` : '';

                            return (
                              <AttackCard
                                key={i}
                                id={`community-${communityCard.name}-${feature.name}`}
                                name={feature.name}
                                description={feature.text}
                                enhancedData={enhancedData}
                                context="character"
                                variant="feature"
                                borderVariant="community"
                                totalAttackBonus={rollBonus}
                                onAttackRoll={hasRoll ? () => prepareRoll(`${feature.name} ${rollLabel}`, rollBonus) : undefined}
                              />
                            );
                          })}
                        </>
                      ) : (
                        <div className="text-gray-400 italic text-sm">
                          {character.community} details not found.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Transformation Section */}
              {character.transformation && (
                <div className="space-y-2">
                  <SectionHeader
                    title="Transformation"
                    isVisible={showTransformation}
                    onToggle={() => setShowTransformation(!showTransformation)}
                  />

                  {showTransformation && (
                    <div className="bg-dagger-panel border border-white/10 rounded-xl p-4 space-y-3">
                      {transformationCard ? (
                        <>
                          <div className="flex items-center justify-between">
                            <h4 className="font-serif font-bold text-white">{transformationCard.name}</h4>
                            <button
                              onClick={() => setShowTransformationLore(!showTransformationLore)}
                              className="p-1 hover:bg-white/10 rounded transition-colors"
                              aria-label={showTransformationLore ? `Hide lore for ${transformationCard.name}` : `Show lore for ${transformationCard.name}`}
                              title={showTransformationLore ? "Hide lore" : "Show lore"}
                            >
                              <AppIcons.ui.info size={12} className="text-gray-400" />
                            </button>
                          </div>
                          {showTransformationLore && (
                            <p className="text-sm text-gray-300 whitespace-pre-wrap p-3 bg-white/5 rounded-lg border border-white/5">
                              {transformationCard.description}
                            </p>
                          )}
                          {transformationCard.features?.map((feature: any, i: number) => (
                            <AttackCard
                              key={i}
                              id={`transformation-${transformationCard.name}-${feature.name}`}
                              name={feature.name}
                              description={feature.text}
                              context="character"
                              variant="feature"
                              borderVariant="class"
                            />
                          ))}
                        </>
                      ) : (
                        <div className="text-gray-400 italic text-sm">
                          {character.transformation} details not found.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}


              {/* Class Features Section */}
              {character.class_data && (
                <div className="space-y-2">
                  <SectionHeader
                    title={<>Class Features <SRDInfoButton ruleKey="character.class" title="Class Features" /></>}
                    isVisible={showClassFeatures}
                    onToggle={() => setShowClassFeatures(!showClassFeatures)}
                  />

                  {showClassFeatures && (
                    <div className="bg-dagger-panel border border-white/10 rounded-xl p-4 space-y-3">
                      {/* Class Header with Lore Toggle */}
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif font-bold text-white">{character.class_data.name}</h4>
                        <button
                          onClick={() => setShowClassLore(!showClassLore)}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                          aria-label={showClassLore ? `Hide lore for ${character.class_data.name}` : `Show lore for ${character.class_data.name}`}
                          title={showClassLore ? "Hide lore" : "Show lore"}
                        >
                          <AppIcons.ui.info size={12} className={showClassLore ? "text-dagger-gold" : "text-gray-400"} />
                        </button>
                      </div>

                      {/* Collapsible Class Description */}
                      {showClassLore && character.class_data.data.description && (
                        <p className="text-sm text-gray-300 whitespace-pre-wrap p-3 bg-white/5 rounded-lg border border-white/5">
                          {character.class_data.data.description}
                        </p>
                      )}

                      {/* Hope Feature - use enhanced data for costs */}
                      {(enhancedHopeFeature || character.class_data.data.hope_feature) && (
                        <div className="bg-white/5 rounded p-3 border border-white/5">
                          <div className="text-xs font-bold text-dagger-gold uppercase tracking-wider mb-1 flex items-center gap-1">
                            <HopeIcon size={12} />
                            {enhancedHopeFeature?.name || character.class_data.data.hope_feature?.name}
                          </div>
                          <div className="text-sm text-gray-300 leading-relaxed">
                            <MarkdownText>{enhancedHopeFeature?.text || character.class_data.data.hope_feature?.description}</MarkdownText>
                          </div>
                          {/* Add cost button if enhanced data has costs */}
                          {enhancedHopeFeature?.enhancement?.costs?.hope && (
                            <div className="mt-3 pt-3 border-t border-white/10">
                              <DomainAbilityButton
                                cardName={`hope-feature-${character.class_data.name}`}
                                costType="hope"
                                costValue={enhancedHopeFeature.enhancement.costs.hope}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Core Class Features */}
                      {character.class_data.data.class_features?.map((feature: any, idx: number) => {
                        // Special handling for Bard Rally
                        if (feature.name === 'Rally') {
                          return (
                            <RallyDiceCard
                              key={idx}
                              rallyDice={character.bard_rally_dice}
                              characterLevel={character.level}
                              description={feature.text}
                              onUpdateRallyDice={updateBardRallyDice}
                            />
                          );
                        }

                        // Special handling for Guardian Unstoppable
                        if (feature.name === 'Unstoppable') {
                          return (
                            <UnstoppableCard
                              key={idx}
                              unstoppable={character.guardian_unstoppable}
                              characterLevel={character.level}
                              description={feature.text}
                              onUpdateUnstoppable={updateGuardianUnstoppable}
                            />
                          );
                        }

                        // Special handling for Wizard Strange Patterns
                        if (feature.name === 'Strange Patterns') {
                          return (
                            <StrangePatternsCard
                              key={idx}
                              strangePatterns={character.wizard_strange_patterns}
                              description={feature.text}
                              onUpdateStrangePatterns={updateWizardStrangePatterns}
                            />
                          );
                        }

                        // Special handling for Druid Beastform
                        if (feature.name === 'Beastform') {
                          return (
                            <BeastformCard
                              key={idx}
                              beastform={character.druid_beastform}
                              characterLevel={character.level}
                              onUpdateBeastform={updateDruidBeastform}
                            />
                          );
                        }

                        // Special handling for Ranger Focus
                        // Verify name matches SRD (Smart quote or regular quote)
                        if (feature.name === "Ranger's Focus" || feature.name === "Ranger's Focus") {
                          return (
                            <RangerFocusCard
                              key={idx}
                              rangerFocus={character.ranger_focus}
                              description={feature.text}
                              onUpdateRangerFocus={updateRangerFocus}
                            />
                          );
                        }

                        // Special handling for Prayer Dice - render interactive component
                        if (feature.name === 'Prayer Dice') {
                          const traitName = (character.spellcast_trait || character.subclass_data?.data?.spellcast_trait || '').toLowerCase();
                          const spellcastValue = character.stats[traitName as keyof typeof character.stats] || 0;

                          return (
                            <PrayerDiceCard
                              key={idx}
                              prayerDice={character.seraph_prayer_dice}
                              spellcastValue={spellcastValue}
                              hasDevout={character.subclass_data?.name?.toLowerCase() === 'divine wielder' && character.subclass_progression?.specialization_obtained === true}
                              description={feature.text}
                              onUpdatePrayerDice={updatePrayerDice}
                            />
                          );
                        }

                        // Standard class feature display - look up enhanced data for interactive elements
                        const enhancedFeat = enhancedClassFeats.find((f: any) => f.name === feature.name);
                        const enhancedData = enhancedFeat;
                        const enhancement = enhancedFeat?.enhancement;
                        const hasRoll = enhancement?.roll?.trait;

                        // Calculate roll bonus with proper modifier support (handles Spellcast derivation)
                        const rollResult = hasRoll ? calculateRollBonus(character, enhancement.roll.trait, cardStates) : null;
                        const rollBonus = rollResult?.bonus ?? 0;
                        const rollLabel = hasRoll ? `${rollResult?.label}${enhancement.roll.difficulty ? ` (${enhancement.roll.difficulty})` : ''}` : '';

                        return (
                          <AttackCard
                            key={idx}
                            id={`class-feature-${character.class_data!.name}-${feature.name}`}
                            name={feature.name}
                            description={feature.text}
                            enhancedData={enhancedData}
                            context="character"
                            variant="feature"
                            borderVariant="class"
                            totalAttackBonus={rollBonus}
                            onAttackRoll={hasRoll ? () => prepareRoll(`${feature.name} ${rollLabel}`, rollBonus) : undefined}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Subclass Features Section */}
              {(character.subclass_progression || character.multiclass_progression) && (
                <div className="space-y-2">
                  <SectionHeader
                    title={<>Subclass Features <SRDInfoButton ruleKey="character.subclass" title="Subclass Features" /></>}
                    isVisible={showSubclassFeatures}
                    onToggle={() => setShowSubclassFeatures(!showSubclassFeatures)}
                  />

                  {showSubclassFeatures && (
                    <div className="space-y-3">
                      {/* Primary Subclass Features - Single unified card */}
                      {character.subclass_progression && (
                        <SubclassFeatureCard
                          card={character.character_cards?.find(c =>
                            c.location === 'feature' &&
                            !c.library_item?.data?.multiclass &&
                            c.library_item?.type === 'subclass'
                          ) || (character.subclass_data && character.subclass_id ? {
                            id: 'primary-subclass-fallback',
                            character_id: character.id,
                            card_id: character.subclass_data.id,
                            location: 'feature',
                            state: {},
                            library_item: character.subclass_data
                          } : undefined)}
                          subclassProgression={character.subclass_progression}
                          isMulticlass={false}
                          showLore={showSubclassLore}
                          onToggleLore={() => setShowSubclassLore(!showSubclassLore)}
                        />
                      )}

                      {/* Multiclass Subclass Features - Single unified card */}
                      {character.multiclass_progression && character.multiclass_progression.foundation_obtained && (
                        <SubclassFeatureCard
                          card={character.character_cards?.find(c =>
                            c.location === 'feature' &&
                            c.library_item?.data?.multiclass === true &&
                            c.library_item?.type === 'subclass'
                          )}
                          subclassProgression={character.multiclass_progression}
                          isMulticlass={true}
                          showLore={showMulticlassLore}
                          onToggleLore={() => setShowMulticlassLore(!showMulticlassLore)}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Warrior Slayer Dice Section */}
              {character.class_id?.toLowerCase() === 'warrior' &&
                character.subclass_data?.name?.toLowerCase() === 'call of the slayer' &&
                character.subclass_progression?.foundation_obtained && (
                  <div className="space-y-2">
                    {(() => {
                      // Find the Slayer feature to get its description
                      const slayerFeature = character.subclass_data?.data?.foundation_features?.find(
                        (f: any) => f.name === 'Slayer'
                      );
                      const proficiency = character.proficiency || 1;

                      return (
                        <SlayerDiceCard
                          slayerDice={character.warrior_slayer_dice}
                          proficiency={proficiency}
                          description={slayerFeature?.text || ''}
                          onUpdateSlayerDice={updateWarriorSlayerDice}
                        />
                      );
                    })()}
                  </div>
                )}

              {/* Beastbond Ranger Companion Section */}
              {character.class_id?.toLowerCase() === 'ranger' &&
                character.subclass_data?.name?.toLowerCase() === 'beastbound' &&
                character.subclass_progression?.foundation_obtained && (
                  <div className="space-y-2">
                    <SectionHeader
                      title={<><AppIcons.campaign.companion size={14} /> Companion</>}
                      isVisible={showCompanion}
                      onToggle={() => setShowCompanion(!showCompanion)}
                      onManage={() => setIsCompanionSheetOpen(true)}
                      manageLabel="Manage"
                    />

                    {showCompanion && (
                      <div className="bg-dagger-panel border border-white/10 rounded-xl overflow-hidden">
                        {character.ranger_companion ? (
                          <div>
                            {/* Companion Header with Portrait */}
                            <div className="flex items-center gap-4 p-4 border-b border-white/10">
                              {/* Companion Portrait */}
                              <div
                                onClick={() => setIsCompanionSheetOpen(true)}
                                className="w-16 h-16 bg-gray-800 rounded-xl border-2 border-dagger-gold/50 flex-shrink-0 relative group cursor-pointer overflow-hidden"
                              >
                                {character.ranger_companion.image_url ? (
                                  <Image
                                    src={character.ranger_companion.image_url}
                                    alt={character.ranger_companion.name}
                                    width={64}
                                    height={64}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-dagger-gold/20 to-dagger-gold/5">
                                    <AppIcons.campaign.companion size={24} className="text-dagger-gold/60" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <AppIcons.ui.camera size={16} className="text-white" />
                                </div>
                              </div>

                              {/* Name & Type */}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-serif font-bold text-white text-lg truncate">
                                  {character.ranger_companion.name}
                                </h4>
                                <p className="text-sm text-gray-400 capitalize">{character.ranger_companion.animal_type}</p>
                              </div>

                              {/* Evasion Badge */}
                              <div className="bg-dagger-panel border border-cyan-500/30 rounded-lg px-3 py-2 text-center">
                                <div className="text-[10px] font-bold uppercase tracking-wide text-cyan-400 flex items-center gap-1">
                                  <AppIcons.ui.visibility size={10} /> Evasion
                                </div>
                                <div className="text-xl font-serif font-bold text-white">{character.ranger_companion.evasion}</div>
                              </div>
                            </div>

                            {/* Stress */}
                            <div className="bg-dagger-panel p-3 border-t border-white/5">
                              <div className="text-[10px] font-bold uppercase tracking-wide text-purple-400 flex items-center gap-1 mb-2">
                                <AppIcons.combat.activation size={10} /> Stress
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {Array.from({ length: character.ranger_companion.stress_max }).map((_, i) => {
                                  const isFilled = i < character.ranger_companion!.stress_current;
                                  const isMax = character.ranger_companion!.stress_current >= character.ranger_companion!.stress_max;
                                  return (
                                    <button
                                      key={i}
                                      onClick={() => {
                                        const newStress = isFilled ? i : i + 1;
                                        updateCompanion({ ...character.ranger_companion!, stress_current: newStress });
                                      }}
                                      className="transition-all"
                                    >
                                      <AppIcons.combat.activation
                                        size={16}
                                        className={clsx(
                                          "transition-all",
                                          isFilled
                                            ? isMax ? "text-red-500 scale-100" : "text-purple-400 scale-100"
                                            : "text-white/10 scale-90"
                                        )}
                                        fill={isFilled ? "currentColor" : "none"}
                                      />
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="flex gap-1 mt-2">
                                <button
                                  onClick={() => updateCompanion({ ...character.ranger_companion!, stress_current: Math.max(0, character.ranger_companion!.stress_current - 1) })}
                                  className="flex-1 h-6 bg-white/5 hover:bg-white/10 rounded text-[10px] font-bold uppercase"
                                >
                                  Clear
                                </button>
                                <button
                                  onClick={() => updateCompanion({ ...character.ranger_companion!, stress_current: Math.min(character.ranger_companion!.stress_max, character.ranger_companion!.stress_current + 1) })}
                                  className="flex-1 h-6 bg-white/5 hover:bg-white/10 rounded text-[10px] font-bold uppercase"
                                >
                                  Mark
                                </button>
                              </div>
                            </div>

                            {/* Combat Stats & Armor */}
                            <div className="p-3 border-t border-white/5">
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="bg-black/20 rounded-lg px-3 py-2">
                                  <div className="text-[9px] text-gray-500 uppercase">Attack</div>
                                  <div className="text-sm font-bold text-white capitalize">{character.ranger_companion.attack_type}</div>
                                </div>
                                <div className="bg-black/20 rounded-lg px-3 py-2">
                                  <div className="text-[9px] text-gray-500 uppercase">Damage</div>
                                  <div className="text-sm font-bold text-dagger-gold">{character.ranger_companion.damage_die}</div>
                                </div>
                                {character.ranger_companion.attack_range && character.ranger_companion.attack_range !== 'melee' && (
                                  <div className="bg-black/20 rounded-lg px-3 py-2">
                                    <div className="text-[9px] text-gray-500 uppercase">Range</div>
                                    <div className="text-sm font-bold text-white capitalize">{character.ranger_companion.attack_range.replace('_', ' ')}</div>
                                  </div>
                                )}
                                {character.ranger_companion.armor_slot && (
                                  <div className="bg-black/20 rounded-lg px-3 py-2">
                                    <div className="text-[9px] text-gray-500 uppercase mb-1">Armor</div>
                                    <button
                                      onClick={() => updateCompanion({ ...character.ranger_companion!, armor_slot_used: !character.ranger_companion!.armor_slot_used })}
                                      className="block"
                                    >
                                      <AppIcons.combat.activation
                                        size={16}
                                        className={clsx(
                                          "transition-all",
                                          character.ranger_companion.armor_slot_used ? "text-blue-400" : "text-white/10"
                                        )}
                                        fill={character.ranger_companion.armor_slot_used ? "currentColor" : "none"}
                                      />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Companion Experiences */}
                            {character.ranger_companion.experiences && character.ranger_companion.experiences.length > 0 && (
                              <div className="p-3 border-t border-white/5">
                                <div className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-2">Experiences</div>
                                <div className="space-y-1">
                                  {character.ranger_companion.experiences.map((exp, i) => (
                                    <div key={i} className="flex justify-between items-center bg-white/5 rounded-lg px-3 py-2">
                                      <span className="text-sm text-gray-300 capitalize">{exp.name}</span>
                                      <span className="font-bold text-dagger-gold min-w-[3rem] text-right">
                                        {exp.value >= 0 ? `+${exp.value}` : exp.value}
                                        {character.ranger_companion!.level_up_options.intelligent > 0 && (
                                          <span className="text-xs text-gray-500"> (+{character.ranger_companion!.level_up_options.intelligent})</span>
                                        )}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Training Badges */}
                            {Object.entries(character.ranger_companion.level_up_options).some(([key, val]) =>
                              (typeof val === 'boolean' && val && !key.includes('used')) ||
                              (typeof val === 'number' && val > 0)
                            ) && (
                                <div className="p-3 border-t border-white/5">
                                  <div className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-2">Training</div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {character.ranger_companion.level_up_options.intelligent > 0 && (
                                      <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-1 rounded-full font-medium">
                                        Intelligent {character.ranger_companion.level_up_options.intelligent > 1 ? `×${character.ranger_companion.level_up_options.intelligent}` : ''}
                                      </span>
                                    )}
                                    {character.ranger_companion.level_up_options.light_in_the_dark && (
                                      <span className="text-xs bg-dagger-gold/10 text-dagger-gold border border-dagger-gold/20 px-2 py-1 rounded-full font-medium">
                                        Light in the Dark
                                      </span>
                                    )}
                                    {character.ranger_companion.level_up_options.creature_comfort && (
                                      <span className="text-xs bg-pink-500/10 text-pink-400 border border-pink-500/20 px-2 py-1 rounded-full font-medium">
                                        Creature Comfort
                                      </span>
                                    )}
                                    {character.ranger_companion.level_up_options.armored && (
                                      <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded-full font-medium">
                                        Armored
                                      </span>
                                    )}
                                    {character.ranger_companion.level_up_options.vicious > 0 && (
                                      <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded-full font-medium">
                                        Vicious {character.ranger_companion.level_up_options.vicious > 1 ? `×${character.ranger_companion.level_up_options.vicious}` : ''}
                                      </span>
                                    )}
                                    {character.ranger_companion.level_up_options.resilient > 0 && (
                                      <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-1 rounded-full font-medium">
                                        Resilient {character.ranger_companion.level_up_options.resilient > 1 ? `×${character.ranger_companion.level_up_options.resilient}` : ''}
                                      </span>
                                    )}
                                    {character.ranger_companion.level_up_options.bonded && (
                                      <span className="text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-1 rounded-full font-medium">
                                        Bonded
                                      </span>
                                    )}
                                    {character.ranger_companion.level_up_options.aware && (
                                      <span className="text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-1 rounded-full font-medium">
                                        Aware
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        ) : (
                          <div
                            onClick={() => setIsCompanionSheetOpen(true)}
                            className="text-center py-8 cursor-pointer hover:bg-white/5 transition-colors"
                          >
                            <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-dagger-gold/10 border-2 border-dashed border-dagger-gold/30 flex items-center justify-center">
                              <AppIcons.campaign.companion size={28} className="text-dagger-gold/50" />
                            </div>
                            <p className="text-gray-400 text-sm">No companion configured yet.</p>
                            <p className="text-dagger-gold text-sm font-medium mt-1">Tap to set up your companion</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

              {/* Advancement History Section */}
              {character.advancement_history_jsonb && Object.keys(character.advancement_history_jsonb).length > 0 && (
                <div className="space-y-2">
                  <AdvancementHistory
                    advancementHistory={character.advancement_history_jsonb}
                    experiences={character.experiences}
                    domainCards={domainCards}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors disabled:opacity-50"
                >
                  <AppIcons.ui.camera size={16} />
                  {isUploading ? 'Uploading...' : 'Upload Image'}
                </button>
              </div>

              {/* Masonry-ish Gallery Grid */}
              {character.gallery_images && character.gallery_images.length > 0 ? (
                <div className="columns-2 gap-4 space-y-4">
                  {character.gallery_images.map((url, index) => (
                    <div key={index} className="relative group break-inside-avoid">
                      <div className="rounded-lg overflow-hidden bg-gray-800 shadow-lg">
                        <Image
                          src={url}
                          alt={`Concept Art ${index + 1}`}
                          width={400}
                          height={400}
                          className="w-full h-auto object-cover"
                        />
                      </div>
                      <div className="absolute top-2 right-2 flex gap-2 transition-opacity">
                        <button
                          onClick={() => {
                            if (confirm('Set this image as your profile picture?')) {
                              updateImage(url);
                              toast.success('Profile picture updated');
                            }
                          }}
                          className="p-1.5 bg-black/60 text-white rounded-full hover:bg-dagger-gold hover:text-black transition-colors"
                          title="Set as Profile Picture"
                        >
                          <AppIcons.campaign.player size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Set this image as your background banner?')) {
                              updateBackgroundImage(url);
                              toast.success('Background updated');
                            }
                          }}
                          className="p-1.5 bg-black/60 text-white rounded-full hover:bg-dagger-gold hover:text-black transition-colors"
                          title="Set as Background"
                        >
                          <AppIcons.ui.image size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteImage(url)}
                          className="p-1.5 bg-black/60 text-white rounded-full hover:bg-red-500/80 transition-colors"
                          title="Delete Image"
                        >
                          <AppIcons.ui.delete size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 text-xs mt-4">
                  No images uploaded yet.
                </div>
              )}
            </div>
          )}

          {activeTab === 'lore' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-4">
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 relative">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-white">Pronouns</h4>
                    {savingField === 'pronouns' && (
                      <span className="text-xs text-gray-400 animate-pulse">Saving...</span>
                    )}
                    {savedField === 'pronouns' && (
                      <span className="text-xs text-green-400">Saved</span>
                    )}
                  </div>
                  <input
                    className="w-full bg-transparent text-sm text-gray-300 leading-relaxed focus:outline-none focus:ring-1 focus:ring-dagger-gold rounded p-2"
                    placeholder="e.g. They/Them"
                    defaultValue={character.pronouns || ''}
                    onChange={(e) => handleLoreChange('pronouns', e.target.value)}
                  />
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/10 relative">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-white">Appearance</h4>
                    {savingField === 'appearance' && (
                      <span className="text-xs text-gray-400 animate-pulse">Saving...</span>
                    )}
                    {savedField === 'appearance' && (
                      <span className="text-xs text-green-400">Saved</span>
                    )}
                  </div>
                  <textarea
                    className="w-full bg-transparent text-sm text-gray-300 leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-dagger-gold rounded p-2"
                    rows={4}
                    placeholder="Describe your character's physical appearance..."
                    defaultValue={character.appearance || ''}
                    onChange={(e) => handleLoreChange('appearance', e.target.value)}
                  />
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/10 relative">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-white">Background</h4>
                    {savingField === 'background' && (
                      <span className="text-xs text-gray-400 animate-pulse">Saving...</span>
                    )}
                    {savedField === 'background' && (
                      <span className="text-xs text-green-400">Saved</span>
                    )}
                  </div>
                  <textarea
                    className="w-full bg-transparent text-sm text-gray-300 leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-dagger-gold rounded p-2"
                    rows={6}
                    placeholder="Write your character's origin, beliefs, and pivotal moments..."
                    defaultValue={character.background || ''}
                    onChange={(e) => handleLoreChange('background', e.target.value)}
                  />
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/10 relative">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-white">Connections</h4>
                    {savingField === 'connections' && (
                      <span className="text-xs text-gray-400 animate-pulse">Saving...</span>
                    )}
                    {savedField === 'connections' && (
                      <span className="text-xs text-green-400">Saved</span>
                    )}
                  </div>
                  <textarea
                    className="w-full bg-transparent text-sm text-gray-300 leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-dagger-gold rounded p-2"
                    rows={4}
                    placeholder="List allies, rivals, and organizations..."
                    defaultValue={character.connections || ''}
                    onChange={(e) => handleLoreChange('connections', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <ExperienceSheet
          isOpen={isExperienceSheetOpen}
          onClose={() => setIsExperienceSheetOpen(false)}
          experiences={character.experiences || []}
          onUpdateExperiences={updateExperiences}
        />

        <LevelUpModal
          isOpen={isLevelUpOpen}
          onClose={() => setIsLevelUpOpen(false)}
          character={character}
          domainCards={domainCards}
          subclasses={subclasses}
          classes={classes}
          isLoading={isLevelUpLoading}
          onComplete={async (options) => {
            setIsLevelUpLoading(true);
            try {
              await levelUpCharacter(options);
              toast.success(`Level up to ${options.newLevel}!`);
              setIsLevelUpOpen(false);
            } catch (err) {
              console.error('Failed to level up:', err);
              toast.error('Failed to complete level up');
            } finally {
              setIsLevelUpLoading(false);
            }
          }}
        />

        <ManageCharacterModal
          isOpen={isManageOpen}
          onClose={() => setIsManageOpen(false)}
          currentName={character?.name}
          currentLevel={character?.level || 1}
          currentAncestry={character?.ancestry}
          currentAncestryFeatures={character?.ancestry_features}
          currentCommunity={character?.community}
          currentTransformation={character?.transformation}
          currentSpellcastTrait={character?.spellcast_trait || character?.subclass_data?.data?.spellcast_trait || ''}
          advancementHistory={character?.advancement_history_jsonb}
          isLoading={isManageLoading}
          onLevelUp={() => {
            setIsManageOpen(false);
            setIsLevelUpOpen(true);
          }}
          onDelete={async () => {
            if (!character || !user) return;
            try {
              await dataService.character.delete(character.id);
              toast.success(`${character.name} deleted.`);
              router.push('/client/characters');
            } catch (err) {
              console.error('Failed to delete character:', err);
              toast.error('Failed to delete character');
              throw err;
            }
          }}
          onUpdate={async (updates) => {
            setIsManageLoading(true);
            try {
              await updateCharacterDetails(updates);
              const changes = [];
              if (updates.name) changes.push(`name: ${updates.name}`);
              if (updates.level) {
                if (updates.level > character!.level) {
                  changes.push(`leveled to ${updates.level}`);
                } else {
                  changes.push(`de-leveled to ${updates.level}`);
                }
              }
              if (updates.ancestry) changes.push(`ancestry: ${updates.ancestry}`);
              if (updates.community) changes.push(`community: ${updates.community}`);
              if (updates.transformation !== undefined) changes.push(`transformation: ${updates.transformation || 'removed'}`);
              if (updates.spellcast_trait) changes.push(`spellcast trait: ${updates.spellcast_trait}`);
              toast.success(`Character updated: ${changes.join(', ')}`);
              setIsManageOpen(false);
            } catch (err) {
              console.error('Failed to update character:', err);
              toast.error('Failed to update character');
            } finally {
              setIsManageLoading(false);
            }
          }}
        />

        <CompanionSheet
          isOpen={isCompanionSheetOpen}
          onClose={() => setIsCompanionSheetOpen(false)}
          companion={character.ranger_companion}
          onUpdateCompanion={updateCompanion}
          characterId={character.id}
          userId={user?.id}
        />

        <ModifierSheet
          isOpen={isTraitModifierSheetOpen}
          onClose={() => setIsTraitModifierSheetOpen(false)}
          statLabel="Traits"
          baseValue={0} // Not used when tabs are provided
          currentModifiers={[]} // Not used when tabs are provided
          onUpdateModifiers={() => { }} // Not used when tabs are provided
          tabs={traitTabs}
        />
      </div>
    </ErrorBoundary>
  );
}