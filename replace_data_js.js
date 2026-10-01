const fs = require('fs');

let dataJs = fs.readFileSync('data.js', 'utf8');

const targetFunction = `export async function toggleBotState(leadId, isActive) {
    const id_empresa = await fetchCompanyId();
    if (!id_empresa) return null;

    const mensagemStr = isActive ? 'Bot foi reativado pelo administrador.' : 'Bot foi pausado pelo administrador.';

    // Verifica se já existe uma mensagem de sistema para este lead
    const { data: existingMsgs, error: checkError } = await supabase
        .from('mensagens')
        .select('id')
        .eq('lead_id', leadId)
        .eq('remetente', 'sistema');

    if (existingMsgs && existingMsgs.length > 0) {
        // Se já existe, apenas ATUALIZA a(s) linha(s) existente(s) em vez de criar novas
        const { error } = await supabase
            .from('mensagens')
            .update({
                conteudo: mensagemStr,
                bot_ativo: isActive,
                criado_em: new Date().toISOString() // atualiza a data para ir pro fim da lista
            })
            .eq('lead_id', leadId)
            .eq('remetente', 'sistema');
            
        if (error) console.error('Erro ao atualizar msg de sistema:', error);
    } else {
        // Se não existe, cria a primeira mensagem de sistema
        const { error } = await supabase
            .from('mensagens')
            .insert([{
                lead_id: leadId,
                conteudo: mensagemStr,
                remetente: 'sistema',
                tipo_mensagem: 'texto',
                bot_ativo: isActive
            }]);
            
        if (error) console.error('Erro ao inserir msg de sistema:', error);
    }
}`;

const newFunction = `export async function toggleBotState(leadId, isActive) {
    const id_empresa = await fetchCompanyId();
    if (!id_empresa) return null;

    const statusStr = isActive ? 'ativado' : 'desativado';

    const { error } = await supabase
        .from('leads')
        .update({ status_agente: statusStr })
        .eq('id', leadId);
        
    if (error) console.error('Erro ao atualizar status_agente do lead:', error);
}

export async function fetchLeadById(leadId) {
    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();
    if (error) {
        console.error('Erro ao buscar lead:', error);
        return null;
    }
    return data;
}`;

if (dataJs.includes(targetFunction)) {
    dataJs = dataJs.replace(targetFunction, newFunction);
} else {
    // try removing carriage returns
    dataJs = dataJs.replace(targetFunction.replace(/\r/g, ''), newFunction);
}

// Add fetchLeadById to window.dbAPI
const targetExport = `    toggleBotState,
    seedFakeData,
    subscribeToMessages,
    unsubscribeFromMessages
};`;
const newExport = `    toggleBotState,
    fetchLeadById,
    seedFakeData,
    subscribeToMessages,
    unsubscribeFromMessages
};`;
dataJs = dataJs.replace(targetExport, newExport);

fs.writeFileSync('data.js', dataJs);
console.log('data.js modificado');
