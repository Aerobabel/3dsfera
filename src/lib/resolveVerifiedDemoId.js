// Shared helper to consistently resolve the Verified Pavilion (Demo) id
// across buyer and seller flows.
export async function resolveVerifiedDemoId(supabase, userId, { createIfMissing = false } = {}) {
    // Always try to grab the most recent demo pavilion
    const { data: latestDemo } = await supabase
        .from('pavilions')
        .select('*')
        .eq('title', 'Verified Pavilion (Demo)')
        .order('created_at', { ascending: false })
        .limit(1);

    if (latestDemo && latestDemo.length > 0) {
        return latestDemo[0].id;
    }

    // Optionally create one for sellers if none exists
    if (createIfMissing && userId) {
        const { data: newData, error } = await supabase.from('pavilions').insert({
            seller_id: userId,
            title: 'Verified Pavilion (Demo)',
            blurb: 'Auto-generated for demo purposes.',
            color: '#00ffff',
            products: []
        }).select().single();

        if (newData && !error) return newData.id;
    }

    // Fallback to a deterministic placeholder id so UI still renders
    return '00000000-0000-0000-0000-000000000001';
}
