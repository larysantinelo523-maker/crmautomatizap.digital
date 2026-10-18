const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qosgrqdfeqzxnzhmwomv.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseKey) {
        return res.status(500).json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // ─── MODO UPDATE REPORTE: /api/list_tenants?action=update_reporte (GET ou POST) ───
    if ((req.query && req.query.action === 'update_reporte') || (req.body && req.body.action === 'update_reporte')) {
        const id = (req.body && req.body.id) || (req.query && req.query.id);
        const status = (req.body && req.body.status) || (req.query && req.query.status) || 'Resolvido';

        if (!id) {
            return res.status(400).json({ error: 'ID do reporte é obrigatório' });
        }

        try {
            const { data, error } = await supabase
                .from('reportes_agente')
                .update({ status: status })
                .eq('id', id)
                .select();

            if (error) throw error;
            return res.status(200).json({ success: true, data });
        } catch (err) {
            console.error('Erro ao atualizar reporte:', err);
            return res.status(500).json({ error: err.message });
        }
    }


    // ─── MODO REPORTES: /api/list_tenants?action=reportes (&id_empresa=UUID opcional) ───
    if (req.query && req.query.action === 'reportes') {
        const id_empresa = req.query.id_empresa;
        try {
            let q = supabase.from('reportes_agente').select('*').order('criado_em', { ascending: false });
            if (id_empresa) {
                q = q.eq('id_empresa', id_empresa);
            } else {
                q = q.limit(30);
            }
            const { data, error } = await q;
            if (error) throw error;
            return res.status(200).json(data || []);
        } catch (err) {
            console.error('Erro ao buscar reportes:', err);
            return res.status(500).json({ error: err.message });
        }
    }

    // ─── MODO CHAT TEST SEND (ENVIO IMEDIATO PARA O WHATSAPP-CHAT / N8N): /api/list_tenants?action=chat_test_send ───
    if ((req.query && (req.query.action === 'chat_test_send' || req.query.action === 'chat_test')) || 
        (req.body && (req.body.action === 'chat_test_send' || req.body.action === 'chat_test'))) {
        const body = req.body || {};
        const query = req.query || {};
        const mensagem = body.mensagem || query.mensagem;
        const id_empresa = body.id_empresa || query.id_empresa || 'a0269c72-e0dd-4a5c-91e5-227665905126';
        const telefone_cliente = body.telefone_cliente || query.telefone_cliente || '558182975691';
        const nome_cliente = body.nome_cliente || query.nome_cliente || 'Lead Teste';

        if (!mensagem) {
            return res.status(400).json({ error: 'Mensagem é obrigatória' });
        }

        try {
            const isReset = mensagem.toLowerCase().trim() === 'reset';
            const conversationText = isReset ? 'ResetAdmin2026' : mensagem;

            const webhookUrl = 'https://talonedlanternfish-n8n.cloudfy.live/webhook/whatsapp-chat';
            const payload = {
                event: 'messages.upsert',
                instance: 'AGENTE',
                origem: 'teste_crm',
                data: {
                    key: {
                        remoteJid: `${telefone_cliente}@s.whatsapp.net`,
                        fromMe: false,
                        id: 'sim_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)
                    },
                    pushName: nome_cliente,
                    message: {
                        conversation: conversationText
                    }
                }
            };

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Erro do webhook n8n (${response.status}): ${errText}`);
            }

            return res.status(200).json({
                success: true,
                sentAt: new Date().toISOString(),
                isReset: isReset
            });
        } catch (err) {
            console.error('Erro no envio chat_test_send:', err);
            return res.status(500).json({
                error: err.message || 'Erro ao enviar mensagem para automação.'
            });
        }
    }

    // ─── MODO CHAT TEST POLL (CONSULTA RESPOSTA DO AGENTE NO SUPABASE): /api/list_tenants?action=chat_test_poll ───
    if ((req.query && req.query.action === 'chat_test_poll') || (req.body && req.body.action === 'chat_test_poll')) {
        const body = req.body || {};
        const query = req.query || {};
        const id_empresa = body.id_empresa || query.id_empresa || 'a0269c72-e0dd-4a5c-91e5-227665905126';
        const last_id = body.last_id || query.last_id; // ID da última mensagem IA conhecida
        const since = body.since || query.since; // ISO string

        try {
            let q = supabase
                .from('mensagens_teste')
                .select('id, conteudo, criado_em, remetente, nome_cliente')
                .eq('id_empresa', id_empresa)
                .eq('remetente', 'ia')
                .order('criado_em', { ascending: false })
                .limit(1);

            const { data, error } = await q;
            if (error) throw error;

            if (data && data.length > 0) {
                const latest = data[0];

                // 1. Se informou last_id: nova mensagem é qualquer uma com ID diferente
                if (last_id) {
                    if (latest.id !== last_id) {
                        return res.status(200).json({
                            success: true,
                            hasNew: true,
                            resposta: latest.conteudo,
                            id: latest.id,
                            criado_em: latest.criado_em
                        });
                    } else {
                        return res.status(200).json({
                            success: true,
                            hasNew: false
                        });
                    }
                }

                // 2. Se informou since (com margem de 45s para desvio de relógio entre cliente e servidor):
                if (since) {
                    const msgTime = new Date(latest.criado_em).getTime();
                    const sinceTime = new Date(since).getTime();
                    if (msgTime > (sinceTime - 45000)) {
                        return res.status(200).json({
                            success: true,
                            hasNew: true,
                            resposta: latest.conteudo,
                            id: latest.id,
                            criado_em: latest.criado_em
                        });
                    } else {
                        return res.status(200).json({
                            success: true,
                            hasNew: false
                        });
                    }
                }

                // 3. Chamada inicial de sincronização (obtém ID atual)
                return res.status(200).json({
                    success: true,
                    hasNew: false,
                    currentId: latest.id
                });
            }

            return res.status(200).json({
                success: true,
                hasNew: false
            });
        } catch (err) {
            console.error('Erro no polling chat_test_poll:', err);
            return res.status(500).json({
                error: err.message || 'Erro ao consultar respostas do agente.'
            });
        }
    }

    // ─── MODO DETALHE: /api/list_tenants?id=UUID ────────────────────────────────
    if (req.query && req.query.id) {
        const id = req.query.id;
        try {
            const { data: usuario, error: errorUser } = await supabase
                .from('usuarios')
                .select('*')
                .eq('id', id)
                .single();

            if (errorUser) throw errorUser;

            const horarios = usuario.horarios || [];

            const data30diasStr = new Date(new Date().getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString();

            const { count: leadsCount } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('id_empresa', id)
                .gte('criado_em', data30diasStr);

            let reunioesCount = 0;
            try {
                const { data: ags } = await supabase
                    .from('agendamentos').select('*')
                    .eq('id_empresa', id);
                if (ags) {
                    reunioesCount = ags.filter(a => {
                        if (!a.status || a.status.trim().toLowerCase() !== 'qualificado') return false;
                        const aDate = new Date(a.created_at || a.criado_em || a.data_agendamento);
                        return aDate >= new Date(data30diasStr);
                    }).length;
                }
            } catch (e) { console.error('Erro agendamentos admin detalhe:', e); }

            // Calcular status de pagamento
            let evaluatedStatus = usuario.status_assinatura || 'vencido';
            let diffDays = 0;

            if (usuario.data_vencimento) {
                const dataVencStr = usuario.data_vencimento.split('T')[0];
                const [yr, mo, dy] = dataVencStr.split('-');
                const dataVenc = new Date(parseInt(yr), parseInt(mo) - 1, parseInt(dy), 0, 0, 0);
                const hojeStr = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
                const hoje = new Date(hojeStr);
                dataVenc.setHours(0, 0, 0, 0);
                hoje.setHours(0, 0, 0, 0);
                const diffTime = dataVenc.getTime() - hoje.getTime();
                diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays < 0) evaluatedStatus = 'vencido';
                else if (diffDays <= 3) evaluatedStatus = 'Aviso prévio';
                else evaluatedStatus = 'pago';
            }

            let reportes = [];
            try {
                const { data: repData, error: repError } = await supabase
                    .from('reportes_agente')
                    .select('*')
                    .eq('id_empresa', id)
                    .order('criado_em', { ascending: false });
                if (!repError && repData) reportes = repData;
            } catch (e) {
                console.error('Erro ao buscar reportes no detalhe:', e);
            }

            return res.status(200).json({
                usuario,
                horarios: horarios || [],
                status: evaluatedStatus,
                diasRestantes: diffDays,
                total_leads: leadsCount || 0,
                reunioes_marcadas: reunioesCount || 0,
                reportes: reportes || []
            });

        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal server error', details: err.message });
        }
    }

    // ─── MODO LISTA: /api/list_tenants ──────────────────────────────────────────
    try {
        const { data: usuarios, error: errUser } = await supabase
            .from('usuarios')
            .select('*')
            .neq('tipo_usuario', 'administrador');

        if (errUser) throw errUser;

        const result = [];

        for (const user of usuarios) {
            let currentStatus = user.status_assinatura || 'vencido';
            let evaluatedStatus = currentStatus;
            
            if (user.data_vencimento) {
                const dataVencStr = user.data_vencimento.split('T')[0];
                const [yr, mo, dy] = dataVencStr.split('-');
                const dataVenc = new Date(yr, mo - 1, dy, 0, 0, 0);
                
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

                if (evaluatedStatus !== currentStatus) {
                    currentStatus = evaluatedStatus;
                    await supabase
                        .from('usuarios')
                        .update({ status_assinatura: currentStatus })
                        .eq('id', user.id);
                }
            }

            let leadsCount = user.quantidade_leads;
            
            if (leadsCount === undefined || leadsCount === null) {
                const { count, error: errLeads } = await supabase
                    .from('leads')
                    .select('*', { count: 'exact', head: true })
                    .eq('id_empresa', user.id);
                leadsCount = count;
            }

            // Reuniões agendadas (últimos 30 dias)
            const data30dias = new Date(new Date().getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString();
            let reunioesCount = 0;
            try {
                const { data: ags } = await supabase
                    .from('agendamentos').select('*')
                    .eq('id_empresa', user.id);
                if (ags) {
                    reunioesCount = ags.filter(a => {
                        if (!a.status || a.status.trim().toLowerCase() !== 'qualificado') return false;
                        const aDate = new Date(a.created_at || a.criado_em || a.data_agendamento);
                        return aDate >= new Date(data30dias);
                    }).length;
                }
            } catch (e) { console.error('Erro agendamentos admin lista:', e); }

            result.push({
                id_empresa: user.id,
                nome: user.nome_fantasia || user.nome_completo || 'Sem Nome',
                nome_fantasia: user.nome_fantasia || user.nome_completo || 'Sem Nome',
                nome_cliente: user.nome_cliente || null,
                email: user.email || 'N/A',
                vencimento: user.data_vencimento || 'N/A',
                status: evaluatedStatus,
                total_leads: leadsCount || 0,
                reunioes_marcadas: reunioesCount || 0,
                criado_em: user.criado_em || null,
                whatsapp: user.whatsapp || null,
                segmento: user.segmento || null,
                localizacao: user.localizacao || null,
                descricao: user.descricao || null,
                cnpj_cpf: user.cnpj_cpf || null,
                horarios: user.horarios || null,
                mensalidade: user.mensalidade || null
            });
        }

        return res.status(200).json(result);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error', details: err.message });
    }
}
