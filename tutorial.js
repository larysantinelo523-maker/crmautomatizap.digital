class TutorialSystem {
    constructor() {
        this.steps = [];
        this.currentStep = 0;
        this.overlay = null;
        this.tooltip = null;
        this.isActive = false;
        
        this.init();
    }

    init() {
        // Criar o overlay
        this.overlay = document.createElement('div');
        this.overlay.id = 'tutorial-overlay';
        document.body.appendChild(this.overlay);

        // Criar o tooltip
        this.tooltip = document.createElement('div');
        this.tooltip.id = 'tutorial-tooltip';
        this.tooltip.innerHTML = `
            <div class="tutorial-arrow"></div>
            <div class="tutorial-tooltip-header">
                <div class="icon-box"><i class="ph ph-info"></i></div>
                <h3 id="tutorial-title">Título</h3>
            </div>
            <div class="tutorial-tooltip-body" id="tutorial-text">
                Texto explicativo
            </div>
            <div class="tutorial-tooltip-footer">
                <span class="tutorial-step-counter" id="tutorial-counter">1 de X</span>
                <div class="tutorial-buttons">
                    <button class="tutorial-btn-close" id="tutorial-btn-close">Finalizar</button>
                    <button class="tutorial-btn-next" id="tutorial-btn-next">Avançar</button>
                </div>
            </div>
        `;
        document.body.appendChild(this.tooltip);

        // Event Listeners
        document.getElementById('tutorial-btn-close').addEventListener('click', () => this.endTutorial());
        document.getElementById('tutorial-btn-next').addEventListener('click', () => this.nextStep());
        
        // Se clicar no overlay escuro, não fazemos nada (força o usuário a ler ou clicar em Finalizar)
    }

    start(stepsArray) {
        if (!stepsArray || stepsArray.length === 0) return;
        this.steps = stepsArray;
        this.currentStep = 0;
        this.isActive = true;
        
        // Prevenir scroll do body
        document.body.style.overflow = 'hidden';
        
        // Ativar overlay
        this.overlay.classList.add('active');
        this.tooltip.classList.add('active');
        
        this.showStep(this.currentStep);
    }

    showStep(index) {
        // Remover highlight anterior
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });

        const step = this.steps[index];
        const targetElement = document.querySelector(step.selector);

        if (!targetElement) {
            console.warn(`Elemento não encontrado para o tutorial: ${step.selector}`);
            // Pula para o próximo se não achar
            if (index < this.steps.length - 1) {
                this.nextStep();
            } else {
                this.endTutorial();
            }
            return;
        }

        // Fazer scroll até o elemento (suave)
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Dar um tempinho pro scroll terminar antes de focar
        setTimeout(() => {
            targetElement.classList.add('tutorial-highlight');
            this.updateTooltip(step, targetElement, index);
        }, 300);
    }

    updateTooltip(step, targetElement, index) {
        // Textos
        document.getElementById('tutorial-title').textContent = step.title;
        document.getElementById('tutorial-text').textContent = step.text;
        document.getElementById('tutorial-counter').textContent = `${index + 1} de ${this.steps.length}`;
        
        const btnNext = document.getElementById('tutorial-btn-next');
        if (index === this.steps.length - 1) {
            btnNext.textContent = "Concluir";
            btnNext.classList.replace('tutorial-btn-next', 'tutorial-btn-next'); // mantem o estilo
        } else {
            btnNext.textContent = "Avançar";
        }

        // Posicionamento inteligente (cálculo simplificado)
        const rect = targetElement.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const arrow = this.tooltip.querySelector('.tutorial-arrow');
        
        // Reseta seta
        arrow.className = 'tutorial-arrow';
        
        let top, left;

        // Tentar posicionar na direita
        if (window.innerWidth - rect.right > 350) {
            top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
            left = rect.right + 20;
            arrow.classList.add('left');
        } 
        // Tentar na esquerda
        else if (rect.left > 350) {
            top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
            left = rect.left - tooltipRect.width - 20;
            arrow.classList.add('right');
        }
        // Tentar em baixo
        else if (window.innerHeight - rect.bottom > 250) {
            top = rect.bottom + 20;
            left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
            arrow.classList.add('top');
        }
        // Tentar em cima
        else {
            top = rect.top - tooltipRect.height - 20;
            left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
            arrow.classList.add('bottom');
        }

        // Garantir que não vaze a tela
        top = Math.max(10, Math.min(top, window.innerHeight - tooltipRect.height - 10));
        left = Math.max(10, Math.min(left, window.innerWidth - tooltipRect.width - 10));

        this.tooltip.style.top = `${top + window.scrollY}px`;
        this.tooltip.style.left = `${left + window.scrollX}px`;
    }

    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.showStep(this.currentStep);
        } else {
            this.endTutorial();
        }
    }

    endTutorial() {
        this.isActive = false;
        document.body.style.overflow = '';
        this.overlay.classList.remove('active');
        this.tooltip.classList.remove('active');
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
    }
}

// Inicializa globalmente
window.tutorialSystem = new TutorialSystem();

