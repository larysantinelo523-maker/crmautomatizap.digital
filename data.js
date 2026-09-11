import { supabase } from './supabase.js';

export async function fetchCompanyId() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

    const { data } = await supabase
        .from('usuarios')
        .select('id_empresa')
        .eq('id', userData.user.id)
        .single();
    
    return data?.id_empresa || null;
}

export async function fetchLeads() {
    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('criado_em', { ascending: false });
    
    if (error) {
        console.error('Erro ao buscar leads:', error);
        return [];
    }
    return data;
}

export async function fetchConversations(leadId) {
    const { data, error } = await supabase
        .from('conversas')
        .select('*')
        .eq('id_lead', leadId)
        .order('criado_em', { ascending: true });
    
    if (error) {
        console.error('Erro ao buscar conversas:', error);
        return [];
    }
    return data;
}

export async function sendMessage(leadId, messageText) {
    const id_empresa = await fetchCompanyId();
    if (!id_empresa) return null;

    const { data, error } = await supabase
        .from('conversas')
        .insert([{
            id_empresa: id_empresa,
            id_lead: leadId,
            mensagem: messageText,
            enviado_por: 'Humano',
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

    // Remove todas as mensagens de sistema anteriores deste lead para não poluir o histórico
    const { error: deleteError } = await supabase
        .from('conversas')
        .delete()
        .eq('id_lead', leadId)
        .eq('enviado_por', 'Sistema');
        
    if (deleteError) {
        console.error('Erro ao deletar msgs antigas:', deleteError);
    }

    // Insere a nova mensagem de sistema com o estado atual
    const { data, error } = await supabase
        .from('conversas')
        .insert([{
            id_empresa: id_empresa,
            id_lead: leadId,
            mensagem: isActive ? 'Bot foi reativado pelo administrador.' : 'Bot foi pausado pelo administrador.',
            enviado_por: 'Sistema',
            bot_ativo: isActive
        }]);

    if (error) {
        console.error('Erro ao alternar bot:', error);
    }
}

// ==========================================
// FUNÇÃO SECRETA PARA INJETAR DADOS DE TESTE
// ==========================================
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
            { id_empresa, nome: 'Mariana Silva', telefone: '(11) 98765-4321', status: 'Aguardando vendedor', origem: 'WhatsApp', interesse: 'Automação', orcamento: 'R$ 2.000 - R$ 5.000', qualificacao: 'Alta', resumo: 'A cliente demonstrou interesse em automatizar o atendimento da empresa. Informou que atualmente perde muitos leads por falta de resposta rápida. Tem interesse no plano completo e mencionou um orçamento entre R$ 2.000 e R$ 5.000.' },
            { id_empresa, nome: 'Lucas Pereira', telefone: '(21) 99999-8888', status: 'Em Atendimento', origem: 'WhatsApp', interesse: 'Criação de sites', orcamento: 'R$ 1.000 - R$ 3.000', qualificacao: 'Média', resumo: 'Deseja criar um site institucional para a imobiliária dele. Gostaria de integração com WhatsApp.' },
            { id_empresa, nome: 'Roberto Costa', telefone: '(31) 91234-5678', status: 'Fechado', origem: 'Site', interesse: 'Gestão de redes sociais', orcamento: 'R$ 5.000+', qualificacao: 'Alta', resumo: 'Fechamos pacote trimestral de gestão de redes sociais. O cliente já enviou as referências visuais.' }
        ])
        .select();
    
    if (leadsError) {
        alert("Erro ao criar leads: " + leadsError.message);
        return;
    }

    // Criar Conversas para a Mariana
    await supabase.from('conversas').insert([
        { id_empresa, id_lead: leads[0].id, enviado_por: 'Cliente', mensagem: 'Olá, gostaria de saber sobre os planos.' },
        { id_empresa, id_lead: leads[0].id, enviado_por: 'IA', mensagem: 'Olá Mariana! Temos o Plano Básico e o Avançado. Qual atende melhor sua agência?' },
        { id_empresa, id_lead: leads[0].id, enviado_por: 'Cliente', mensagem: 'Quero detalhes do Avançado.' }
    ]);

    // Criar Conversas para o Lucas
    await supabase.from('conversas').insert([
        { id_empresa, id_lead: leads[1].id, enviado_por: 'Cliente', mensagem: 'Bom dia, vcs fazem integração com RD Station?' },
        { id_empresa, id_lead: leads[1].id, enviado_por: 'IA', mensagem: 'Bom dia, Lucas! Sim, nós integramos com o RD Station perfeitamente.' }
    ]);

    alert("Dados de teste injetados com sucesso! Atualize a página.");
}

// Expõe globalmente para uso rápido no console e scripts
window.dbAPI = {
    fetchLeads,
    fetchConversations,
    sendMessage,
    toggleBotState,
    seedFakeData
};
