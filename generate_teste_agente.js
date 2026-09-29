const fs = require('fs');

const filesToUpdate = [
    'index.html',
    'conversas.html',
    'tarefas.html',
    'relatorios.html',
    'configuracoes.html',
    'notificacoes.html',
    'admin.html'
];

const menuItem = `
                <a href="teste-agente.html" class="nav-item">
                    <i class="ph ph-robot"></i>
                    <span>Teste seu Agente</span>
                </a>`;

for (const file of filesToUpdate) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    
    // Evitar duplicao
    if (!content.includes('href="teste-agente.html"')) {
        content = content.replace(
            /(<a href="relatorios\.html" class="nav-item">[\s\S]*?<\/a>)/,
            `$1${menuItem}`
        );
        fs.writeFileSync(file, content, 'utf8');
    }
}

// Criar teste-agente.html
if (fs.existsSync('index.html')) {
    let content = fs.readFileSync('index.html', 'utf8');
    
    // Atualizar o item ativo do menu
    content = content.replace(/class="nav-item active"/g, 'class="nav-item"');
    content = content.replace(/<a href="teste-agente\.html" class="nav-item">/, '<a href="teste-agente.html" class="nav-item active">');
    
    // Substituir o ttulo da pgina
    content = content.replace(/<h1.*?>Visão geral<\/h1>/, '<h1>Teste seu Agente</h1><p style="color: var(--color-text-mut); margin-top: 4px;">Converse com a inteligência artificial da sua empresa e veja como ela atende seus clientes.</p>');
    content = content.replace(/<title>.*?<\/title>/, '<title>Teste seu Agente - AutomatiZAP</title>');
    
    // Remover o comentrio principal de contedo
    const mainContentRegex = /<div class="kpi-grid">[\s\S]*?(?=<\/main>)/;
    
    const newContent = `
    <!-- Barra de aviso -->
    <div style="background-color: #FEF9C3; color: #854D0E; padding: 12px 16px; border-radius: 8px; display: flex; align-items: center; gap: 8px; margin-top: 24px; margin-bottom: 24px; font-size: 14px;">
        <i class="ph ph-clock" style="font-size: 20px; color: #CA8A04;"></i>
        <span>Você está no período de teste gratuito. <strong>Restam 5 dias.</strong></span>
    </div>

    <!-- Layout Grid 2 Colunas -->
    <div class="teste-agente-layout" style="display: flex; gap: 24px; flex-wrap: wrap; align-items: flex-start;">
        
        <!-- Coluna Esquerda: CHAT -->
        <div class="card chat-card" style="flex: 3; min-width: 300px; padding: 0; display: flex; flex-direction: column; height: calc(100vh - 220px); min-height: 500px;">
            <!-- Cabecalho Chat -->
            <div style="padding: 16px 24px; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 40px; height: 40px; background-color: var(--color-primary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                        <i class="ph-fill ph-robot"></i>
                    </div>
                    <div>
                        <h3 style="font-size: 15px; margin: 0; color: var(--color-text-main);">Assistente [Nome da Clínica]</h3>
                        <div style="display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--color-text-mut); margin-top: 2px;">
                            <span style="width: 8px; height: 8px; background-color: #22c55e; border-radius: 50%; display: inline-block;"></span>
                            online
                        </div>
                    </div>
                </div>
                <button class="btn-icon outline" style="border: none;"><i class="ph ph-dots-three-vertical"></i></button>
            </div>

            <!-- Corpo do Chat -->
            <div style="flex: 1; background-color: #F9FAFB; padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <span style="background-color: #E5E7EB; color: var(--color-text-mut); font-size: 11px; padding: 4px 12px; border-radius: 12px; font-weight: 500;">Hoje</span>
                </div>

                <!-- Mensagem Cliente -->
                <div style="display: flex; justify-content: flex-end; width: 100%;">
                    <div style="background-color: #DCFCE7; color: #065F46; padding: 12px 16px; border-radius: 16px 16px 0 16px; max-width: 75%; position: relative; font-size: 14px; line-height: 1.5;">
                        Quanto custa uma limpeza de pele?
                        <div style="display: flex; align-items: center; justify-content: flex-end; gap: 4px; margin-top: 4px; font-size: 10px; color: #16A34A;">
                            14:32 <i class="ph ph-checks"></i>
                        </div>
                    </div>
                </div>

                <!-- Mensagem IA -->
                <div style="display: flex; justify-content: flex-start; width: 100%; gap: 12px;">
                    <div style="width: 32px; height: 32px; background-color: var(--color-primary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; margin-top: auto;">
                        <i class="ph-fill ph-robot"></i>
                    </div>
                    <div style="background-color: white; color: var(--color-text-main); padding: 12px 16px; border-radius: 16px 16px 16px 0; max-width: 75%; border: 1px solid var(--color-border); font-size: 14px; line-height: 1.5;">
                        Nossa limpeza de pele sai R$150, e a avaliação inicial é gratuita! Quer agendar um horário?
                        <div style="text-align: right; margin-top: 4px; font-size: 10px; color: var(--color-text-mut);">
                            14:32
                        </div>
                    </div>
                </div>

                <!-- Mensagem Cliente -->
                <div style="display: flex; justify-content: flex-end; width: 100%;">
                    <div style="background-color: #DCFCE7; color: #065F46; padding: 12px 16px; border-radius: 16px 16px 0 16px; max-width: 75%; position: relative; font-size: 14px; line-height: 1.5;">
                        Qual o horário de atendimento?
                        <div style="display: flex; align-items: center; justify-content: flex-end; gap: 4px; margin-top: 4px; font-size: 10px; color: #16A34A;">
                            14:33 <i class="ph ph-checks"></i>
                        </div>
                    </div>
                </div>

                <!-- Mensagem IA -->
                <div style="display: flex; justify-content: flex-start; width: 100%; gap: 12px;">
                    <div style="width: 32px; height: 32px; background-color: var(--color-primary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; margin-top: auto;">
                        <i class="ph-fill ph-robot"></i>
                    </div>
                    <div style="background-color: white; color: var(--color-text-main); padding: 12px 16px; border-radius: 16px 16px 16px 0; max-width: 75%; border: 1px solid var(--color-border); font-size: 14px; line-height: 1.5;">
                        Nosso horário de atendimento é de segunda a sexta, das 08h às 18h, e aos sábados das 08h às 12h.
                        <div style="text-align: right; margin-top: 4px; font-size: 10px; color: var(--color-text-mut);">
                            14:33
                        </div>
                    </div>
                </div>

                <!-- Mensagem Cliente -->
                <div style="display: flex; justify-content: flex-end; width: 100%;">
                    <div style="background-color: #DCFCE7; color: #065F46; padding: 12px 16px; border-radius: 16px 16px 0 16px; max-width: 75%; position: relative; font-size: 14px; line-height: 1.5;">
                        Certo, pode me ajudar a agendar?
                        <div style="display: flex; align-items: center; justify-content: flex-end; gap: 4px; margin-top: 4px; font-size: 10px; color: #16A34A;">
                            14:34 <i class="ph ph-checks"></i>
                        </div>
                    </div>
                </div>

                <!-- Mensagem IA -->
                <div style="display: flex; justify-content: flex-start; width: 100%; gap: 12px;">
                    <div style="width: 32px; height: 32px; background-color: var(--color-primary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; margin-top: auto;">
                        <i class="ph-fill ph-robot"></i>
                    </div>
                    <div style="background-color: white; color: var(--color-text-main); padding: 12px 16px; border-radius: 16px 16px 16px 0; max-width: 75%; border: 1px solid var(--color-border); font-size: 14px; line-height: 1.5;">
                        Claro! Posso te ajudar a agendar agora mesmo. Qual dia e horário você prefere?
                        <div style="text-align: right; margin-top: 4px; font-size: 10px; color: var(--color-text-mut);">
                            14:34
                        </div>
                    </div>
                </div>

            </div>

            <!-- Rodape Chat -->
            <div style="padding: 16px 24px; border-top: 1px solid var(--color-border); background-color: white; display: flex; align-items: center; gap: 12px;">
                <div style="flex: 1; display: flex; align-items: center; background-color: #F3F4F6; border-radius: 24px; padding: 10px 16px;">
                    <i class="ph ph-smiley" style="font-size: 20px; color: var(--color-text-mut); margin-right: 12px; cursor: pointer;"></i>
                    <input type="text" placeholder="Digite sua mensagem..." style="border: none; background: transparent; width: 100%; outline: none; font-size: 14px; color: var(--color-text-main);">
                </div>
                <button class="btn btn-primary" style="width: 44px; height: 44px; border-radius: 50%; padding: 0; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <i class="ph-fill ph-paper-plane-tilt" style="font-size: 20px;"></i>
                </button>
            </div>
        </div>

        <!-- Coluna Direita: CORRIGIR MEU AGENTE -->
        <div class="card report-card" style="flex: 2; min-width: 300px; display: flex; flex-direction: column;">
            
            <div style="margin-bottom: 24px;">
                <h3 style="font-size: 18px; margin: 0; color: var(--color-text-main); display: flex; align-items: center; gap: 8px;">
                    <i class="ph ph-gear text-primary" style="font-size: 22px;"></i> Corrigir meu Agente
                </h3>
                <p style="color: var(--color-text-mut); font-size: 13px; margin-top: 4px;">Encontrou algo que a IA fez errado? Nos conte aqui.</p>
            </div>

            <!-- Lista de Botoes de Reporte -->
            <div style="display: flex; flex-direction: column;">
                
                <!-- Item 1 -->
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 0; border-bottom: 1px solid var(--color-border);">
                    <div style="display: flex; align-items: center; gap: 12px; flex: 1; padding-right: 16px;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background-color: #FEE2E2; color: #EF4444; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">
                            <i class="ph ph-chat-teardrop-slash"></i>
                        </div>
                        <span style="font-size: 13.5px; font-weight: 500; color: var(--color-text-sec); line-height: 1.3;">A IA respondeu algo errado</span>
                    </div>
                    <button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px; flex-shrink: 0;">Reportar</button>
                </div>

                <!-- Item 2 -->
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 0; border-bottom: 1px solid var(--color-border);">
                    <div style="display: flex; align-items: center; gap: 12px; flex: 1; padding-right: 16px;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background-color: #DBEAFE; color: #3B82F6; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">
                            <i class="ph ph-question"></i>
                        </div>
                        <span style="font-size: 13.5px; font-weight: 500; color: var(--color-text-sec); line-height: 1.3;">A IA esqueceu de perguntar algo importante</span>
                    </div>
                    <button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px; flex-shrink: 0;">Reportar</button>
                </div>

                <!-- Item 3 -->
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 0; border-bottom: 1px solid var(--color-border);">
                    <div style="display: flex; align-items: center; gap: 12px; flex: 1; padding-right: 16px;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background-color: #FFEDD5; color: #F97316; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">
                            <i class="ph ph-calendar-x"></i>
                        </div>
                        <span style="font-size: 13.5px; font-weight: 500; color: var(--color-text-sec); line-height: 1.3;">Erro ao tentar marcar um horário</span>
                    </div>
                    <button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px; flex-shrink: 0;">Reportar</button>
                </div>

                <!-- Item 4 -->
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 0; border-bottom: 1px solid var(--color-border);">
                    <div style="display: flex; align-items: center; gap: 12px; flex: 1; padding-right: 16px;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background-color: #F3E8FF; color: #A855F7; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">
                            <i class="ph ph-smiley-meh"></i>
                        </div>
                        <span style="font-size: 13.5px; font-weight: 500; color: var(--color-text-sec); line-height: 1.3;">O tom de voz não combina com minha empresa</span>
                    </div>
                    <button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px; flex-shrink: 0;">Reportar</button>
                </div>

                <!-- Item 5 -->
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 0;">
                    <div style="display: flex; align-items: center; gap: 12px; flex: 1; padding-right: 16px;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background-color: var(--color-primary-light); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">
                            <i class="ph ph-plus"></i>
                        </div>
                        <span style="font-size: 13.5px; font-weight: 500; color: var(--color-text-sec); line-height: 1.3;">Outro problema</span>
                    </div>
                    <button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px; flex-shrink: 0;">Reportar</button>
                </div>

            </div>

            <!-- Ultimos Reportes -->
            <div style="margin-top: 32px;">
                <h4 style="font-size: 13px; color: var(--color-text-mut); margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
                    <i class="ph ph-clock"></i> Últimos reportes enviados
                </h4>
                
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <!-- Report 1 -->
                    <div style="background-color: #F9FAFB; border: 1px solid var(--color-border); border-radius: 8px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: 0.2s;">
                        <span style="font-size: 13px; color: var(--color-text-sec); line-height: 1.4; flex: 1; padding-right: 16px;">A IA não sabia informar o horário de funcionamento aos sábados</span>
                        <div style="display: flex; align-items: center; gap: 12px; flex-shrink: 0;">
                            <span style="font-size: 12px; color: var(--color-text-mut);">24/09</span>
                            <i class="ph ph-caret-right" style="color: var(--color-text-mut);"></i>
                        </div>
                    </div>
                    
                    <!-- Report 2 -->
                    <div style="background-color: #F9FAFB; border: 1px solid var(--color-border); border-radius: 8px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: 0.2s;">
                        <span style="font-size: 13px; color: var(--color-text-sec); line-height: 1.4; flex: 1; padding-right: 16px;">A IA respondeu um valor incorreto para o procedimento</span>
                        <div style="display: flex; align-items: center; gap: 12px; flex-shrink: 0;">
                            <span style="font-size: 12px; color: var(--color-text-mut);">22/09</span>
                            <i class="ph ph-caret-right" style="color: var(--color-text-mut);"></i>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
    `;
    
    content = content.replace(mainContentRegex, newContent);
    fs.writeFileSync('teste-agente.html', content, 'utf8');
}

console.log('Done generating file');
