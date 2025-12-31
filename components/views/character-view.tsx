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

import React, { useState, useRef, useEffect } from 'react';
import { useCharacterStore } from '@/store/character-store';
import Image from 'next/image';
import { getSystemModifiers } from '@/lib/utils';
import StatButton from '@/components/character/trait-button';
import CommonVitalsDisplay from '@/components/vitals/common-vitals-display';
import ExperienceSheet from '../character/experience-sheet';
import LevelUpModal from '../modals/level-up-modal';
import ManageCharacterModal from '../modals/manage-character-modal';
import AdvancementHistory from '../level-up/advancement-history';
import SubclassFeatureCard from '../cards/subclass-feature-card';
import CompanionSheet from '../character/subclass/beastbound-companion-sheet';
import PrayerDiceCard from '../cards/prayer-dice-card';
import { Settings, Grid, Book, Activity, Camera, Hash, Trash2, Eye, EyeOff, User, Image as ImageIcon, Zap, Info, Sparkles, PawPrint } from 'lucide-react';
import clsx from 'clsx';
import { uploadCharacterImage } from '@/lib/storage-service';
import { toast } from 'sonner';
import { dataService } from '@/lib/data-service';
import { ErrorBoundary } from '@/components/core/error-boundary';
import useContentAccess from '@/hooks/useContentAccess';

