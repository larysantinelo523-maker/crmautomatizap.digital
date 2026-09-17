document.addEventListener('DOMContentLoaded', () => {
    // Referências do DOM
    const wrapper = document.getElementById('tarefas-wrapper');
    const calBody = document.getElementById('cal-main-body');
    const btnClose = document.getElementById('summary-close-btn');
    
    // Elementos do Resumo
    const sumDateText = document.getElementById('summary-date-text');
    const sumAtend = document.getElementById('sum-atendimentos');
    const sumReunioes = document.getElementById('sum-reunioes');
    const sumTasksList = document.getElementById('summary-tasks-list');

    // Mês atual fixo para Setembro de 2026 como base
    const currentYear = 2026;
    const currentMonth = 8; // Setembro (0-index)

    // Dados Mockados para os dias do mês
    // Mapeando algumas datas (ex: chaves de 1 a 30)
    const mockData = {
        1: {
            kpis: { atendimentos: 12, reunioes: 5 },
            tasks: [
                { type: 'atendimento', client: 'Fernanda Costa', time: '08:24', text: 'A cliente Fernanda Costa ficou interessada e gostaria de saber mais sobre nossos serviços.', status: 'Atendido' },
                { type: 'atendimento', client: 'Bruna Martins', time: '09:12', text: 'A cliente Bruna Martins pediu mais informações sobre os planos e agendou uma conversa.', status: 'Atendido' },
                { type: 'reuniao', client: 'Clínica Vida', time: '10:37', text: 'O cliente Clínica Vida demonstrou interesse e solicitou o agendamento de uma reunião.', status: 'Reunião marcada' },
                { type: 'atendimento', client: 'Juliana Santos', time: '14:26', text: 'A cliente Juliana Santos solicitou um orçamento personalizado.', status: 'Atendido' }
            ]
        },
        7: {
            kpis: { atendimentos: 8, reunioes: 2 },
            tasks: [
                { type: 'reuniao', client: 'Studio Beleza', time: '11:00', text: 'O Studio Beleza agendou uma apresentação formal.', status: 'Reunião marcada' },
                { type: 'atendimento', client: 'Vanessa Martins', time: '16:45', text: 'A cliente Vanessa Martins tirou dúvidas sobre o plano e ficou de pensar.', status: 'Atendido' }
            ]
        },
        14: {
            kpis: { atendimentos: 20, reunioes: 4 },
            tasks: [
                { type: 'atendimento', client: 'Tatiana Alves', time: '09:00', text: 'A cliente Tatiana Alves gostou dos preços e quer prosseguir.', status: 'Atendido' },
                { type: 'atendimento', client: 'Rafael Pereira', time: '10:15', text: 'O cliente Rafael Pereira pediu contato para amanhã.', status: 'Atendido' },
                { type: 'reuniao', client: 'Agência PR', time: '14:00', text: 'Reunião confirmada com a Agência PR.', status: 'Reunião marcada' }
            ]
        },
        16: {
            kpis: { atendimentos: 15, reunioes: 3 },
            tasks: [
                { type: 'atendimento', client: 'João Silva', time: '08:24', text: 'O cliente João Silva ficou interessado e gostaria de saber mais sobre nossos serviços.', status: 'Atendido' },
                { type: 'atendimento', client: 'Maria Clara', time: '09:12', text: 'A cliente Maria Clara pediu mais informações sobre os planos e agendou uma conversa.', status: 'Atendido' },
                { type: 'reuniao', client: 'Rafael Lima', time: '10:37', text: 'O cliente Rafael Lima demonstrou interesse e solicitou o agendamento de uma reunião.', status: 'Reunião marcada' },
                { type: 'atendimento', client: 'Ana Fernandes', time: '11:03', text: 'A cliente Ana Fernandes solicitou um orçamento personalizado.', status: 'Atendido' },
                { type: 'atendimento', client: 'Pedro Paulo', time: '14:26', text: 'O cliente Pedro Paulo confirmou a reunião para o dia 17.', status: 'Atendido' },
                { type: 'atendimento', client: 'Luana Souza', time: '16:18', text: 'A cliente Luana Souza tirou dúvidas sobre o plano e fez a compra.', status: 'Atendido' }
            ]
        },
        21: {
            kpis: { atendimentos: 5, reunioes: 1 },
            tasks: [
                { type: 'atendimento', client: 'Vanessa Souza', time: '10:00', text: 'A cliente Vanessa Souza pediu um orçamento.', status: 'Atendido' },
                { type: 'reuniao', client: 'Loja do Pão', time: '15:30', text: 'Reunião de alinhamento marcada.', status: 'Reunião marcada' }
            ]
        },
        30: {
            kpis: { atendimentos: 10, reunioes: 2 },
            tasks: [
                { type: 'atendimento', client: 'Wagner Silva', time: '08:30', text: 'O cliente Wagner Silva aprovou a proposta.', status: 'Atendido' },
                { type: 'atendimento', client: 'Juliana Mendes', time: '11:20', text: 'A cliente Juliana Mendes solicitou contrato.', status: 'Atendido' }
            ]
        }
    };

    // Helper para gerar iniciais
    function getInitials(name) {
        if (!name) return '??';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    // Helper para cor do badge com base no status
    function getStatusBadgeClass(status) {
        switch(status) {
            case 'Atendido': return 'green';
            case 'Reunião marcada': return 'blue';
            case 'Lead qualificado': return 'purple';
            case 'Venda': return 'yellow';
            default: return 'green';
        }
    }

    // Gerar o calendário
    function renderCalendar() {
        calBody.innerHTML = '';
        
        // 1 de Setembro de 2026 é Terça-feira (2)
        const firstDayIndex = 2; 
        const daysInMonth = 30;
        
        // Dias do mês anterior
        for (let i = 0; i < firstDayIndex; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'cal-day-cell empty-month';
            emptyCell.innerHTML = `<div class="cal-day-number">${31 - firstDayIndex + i + 1}</div>`;
            calBody.appendChild(emptyCell);
        }

        // Dias do mês atual
        for (let i = 1; i <= daysInMonth; i++) {
            const cell = document.createElement('div');
            cell.className = 'cal-day-cell';
            cell.dataset.day = i;
            
            let html = `<div class="cal-day-number">${i}</div>`;
            html += `<div class="cal-day-tasks">`;
            
            // Injetar tasks mockadas se houver
            if (mockData[i]) {
                const tasks = mockData[i].tasks;
                tasks.forEach(t => {
                    let pillClass = t.type === 'reuniao' ? 'blue' : 'green';
                    let icon = t.type === 'reuniao' ? 'ph-calendar-blank' : 'ph-whatsapp-logo';
                    html += `
                        <div class="cal-task-pill ${pillClass}">
                            <i class="ph ${icon}"></i> ${t.client.split(' ')[0]}
                        </div>
                    `;
                });
            }
            
            html += `</div>`;
            cell.innerHTML = html;
            
            // Evento de clique
            cell.addEventListener('click', () => {
                document.querySelectorAll('.cal-day-cell').forEach(c => c.classList.remove('active'));
                cell.classList.add('active');
                openSummary(i);
            });
            
            calBody.appendChild(cell);
        }
        
        // Completar a grid (para dar 35 células totais - 5 semanas de 7 dias)
        const totalCellsRendered = firstDayIndex + daysInMonth;
        const remainingCells = 35 - totalCellsRendered;
        for (let i = 1; i <= remainingCells; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'cal-day-cell empty-month';
            emptyCell.innerHTML = `<div class="cal-day-number">${i}</div>`;
            calBody.appendChild(emptyCell);
        }
    }

    // Abrir painel
    function openSummary(day) {
        // Obter dia da semana de formatação
        const dateObj = new Date(currentYear, currentMonth, day);
        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const monthNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
        
        sumDateText.textContent = `${dayNames[dateObj.getDay()]}, ${String(day).padStart(2, '0')} de ${monthNames[currentMonth]} de ${currentYear}`;
        
        const data = mockData[day];
        
        if (data) {
            sumAtend.textContent = data.kpis.atendimentos;
            sumReunioes.textContent = data.kpis.reunioes;
            
            let listHtml = '';
            data.tasks.forEach(t => {
                const badgeColor = getStatusBadgeClass(t.status);
                listHtml += `
                    <div class="day-task-item">
                        <div class="dt-avatar">${getInitials(t.client)}</div>
                        <div class="dt-content">
                            <h5>${t.client}</h5>
                            <div class="dt-text">${t.text}</div>
                        </div>
                        <div class="dt-badge ${badgeColor}">${t.status}</div>
                        <i class="ph ph-caret-right dt-caret"></i>
                    </div>
                `;
            });
            sumTasksList.innerHTML = listHtml;
        } else {
            // Estado vazio
            sumAtend.textContent = '0';
            sumReunioes.textContent = '0';
                                    sumTasksList.innerHTML = `
                <div style="text-align: center; padding: 24px 0; color: var(--color-text-mut);">
                    Nenhuma atividade registrada neste dia.
                </div>
            `;
        }

        wrapper.classList.add('summary-active');
    }

    // Fechar painel
    if (btnClose) {
        btnClose.addEventListener('click', () => {
            wrapper.classList.remove('summary-active');
            document.querySelectorAll('.cal-day-cell').forEach(c => c.classList.remove('active'));
        });
    }

    // Iniciar
    if (calBody) {
        renderCalendar();
    }
});
