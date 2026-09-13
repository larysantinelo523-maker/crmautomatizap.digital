// --- Verificação de Autenticação Global ---
import { fetchUserData } from './data.js';

let tenantVencDate = null;
fetchUserData().then(user => {
    if (user && user.data_vencimento && user.data_vencimento !== 'N/A') {
        const parts = user.data_vencimento.split('-');
        if (parts.length === 3) {
            tenantVencDate = new Date(parts[0], parts[1] - 1, parts[2]);
            tenantVencDate.setHours(0,0,0,0);
            window.dispatchEvent(new Event('tenantDateLoaded'));
        }
    }
});

window.getBrasiliaDate = function() {
    const str = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    return new Date(str);
};

// --- Relógio da Sidebar em Tempo Real ---
function updateSidebarClock() {
    const brDate = window.getBrasiliaDate();
    const h = String(brDate.getHours()).padStart(2, '0');
    const m = String(brDate.getMinutes()).padStart(2, '0');
    const options = { weekday: 'short', day: '2-digit', month: 'long' };
    let dateStr = brDate.toLocaleDateString('pt-BR', options);
    dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

    // Desktop/Sidebar Clock
    const clockTime = document.getElementById('clock-time');
    const clockDate = document.getElementById('clock-date');
    if (clockTime && clockDate) {
        clockTime.textContent = `${h}:${m} (Brasília)`;
        clockDate.textContent = dateStr;
    }

    // Mobile/Dropdown Clock
    const mClockTime = document.getElementById('mobile-clock-time');
    const mClockDate = document.getElementById('mobile-clock-date');
    if (mClockTime && mClockDate) {
        mClockTime.textContent = `${h}:${m} (Brasília)`;
        mClockDate.textContent = dateStr;
    }
}
// Atualiza a cada segundo
setInterval(updateSidebarClock, 1000);
document.addEventListener('DOMContentLoaded', updateSidebarClock);

