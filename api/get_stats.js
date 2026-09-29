const { createClient } = require('@supabase/supabase-js');
const { MercadoPagoConfig, Payment } = require('mercadopago');

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qosgrqdfeqzxnzhmwomv.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseKey) {
        return res.status(500).json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // ─── MODO DETALHE: /api/get_stats?id=UUID ────────────────────────────────────
    const detailId = req.query && req.query.id;
    if (detailId) {
        try {
            const { data: usuario, error: errorUser } = await supabase
                .from('usuarios').select('*').eq('id', detailId).single();
            if (errorUser) throw errorUser;

            const horarios = usuario.horarios || [];

            const data30dias = new Date(new Date().getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString();

            const { count: leadsCount } = await supabase
                .from('leads').select('*', { count: 'exact', head: true })
                .eq('id_empresa', detailId).gte('criado_em', data30dias);

            let reunioesCount = 0;
            try {
                const { data: ags } = await supabase
                    .from('agendamentos').select('*')
                    .eq('id_empresa', detailId);
                if (ags) {
                    reunioesCount = ags.filter(a => {
                        if (!a.status || a.status.trim().toLowerCase() !== 'qualificado') return false;
                        const aDate = new Date(a.created_at || a.criado_em || a.data_agendamento);
                        return aDate >= new Date(data30dias);
                    }).length;
                }
            } catch (e) { console.error('Erro agendamentos admin master stats:', e); }

            let evaluatedStatus = usuario.status_assinatura || 'vencido';
            let diffDays = 0;
            if (usuario.data_vencimento) {
                const dataVencStr = usuario.data_vencimento.split('T')[0];
                const [yr, mo, dy] = dataVencStr.split('-');
                const dataVenc = new Date(parseInt(yr), parseInt(mo) - 1, parseInt(dy));
                const hoje = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
                dataVenc.setHours(0,0,0,0); hoje.setHours(0,0,0,0);
                diffDays = Math.ceil((dataVenc.getTime() - hoje.getTime()) / (1000*60*60*24));
                if (diffDays < 0) evaluatedStatus = 'vencido';
                else if (diffDays <= 3) evaluatedStatus = 'Aviso prévio';
                else evaluatedStatus = 'pago';
            }

            return res.status(200).json({
                usuario, horarios: horarios || [],
                status: evaluatedStatus, diasRestantes: diffDays,
                total_leads: leadsCount || 0, reunioes_marcadas: reunioesCount || 0
            });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal server error', details: err.message });
        }
    }
    // ─────────────────────────────────────────────────────────────────────────────

    let start, end;
    if (req.query && Object.keys(req.query).length > 0) {
        start = req.query.start;
        end = req.query.end;
    } else {
        try {
            const host = req.headers.host || 'localhost';
            const urlObj = new URL(req.url, `http://${host}`);
            start = urlObj.searchParams.get('start');
            end = urlObj.searchParams.get('end');
        } catch (e) {
            console.error("Erro ao fazer parse da URL:", e);
        }
    }
    let queryStartDate = start ? new Date(start) : null;
    let queryEndDate = end ? new Date(end) : null;

    try {
        // Obter todos os usuários (empresas)
        const { data: empresas, error: errEmp } = await supabase
            .from('usuarios')
            .select('*')
            .neq('tipo_usuario', 'administrador');

        if (errEmp) throw errEmp;

        let totalEmpresas = 0;
        let clientesPagos = 0;
        let clientesInadimplentes = 0;

        empresas.forEach(emp => {
            // Garante que o administrador não seja contado (filtro duplo)
            if (emp.tipo_usuario && emp.tipo_usuario.trim().toLowerCase() === 'administrador') return;
            // Opcional: filtro por email caso seja necessário
            if (emp.email && emp.email.trim().toLowerCase() === 'admin@automatizap.com') return;
            
            let evaluatedStatus = emp.status_assinatura || 'vencido';

            if (emp.data_vencimento && emp.data_vencimento !== 'N/A') {
                const dataVencStr = emp.data_vencimento.split('T')[0];
                const parts = dataVencStr.split('-');
                if (parts.length === 3) {
                    const dataVenc = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0);
                    
                    // Filter out by query dates if present
                    if (queryStartDate && queryEndDate) {
                        if (dataVenc < queryStartDate || dataVenc > queryEndDate) return;
                    } else if (queryStartDate) {
                        // Check if exact day match is expected like the frontend
                        const qdStr = queryStartDate.toISOString().split('T')[0];
                        if (dataVencStr !== qdStr) return;
                    }
                    
                    const hojeStr = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
                    const hoje = new Date(hojeStr);
                    
                    dataVenc.setHours(0, 0, 0, 0);
                    hoje.setHours(0, 0, 0, 0);

                    const diffTime = dataVenc.getTime() - hoje.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays < 0) {
                        evaluatedStatus = 'vencido';
                    } else if (diffDays >= 0 && diffDays <= 3) {
                        evaluatedStatus = 'Aviso prévio';
                    } else {
                        evaluatedStatus = 'pago';
                    }
                }
            } else if (queryStartDate) {
                // Se o usuário filtrou por data mas a empresa não tem data_vencimento, ela deve ser escondida
                return;
            }

            totalEmpresas++;

            if (evaluatedStatus === 'pago' || evaluatedStatus === 'Aviso prévio') {
                clientesPagos++;
            } else if (evaluatedStatus === 'vencido' || evaluatedStatus === 'inadimplente' || evaluatedStatus === 'cancelado') {
                clientesInadimplentes++;
            }
        });

        let faturamentoReal = 0;
        try {
            const client = new MercadoPagoConfig({ 
                accessToken: 'APP_USR-5121029731142512-091416-44ec7bdf36a55ab8f244f0d84bebbf11-1370822621' 
            });
            const payment = new Payment(client);
            
            const hojeMP = new Date();
            let firstDay = new Date(hojeMP.getFullYear(), hojeMP.getMonth(), 1).toISOString();
            let lastDay = new Date(hojeMP.getFullYear(), hojeMP.getMonth() + 1, 0, 23, 59, 59).toISOString();
            
            if (queryStartDate && queryEndDate) {
                firstDay = queryStartDate.toISOString();
                lastDay = queryEndDate.toISOString();
            } else if (queryStartDate) {
                const f = new Date(queryStartDate);
                f.setHours(0,0,0,0);
                firstDay = f.toISOString();
                
                const l = new Date(queryStartDate);
                l.setHours(23,59,59,999);
                lastDay = l.toISOString();
            }
            
            const searchResult = await payment.search({
                options: {
                    begin_date: firstDay,
                    end_date: lastDay,
                    status: 'approved'
                }
            });
            
            if (searchResult && searchResult.results) {
                searchResult.results.forEach(p => {
                    faturamentoReal += p.transaction_amount;
                });
            }
        } catch (mpErr) {
            console.error("Erro ao buscar faturamento no Mercado Pago:", mpErr);
        }

        return res.status(200).json({
            empresas: totalEmpresas,
            pagos: clientesPagos,
            inadimplentes: clientesInadimplentes,
            faturamento: faturamentoReal
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
