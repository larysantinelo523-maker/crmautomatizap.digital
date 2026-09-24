import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', () => {
    // Vencimento dinâmico do banco de dados
    let userVencimentoDay = 9; // Default

    // Referências do DOM
    const wrapper = document.getElementById('tarefas-wrapper');
    const calBody = document.getElementById('cal-main-body');
    const btnClose = document.getElementById('summary-close-btn');
    
    // Elementos do Resumo
    const sumDateText = document.getElementById('summary-date-text');
    const sumAtend = document.getElementById('sum-atendimentos');
    const sumReunioes = document.getElementById('sum-reunioes');
    const sumTasksList = document.getElementById('summary-tasks-list');

    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    let targetDayToClick = null;
    let targetMonthToClick = null;
    let targetYearToClick = null;

    // Mês atual e ano baseados na data real de hoje
    const todayDateObj = new Date();
    let currentYear = todayDateObj.getFullYear();
    let currentMonth = todayDateObj.getMonth();

    if (dateParam) {
        const parts = dateParam.split('-');
        if (parts.length === 3) {
            currentYear = parseInt(parts[0], 10);
            currentMonth = parseInt(parts[1], 10) - 1;
            targetDayToClick = parseInt(parts[2], 10);
            targetMonthToClick = currentMonth;
            targetYearToClick = currentYear;
        }
    }
    const monthNamesList = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    const calMonthYear = document.getElementById('cal-main-month-year');
    
    function updateMonthYearText() {
        if (calMonthYear) {
            calMonthYear.textContent = `${monthNamesList[currentMonth]} ${currentYear}`;
        }
    }

    // Dados Mockados para os dias do mês
    // Mapeando algumas datas (ex: chaves de 1 a 30)
    // Objeto que será preenchido com dados reais do Supabase
    let calendarData = {};

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

    // Gerar HTML de um mês específico
    function generateMonthHTML(year, month) {
        let htmlContent = '';
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayIndex = new Date(year, month, 1).getDay();
        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        
        const realToday = new Date();
        const isThisMonth = realToday.getFullYear() === year && realToday.getMonth() === month;
        const todayDate = realToday.getDate();
        
        let k = firstDayIndex;
        for (let i = 1; i <= daysInMonth; i++) {
            let classes = 'cal-day-cell';
            if (isThisMonth && i === todayDate) {
                classes += ' today';
            }
            
            let html = `<div class="${classes}" data-day="${i}" data-month="${month}" data-year="${year}">`;
            html += `<div class="mobile-day-name">${dayNames[k % 7]}</div>`;
            html += `<div class="cal-day-card">`;
            html += `<div class="cal-day-header">`;
            let numberColorStyle = '';
            // Lógica dinâmica para vencimento (userVencimentoDay = vermelho) e aviso prévio (3 dias antes = amarelo)
            if (i === userVencimentoDay) {
                numberColorStyle = 'color: #ef4444 !important; font-weight: 800;';
            } else if (i === userVencimentoDay - 3 || i === userVencimentoDay - 2 || i === userVencimentoDay - 1) {
                numberColorStyle = 'color: #eab308 !important; font-weight: 800;';
            }

            html += `<div class="cal-day-number" style="${numberColorStyle}">${i}</div>`;
            
            const dateKey = `${year}-${month}-${i}`;
            if (calendarData[dateKey]) {
                const kpis = calendarData[dateKey].kpis;
                if (kpis) {
                    html += `
                        <div class="cal-day-indicator">
                            <span class="ind-green">${kpis.atendimentos}</span><span class="ind-slash"> / </span><span class="ind-blue">${kpis.reunioes}</span>
                        </div>
                    `;
                }
                html += `</div>`; 

                html += `<div class="cal-day-tasks">`;
                const tasks = calendarData[dateKey].tasks;
                tasks.forEach(t => {
                    let pillClass = t.type === 'reuniao' ? 'blue' : 'green';
                    let icon = t.type === 'reuniao' ? 'ph-calendar-blank' : 'ph-whatsapp-logo';
                    html += `
                        <div class="cal-task-pill ${pillClass}">
                            <i class="ph ${icon}"></i> <span class="pill-text">${t.client.split(' ')[0]}</span>
                        </div>
                    `;
                });
            } else {
                html += `</div><div class="cal-day-tasks">`;
            }
            
            html += `</div></div></div>`;
            htmlContent += html;
            k++;
        }
        return htmlContent;
    }

    // Grid do Desktop (Estático 35 slots)
    function renderDesktopGrid() {
        calBody.innerHTML = '';
        const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        
        let k = 0;
        const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
        for (let i = 0; i < firstDayIndex; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'cal-day-cell empty-month';
            emptyCell.innerHTML = `
                <div class="mobile-day-name">${dayNames[k % 7]}</div>
                <div class="cal-day-card">
                    <div class="cal-day-number">${prevMonthDays - firstDayIndex + i + 1}</div>
                </div>
            `;
            calBody.appendChild(emptyCell);
            k++;
        }

        calBody.insertAdjacentHTML('beforeend', generateMonthHTML(currentYear, currentMonth));
        k += daysInMonth;

        const totalCellsRendered = firstDayIndex + daysInMonth;
        const remainingCells = 35 - totalCellsRendered;
        for (let i = 1; i <= remainingCells; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'cal-day-cell empty-month';
            emptyCell.innerHTML = `
                <div class="mobile-day-name">${dayNames[k % 7]}</div>
                <div class="cal-day-card">
                    <div class="cal-day-number">${i}</div>
                </div>
            `;
            calBody.appendChild(emptyCell);
            k++;
        }

        document.querySelectorAll('.cal-day-cell:not(.empty-month)').forEach(cell => {
            cell.addEventListener('click', () => {
                document.querySelectorAll('.cal-day-cell').forEach(c => c.classList.remove('active'));
                cell.classList.add('active');
                openSummary(parseInt(cell.dataset.day), parseInt(cell.dataset.month), parseInt(cell.dataset.year));
            });
        });
    }

    // Carrossel Contínuo do Mobile
    let observer;
    let isScrollLoading = false;
    let minRenderedMonth, minRenderedYear, maxRenderedMonth, maxRenderedYear;

    function renderInfiniteMobile() {
        calBody.innerHTML = '';
        
        minRenderedMonth = currentMonth - 1;
        minRenderedYear = currentYear;
        if (minRenderedMonth < 0) { minRenderedMonth = 11; minRenderedYear--; }
        
        maxRenderedMonth = currentMonth + 1;
        maxRenderedYear = currentYear;
        if (maxRenderedMonth > 11) { maxRenderedMonth = 0; maxRenderedYear++; }

        const html = generateMonthHTML(minRenderedYear, minRenderedMonth) + 
                     generateMonthHTML(currentYear, currentMonth) + 
                     generateMonthHTML(maxRenderedYear, maxRenderedMonth);
        calBody.innerHTML = html;

        if(observer) observer.disconnect();
        
        function updateMutedMonths(activeMonth, activeYear) {
            document.querySelectorAll('.cal-day-cell').forEach(cell => {
                const cellM = parseInt(cell.dataset.month);
                const cellY = parseInt(cell.dataset.year);
                if (cellM === activeMonth && cellY === activeYear) {
                    cell.classList.remove('empty-month');
                } else {
                    cell.classList.add('empty-month');
                }
            });
        }

        observer = new IntersectionObserver((entries) => {
            let mostVisible = null;
            let maxRatio = 0;
            entries.forEach(entry => {
                if (entry.intersectionRatio > maxRatio) {
                    maxRatio = entry.intersectionRatio;
                    mostVisible = entry.target;
                }
            });
            if (mostVisible && maxRatio > 0.4) {
                const m = parseInt(mostVisible.dataset.month);
                const y = parseInt(mostVisible.dataset.year);
                if (calMonthYear) calMonthYear.textContent = `${monthNamesList[m]} ${y}`;
                updateMutedMonths(m, y);
                currentMonth = m;
                currentYear = y;
            }
        }, { root: calBody, threshold: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0] });

        function attachEvents(cells) {
            cells.forEach(cell => {
                observer.observe(cell);
                cell.addEventListener('click', () => {
                    document.querySelectorAll('.cal-day-cell').forEach(c => c.classList.remove('active'));
                    cell.classList.add('active');
                    openSummary(parseInt(cell.dataset.day), parseInt(cell.dataset.month), parseInt(cell.dataset.year));
                });
            });
        }
        attachEvents(document.querySelectorAll('.cal-day-cell'));

        // Scroll para centralizar o dia de hoje ou o dia da URL
        setTimeout(() => {
            let cellToCenter = null;
            if (targetDayToClick && targetMonthToClick !== null && targetYearToClick !== null) {
                cellToCenter = calBody.querySelector(`.cal-day-cell[data-month="${targetMonthToClick}"][data-year="${targetYearToClick}"][data-day="${targetDayToClick}"]`);
            }
            if (!cellToCenter) {
                cellToCenter = calBody.querySelector('.cal-day-cell.today');
            }
            if (cellToCenter) {
                const centerPos = cellToCenter.offsetLeft - calBody.offsetLeft - (calBody.clientWidth / 2) + (cellToCenter.clientWidth / 2);
                calBody.scrollLeft = centerPos;
            } else {
                const firstCurrentDay = calBody.querySelector(`.cal-day-cell[data-month="${currentMonth}"]`);
                if (firstCurrentDay) {
                    calBody.scrollLeft = firstCurrentDay.offsetLeft - calBody.offsetLeft - 16;
                }
            }
        }, 50);

        // Lidar com o scroll infinito
        calBody.addEventListener('scroll', () => {
            if (window.innerWidth > 1024 || isScrollLoading) return;

            // Borda direita
            if (calBody.scrollLeft + calBody.clientWidth >= calBody.scrollWidth - 100) {
                isScrollLoading = true;
                maxRenderedMonth++;
                if(maxRenderedMonth > 11) { maxRenderedMonth = 0; maxRenderedYear++; }
                calBody.insertAdjacentHTML('beforeend', generateMonthHTML(maxRenderedYear, maxRenderedMonth));
                
                const daysAdded = new Date(maxRenderedYear, maxRenderedMonth + 1, 0).getDate();
                const newCells = Array.from(calBody.children).slice(-daysAdded);
                attachEvents(newCells);
                setTimeout(() => { isScrollLoading = false; }, 100);
            }

            // Borda esquerda
            if (calBody.scrollLeft <= 50) {
                isScrollLoading = true;
                minRenderedMonth--;
                if(minRenderedMonth < 0) { minRenderedMonth = 11; minRenderedYear--; }
                
                const prevScrollWidth = calBody.scrollWidth;
                calBody.insertAdjacentHTML('afterbegin', generateMonthHTML(minRenderedYear, minRenderedMonth));
                const newScrollWidth = calBody.scrollWidth;
                
                calBody.scrollLeft += (newScrollWidth - prevScrollWidth);

                const daysAdded = new Date(minRenderedYear, minRenderedMonth + 1, 0).getDate();
                const newCells = Array.from(calBody.children).slice(0, daysAdded);
                attachEvents(newCells);
                setTimeout(() => { isScrollLoading = false; }, 100);
            }
        });
    }

    function renderCalendar() {
        if (window.innerWidth <= 1024) {
            renderInfiniteMobile();
        } else {
            renderDesktopGrid();
        }
    }

    // Ouve resize para trocar de grid pra carrossel se a tela virar deitada
    window.addEventListener('resize', () => {
        // Debounce simples
        clearTimeout(window.resizeTimer);
        window.resizeTimer = setTimeout(() => {
            renderCalendar();
            updateMonthYearText();
        }, 250);
    });

    // Abrir painel
    function openSummary(day, month = currentMonth, year = currentYear) {
        const dateObj = new Date(year, month, day);
        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const monthNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
        
        sumDateText.textContent = `${dayNames[dateObj.getDay()]}, ${String(day).padStart(2, '0')} de ${monthNames[month]} de ${year}`;
        
        const dateKey = `${year}-${month}-${day}`;
        const data = calendarData[dateKey];
        
        if (data) {
            sumAtend.textContent = data.kpis.atendimentos;
            sumReunioes.textContent = data.kpis.reunioes;
            
            let listHtml = '';
            let allListHtml = '';
            
            data.tasks.forEach((t, index) => {
                const badgeColor = getStatusBadgeClass(t.status);
                // Mock AI response if it doesn't exist
                const aiResponseMock = `Análise concluída. O lead está interessado no serviço. Qualificação: ${t.status}.`;
                const itemHtml = `
                    <div class="day-task-item" data-client="${t.client}" data-text="${t.text}" data-ai-text="${aiResponseMock}" onclick="window.openConversation(this)">
                        <div class="dt-avatar">${getInitials(t.client)}</div>
                        <div class="dt-content">
                            <h5>${t.client}</h5>
                            <div class="dt-text">${t.text}</div>
                        </div>
                        <div class="dt-badge ${badgeColor}">
                            <i class="ph-fill ph-bookmark-simple dt-badge-icon"></i>
                            <span class="dt-badge-text">${t.status}</span>
                        </div>
                        <i class="ph ph-caret-right dt-caret"></i>
                    </div>
                `;
                
                if (index < 3) {
                    listHtml += itemHtml;
                }
                allListHtml += itemHtml;
            });
            sumTasksList.innerHTML = listHtml;
            const allLeadsList = document.getElementById('all-leads-list');
            if(allLeadsList) allLeadsList.innerHTML = allListHtml;
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

    // Navegação de Meses
    const btnPrev = document.getElementById('cal-main-prev');
    const btnNext = document.getElementById('cal-main-next');
    
    if (btnPrev && btnNext) {
        btnPrev.addEventListener('click', () => {
            if (window.innerWidth <= 1024) {
                let targetMonth = currentMonth - 1;
                let targetYear = currentYear;
                if (targetMonth < 0) { targetMonth = 11; targetYear--; }
                
                let firstDay = calBody.querySelector(`.cal-day-cell[data-month="${targetMonth}"][data-year="${targetYear}"]`);
                if (!firstDay) {
                    minRenderedMonth--;
                    if(minRenderedMonth < 0) { minRenderedMonth = 11; minRenderedYear--; }
                    
                    const prevScrollWidth = calBody.scrollWidth;
                    const prevScrollLeft = calBody.scrollLeft;
                    calBody.insertAdjacentHTML('afterbegin', generateMonthHTML(minRenderedYear, minRenderedMonth));
                    const newScrollWidth = calBody.scrollWidth;
                    calBody.scrollLeft = prevScrollLeft + (newScrollWidth - prevScrollWidth);
                    
                    const daysAdded = new Date(minRenderedYear, minRenderedMonth + 1, 0).getDate();
                    const newCells = Array.from(calBody.children).slice(0, daysAdded);
                    newCells.forEach(cell => {
                        if(observer) observer.observe(cell);
                        cell.addEventListener('click', () => {
                            document.querySelectorAll('.cal-day-cell').forEach(c => c.classList.remove('active'));
                            cell.classList.add('active');
                            openSummary(parseInt(cell.dataset.day), parseInt(cell.dataset.month), parseInt(cell.dataset.year));
                        });
                    });
                    firstDay = calBody.querySelector(`.cal-day-cell[data-month="${targetMonth}"][data-year="${targetYear}"]`);
                }
                
                if (firstDay) {
                    calBody.scrollTo({ left: firstDay.offsetLeft - calBody.offsetLeft - 16, behavior: 'smooth' });
                }
            } else {
                calBody.style.animation = 'none';
                void calBody.offsetWidth; 
                calBody.style.animation = 'slideOutRight 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards';
                
                setTimeout(() => {
                    currentMonth--;
                    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
                    updateMonthYearText();
                    if (calBody) renderCalendar();
                    
                    calBody.style.animation = 'none';
                    void calBody.offsetWidth;
                    calBody.style.animation = 'slideInLeft 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards';
                }, 200);
            }
        });
        
        btnNext.addEventListener('click', () => {
            if (window.innerWidth <= 1024) {
                let targetMonth = currentMonth + 1;
                let targetYear = currentYear;
                if (targetMonth > 11) { targetMonth = 0; targetYear++; }
                
                let firstDay = calBody.querySelector(`.cal-day-cell[data-month="${targetMonth}"][data-year="${targetYear}"]`);
                if (!firstDay) {
                    maxRenderedMonth++;
                    if(maxRenderedMonth > 11) { maxRenderedMonth = 0; maxRenderedYear++; }
                    calBody.insertAdjacentHTML('beforeend', generateMonthHTML(maxRenderedYear, maxRenderedMonth));
                    
                    const daysAdded = new Date(maxRenderedYear, maxRenderedMonth + 1, 0).getDate();
                    const newCells = Array.from(calBody.children).slice(-daysAdded);
                    newCells.forEach(cell => {
                        if(observer) observer.observe(cell);
                        cell.addEventListener('click', () => {
                            document.querySelectorAll('.cal-day-cell').forEach(c => c.classList.remove('active'));
                            cell.classList.add('active');
                            openSummary(parseInt(cell.dataset.day), parseInt(cell.dataset.month), parseInt(cell.dataset.year));
                        });
                    });
                    firstDay = calBody.querySelector(`.cal-day-cell[data-month="${targetMonth}"][data-year="${targetYear}"]`);
                }
                
                if (firstDay) {
                    calBody.scrollTo({ left: firstDay.offsetLeft - calBody.offsetLeft - 16, behavior: 'smooth' });
                }
            } else {
                calBody.style.animation = 'none';
                void calBody.offsetWidth; 
                calBody.style.animation = 'slideOutLeft 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards';
                
                setTimeout(() => {
                    currentMonth++;
                    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
                    updateMonthYearText();
                    if (calBody) renderCalendar();
                    
                    calBody.style.animation = 'none';
                    void calBody.offsetWidth;
                    calBody.style.animation = 'slideInRight 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards';
                }, 200);
            }
        });
    }

    // Iniciar Calendário com Dados do Supabase
    async function initCalendar() {
        if (!calBody) return;
        
        try {
            await new Promise(resolve => {
                if (window.dbAPI) resolve();
                else {
                    const int = setInterval(() => {
                        if (window.dbAPI) { clearInterval(int); resolve(); }
                    }, 50);
                }
            });

            const agendamentos = await window.dbAPI.fetchAgendamentos();
            calendarData = {};

            agendamentos.forEach(ag => {
                if (!ag.data_agendamento) return;
                const d = new Date(ag.data_agendamento);
                const year = d.getFullYear();
                const month = d.getMonth();
                const day = d.getDate();
                const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                const dateKey = `${year}-${month}-${day}`;
                if (!calendarData[dateKey]) {
                    calendarData[dateKey] = { kpis: { atendimentos: 0, reunioes: 0 }, tasks: [] };
                }
                
                const st = ag.status ? ag.status.trim().toLowerCase() : 'agendado';
                if (st === 'cancelado') return;
                
                let type = 'reuniao';
                let actionText = `Consulta agendada para as ${timeStr}`;
                
                calendarData[dateKey].kpis.reunioes++;
                
                calendarData[dateKey].tasks.push({
                    type: type,
                    client: ag.nome_lead || 'Cliente',
                    time: timeStr,
                    text: actionText,
                    status: ag.status || 'Agendado'
                });
            });

            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData && sessionData.session) {
                const user = sessionData.session.user;
                const { data: userData, error } = await supabase
                    .from('usuarios')
                    .select('data_vencimento')
                    .eq('id', user.id)
                    .single();
                    
                if (userData && userData.data_vencimento && userData.data_vencimento !== 'N/A') {
                    const parts = userData.data_vencimento.split('-');
                    if(parts.length === 3) {
                        userVencimentoDay = parseInt(parts[2], 10);
                    }
                }
            }
        } catch(err) {
            console.error('Erro ao buscar vencimento:', err);
        }
        
        updateMonthYearText();
        renderCalendar();
        
        // Selecionar o dia atual (ou o dia passado na URL) automaticamente ao carregar
        setTimeout(() => {
            let cellToClick = null;
            if (targetDayToClick && targetMonthToClick !== null && targetYearToClick !== null) {
                cellToClick = calBody.querySelector(`.cal-day-cell[data-month="${targetMonthToClick}"][data-year="${targetYearToClick}"][data-day="${targetDayToClick}"]`);
            }
            if (!cellToClick) {
                cellToClick = calBody.querySelector('.cal-day-cell.today');
            }
            if (cellToClick) {
                cellToClick.click();
            }
        }, 100);
    }
    
    initCalendar();
});

