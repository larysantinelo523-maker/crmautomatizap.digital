import { supabase } from './supabase.js';

export async function fetchCompanyId() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

    // O ID da empresa é o próprio ID do usuário
    return userData.user.id;
}

export async function fetchLeads() {
    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('criado_em', { ascending: false });

    if (error) {
        console.error('Erro ao buscar leads:', error);
        alert("Erro Supabase: " + (error.message || JSON.stringify(error)));
        return [];
    }
    return data;
}

export async function fetchConversations(leadId) {
    const { data, error } = await supabase
        .from('mensagens')
        .select('*')
        .eq('lead_id', leadId)
        .order('criado_em', { ascending: true });

    if (error) {
        console.error('Erro ao buscar conversas:', error);
        return [];
    }
    return data;
}

export async function fetchTasks() {
    const { data, error } = await supabase
        .from('tarefas')
        .select('*')
        .order('data_vencimento', { ascending: true });

    if (error) {
        console.error('Erro ao buscar tarefas:', error);
        return [];
    }
    return data;
}

export async function fetchAgendamentos() {
    const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .order('data_agendamento', { ascending: true });

    if (error) {
        console.error('Erro ao buscar agendamentos:', error);
        return [];
    }
    return data;
}

export async function fetchUserData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('Erro ao buscar usuário:', error);
        return null;
    }
    return data;
}

export async function sendMessage(leadId, messageText) {
    const id_empresa = await fetchCompanyId();
    if (!id_empresa) return null;

    const { data, error } = await supabase
        .from('mensagens')
        .insert([{
            lead_id: leadId,
            conteudo: messageText,
            remetente: 'humano',
            tipo_mensagem: 'texto',
            bot_ativo: false // Ao mandar msg manual, assumimos que desativou o bot ou não importa pra lógica imediata
        }])
        .select();

    if (error) {
        console.error('Erro ao enviar mensagem:', error);
        return null;
    }
    return data[0];
}

export async function toggleBotState(leadId, isActive) {
    const id_empresa = await fetchCompanyId();
    if (!id_empresa) return null;

    const statusStr = isActive ? 'ativado' : 'desativado';

    const { error } = await supabase
        .from('leads')
        .update({ status_agente: statusStr })
        .eq('id', leadId);
        
    if (error) console.error('Erro ao atualizar status_agente do lead:', error);
}

// ==========================================
// FUNÇÃO SECRETA PARA INJETAR DADOS DE TESTE
// ==========================================
export async function fetchLeadById(leadId) { const { data, error } = await supabase.from('leads').select('*').eq('id', leadId).single(); if (error) { console.error('Erro ao buscar lead:', error); return null; } return data; }

export async function seedFakeData() {
    const id_empresa = await fetchCompanyId();
    if (!id_empresa) {
        alert("Erro: Usuário não tem empresa vinculada.");
        return;
    }

    // Criar Leads
    const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .insert([
            { id_empresa, nome: 'Mariana Silva', telefone: '(11) 98765-4321', status: 'Aguardando vendedor', interesse: 'Automação', orcamento: 'R$ 2.000 - R$ 5.000', qualificacao: 'Alta', resumo: 'A cliente demonstrou interesse em automatizar o atendimento da empresa. Informou que atualmente perde muitos leads por falta de resposta rápida. Tem interesse no plano completo e mencionou um orçamento entre R$ 2.000 e R$ 5.000.' },
            { id_empresa, nome: 'Lucas Pereira', telefone: '(21) 99999-8888', status: 'Em Atendimento', interesse: 'Criação de sites', orcamento: 'R$ 1.000 - R$ 3.000', qualificacao: 'Média', resumo: 'Deseja criar um site institucional para a imobiliária dele. Gostaria de integração com WhatsApp.' },
            { id_empresa, nome: 'Roberto Costa', telefone: '(31) 91234-5678', status: 'Fechado', interesse: 'Gestão de redes sociais', orcamento: 'R$ 5.000+', qualificacao: 'Alta', resumo: 'Fechamos pacote trimestral de gestão de redes sociais. O cliente já enviou as referências visuais.' }
        ])
        .select();

    if (leadsError) {
        alert("Erro ao criar leads: " + leadsError.message);
        return;
    }

    // Criar Conversas para a Mariana
    await supabase.from('mensagens').insert([
        { lead_id: leads[0].id, remetente: 'cliente', tipo_mensagem: 'texto', conteudo: 'Olá, gostaria de saber sobre os planos.' },
        { lead_id: leads[0].id, remetente: 'ia', tipo_mensagem: 'texto', conteudo: 'Olá Mariana! Temos o Plano Básico e o Avançado. Qual atende melhor sua agência?' },
        { lead_id: leads[0].id, remetente: 'cliente', tipo_mensagem: 'texto', conteudo: 'Quero detalhes do Avançado.' }
    ]);

    // Criar Conversas para o Lucas
    await supabase.from('mensagens').insert([
        { lead_id: leads[1].id, remetente: 'cliente', tipo_mensagem: 'texto', conteudo: 'Bom dia, vcs fazem integração com RD Station?' },
        { lead_id: leads[1].id, remetente: 'ia', tipo_mensagem: 'texto', conteudo: 'Bom dia, Lucas! Sim, nós integramos com o RD Station perfeitamente.' }
    ]);

    alert("Dados de teste injetados com sucesso! Atualize a página.");
}

// ==========================================
// REALTIME: escuta mensagens novas em tempo real
// ==========================================
export function subscribeToMessages(leadId, onNewMessage) {
    const channel = supabase
        .channel(`mensagens-lead-${leadId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'mensagens',
                filter: `lead_id=eq.${leadId}`
            },
            (payload) => {
                onNewMessage(payload.new);
            }
        )
        .subscribe();

    return channel; // retorna para poder cancelar depois
}

export function unsubscribeFromMessages(channel) {
    if (channel) supabase.removeChannel(channel);
}

// Expõe globalmente para uso rápido no console e scripts
window.dbAPI = {
    fetchLeads,
    fetchConversations,
    fetchTasks,
    fetchAgendamentos,
    fetchUserData,
    sendMessage,
    toggleBotState,
    fetchLeadById,
    seedFakeData,
    subscribeToMessages,
    unsubscribeFromMessages
};