if (window.location.pathname.indexOf('login.html') === -1) {
    import('./supabase.js').then(({ supabase }) => {
        supabase.auth.getSession().then(async ({ data }) => {
            if (!data.session) {
                window.location.href = 'login.html';
            } else {
                let currentUserData = null;
                // Busca os dados adicionais do usuário logado na tabela 'usuarios'
                try {
                    const userId = data.session.user.id;
                    const { data: userData, error } = await supabase
                        .from('usuarios')
                        .select('nome_completo, tipo_usuario, avatar_url, status_assinatura, data_vencimento')
                        .eq('id', userId)
                        .single();

                    if (userData && !error) {
                        currentUserData = userData;
                        const userName = userData.nome_completo || 'Usuário';
                        const userRole = userData.tipo_usuario || 'usuário';

                        // Redireciona Master Admin para o painel admin
                        if (userRole === 'administrador' && window.location.pathname.indexOf('admin.html') === -1) {
                            window.location.href = 'admin.html';
                            return;
                        }

                        // Bloqueio por falta de pagamento
                        if (userData.status_assinatura === 'inadimplente' && window.location.pathname.indexOf('configuracoes.html') === -1) {
                            window.location.href = 'configuracoes.html?tab=assinatura';
                            return;
                        }

                        document.querySelectorAll('.user-info .user-name').forEach(el => el.textContent = userName);
                        document.querySelectorAll('.user-info .user-role').forEach(el => el.textContent = userRole);

                        document.querySelectorAll('.user-menu .avatar').forEach(el => {
                            if (userData.avatar_url) {
                                el.innerHTML = `<img src="${userData.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
                            } else {
                                el.textContent = userName.substring(0, 2).toUpperCase();
                            }
                        });
                    } else {
                        // Fallback: se der erro (ex: RLS bloqueando), usa o e-mail da sessão
                        const fallbackEmail = data.session.user.email;
                        document.querySelectorAll('.user-info .user-name').forEach(el => el.textContent = fallbackEmail);
                        document.querySelectorAll('.user-info .user-role').forEach(el => el.textContent = 'Erro de Permissão');
                        document.querySelectorAll('.user-menu .avatar').forEach(el => {
                            el.textContent = fallbackEmail.substring(0, 2).toUpperCase();
                        });
                        console.error('Erro ao ler tabela usuarios (RLS?):', error);
                    }
                } catch (e) {
                    console.error("Erro ao carregar perfil do usuário:", e);
                }

                // Se estiver logado, carrega o módulo de dados
                import('./data.js').then(async (module) => {
                    // Inicializa os dados da página específica
                    if (window.location.pathname.indexOf('index.html') > -1 || window.location.pathname.endsWith('/')) {
                        if (window.initDashboard) window.initDashboard();
                    } else if (window.location.pathname.indexOf('leads.html') > -1) {
                        if (window.initLeads) window.initLeads();
                    } else if (window.location.pathname.indexOf('conversas.html') > -1) {
                        if (window.initConversations) window.initConversations();
                    } else if (window.location.pathname.indexOf('configuracoes.html') > -1) {
                        if (window.initSettings) window.initSettings();
                    }
                    
                    // --- Lógica de Notificações Inteligentes ---
                    async function loadNotifications() {
                        const notifList = document.getElementById('notif-list');
                        const notifDot = document.querySelector('.notification-dot');
                        if (!notifList) return;

                        let html = '';
                        let notifCount = 0;

                        // 1. Verificar Vencimento da Mensalidade
                        if (currentUserData && currentUserData.data_vencimento) {
                            const vencDate = new Date(currentUserData.data_vencimento);
                            const now = window.getBrasiliaDate();
                            const diffTime = vencDate - now;
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            
                            let notifText = '';
                            let isExpired = false;

                            if (diffDays < 0) {
                                isExpired = true;
                                if (diffDays === -1) notifText = "Sua assinatura venceu ontem. Renove agora para evitar o bloqueio.";
                                else notifText = `Sua assinatura venceu há ${Math.abs(diffDays)} dias. Renove agora para evitar o bloqueio.`;
                            } else if (diffDays === 0) {
                                notifText = "Sua assinatura vence hoje! Renove agora para evitar a suspensão.";
                            } else if (diffDays === 1) {
                                notifText = "Atenção: Falta 1 dia para o vencimento da sua assinatura.";
                            } else if (diffDays <= 5) {
                                notifText = `Atenção: Faltam ${diffDays} dias para o vencimento da sua assinatura.`;
                            }

                            if (notifText) {
                                html += `<div style="padding: 12px; border-bottom: 1px solid var(--color-border); cursor: pointer;" onclick="window.location.href='configuracoes.html?tab=assinatura'">
                                    <div style="font-weight: 600; font-size: 13px; color: ${isExpired ? 'var(--color-danger)' : 'var(--color-warning)'}; margin-bottom: 4px;"><i class="ph ${isExpired ? 'ph-warning-circle' : 'ph-warning'}"></i> ${isExpired ? 'Assinatura Vencida' : 'Vencimento Próximo'}</div>
                                    <div style="font-size: 12px; color: var(--color-text-mut);">${notifText}</div>
                                </div>`;
                                notifCount++;
                            }
                        }

                        // 2. Verificar Novos Leads nas últimas 24h
                        const leads = await module.fetchLeads();
                        const nowLeads = window.getBrasiliaDate();
                        const newLeads = leads.filter(l => {
                            const leadDate = new Date(l.criado_em);
                            const diff = (nowLeads - leadDate) / (1000 * 60 * 60); // horas
                            return diff <= 24;
                        });

                        newLeads.forEach(l => {
                            html += `<div style="padding: 12px; border-bottom: 1px solid var(--color-border); cursor: pointer;" onclick="window.location.href='leads.html'">
                                <div style="font-weight: 600; font-size: 13px; color: var(--color-text); margin-bottom: 4px;"><i class="ph ph-user-plus text-primary"></i> Novo Lead</div>
                                <div style="font-size: 12px; color: var(--color-text-mut);">Você recebeu um novo lead: ${l.nome}</div>
                            </div>`;
                            notifCount++;
                        });

                        // 3. Verificar Tarefas Pendentes para hoje
                        const tarefas = await module.fetchTasks();
                        
                        // Forçar formatação YYYY-MM-DD segura no horário de Brasília
                        const brDate = window.getBrasiliaDate();
                        const y = brDate.getFullYear();
                        const m = String(brDate.getMonth() + 1).padStart(2, '0');
                        const d = String(brDate.getDate()).padStart(2, '0');
                        const todayStr = `${y}-${m}-${d}`;
                        
                        const pendingTasks = tarefas.filter(t => t.status === 'pendente' && t.data_vencimento && t.data_vencimento.startsWith(todayStr));
                        
                        pendingTasks.forEach(t => {
                            html += `<div style="padding: 12px; border-bottom: 1px solid var(--color-border); cursor: pointer;" onclick="window.location.href='tarefas.html'">
                                <div style="font-weight: 600; font-size: 13px; color: var(--color-text); margin-bottom: 4px;"><i class="ph ph-check-square text-success"></i> Tarefa de Hoje</div>
                                <div style="font-size: 12px; color: var(--color-text-mut);">${t.titulo}</div>
                            </div>`;
                            notifCount++;
                        });

                        let hiddenCount = parseInt(localStorage.getItem('notifs_hidden_until_count')) || 0;
                        if (hiddenCount > notifCount) {
                            hiddenCount = notifCount;
                            localStorage.setItem('notifs_hidden_until_count', hiddenCount);
                        }
                        const newCount = notifCount - hiddenCount;

                        const badge = document.getElementById('notif-badge');
                        const btnReadAll = document.getElementById('btn-read-all');
                        
                        if (btnReadAll && !btnReadAll.dataset.listener) {
                            btnReadAll.dataset.listener = "true";
                            btnReadAll.addEventListener('click', (e) => {
                                e.stopPropagation();
                                localStorage.setItem('notifs_hidden_until_count', notifCount);
                                loadNotifications();
                            });
                        }

                        if (notifCount > 0) {
                            notifList.innerHTML = html;
                            
                            if (newCount > 0) {
                                if (notifDot) notifDot.style.display = 'block';
                                if (badge) {
                                    badge.textContent = newCount === 1 ? '1 nova' : `${newCount} novas`;
                                    badge.style.display = 'inline-block';
                                }
                                if (btnReadAll) btnReadAll.style.display = 'inline-block';
                            } else {
                                if (notifDot) notifDot.style.display = 'none';
                                if (badge) badge.style.display = 'none';
                                if (btnReadAll) btnReadAll.style.display = 'none';
                            }
                            
                            const notifPageList = document.getElementById('notif-page-list');
                            if (notifPageList) notifPageList.innerHTML = html;
                        } else {
                            notifList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--color-text-mut); font-size: 13px;">Nenhuma notificação.</div>';
                            if (notifDot) notifDot.style.display = 'none';
                            if (badge) badge.style.display = 'none';
                            if (btnReadAll) btnReadAll.style.display = 'none';
                            
                            const notifPageList = document.getElementById('notif-page-list');
                            if (notifPageList) notifPageList.innerHTML = '<div style="padding: 32px; text-align: center; color: var(--color-text-mut);">Nenhuma notificação.</div>';
                        }
                    }

                    // Aguardar um momento para garantir que a UI foi renderizada
                    setTimeout(loadNotifications, 500);
                });
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Lógica de Sidebar e Overlay originais
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    // --- Lógica do Modo Escuro (Dark Mode) ---
    const themeCheckbox = document.getElementById('theme-toggle-checkbox');

    // Verifica preferência salva
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        if (themeCheckbox) themeCheckbox.checked = true;
    }

    if (themeCheckbox) {
        const themeText = document.querySelector('.theme-item span');

        // Função para atualizar o texto do tema
        const updateThemeText = (isDark) => {
            if (themeText) {
                if (isDark) {
                    themeText.innerHTML = '<i class="ph ph-moon"></i> Modo Escuro';
                } else {
                    themeText.innerHTML = '<i class="ph ph-sun"></i> Modo Claro';
                }
            }
        };

        // Aplica o texto correto na inicialização
        updateThemeText(themeCheckbox.checked);

        themeCheckbox.addEventListener('change', (e) => {
            const isDark = e.target.checked;
            updateThemeText(isDark);

            if (isDark) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // --- Lógica do Dropdown de Usuário ---
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-dropdown');

    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Impede o fechamento ao clicar no próprio menu
            userDropdown.classList.toggle('show');
        });

        // Fechar dropdown ao clicar fora
        document.addEventListener('click', (e) => {
            if (!userMenuBtn.contains(e.target)) {
                userDropdown.classList.remove('show');
            }
        });
    }

    // --- Lógica de Logout ---
    const logoutBtn = document.querySelector('.ph-sign-out')?.closest('.dropdown-item');
    if (logoutBtn) {
        logoutBtn.style.cursor = 'pointer';
        logoutBtn.addEventListener('click', () => {
            import('./supabase.js').then(({ supabase }) => {
                supabase.auth.signOut().then(() => {
                    window.location.href = 'login.html';
                });
            });
        });
    }

    // --- Lógica do Dropdown de Notificações ---
    const notifBtn = document.getElementById('notification-btn');
    const notifDropdown = document.getElementById('notification-dropdown');

    if (notifBtn && notifDropdown) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notifDropdown.classList.toggle('show');

            // Fecha o user dropdown se estiver aberto
            if (userDropdown) userDropdown.classList.remove('show');
        });

        document.addEventListener('click', (e) => {
            if (!notifBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
                notifDropdown.classList.remove('show');
            }
        });
    }

    // Toggle sidebar
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // Close sidebar when clicking outside (on mobile)
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024) {
            if (sidebar && sidebar.classList.contains('open')) {
                // Se clicou fora da sidebar E fora do botão de menu
                if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            }
        }
    });

    // Handle resizing - remove open class if resizing back to desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 1024 && sidebar) {
            sidebar.classList.remove('open');
        }
    });

    // --- Live Search ---
    const searchInputs = document.querySelectorAll('.search-input input');

    searchInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();

            // Procura a tabela de dados mais próxima, ou assume a principal da página
            const tableRows = document.querySelectorAll('.data-table tbody tr');

            tableRows.forEach(row => {
                const textContent = row.textContent.toLowerCase();
                if (textContent.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    });


    // --- Lead Table Row Click to Update Sidebar ---
    const tableRows = document.querySelectorAll('.data-table tbody tr');
    const highlightSidebar = document.querySelector('.lead-highlight');

    if (tableRows.length > 0 && highlightSidebar) {
        tableRows.forEach(row => {
            row.style.cursor = 'pointer'; // Adiciona cursor de clique

            row.addEventListener('click', () => {
                // 1. Coleta os dados da linha clicada
                const nameEl = row.querySelector('.font-medium');
                const name = nameEl ? nameEl.textContent.trim() : 'Nome não informado';

                const initialsEl = row.querySelector('.avatar');
                const initials = initialsEl ? initialsEl.textContent.trim() : '--';

                const cells = row.querySelectorAll('td');
                const origin = cells.length > 1 ? cells[1].textContent.trim() : 'Desconhecida';
                const interest = cells.length > 2 ? cells[2].textContent.trim() : 'Não informado';
                const statusHtml = cells.length > 3 ? cells[3].innerHTML : '';

                // 2. Atualiza a barra lateral (Perfil)
                const hlName = highlightSidebar.querySelector('.profile-info h3');
                if (hlName) hlName.textContent = name;

                const hlAvatar = highlightSidebar.querySelector('.highlight-profile .avatar');
                if (hlAvatar) {
                    hlAvatar.textContent = initials;
                    // Opcional: remover cores antigas e sortear uma nova baseada no nome
                }

                const hlOrigin = highlightSidebar.querySelector('.origin-info span');
                if (hlOrigin) hlOrigin.textContent = 'Origem: ' + origin;

                // 3. Atualiza os detalhes
                const detailValues = highlightSidebar.querySelectorAll('.detail-value');
                if (detailValues.length >= 4) {
                    detailValues[0].textContent = interest; // Interesse
                    // Mantém o orçamento fixo por agora, ou muda se houver na tabela
                    // detailValues[1] é Orçamento
                    // detailValues[2] é Qualificação
                    detailValues[3].innerHTML = statusHtml; // Status
                }

                // Adiciona um efeito visual de destaque na linha clicada
                tableRows.forEach(r => r.style.backgroundColor = '');
                row.style.backgroundColor = 'rgba(0, 168, 132, 0.05)'; // Verde sutil

                // Se estiver no mobile, rolar a tela para a barra lateral
                if (window.innerWidth <= 1024) {
                    highlightSidebar.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    // --- Modal Factory (Filtros e Data) ---
    function createModal(title, contentHtml, onApply) {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
        overlay.style.backdropFilter = 'blur(4px)';
        overlay.style.zIndex = '2000';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.2s';

        const modal = document.createElement('div');
        modal.className = 'card'; // Herda estilos base de card do tema
        modal.style.width = '90%';
        modal.style.maxWidth = '400px';
        modal.style.transform = 'scale(0.95)';
        modal.style.transition = 'transform 0.2s';

        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="font-size: 18px; margin: 0;">${title}</h3>
                <button class="btn-icon xs close-modal"><i class="ph ph-x"></i></button>
            </div>
            <div style="margin-bottom: 24px;">
                ${contentHtml}
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 12px;">
                <button class="btn btn--outline close-modal">Cancelar</button>
                <button class="btn btn--primary apply-modal">Aplicar</button>
            </div>
        `;
        modal.innerHTML = html;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Animate in
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            modal.style.transform = 'scale(1)';
        });

        const close = () => {
            overlay.style.opacity = '0';
            modal.style.transform = 'scale(0.95)';
            setTimeout(() => overlay.remove(), 200);
        };

        overlay.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', close));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });

        overlay.querySelector('.apply-modal').addEventListener('click', () => {
            onApply(modal);
            close();
        });
    }

    // --- Lógica do Botão de Data (Dropdown) ---
    const dateBtn = document.getElementById('date-filter-btn');
    const dateDropdown = document.getElementById('date-dropdown');

    if (dateBtn && dateDropdown) {
        dateBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dateDropdown.classList.toggle('show');

            // Fecha outros dropdowns se estiverem abertos
            const userDropdown = document.getElementById('user-dropdown');
            const notifDropdown = document.getElementById('notification-dropdown');
            if (userDropdown) userDropdown.classList.remove('show');
            if (notifDropdown) notifDropdown.classList.remove('show');
        });

        document.addEventListener('click', (e) => {
            if (!dateBtn.contains(e.target) && !dateDropdown.contains(e.target)) {
                dateDropdown.classList.remove('show');
            }
        });

        // --- Lógica do Calendário ---
        const calendarGrid = document.getElementById('calendar-grid');
        const monthYearTxt = document.getElementById('cal-month-year');
        const selectionTxt = document.getElementById('cal-selection-text');
        const prevBtn = document.getElementById('cal-prev');
        const nextBtn = document.getElementById('cal-next');
        let currentDate = new Date();
        
        // Cache logic
        let rangeStart = null;
        let rangeEnd = null;
        
        const cachedStart = localStorage.getItem('calendar_filter_start');
        const cachedEnd = localStorage.getItem('calendar_filter_end');
        
        if (cachedStart && cachedEnd) {
            rangeStart = new Date(cachedStart);
            rangeEnd = new Date(cachedEnd);
        } else {
            // Default to current month
            const now = new Date();
            rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
            rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }
        
        function updateMainFilterText() {
            const dateText = document.getElementById('date-filter-text');
            if (!dateText) return;
            if (rangeStart && rangeEnd) {
                const startStr = `${rangeStart.getDate().toString().padStart(2, '0')}/${(rangeStart.getMonth() + 1).toString().padStart(2, '0')}/${rangeStart.getFullYear()}`;
                const endStr = `${rangeEnd.getDate().toString().padStart(2, '0')}/${(rangeEnd.getMonth() + 1).toString().padStart(2, '0')}/${rangeEnd.getFullYear()}`;
                dateText.textContent = `${startStr} - ${endStr}`;
            }
        }
        // Update on load
        updateMainFilterText();
        
        // Inject Limpar Filtros button dynamically
        const dateDropdownHeader = document.querySelector('.date-dropdown-header');
        if (dateDropdownHeader && !document.getElementById('btn-clear-filters')) {
            dateDropdownHeader.style.display = 'flex';
            dateDropdownHeader.style.justifyContent = 'space-between';
            dateDropdownHeader.style.alignItems = 'center';
            
            const clearBtn = document.createElement('button');
            clearBtn.id = 'btn-clear-filters';
            clearBtn.textContent = 'Limpar filtros';
            clearBtn.style.background = 'none';
            clearBtn.style.border = 'none';
            clearBtn.style.color = 'var(--color-text-mut)';
            clearBtn.style.fontSize = '11px';
            clearBtn.style.cursor = 'pointer';
            clearBtn.style.textDecoration = 'underline';
            
            clearBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const now = new Date();
                rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
                rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                
                if (selectionTxt) selectionTxt.textContent = `Período selecionado: ${rangeStart.getDate().toString().padStart(2, '0')}/${(rangeStart.getMonth() + 1).toString().padStart(2, '0')} até ${rangeEnd.getDate().toString().padStart(2, '0')}/${(rangeEnd.getMonth() + 1).toString().padStart(2, '0')}`;
                
                localStorage.removeItem('calendar_filter_start');
                localStorage.removeItem('calendar_filter_end');
                
                updateMainFilterText();
                renderCalendar();
            });
            dateDropdownHeader.appendChild(clearBtn);
        }

        function renderCalendar() {
            if (!calendarGrid) return;

            // Limpa dias anteriores (mantém os span dos nomes da semana)
            const days = calendarGrid.querySelectorAll('.cal-day');
            days.forEach(d => d.remove());
            const empties = calendarGrid.querySelectorAll('.empty');
            empties.forEach(e => e.remove());

            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
            if (monthYearTxt) monthYearTxt.textContent = `${monthNames[month]} ${year}`;

            const firstDay = new Date(year, month, 1).getDay(); // 0 (Dom) a 6 (Sab)
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            // Espaços vazios antes do dia 1
            for (let i = 0; i < firstDay; i++) {
                const empty = document.createElement('div');
                empty.className = 'cal-day empty';
                calendarGrid.appendChild(empty);
            }

            // Dias do mês
            for (let i = 1; i <= daysInMonth; i++) {
                const dayDiv = document.createElement('div');
                dayDiv.className = 'cal-day';
                dayDiv.textContent = i;

                const thisDate = new Date(year, month, i);

                // Classes de range
                if (rangeStart && rangeEnd) {
                    if (thisDate.getTime() === rangeStart.getTime()) {
                        dayDiv.classList.add('start-range');
                    }
                    if (thisDate.getTime() === rangeEnd.getTime()) {
                        dayDiv.classList.add('end-range');
                    }
                    if (thisDate > rangeStart && thisDate < rangeEnd) {
                        dayDiv.classList.add('in-range');
                    }
                } else if (rangeStart && thisDate.getTime() === rangeStart.getTime()) {
                    dayDiv.classList.add('selected');
                }

                if (tenantVencDate) {
                    const thisTime = thisDate.getTime();
                    const targetDay = tenantVencDate.getDate();
                    
                    // Cria datas de vencimento para o mês atual e para o próximo mês
                    // Isso garante que a transição de meses (ex: vencimento dia 2, e estamos no dia 30) funcione
                    const vencThisMonth = new Date(year, month, targetDay);
                    const vencNextMonth = new Date(year, month + 1, targetDay);
                    
                    const diffThis = Math.round((vencThisMonth.getTime() - thisTime) / (1000 * 60 * 60 * 24));
                    const diffNext = Math.round((vencNextMonth.getTime() - thisTime) / (1000 * 60 * 60 * 24));

                    if (diffThis === 0 || diffNext === 0) {
                        dayDiv.classList.add('due-date-danger');
                    } else if ((diffThis > 0 && diffThis <= 3) || (diffNext > 0 && diffNext <= 3)) {
                        dayDiv.classList.add('due-date-warning');
                    }
                }

                dayDiv.addEventListener('click', (e) => {
                    e.stopPropagation(); // Previne fechamento do menu ao recriar DOM
                    if (!rangeStart || (rangeStart && rangeEnd)) {
                        rangeStart = thisDate;
                        rangeEnd = null;
                        if (selectionTxt) selectionTxt.textContent = `De: ${i} de ${monthNames[month]} - Selecione o fim`;
                    } else if (rangeStart && !rangeEnd) {
                        if (thisDate < rangeStart) {
                            rangeEnd = rangeStart;
                            rangeStart = thisDate;
                        } else {
                            rangeEnd = thisDate;
                        }
                        if (selectionTxt) selectionTxt.textContent = `Período selecionado: ${rangeStart.getDate().toString().padStart(2, '0')}/${(rangeStart.getMonth() + 1).toString().padStart(2, '0')} até ${rangeEnd.getDate().toString().padStart(2, '0')}/${(rangeEnd.getMonth() + 1).toString().padStart(2, '0')}`;
                    }
                    renderCalendar();
                });

                calendarGrid.appendChild(dayDiv);
            }
        }

        if (prevBtn) prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });

        if (nextBtn) nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });

        // Primeiro render
        window.addEventListener('tenantDateLoaded', () => {
            if (typeof renderCalendar === 'function') {
                renderCalendar();
            }
        });

        renderCalendar();

        const applyBtn = document.getElementById('btn-apply-date');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                const dateText = document.getElementById('date-filter-text');
                if (rangeStart && rangeEnd) {
                    const startStr = `${rangeStart.getDate().toString().padStart(2, '0')}/${(rangeStart.getMonth() + 1).toString().padStart(2, '0')}/${rangeStart.getFullYear()}`;
                    const endStr = `${rangeEnd.getDate().toString().padStart(2, '0')}/${(rangeEnd.getMonth() + 1).toString().padStart(2, '0')}/${rangeEnd.getFullYear()}`;
                    if (dateText) dateText.textContent = `${startStr} - ${endStr}`;
                    
                    localStorage.setItem('calendar_filter_start', rangeStart.toISOString());
                    localStorage.setItem('calendar_filter_end', rangeEnd.toISOString());
                } else if (rangeStart) {
                    const startStr = `${rangeStart.getDate().toString().padStart(2, '0')}/${(rangeStart.getMonth() + 1).toString().padStart(2, '0')}/${rangeStart.getFullYear()}`;
                    if (dateText) dateText.textContent = `A partir de ${startStr}`;
                    
                    localStorage.setItem('calendar_filter_start', rangeStart.toISOString());
                    localStorage.removeItem('calendar_filter_end');
                } else {
                    if (dateText) dateText.textContent = `Sem limite de data`;
                    
                    localStorage.removeItem('calendar_filter_start');
                    localStorage.removeItem('calendar_filter_end');
                }
                dateDropdown.classList.remove('show');
            });
        }
    }

    // --- Lógica do Botão de Filtro da Tabela (.ph-funnel) ---
    // Procura por botões de filtro nas table-controls
    const filterBtns = document.querySelectorAll('.table-controls .btn-icon');
    filterBtns.forEach(btn => {
        // Verifica se é o botão com funil
        if (btn.querySelector('.ph-funnel')) {
            btn.addEventListener('click', () => {
                const content = `
                    <div style="display: flex; flex-direction: column; gap: 16px;">
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Status do Lead</label>
                            <select id="modal-status-select" class="crm-select">
                                <option value="Todos">Todos os status</option>
                                <option value="Em atendimento">Em atendimento</option>
                                <option value="Aguardando vendedor">Aguardando vendedor</option>
                                <option value="Em negociação">Em negociação</option>
                                <option value="Qualificado">Qualificado</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Selecione uma data</label>
                            <div class="calendar-header">
                                <button class="btn-icon xs" id="modal-cal-prev"><i class="ph ph-caret-left"></i></button>
                                <strong id="modal-cal-month-year">...</strong>
                                <button class="btn-icon xs" id="modal-cal-next"><i class="ph ph-caret-right"></i></button>
                            </div>
                            <div class="calendar-grid" id="modal-calendar-grid">
                                <span class="cal-day-name">D</span>
                                <span class="cal-day-name">S</span>
                                <span class="cal-day-name">T</span>
                                <span class="cal-day-name">Q</span>
                                <span class="cal-day-name">Q</span>
                                <span class="cal-day-name">S</span>
                                <span class="cal-day-name">S</span>
                            </div>
                            <div style="display: flex; gap: 8px; margin-top: 12px; font-size: 12px; color: var(--color-text-sec);">
                                <span id="modal-cal-selection-text">Selecione a data inicial</span>
                            </div>
                        </div>
                    </div>
                `;

                createModal('Filtros Avançados', content, (modal) => {
                    const statusVal = modal.querySelector('#modal-status-select').value;

                    // A data selecionada estaria em mRangeStart e mRangeEnd (variáveis abaixo)

                    // Lógica simples de filtro na tabela atual (por status)
                    const tableRows = document.querySelectorAll('.data-table tbody tr');
                    tableRows.forEach(row => {
                        if (statusVal === 'Todos') {
                            row.style.display = '';
                        } else {
                            // O status fica geralmente na 4ª coluna
                            const cells = row.querySelectorAll('td');
                            if (cells.length > 3) {
                                const rowStatus = cells[3].textContent.trim();
                                if (rowStatus === statusVal) {
                                    row.style.display = '';
                                } else {
                                    row.style.display = 'none';
                                }
                            }
                        }
                    });
                });

                // --- Inicializa o calendário dentro do modal recém criado ---
                const mCalendarGrid = document.getElementById('modal-calendar-grid');
                const mMonthYearTxt = document.getElementById('modal-cal-month-year');
                const mSelectionTxt = document.getElementById('modal-cal-selection-text');
                const mPrevBtn = document.getElementById('modal-cal-prev');
                const mNextBtn = document.getElementById('modal-cal-next');

                let mCurrentDate = new Date();
                let mRangeStart = null;
                let mRangeEnd = null;

                function renderModalCalendar() {
                    if (!mCalendarGrid) return;

                    const days = mCalendarGrid.querySelectorAll('.cal-day');
                    days.forEach(d => d.remove());
                    const empties = mCalendarGrid.querySelectorAll('.empty');
                    empties.forEach(e => e.remove());

                    const year = mCurrentDate.getFullYear();
                    const month = mCurrentDate.getMonth();
                    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
                    if (mMonthYearTxt) mMonthYearTxt.textContent = `${monthNames[month]} ${year}`;

                    const firstDay = new Date(year, month, 1).getDay();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();

                    for (let i = 0; i < firstDay; i++) {
                        const empty = document.createElement('div');
                        empty.className = 'cal-day empty';
                        mCalendarGrid.appendChild(empty);
                    }

                    for (let i = 1; i <= daysInMonth; i++) {
                        const dayDiv = document.createElement('div');
                        dayDiv.className = 'cal-day';
                        dayDiv.textContent = i;

                        const thisDate = new Date(year, month, i);

                        if (mRangeStart && mRangeEnd) {
                            if (thisDate.getTime() === mRangeStart.getTime()) dayDiv.classList.add('start-range');
                            if (thisDate.getTime() === mRangeEnd.getTime()) dayDiv.classList.add('end-range');
                            if (thisDate > mRangeStart && thisDate < mRangeEnd) dayDiv.classList.add('in-range');
                        } else if (mRangeStart && thisDate.getTime() === mRangeStart.getTime()) {
                            dayDiv.classList.add('selected');
                        }

                        dayDiv.addEventListener('click', (e) => {
                            e.stopPropagation();
                            if (!mRangeStart || (mRangeStart && mRangeEnd)) {
                                mRangeStart = thisDate;
                                mRangeEnd = null;
                                if (mSelectionTxt) mSelectionTxt.textContent = `De: ${i} de ${monthNames[month]} - Selecione o fim`;
                            } else if (mRangeStart && !mRangeEnd) {
                                if (thisDate < mRangeStart) {
                                    mRangeEnd = mRangeStart;
                                    mRangeStart = thisDate;
                                } else {
                                    mRangeEnd = thisDate;
                                }
                                if (mSelectionTxt) mSelectionTxt.textContent = `Período selecionado: ${mRangeStart.getDate().toString().padStart(2, '0')}/${(mRangeStart.getMonth() + 1).toString().padStart(2, '0')} até ${mRangeEnd.getDate().toString().padStart(2, '0')}/${(mRangeEnd.getMonth() + 1).toString().padStart(2, '0')}`;
                            }
                            renderModalCalendar();
                        });

                        mCalendarGrid.appendChild(dayDiv);
                    }
                }

                if (mPrevBtn) mPrevBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    mCurrentDate.setMonth(mCurrentDate.getMonth() - 1);
                    renderModalCalendar();
                });

                if (mNextBtn) mNextBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    mCurrentDate.setMonth(mCurrentDate.getMonth() + 1);
                    renderModalCalendar();
                });

                renderModalCalendar();
            });
        }
    });
});