// --- Lógica do Resumo da Conversa (Nova Tela) ---
let previousPanelId = 'main-summary-panel';

window.openConversation = function(element) {
    const mainPanel = document.getElementById('main-summary-panel');
    const allLeadsPanel = document.getElementById('all-leads-panel');
    const convPanel = document.getElementById('conversation-panel');
    
    if(convPanel) {
        // Extrai os dados do elemento clicado
        const clientName = element.getAttribute('data-client');
        const clientText = element.getAttribute('data-text');
        const aiText = element.getAttribute('data-ai-text');
        
        // Preenche o painel de conversa
        document.getElementById('conv-client-name').textContent = clientName || 'Cliente';
        document.getElementById('conv-client-text').textContent = clientText || 'Sem mensagem recebida.';
        document.getElementById('conv-ai-text').textContent = aiText || 'Nenhuma interação da IA registrada.';
        
        // Esconde o painel atual (main ou all-leads)
        if (allLeadsPanel && !allLeadsPanel.classList.contains('d-none-important')) {
            previousPanelId = 'all-leads-panel';
            allLeadsPanel.classList.add('d-none-important');
        } else if (mainPanel && !mainPanel.classList.contains('d-none-important')) {
            previousPanelId = 'main-summary-panel';
            mainPanel.classList.add('d-none-important');
        }
        
        convPanel.classList.remove('d-none-important');
        
        // Reinicia a animação
        convPanel.classList.remove('animate-fade-slide');
        void convPanel.offsetWidth; // Trigger reflow
        convPanel.classList.add('animate-fade-slide');
        
        convPanel.style.display = 'flex'; // Garante que, se perder o none, vira flex
    }
};