// Função que cada página chama com seus próprios passos
window.startPageTutorial = function() {
    const pathname = window.location.pathname;
    let steps = [];

    // Passos para o Dashboard (Visão Geral)
    if (pathname.includes('index.html') || pathname.endsWith('/')) {
        steps = [
            {
                selector: window.innerWidth <= 768 ? '.mobile-bottom-bar' : '.sidebar',
                title: 'Menu de Navegação',
                text: 'Aqui ficam todas as ferramentas do CRM. Você pode acessar seus Leads, Conversas, Tarefas e Relatórios com apenas um clique.'
            },
            {
                selector: '.kpi-card:nth-child(1)',
                title: 'Leads Atendidos',
                text: 'Este card mostra quantos leads tiveram o atendimento finalizado pela IA.'
            },
            {
                selector: '.kpi-card:nth-child(2)',
                title: 'Reuniões Marcadas',
                text: 'Este card mostra quantas reuniões a IA conseguiu agendar com sucesso na agenda.'
            },
            {
                selector: '.kpi-card:nth-child(3)',
                title: 'Leads a Recuperar',
                text: 'Este card mostra quantos leads recusaram o produto ou serviço durante o atendimento.'
            },
            {
                selector: '.table-card',
                title: 'Tabela de Leads Recentes',
                text: 'Acompanhe os últimos potenciais clientes atendidos pela IA. Para ver o dossiê completo de cada um, acesse a aba "Leads".'
            },
            {
                selector: '.table-controls',
                title: 'Busca e Filtros',
                text: 'Pesquise rapidamente um lead específico por nome, telefone ou interesse, ou use o funil para filtros avançados.'
            },
            {
                selector: '.pagination',
                title: 'Paginação',
                text: 'Navegue entre as páginas (1, 2, 3, 4, 5...) para explorar a lista completa de leads que não couberam na primeira tela.'
            },
            {
                selector: '.side-column',
                title: 'Suas Tarefas',
                text: 'Não perca nenhum compromisso. Suas reuniões e retornos importantes agendados aparecerão listados aqui na lateral direita.'
            }
        ];
    } 
    // Passos para Relatórios
    else if (pathname.includes('relatorios.html')) {
        steps = [
            {
                selector: '.kpi-card:nth-child(1)',
                title: 'Leads Atendidos',
                text: 'Este card mostra quantos leads tiveram o atendimento finalizado pela IA.'
            },
            {
                selector: '.kpi-card:nth-child(2)',
                title: 'Reuniões Marcadas',
                text: 'Este card mostra quantas reuniões a IA conseguiu agendar com sucesso na agenda.'
            },
            {
                selector: '.kpi-card:nth-child(3)',
                title: 'Leads a Recuperar',
                text: 'Este card mostra quantos leads recusaram o produto ou serviço durante o atendimento.'
            },
            {
                selector: '.relatorios-charts .card:first-child',
                title: 'Gráfico de Desempenho',
                text: 'Visualize a conversão do seu funil e os resultados em formato de linha.'
            },
            {
                selector: '.map-container-flex',
                title: 'Mapa Interativo',
                text: 'Passe o mouse (ou clique no celular) para ver de quais estados do Brasil seus Leads estão vindo com mais frequência e dê zoom para ver detalhes.'
            }
        ];
    }
    // Passos para Leads
    else if (pathname.includes('leads.html')) {
        steps = [
            {
                selector: '.table-card',
                title: 'Tabela de Leads',
                text: 'Aqui ficam armazenados todos os contatos que chegam no seu WhatsApp.'
            },
            {
                selector: 'tbody tr:first-child .btn-exibir-infos',
                title: 'Dossiê Completo',
                text: 'Clique em "Exibir informações" para abrir o Dossiê do cliente, onde a IA salva resumos da conversa, orçamento e nível de interesse mapeados automaticamente.'
            },
            {
                selector: '.table-controls',
                title: 'Filtros e Pesquisa por Clientes',
                text: 'Aqui você pode buscar leads pelo nome rapidamente ou utilizar filtros avançados.'
            }
        ];
    }
    // Passos para Conversas
    else if (pathname.includes('conversas.html')) {
        steps = [
            {
                selector: '.chat-layout .card',
                title: 'Lista de Contatos',
                text: 'Aqui você visualiza todas as conversas do seu WhatsApp em tempo real.'
            },
            {
                selector: '.iphone-mockup-wrapper',
                title: 'Simulador do WhatsApp',
                text: 'Acompanhe as conversas exatamente como elas aparecem no celular do cliente, visualizando a interação da IA ao vivo.'
            },
            {
                selector: '.hint-box',
                title: 'Dica Importante',
                text: 'Leia atentamente essa dica sobre como intervir na conversa e pausar o robô caso necessário!'
            }
        ];
    }
    // Passos Genéricos (Fallback)
    else {
        steps = [
            {
                selector: '.header',
                title: 'Bem-vindo ao CRM!',
                text: 'Aqui em cima você pode filtrar informações e acompanhar os dados da sua operação.'
            },
            {
                selector: window.innerWidth <= 768 ? '.mobile-bottom-bar' : '.sidebar',
                title: 'Navegação',
                text: 'Use o menu lateral para transitar entre as diferentes abas do sistema.'
            }
        ];
    }

    window.tutorialSystem.start(steps);
};

// Injetar botão de tutorial para mobile no corpo da página
document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.querySelector('.main-content');
    
    if (mainContent) {
        const mobileHelpBtn = document.createElement('button');
        // Usa a mesma classe base para herdar o visual e uma classe extra para mobile
        mobileHelpBtn.className = 'btn-tutorial-sidebar btn-tutorial-mobile-full';
        mobileHelpBtn.innerHTML = '<i class="ph ph-question"></i> Como utilizar o CRM';
        mobileHelpBtn.onclick = window.startPageTutorial;
        
        // Insere o botão logo abaixo do header
        const header = document.querySelector('.header');
        if (header && header.nextSibling) {
            header.parentNode.insertBefore(mobileHelpBtn, header.nextSibling);
        } else {
            mainContent.insertBefore(mobileHelpBtn, mainContent.firstChild);
        }
    }
});
