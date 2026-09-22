const fs = require('fs');
const data = fs.readFileSync('C:/Users/joaoa/.gemini/antigravity-ide/brain/cfc44c4a-f03e-42af-b878-9c38c5aac947/.system_generated/steps/6242/output.txt', 'utf8');
const wf = JSON.parse(data);

const resetIfId = 'node-checar-reset-' + Date.now();
const memoryManagerId = 'node-memory-manager-' + Date.now();
const confirmTextId = 'node-confirm-text-' + Date.now();

wf.workflow.connections['Supabase (Buscar/Criar Lead)'].main[0] = wf.workflow.connections['Supabase (Buscar/Criar Lead)'].main[0].filter(c => c.node !== 'Agente Seu Geremias1');
wf.workflow.connections['If'].main[1] = wf.workflow.connections['If'].main[1].filter(c => c.node !== 'Agente Seu Geremias1');

wf.workflow.connections['Supabase (Buscar/Criar Lead)'].main[0].push({ node: 'Checar Reset', type: 'main', index: 0 });
wf.workflow.connections['If'].main[1].push({ node: 'Checar Reset', type: 'main', index: 0 });

wf.workflow.connections['Checar Reset'] = {
  main: [
    [ { node: 'Limpar Memoria', type: 'main', index: 0 } ],
    [ { node: 'Agente Seu Geremias1', type: 'main', index: 0 } ]
  ]
};

wf.workflow.connections['Limpar Memoria'] = {
  main: [
    [ { node: 'Enviar Confirmacao Reset', type: 'main', index: 0 } ]
  ]
};

wf.workflow.connections['Enviar Confirmacao Reset'] = {
  main: [ [] ]
};

wf.workflow.nodes.push({
  parameters: {
    conditions: {
      options: {
        caseSensitive: false,
        leftValue: '',
        typeValidation: 'strict',
        version: 3
      },
      conditions: [
        {
          id: 'cond-reset-' + Date.now(),
          leftValue: '={{ $(\\"Configurar Empresa (Geremias)\\").first().json.mensagem_recebida }}',
          rightValue: 'reset',
          operator: {
            type: 'string',
            operation: 'equals',
            singleValue: true
          }
        }
      ],
      combinator: 'and'
    },
    options: {}
  },
  type: 'n8n-nodes-base.if',
  typeVersion: 2.3,
  position: [2300, 350],
  id: resetIfId,
  name: 'Checar Reset'
});

wf.workflow.nodes.push({
  parameters: {
    operation: 'deleteMessages',
    delete: 'allMessages',
    sessionKey: '={{ $json.id }}'
  },
  id: memoryManagerId,
  name: 'Limpar Memoria',
  type: '@n8n/n8n-nodes-langchain.memoryManager',
  typeVersion: 1,
  position: [2500, 250]
});

wf.workflow.nodes.push({
  parameters: {
    resource: 'messages-api',
    instanceName: 'AGENTE',
    remoteJid: '={{ $(\\"Configurar Empresa (Geremias)\\").first().json.telefone_cliente }}',
    messageText: 'Memória reiniciada com sucesso! Em que posso ajudar do zero?',
    options_message: {}
  },
  type: 'n8n-nodes-evolution-api.evolutionApi',
  typeVersion: 1,
  position: [2700, 250],
  id: confirmTextId,
  name: 'Enviar Confirmacao Reset',
  credentials: {
    evolutionApi: {
      id: '9xqNd08MDKGm82Rl',
      name: 'evolution_cloudfy'
    }
  }
});

fs.writeFileSync('C:/Users/joaoa/.gemini/antigravity-ide/brain/cfc44c4a-f03e-42af-b878-9c38c5aac947/.system_generated/steps/6242/output_modified.json', JSON.stringify(wf.workflow, null, 2), 'utf8');
console.log('Modified workflow written to output_modified.json');