// Toggle Bot / Humano
const botSwitch = document.getElementById('bot-switch');
if (botSwitch) {
    botSwitch.addEventListener('change', (e) => {
        if (e.target.checked) {
            console.log("Robô Ativado - Automação em andamento");
            // Disparar Webhook para o n8n ligar o robô
        } else {
            console.log("Intervenção Humana - Robô Pausado");
            // Disparar Webhook para o n8n pausar o robô
        }
    });
}

// Dossiê Lateral
const taskItems = document.querySelectorAll('.task-item');
const dossierDrawer = document.getElementById('dossier-drawer');
const dossierOverlay = document.getElementById('dossier-overlay');
const dossierClose = document.getElementById('dossier-close');

function openDossier(title) {
    if (dossierDrawer && dossierOverlay) {
        document.getElementById('dossier-name').innerText = title;
        dossierDrawer.classList.add('open');
        dossierOverlay.classList.add('open');
    }
}

function closeDossier() {
    if (dossierDrawer && dossierOverlay) {
        dossierDrawer.classList.remove('open');
        dossierOverlay.classList.remove('open');
    }
}

if (taskItems) {
    taskItems.forEach(item => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', (e) => {
            // Não abrir se clicou no checkbox ou botões
            if (e.target.tagName.toLowerCase() === 'input' || e.target.closest('button')) {
                return;
            }
            const title = item.querySelector('.task-title').innerText;
            openDossier(title);
        });
    });
}

