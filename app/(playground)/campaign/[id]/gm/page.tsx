'use client';

import { useParams } from 'next/navigation';
import { GmScreen } from '@/components/gm-screen';

export default function GmScreenPage() {
    const params = useParams();
    const campaignId = params.id as string;

    return <GmScreen campaignId={campaignId} />;
}