export default function CharacterView() {
  const { character, user, updateModifiers, updateExperiences, updateLore, updateGallery, updateImage, updateBackgroundImage, levelUpCharacter, updateCharacterDetails, updateMarkedTraits, updateCompanion, updatePrayerDice } = useCharacterStore();
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
  const [showTransformationLore, setShowTransformationLore] = useState(false);
  const [showClassLore, setShowClassLore] = useState(false);
  const [showSubclassLore, setShowSubclassLore] = useState(false);
  const [showMulticlassLore, setShowMulticlassLore] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [savingField, setSavingField] = useState<string>('');
  const [savedField, setSavedField] = useState<string>('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Fetch domain cards, ancestry, and community from library
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

          // Find ancestry card
          if (character?.ancestry) {
            const ancestry = data.find((lib: any) => lib.name === character.ancestry);
            if (ancestry) {
              setAncestryCard({
                name: ancestry.name,
                description: ancestry.data?.description || ancestry.data?.markdown || '',
                features: ancestry.data?.features || [],
              });
            }
          }

          // Find community card
          if (character?.community) {
            const community = data.find((lib: any) => lib.name === character.community);
            if (community) {
              setCommunityCard({
                name: community.name,
                description: community.data?.description || community.data?.markdown || '',
                features: community.data?.features || [],
              });
            }
          }

          // Find transformation card
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
  }, [character?.ancestry, character?.community, character?.transformation, includePlaytest]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !character || !user) return;

    const file = e.target.files[0];

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
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
    const systemMods = getSystemModifiers(character, stat);
    const userMods = character.modifiers?.[stat] || [];
    const allMods = [...systemMods, ...userMods];
    const uniqueMods = Array.from(new Map(allMods.map(mod => [mod.id, mod])).values());
    const total = base + uniqueMods.reduce((acc, mod) => acc + mod.value, 0);
    return { total, allMods: uniqueMods };
  };

  return (
    <ErrorBoundary>
      <div className="pb-24">
        {/* Social Profile Header */}
        <div className="relative w-full h-48 md:h-64 bg-gray-900 overflow-hidden group/header">
          {/* Banner Background */}
          <div className="absolute inset-0 opacity-60 transition-opacity duration-700 group-hover/header:opacity-70">
            {character.background_image_url ? (
              <Image
                src={character.background_image_url}
                alt="Banner Background"
                fill
                className="object-cover"
              />
            ) : character.image_url ? (
              <Image
                src={character.image_url}
                alt="Background"
                fill
                className="object-cover blur-md scale-110"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black" />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-dagger-dark via-dagger-dark/40 to-transparent" />

          {/* Top Right Controls */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button
              onClick={() => setIsManageOpen(true)}
              className="bg-black/40 hover:bg-black/60 text-white backdrop-blur-md px-4 py-2 rounded-full transition-all flex items-center gap-2 border border-white/10 shadow-lg"
            >
              <Settings size={16} />
              <span className="text-sm font-bold hidden sm:inline">Manage</span>
            </button>
          </div>

          {/* Profile Avatar & Basic Info */}
          <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 flex items-end gap-4 md:gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-800 rounded-2xl rotate-3 p-1 border-4 border-dagger-gold shadow-2xl flex-shrink-0 relative group cursor-pointer hover:rotate-0 transition-transform duration-300 overflow-hidden">
              <div className="w-full h-full rounded-xl overflow-hidden relative">
                {character.image_url ? (
                  <Image
                    src={character.image_url}
                    alt={character.name || "Character Avatar"}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl md:text-4xl font-bold bg-dagger-gold text-black">
                    {character.name[0]}
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" size={24} />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleUpload}
              />
              {/* Hidden Overlay Button for clicking the avatar to upload */}
              <div
                className="absolute inset-0 z-20"
                onClick={() => fileInputRef.current?.click()}
              />
            </div>

            {/* Info Block */}
            <div className="mb-1 flex-1 min-w-0">
              <h1 className="text-3xl md:text-5xl font-serif font-bold text-white drop-shadow-lg leading-tight truncate">
                {character.name}
              </h1>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-2">
                {/* Level & Class Badge */}
                <div className="flex items-center gap-2 text-dagger-gold font-bold text-sm md:text-lg uppercase tracking-wider drop-shadow-md bg-black/30 px-2 md:px-3 py-1 rounded-lg border border-dagger-gold/20 backdrop-blur-sm">
                  <span>Lvl {character.level}</span>
                  <span className="w-1 h-3 md:h-4 bg-dagger-gold/50 rounded-full" />
                  <span>{character.class_id}</span>
                </div>

                {/* Heritage Info */}
                <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-200 font-medium drop-shadow-md hidden sm:flex">
                  {character.ancestry && (
                    <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-md backdrop-blur-sm">
                      <User size={14} className="text-gray-400" />
                      {character.ancestry}
                    </div>
                  )}
                  {character.community && (
                    <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-md backdrop-blur-sm">
                      <User size={14} className="text-gray-400" />
                      {character.community}
                    </div>
                  )}
                  {character.transformation && (
                    <div className="flex items-center gap-1.5 bg-purple-500/20 px-2 py-1 rounded-md backdrop-blur-sm border border-purple-500/30">
                      <Sparkles size={14} className="text-purple-400" />
                      {character.transformation}
                    </div>
                  )}
                </div>
              </div>
            </div>



          </div> {/* Closes Profile Avatar & Basic Info */}
        </div> {/* Closes Social Profile Header */}

        {/* Segmented Control (Sticky Tab Bar) */}
        <div className="sticky top-0 z-10 bg-dagger-dark/95 backdrop-blur border-b border-white/10 px-4 py-2 flex justify-between items-center shadow-sm">
          <div className="flex p-1 bg-white/5 rounded-lg w-full">
            <button
              onClick={() => setActiveTab('stats')}
              className={clsx(
                "flex-1 py-1.5 px-3 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                activeTab === 'stats' ? "bg-dagger-gold text-black shadow-sm" : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Activity size={14} /> Stats
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={clsx(
                "flex-1 py-1.5 px-3 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                activeTab === 'gallery' ? "bg-dagger-gold text-black shadow-sm" : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Grid size={14} /> Gallery
            </button>
            <button
              onClick={() => setActiveTab('lore')}
              className={clsx(
                "flex-1 py-1.5 px-3 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                activeTab === 'lore' ? "bg-dagger-gold text-black shadow-sm" : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Book size={14} /> Lore
            </button>
          </div>
        </div>

        <div className="p-4">
          {activeTab === 'stats' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* Vitals Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Vitals</h3>
                  <button
                    onClick={() => setShowVitals(!showVitals)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded"
                  >
                    {showVitals ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showVitals ? 'Hide' : 'Show'}
                  </button>
                </div>
                {showVitals && <CommonVitalsDisplay character={character} />}
              </div>

              {/* Stats Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Traits</h3>
                  <button
                    onClick={() => setShowTraits(!showTraits)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded"
                  >
                    {showTraits ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showTraits ? 'Hide' : 'Show'}
                  </button>
                </div>
                {showTraits && (
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(character.stats).map(([key, value]) => {
                      const { total, allMods } = getStatDetails(key, value);
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
                          />
                          <button
                            onClick={toggleMark}
                            className={`absolute -top-0.5 -left-0.5 w-4 h-4 rounded-full transition-all border border-gray-500 ${isMarked
                              ? 'bg-dagger-gold'
                              : 'bg-transparent hover:bg-white/10'
                              }`}
                            title={isMarked ? 'Trait is marked (cannot be increased until tier clear)' : 'Mark trait as used'}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Experiences Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Experiences</h3>
                    <button
                      onClick={() => setIsExperienceSheetOpen(true)}
                      className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors"
                    >
                      <Settings size={12} /> Manage
                    </button>
                  </div>
                  <button
                    onClick={() => setShowExperiences(!showExperiences)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded"
                  >
                    {showExperiences ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showExperiences ? 'Hide' : 'Show'}
                  </button>
                </div>

                {showExperiences && (<div className="space-y-2">
                  {character.experiences && character.experiences.length > 0 ? (
                    character.experiences.map((exp, index) => (
                      <div key={index} className="flex bg-white/5 border border-white/5 rounded-lg overflow-hidden">
                        <div className="flex-1 p-3 flex items-center justify-start text-left">
                          <span className="capitalize font-medium text-gray-300">{exp.name}</span>
                        </div>
                        <div className="p-3 min-w-[3rem] flex items-center justify-center font-bold text-xl border-l border-white/5 text-white">
                          {exp.value >= 0 ? `+${exp.value}` : exp.value}
                        </div>
                      </div>
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
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Ancestry</h3>
                    <button
                      onClick={() => setShowAncestry(!showAncestry)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded"
                    >
                      {showAncestry ? <EyeOff size={14} /> : <Eye size={14} />}
                      {showAncestry ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  {showAncestry && (
                    <div className="bg-dagger-panel border border-white/10 rounded-xl p-4">
                      {ancestryCard ? (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-serif font-bold text-white">{ancestryCard.name}</h4>
                            <button
                              onClick={() => setShowAncestryLore(!showAncestryLore)}
                              className="p-1 hover:bg-white/10 rounded transition-colors"
                              title={showAncestryLore ? "Hide lore" : "Show lore"}
                            >
                              <Info size={14} className="text-gray-400" />
                            </button>
                          </div>
                          {showAncestryLore && (
                            <p className="text-sm text-gray-300 whitespace-pre-wrap mb-3 p-3 bg-white/5 rounded-lg border border-white/5">
                              {ancestryCard.description}
                            </p>
                          )}
                          {ancestryCard.features?.map((feature: any, i: number) => (
                            <div key={i} className="mt-2 bg-white/5 rounded p-3 border border-white/5">
                              <div className="text-xs font-bold text-dagger-gold uppercase tracking-wider mb-1">
                                {feature.name}
                              </div>
                              <div className="text-sm text-gray-300 leading-relaxed">
                                {feature.text?.split('**').map((part: string, j: number) =>
                                  j % 2 === 1 ? <strong key={j} className="text-white">{part}</strong> : part
                                )}
                              </div>
                            </div>
                          ))}
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
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Community</h3>
                    <button
                      onClick={() => setShowCommunity(!showCommunity)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded"
                    >
                      {showCommunity ? <EyeOff size={14} /> : <Eye size={14} />}
                      {showCommunity ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  {showCommunity && (
                    <div className="bg-dagger-panel border border-white/10 rounded-xl p-4">
                      {communityCard ? (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-serif font-bold text-white">{communityCard.name}</h4>
                            <button
                              onClick={() => setShowCommunityLore(!showCommunityLore)}
                              className="p-1 hover:bg-white/10 rounded transition-colors"
                              title={showCommunityLore ? "Hide lore" : "Show lore"}
                            >
                              <Info size={14} className="text-gray-400" />
                            </button>
                          </div>
                          {showCommunityLore && (
                            <p className="text-sm text-gray-300 whitespace-pre-wrap mb-3 p-3 bg-white/5 rounded-lg border border-white/5">
                              {communityCard.description}
                            </p>
                          )}
                          {communityCard.features?.map((feature: any, i: number) => (
                            <div key={i} className="mt-2 bg-white/5 rounded p-3 border border-white/5">
                              <div className="text-xs font-bold text-dagger-gold uppercase tracking-wider mb-1">
                                {feature.name}
                              </div>
                              <div className="text-sm text-gray-300 leading-relaxed">
                                {feature.text?.split('**').map((part: string, j: number) =>
                                  j % 2 === 1 ? <strong key={j} className="text-white">{part}</strong> : part
                                )}
                              </div>
                            </div>
                          ))}
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
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Transformation</h3>
                    <button
                      onClick={() => setShowTransformation(!showTransformation)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded"
                    >
                      {showTransformation ? <EyeOff size={14} /> : <Eye size={14} />}
                      {showTransformation ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  {showTransformation && (
                    <div className="bg-dagger-panel border border-white/10 rounded-xl p-4">
                      {transformationCard ? (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-serif font-bold text-white">{transformationCard.name}</h4>
                            <button
                              onClick={() => setShowTransformationLore(!showTransformationLore)}
                              className="p-1 hover:bg-white/10 rounded transition-colors"
                              title={showTransformationLore ? "Hide lore" : "Show lore"}
                            >
                              <Info size={14} className="text-gray-400" />
                            </button>
                          </div>
                          {showTransformationLore && (
                            <p className="text-sm text-gray-300 whitespace-pre-wrap mb-3 p-3 bg-white/5 rounded-lg border border-white/5">
                              {transformationCard.description}
                            </p>
                          )}
                          {transformationCard.features?.map((feature: any, i: number) => (
                            <div key={i} className="mt-2 bg-white/5 rounded p-3 border border-white/5">
                              <div className="text-xs font-bold text-dagger-gold uppercase tracking-wider mb-1">
                                {feature.name}
                              </div>
                              <div className="text-sm text-gray-300 leading-relaxed">
                                {feature.text?.split('**').map((part: string, j: number) =>
                                  j % 2 === 1 ? <strong key={j} className="text-white">{part}</strong> : part
                                )}
                              </div>
                              {feature.has_tokens && (
                                <div className="mt-2 text-xs text-dagger-gold">
                                  Max tokens: {feature.max_tokens}
                                </div>
                              )}
                            </div>
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

              {/* Class Features Section */}
              {character.class_data && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
                      <Info size={14} /> Class Features
                    </h3>
                    <button
                      onClick={() => setShowClassFeatures(!showClassFeatures)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded"
                    >
                      {showClassFeatures ? <EyeOff size={14} /> : <Eye size={14} />}
                      {showClassFeatures ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  {showClassFeatures && (
                    <div className="bg-dagger-panel border border-white/10 rounded-xl p-4">
                      {/* Class Header with Lore Toggle */}
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-serif font-bold text-white">{character.class_data.name}</h4>
                        <button
                          onClick={() => setShowClassLore(!showClassLore)}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                          title={showClassLore ? "Hide lore" : "Show lore"}
                        >
                          <Info size={14} className="text-gray-400" />
                        </button>
                      </div>

                      {/* Collapsible Class Description */}
                      {showClassLore && character.class_data.data.description && (
                        <p className="text-sm text-gray-300 whitespace-pre-wrap mb-3 p-3 bg-white/5 rounded-lg border border-white/5">
                          {character.class_data.data.description}
                        </p>
                      )}

                      {/* Hope Feature */}
                      {character.class_data.data.hope_feature && (
                        <div className="mt-2 bg-white/5 rounded p-3 border border-white/5">
                          <div className="text-xs font-bold text-dagger-gold uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Zap size={12} />
                            {character.class_data.data.hope_feature.name}
                          </div>
                          <div className="text-sm text-gray-300 leading-relaxed">
                            {character.class_data.data.hope_feature.description?.split('**').map((part: string, j: number) =>
                              j % 2 === 1 ? <strong key={j} className="text-white">{part}</strong> : part
                            )}
                          </div>
                        </div>
                      )}

                      {/* Core Class Features */}
                      {character.class_data.data.class_features?.map((feature: any, idx: number) => {
                        // Special handling for Prayer Dice - render interactive component
                        if (feature.name === 'Prayer Dice') {
                          const traitName = (character.spellcast_trait || character.subclass_data?.data?.spellcast_trait || '').toLowerCase();
                          const spellcastValue = character.stats[traitName as keyof typeof character.stats] || 0;

                          return (
                            <div key={idx} className="mt-2">
                              <PrayerDiceCard
                                prayerDice={character.seraph_prayer_dice}
                                spellcastValue={spellcastValue}
                                hasDevout={character.subclass_data?.name?.toLowerCase() === 'divine wielder' && character.subclass_progression?.specialization_obtained === true}
                                onUpdatePrayerDice={updatePrayerDice}
                              />
                            </div>
                          );
                        }

                        // Standard class feature display
                        return (
                          <div key={idx} className="mt-2 bg-white/5 rounded p-3 border border-white/5">
                            <div className="text-xs font-bold text-dagger-gold uppercase tracking-wider mb-1">
                              {feature.name}
                            </div>
                            <div className="text-sm text-gray-300 leading-relaxed">
                              {feature.text?.split('**').map((part: string, j: number) =>
                                j % 2 === 1 ? <strong key={j} className="text-white">{part}</strong> : part
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Subclass Features Section */}
              {(character.subclass_progression || character.multiclass_progression) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
                      <Sparkles size={14} /> Subclass Features
                    </h3>
                    <button
                      onClick={() => setShowSubclassFeatures(!showSubclassFeatures)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded"
                    >
                      {showSubclassFeatures ? <EyeOff size={14} /> : <Eye size={14} />}
                      {showSubclassFeatures ? 'Hide' : 'Show'}
                    </button>
                  </div>

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

              {/* Beastbond Ranger Companion Section */}
              {character.class_id?.toLowerCase() === 'ranger' &&
                character.subclass_data?.name?.toLowerCase() === 'beastbound' &&
                character.subclass_progression?.foundation_obtained && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
                          <PawPrint size={14} /> Companion
                        </h3>
                        <button
                          onClick={() => setIsCompanionSheetOpen(true)}
                          className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors"
                        >
                          <Settings size={12} /> Manage
                        </button>
                      </div>
                      <button
                        onClick={() => setShowCompanion(!showCompanion)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded"
                      >
                        {showCompanion ? <EyeOff size={14} /> : <Eye size={14} />}
                        {showCompanion ? 'Hide' : 'Show'}
                      </button>
                    </div>

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
                                    <PawPrint size={24} className="text-dagger-gold/60" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Camera className="text-white" size={16} />
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
                                  <Eye size={10} /> Evasion
                                </div>
                                <div className="text-xl font-serif font-bold text-white">{character.ranger_companion.evasion}</div>
                              </div>
                            </div>

                            {/* Stress */}
                            <div className="bg-dagger-panel p-3 border-t border-white/5">
                              <div className="text-[10px] font-bold uppercase tracking-wide text-purple-400 flex items-center gap-1 mb-2">
                                <Zap size={10} /> Stress
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
                                      <Zap
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
                                      <Zap
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
                              <PawPrint size={28} className="text-dagger-gold/50" />
                            </div>
                            <p className="text-gray-400 text-sm">No companion configured yet.</p>
                            <p className="text-dagger-gold text-sm font-medium mt-1">Tap to set up your companion</p>
                          </div>
                        )}
                      </div>
                    )}
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
                  <Camera size={16} />
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
                          <User size={14} />
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
                          <ImageIcon size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteImage(url)}
                          className="p-1.5 bg-black/60 text-white rounded-full hover:bg-red-500/80 transition-colors"
                          title="Delete Image"
                        >
                          <Trash2 size={14} />
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
          currentCommunity={character?.community}
          currentTransformation={character?.transformation}
          currentSpellcastTrait={character?.spellcast_trait || character?.subclass_data?.data?.spellcast_trait || ''}
          advancementHistory={character?.advancement_history_jsonb}
          isLoading={isManageLoading}
          onLevelUp={() => {
            setIsManageOpen(false);
            setIsLevelUpOpen(true);
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
      </div>
    </ErrorBoundary>
  );
}