if (dossierClose) dossierClose.addEventListener('click', closeDossier);
if (dossierOverlay) dossierOverlay.addEventListener('click', closeDossier);

// ==========================================================================
//   Lógica do Teclado iOS Simulado e Chat Input
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const fakeInput = document.getElementById('fake-chat-input');
    const fakeTypingText = document.getElementById('fake-typing-text');
    const iosKeyboard = document.getElementById('ios-keyboard');
    const btnSend = document.getElementById('btn-send-message');
    const messagesContainer = document.getElementById('chat-messages-container');

    if (!fakeInput || !iosKeyboard || !btnSend || !messagesContainer) return;

    let currentText = '';

    // Mostra o teclado ao focar no input fake
    fakeInput.addEventListener('click', (e) => {
        e.stopPropagation();
        fakeInput.classList.add('active');
        if (window.innerWidth <= 768) {
            iosKeyboard.classList.add('show');
            // Rolar para o final do chat suavemente enquanto o teclado abre
            setTimeout(() => {
                messagesContainer.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' });
            }, 150);
        }
    });

    // Oculta teclado ao clicar fora
    document.addEventListener('click', (e) => {
        if (!fakeInput.contains(e.target) && !iosKeyboard.contains(e.target)) {
            fakeInput.classList.remove('active');
            iosKeyboard.classList.remove('show');
        }
    });

    function updateInput() {
        fakeTypingText.innerText = currentText;
        if (currentText.length > 0) {
            fakeInput.classList.add('has-text');
        } else {
            fakeInput.classList.remove('has-text');
        }
        // Auto-scroll para acompanhar a digitação
        fakeTypingText.scrollTop = fakeTypingText.scrollHeight;
    }

    // --- Suporte a Teclado Físico (Desktop) ---
    document.addEventListener('keydown', (e) => {
        if (!fakeInput.classList.contains('active')) return;

        if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta' || e.key === 'CapsLock' || e.key === 'Tab') return;

        if (e.key === 'Backspace') {
            currentText = currentText.slice(0, -1);
            if (currentText.length === 0) isShifted = true;
            updateInput();
            e.preventDefault(); // Evitar voltar página no navegador
        } else if (e.key === 'Enter') {
            btnSend.click();
            e.preventDefault();
        } else if (e.key.length === 1) { // Letra normal ou número/símbolo
            currentText += e.key;
            isShifted = false;
            updateInput();
            e.preventDefault();
        }
    });

    // --- Lógica do Teclado Virtual ---
    const keys = iosKeyboard.querySelectorAll('.key:not(.special)');
    let isShifted = true; // Primeira letra Maiúscula

    function triggerHaptic() {
        if (navigator.vibrate) {
            navigator.vibrate(15);
        }
    }
    function checkAutocorrect() {
        const bar = document.getElementById('autocorrect-bar');
        const suggestionElement = document.getElementById('autocorrect-suggestion');
        if (!bar || !suggestionElement) return;

        const words = currentText.split(/\s+/);
        const lastWord = words[words.length - 1].toLowerCase();

        const corrections = {
            'tido': 'tudo',
            'cmo': 'como',
            'ta': 'tá',
            'sinhor': 'senhor',
            'sihnor': 'senhor',
            'senho': 'senhor',
            'vc': 'você',
            'vcs': 'vocês',
            'pq': 'porque',
            'tb': 'também',
            'tbm': 'também',
            'obg': 'obrigado',
            'nd': 'nada',
            'qdo': 'quando',
            'mto': 'muito',
            'muitu': 'muito',
            'td': 'tudo',
            'bomd': 'bom dia',
            'boad': 'boa tarde',
            'boan': 'boa noite',
            'comigu': 'comigo',
            'vdd': 'verdade',
            'q': 'que',
            'nao': 'não',
            'n': 'não',
            'ola': 'olá',
            'eh': 'é',
            'p/': 'para',
            'pra': 'para',
            'agr': 'agora',
            'cmg': 'comigo',
            'ctz': 'certeza',
            'vlw': 'valeu',
            'att': 'atenciosamente',
            'fds': 'fim de semana',
            'blz': 'beleza',
            'qm': 'quem',
            'oq': 'o que',
            'aki': 'aqui',
            'sin': 'sim',
        };

        if (corrections[lastWord]) {
            suggestionElement.innerText = corrections[lastWord];
            bar.style.display = 'flex';

            suggestionElement.onclick = (e) => {
                e.stopPropagation();
                triggerHaptic();
                words[words.length - 1] = corrections[lastWord];
                currentText = words.join(' ') + ' '; // Adiciona espaço após corrigir
                updateInput();
                bar.style.display = 'none';
                fakeInput.classList.add('active');
            };
        } else {
            bar.style.display = 'none';
        }
    }

    keys.forEach(key => {
        key.addEventListener('click', (e) => {
            e.stopPropagation();
            let char = key.innerText;
            if (key.classList.contains('space')) {
                char = ' ';
            } else {
                // Se for letra e não estiver shifted, converte. Se for número, não faz toLowerCase
                if (!isShifted && char.match(/[a-zA-Z]/)) char = char.toLowerCase();
                if (char.match(/[a-zA-Z]/)) isShifted = false; // Desliga shift após primeira letra
            }

            currentText += char;
            updateInput();
            checkAutocorrect();
            triggerHaptic();
            fakeInput.classList.add('active');
        });
    });

    // Teclas Backspace Contínuo
    const backspaces = document.querySelectorAll('.key-backspace');
    backspaces.forEach(btn => {
        let backspaceInterval;
        let backspaceTimeout;

        const startBackspace = (e) => {
            e.stopPropagation();
            e.preventDefault(); // Evitar comportamento padrão
            triggerHaptic();

            const apagarChar = () => {
                if (currentText.length > 0) {
                    currentText = currentText.slice(0, -1);
                    if (currentText.length === 0) isShifted = true;
                    updateInput();
                    checkAutocorrect();
                    fakeInput.classList.add('active');
                }
            };

            // Apaga o primeiro char imediatamente
            apagarChar();

            // Espera um pouco antes de apagar continuamente
            backspaceTimeout = setTimeout(() => {
                backspaceInterval = setInterval(() => {
                    apagarChar();
                    triggerHaptic();
                }, 50); // Apaga a cada 50ms
            }, 400); // Demora 400ms para iniciar o modo contínuo
        };

        const stopBackspace = () => {
            clearTimeout(backspaceTimeout);
            clearInterval(backspaceInterval);
        };

        btn.addEventListener('mousedown', startBackspace);
        btn.addEventListener('touchstart', startBackspace, { passive: false });

        btn.addEventListener('mouseup', stopBackspace);
        btn.addEventListener('mouseleave', stopBackspace);
        btn.addEventListener('touchend', stopBackspace);
        btn.addEventListener('touchcancel', stopBackspace);
    });

    // Alternar Layouts (ABC / 123)
    const kbLetters = document.getElementById('keyboard-letters');
    const kbNumbers = document.getElementById('keyboard-numbers');

    const btnNum = document.querySelector('.key-toggle-num');
    const btnAbc = document.querySelector('.key-toggle-abc');

    if (btnNum && kbLetters && kbNumbers) {
        btnNum.addEventListener('click', (e) => {
            e.stopPropagation();
            triggerHaptic();
            kbLetters.style.display = 'none';
            kbNumbers.style.display = 'flex';
            fakeInput.classList.add('active');
        });
    }

    if (btnAbc && kbLetters && kbNumbers) {
        btnAbc.addEventListener('click', (e) => {
            e.stopPropagation();
            triggerHaptic();
            kbNumbers.style.display = 'none';
            kbLetters.style.display = 'flex';
            fakeInput.classList.add('active');
        });
    }

    // Botão Enter/Retorno
    const btnEnters = document.querySelectorAll('.btn-send-enter');
    btnEnters.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentText += '\n';
            updateInput();
            fakeInput.classList.add('active');
        });
    });

    // Botão de Enviar
    btnSend.addEventListener('click', () => {
        if (currentText.trim() === '') return; // Não envia vazio

        const now = new Date();
        const timeString = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

        // Cria o balão verde
        const msgDiv = document.createElement('div');
        msgDiv.style.alignSelf = 'flex-end';
        msgDiv.style.background = '#d9fdd3';
        msgDiv.style.padding = '6px 10px';
        msgDiv.style.borderRadius = '8px 0 8px 8px';
        msgDiv.style.maxWidth = '90%';
        msgDiv.style.boxShadow = '0 1px 1px rgba(0,0,0,0.1)';
        msgDiv.style.position = 'relative';
        msgDiv.style.zIndex = '2';
        msgDiv.style.marginBottom = '12px';

        msgDiv.innerHTML = `
            <div style="position: absolute; top: 0; right: -6px; width: 0; height: 0; border-top: 0px solid transparent; border-left: 6px solid #d9fdd3; border-bottom: 6px solid transparent;"></div>
            <p style="margin: 0; font-size: 13px; color: #111; line-height: 1.35; word-wrap: break-word;">${currentText}</p>
            <div style="text-align: right; margin-top: 2px; margin-bottom: -2px; display: flex; justify-content: flex-end; align-items: center; gap: 4px;">
                <span style="font-size: 10px; color: #667781;">${timeString}</span>
                <i class="ph-fill ph-check" style="color: #667781; font-size: 14px;"></i>
            </div>
        `;

        messagesContainer.appendChild(msgDiv);

        // Rola para baixo suavemente
        messagesContainer.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' });

        // Limpa input e reseta teclado
        currentText = '';
        isShifted = true;
        updateInput();

        if (kbLetters && kbNumbers) {
            kbNumbers.style.display = 'none';
            kbLetters.style.display = 'flex';
        }

        // Ocultar teclado
        fakeInput.classList.remove('active');
        iosKeyboard.classList.remove('show');
    });
});

// --- Lógica da Lista em Acordeão (Accordion) ---
document.addEventListener('DOMContentLoaded', () => {
    const accordionHeaders = document.querySelectorAll('.accordion-header');

    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const currentItem = header.parentElement;
            const isCurrentlyActive = currentItem.classList.contains('active');

            // Fecha todos os outros acordeões
            document.querySelectorAll('.accordion-item').forEach(item => {
                item.classList.remove('active');
            });

            // Se não estava ativo antes, abre ele (comportamento de toggle)
            if (!isCurrentlyActive) {
                currentItem.classList.add('active');
            }
        });
    });
});
