const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id_empresa } = req.query;

    if (!id_empresa) {
        return res.status(400).json({ error: 'Missing id_empresa parameter' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qosgrqdfeqzxnzhmwomv.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseKey) {
        return res.status(500).json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // Fetch all leads for this tenant
        const { data: leads, error: leadsError } = await supabase
            .from('leads')
            .select('criado_em, localizacao, nome, status, telefone')
            .eq('id_empresa', id_empresa);

        if (leadsError) throw leadsError;

        // Calculate time series data (leads per day for the last 7 days)
        const leadsOverTime = {};
        const statesData = {};

        leads.forEach(lead => {
            // Map data
            if (lead.localizacao) {
                const state = lead.localizacao.trim().toLowerCase();
                statesData[state] = (statesData[state] || 0) + 1;
            }

            // Time series data
            if (lead.criado_em) {
                const date = new Date(lead.criado_em).toISOString().split('T')[0];
                leadsOverTime[date] = (leadsOverTime[date] || 0) + 1;
            }
        });

        // Format chart data
        const sortedDates = Object.keys(leadsOverTime).sort();
        const lineChartData = {
            categories: sortedDates,
            series: sortedDates.map(d => leadsOverTime[d])
        };

        const mapData = Object.keys(statesData).map(state => ({
            'hc-key': `br-${state}`,
            value: statesData[state]
        }));

        return res.status(200).json({
            total_leads: leads.length,
            lineChartData,
            mapData
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error', details: err.message });
    }
}
