/**
 * CONTENT ACCESS SETTINGS
 * ----------------------------------------------------------------------------
 * A component that allows users to toggle access to different content sources
 * like SRD (core rules) and Playtest material (The Void).
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, BookOpen, FlaskConical } from 'lucide-react';
import { dataService } from '@/lib/data-service';
import useUser from '@/hooks/useUser';
import type { ContentAccess } from '@/types/character';

export default function ContentAccessSettings() {
  const { user } = useUser();
  const [contentAccess, setContentAccess] = useState<ContentAccess>({
    srd: true,
    playtest: false,
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
          setContentAccess(profile.content_access);
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Content Access</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Loading settings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Content Access
        </CardTitle>
        <CardDescription>
          Control which game content is available for character creation and browsing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* SRD Content - Always enabled */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Label htmlFor="srd-content" className="font-medium">
                Core Rules (SRD)
              </Label>
              <Badge variant="secondary">Always On</Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              Official Daggerheart System Reference Document content.
            </p>
          </div>
          <Switch id="srd-content" checked={true} disabled />
        </div>

        {/* Playtest Content */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Label htmlFor="playtest-content" className="font-medium">
                Playtest Content
              </Label>
              <Badge variant="outline" className="gap-1">
                <FlaskConical className="h-3 w-3" />
                The Void v1.5
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
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
              <p className="text-sm font-medium text-amber-500">Playtest Content Notice</p>
              <p className="text-sm text-muted-foreground">
                Playtest material is not final and may be unbalanced or subject to change.
                Characters using this content may need adjustments in the future.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
