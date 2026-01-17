import createServerClient from '@/lib/supabase/server';
import CampaignList from '@/components/campaign/campaign-list';
import { redirect } from 'next/navigation';

export default async function CampaignsPage() {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/login');
    }

    return (
        <div className="min-h-screen bg-dagger-bg">
            <CampaignList />
        </div>
    );
}
