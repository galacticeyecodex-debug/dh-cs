/**
 * CONTENT ACCESS SETTINGS
 * ----------------------------------------------------------------------------
 * A component that allows users to toggle access to different content sources
 * like SRD (core rules), Playtest material (The Void), and Homebrew campaigns.
 */

'use client';

import { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, BookOpen, FlaskConical, Sparkles, Lock } from 'lucide-react';
import { dataService } from '@/lib/data-service';
import useUser from '@/hooks/useUser';
import type { ContentAccess } from '@/types/character';
import { AVAILABLE_CAMPAIGNS } from '@/hooks/useContentAccess';
import clsx from 'clsx';

export default function ContentAccessSettings() {
  const { user } = useUser();
  const [contentAccess, setContentAccess] = useState<ContentAccess>({
    srd: true,
    playtest: false,
    homebrew: {},
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load user's content access settings
  useEffect(() => {
    async function loadSettings() {
      if (!user?.id) return;

      try {
        const profile = await dataService.profile.get(user.id);
        if (profile?.content_access) {
          // Ensure homebrew object exists
          setContentAccess({
            ...profile.content_access,
            homebrew: profile.content_access.homebrew ?? {},
          });
        }
      } catch (error) {
        console.error('Failed to load content access settings:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [user?.id]);

  const handleTogglePlaytest = async (enabled: boolean) => {
    if (!user?.id) return;

    setSaving(true);
    const newAccess = { ...contentAccess, playtest: enabled };

    try {
      await dataService.profile.updateContentAccess(user.id, newAccess);
      setContentAccess(newAccess);
    } catch (error) {
      console.error('Failed to update content access:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleHomebrew = async (campaignId: string, enabled: boolean) => {
    if (!user?.id) return;

    setSaving(true);
    const newAccess = {
      ...contentAccess,
      homebrew: {
        ...contentAccess.homebrew,
        [campaignId]: enabled,
      },
    };

    try {
      await dataService.profile.updateContentAccess(user.id, newAccess);
      setContentAccess(newAccess);
    } catch (error) {
      console.error('Failed to update content access:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-dagger-panel border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-5 w-5 text-dagger-gold" />
          <h2 className="text-lg font-semibold text-white">Content Access</h2>
        </div>
        <p className="text-gray-400 text-sm">Loading settings...</p>
      </div>
    );
  }

  const hasAnyHomebrewEnabled = Object.values(contentAccess.homebrew ?? {}).some(Boolean);

  return (
    <div className="bg-dagger-panel border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-5 w-5 text-dagger-gold" />
          <h2 className="text-lg font-semibold text-white">Content Access</h2>
        </div>
        <p className="text-gray-400 text-sm">
          Control which game content is available for character creation and browsing.
        </p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* SRD Content - Always enabled */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <label htmlFor="srd-content" className="font-medium text-white">
                Core Rules (SRD)
              </label>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-gray-300 text-xs font-medium">
                <Lock size={12} />
                Always On
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              Official Daggerheart System Reference Document content.
            </p>
          </div>
          <Switch id="srd-content" checked={true} disabled />
        </div>

        {/* Playtest Content */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <label htmlFor="playtest-content" className="font-medium text-white">
                Playtest Content
              </label>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-gray-300 text-xs font-medium">
                <FlaskConical size={12} />
                The Void v1.5
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              Blood Hunter, Witch, Brawler classes and Blood & Dread domains.
            </p>
          </div>
          <Switch
            id="playtest-content"
            checked={contentAccess.playtest}
            onCheckedChange={handleTogglePlaytest}
            disabled={saving}
          />
        </div>

        {/* Warning when playtest is enabled */}
        {contentAccess.playtest && (
          <div className="flex gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-400">Playtest Content Notice</p>
              <p className="text-sm text-gray-400">
                Playtest material is not final and may be unbalanced or subject to change.
                Characters using this content may need adjustments in the future.
              </p>
            </div>
          </div>
        )}

        {/* Homebrew Campaigns Section */}
        {AVAILABLE_CAMPAIGNS.length > 0 && (
          <>
            <div className="border-t border-white/10 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <h3 className="font-semibold text-white">Homebrew Campaigns</h3>
              </div>

              <div className="space-y-4">
                {AVAILABLE_CAMPAIGNS.map((campaign) => (
                  <div key={campaign.id} className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <label htmlFor={`campaign-${campaign.id}`} className="font-medium text-white">
                          {campaign.name}
                        </label>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-medium">
                          Homebrew
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        {campaign.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {campaign.features.map((feature) => (
                          <span key={feature} className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/5 text-gray-300 text-xs">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Switch
                      id={`campaign-${campaign.id}`}
                      checked={contentAccess.homebrew?.[campaign.id] ?? false}
                      onCheckedChange={(enabled) => handleToggleHomebrew(campaign.id, enabled)}
                      disabled={saving}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Warning when homebrew is enabled */}
            {hasAnyHomebrewEnabled && (
              <div className="flex gap-3 rounded-lg border border-purple-500/50 bg-purple-500/10 p-4">
                <Sparkles className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-purple-400">Homebrew Content Active</p>
                  <p className="text-sm text-gray-400">
                    Homebrew content is custom material created for specific campaigns.
                    Features may include mechanics not found in the official rules.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