window.closeConversation = function() {
    const prevPanel = document.getElementById(previousPanelId);
    const convPanel = document.getElementById('conversation-panel');
    
    if(prevPanel && convPanel) {
        convPanel.classList.add('d-none-important');
        prevPanel.classList.remove('d-none-important');
        
        // Reinicia a animação
        prevPanel.classList.remove('animate-fade-slide');
        void prevPanel.offsetWidth; // Trigger reflow
        prevPanel.classList.add('animate-fade-slide');
    }
};

window.openAllLeads = function() {
    const mainPanel = document.getElementById('main-summary-panel');
    const allLeadsPanel = document.getElementById('all-leads-panel');
    
    if(mainPanel && allLeadsPanel) {
        mainPanel.classList.add('d-none-important');
        allLeadsPanel.classList.remove('d-none-important');
        
        allLeadsPanel.classList.remove('animate-fade-slide');
        void allLeadsPanel.offsetWidth;
        allLeadsPanel.classList.add('animate-fade-slide');
        
        allLeadsPanel.style.display = 'flex';
    }
};

window.closeAllLeads = function() {
    const mainPanel = document.getElementById('main-summary-panel');
    const allLeadsPanel = document.getElementById('all-leads-panel');
    
    if(mainPanel && allLeadsPanel) {
        allLeadsPanel.classList.add('d-none-important');
        mainPanel.classList.remove('d-none-important');
        
        mainPanel.classList.remove('animate-fade-slide');
        void mainPanel.offsetWidth;
        mainPanel.classList.add('animate-fade-slide');
    }
};
