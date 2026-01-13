'use client';

import { useState, useEffect, useCallback } from 'react';
import createClient from '@/lib/supabase/client';

export interface PlaytestPack {
    id: string;
    name: string;
    description: string;
}

export default function usePlaytestPacks() {
    const [packs, setPacks] = useState<PlaytestPack[]>([]);
    const [loading, setLoading] = useState(true);

    const loadPacks = useCallback(async () => {
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('library')
                .select('id, name, data')
                .eq('type', 'playtest_pack');

            if (error) throw error;

            const loadedPacks = (data || []).map(row => ({
                id: row.id,
                name: row.name,
                description: (row.data as { description?: string }).description || ''
            }));

            setPacks(loadedPacks);
        } catch (err) {
            console.error('Failed to load playtest packs:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPacks();
    }, [loadPacks]);

    return { packs, loading };
}
