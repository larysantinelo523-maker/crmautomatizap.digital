import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    let adminStartDate = null;
    let adminEndDate = null;
    let globalTenants = [];
    let adminChartInstance = null;    // 1. Autenticação e Tema
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    const { data: userData } = await supabase
        .from('usuarios')
        .select('tipo_usuario')
        .eq('id', session.user.id)
        .single();

    if (!userData || userData.tipo_usuario !== 'administrador') {
        window.location.href = 'index.html';
        return;
    }

    // Configurar Tema
    function getUserThemeKey() {
        let themeKey = 'theme';
        try {
            const tokenStr = localStorage.getItem('sb-qosgrqdfeqzxnzhmwomv-auth-token');
            if (tokenStr) {
                const token = JSON.parse(tokenStr);
                if (token && token.user && token.user.id) {
                    themeKey = 'theme_' + token.user.id;
                }
            }
        } catch(e) {}
        return themeKey;
    }
    const currentThemeKey = getUserThemeKey();

    const themeCheckbox = document.getElementById('theme-toggle-checkbox');
    const savedTheme = localStorage.getItem(currentThemeKey);
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeCheckbox.checked = true;
    }

    themeCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem(currentThemeKey, 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem(currentThemeKey, 'light');
        }

        // Se estivermos na aba de detalhes com gráficos, recarregamos
        if (currentTenantId) loadTenantDetails(currentTenantId, currentTenantName, currentTenantEmail);
    });

    // 2. Navegação entre abas
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.admin-section');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');

    const sectionTitles = {
        'dashboard': { title: 'Visão Geral Master', sub: 'Acompanhe as métricas globais de todos os seus clientes SaaS.' },
        'cadastrar': { title: 'Cadastrar Empresa', sub: 'Crie um novo ambiente de CRM para uma empresa.' },
        'configuracoes': { title: 'Configurações', sub: 'Gerencie a segurança da sua conta master.' },
        'detalhes-empresa': { title: 'Visão Geral da Empresa', sub: 'Acompanhe de perto as métricas deste cliente específico.' }
    };

    function showSection(target) {
        sections.forEach(s => s.classList.remove('active'));
        document.getElementById('sec-' + target).classList.add('active');

        if (sectionTitles[target]) {
            pageTitle.textContent = sectionTitles[target].title;
            pageSubtitle.textContent = sectionTitles[target].sub;
        }

        if (target === 'dashboard') {
            loadDashboardStats();
            loadTenantsList();
        }
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-target');

            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            showSection(target);
        });
    });

    // 3. Funcionalidade de Logout e Relógio
    document.getElementById('btn-logout').addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'login.html';
    });

    setInterval(() => {
        const now = new Date();
        document.getElementById('clock-time').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('clock-date').textContent = now.toLocaleDateString('pt-BR', options);
    }, 1000);

    // Dropdown do perfil
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-dropdown');
    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });
        document.addEventListener('click', function (e) {
            if (!userMenuBtn.contains(e.target)) {
                userDropdown.classList.remove('show');
            }
        });
    }

    // Função para animar números
    function animateValue(id, start, end, duration, isCurrency = false) {
        const obj = document.getElementById(id);
        if (!obj) return;
        
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            
            // Easing function (easeOutQuad)
            const easeProgress = progress * (2 - progress);
            const currentVal = start + (end - start) * easeProgress;
            
            if (isCurrency) {
                obj.innerHTML = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentVal);
            } else {
                obj.innerHTML = Math.round(currentVal);
            }

            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                if (isCurrency) {
                    obj.innerHTML = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(end);
                } else {
                    obj.innerHTML = Math.round(end);
                }
            }
        };
        window.requestAnimationFrame(step);
    }

    // 4. Carregar Métricas Globais (Visão Geral)
    async function loadDashboardStats() {
        try {
            let url = '/api/get_stats';
            const params = new URLSearchParams();
            if (adminStartDate) {
                const s = new Date(adminStartDate);
                s.setHours(0, 0, 0, 0);
                params.append('start', s.toISOString());
            }
            if (adminEndDate) {
                const e = new Date(adminEndDate);
                e.setHours(23, 59, 59, 999);
                params.append('end', e.toISOString());
            }
            if (params.toString()) {
                url += '?' + params.toString();
            }
            const res = await fetch(url);
            if (!res.ok) throw new Error("Erro na API (verifique chave Supabase na Vercel)");
            const stats = await res.json();

            animateValue('kpi-empresas', 0, stats.empresas || 0, 1500);
            animateValue('kpi-pagos', 0, stats.pagos || 0, 1500);
            animateValue('kpi-inadimplentes', 0, stats.inadimplentes || 0, 1500);
            animateValue('kpi-faturamento', 0, stats.faturamento || 0, 1500, true);
        } catch (e) {
            console.error("Erro no loadDashboardStats:", e);
            document.querySelectorAll('.kpi-content h2').forEach(el => {
                el.innerHTML = `<span style="color:#ef4444; font-size: 14px;">Erro: ${e.message}</span>`;
            });
        }
    }

    loadDashboardStats();
    loadTenantsList();

    // 5. Carregar Lista de Empresas (Tenants)

    async function loadTenantsList() {
        const tbody = document.getElementById('empresas-tbody');
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 32px;"><div class="kpi-loading" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;"><i class="ph ph-spinner-gap"></i><span style="font-size: 14px;">Carregando empresas...</span></div></td></tr>';

        try {
            const res = await fetch('/api/list_tenants');
            if (!res.ok) throw new Error("Erro na API");

            globalTenants = await res.json();
            renderTenants(globalTenants);
        } catch (e) {
            console.error(e);
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 24px; color: red;">Erro ao carregar lista. Verifique a chave na Vercel.</td></tr>';
        }
    }

    function renderTenants(tenantsList) {
        const tbody = document.getElementById('empresas-tbody');
        tbody.innerHTML = '';

        if (tenantsList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 24px;">Nenhuma empresa encontrada com os filtros atuais.</td></tr>';
            return;
        }

        // Ordena a lista de empresas pelo status: 1 - pago, 2 - aviso prévio, 3 - vencido
        const getStatusWeight = (status) => {
            const s = (status || '').toLowerCase();
            if (s === 'pago' || s === 'ativo') return 1;
            if (s === 'aviso prévio' || s === 'aviso previo') return 2;
            if (s === 'vencido' || s === 'inadimplente') return 3;
            return 4;
        };

        tenantsList.sort((a, b) => getStatusWeight(a.status) - getStatusWeight(b.status));

        tenantsList.forEach(tenant => {
            let statusBadge = '<span style="background-color: #10b981; color: white; padding: 4px 16px; border-radius: 6px; font-size: 12px; font-weight: 600;">Pago</span>';

            // Função de cálculo autônomo (Lê a data exata)
            const calcNextDue = (baseDateStr) => {
                if (!baseDateStr || baseDateStr === 'N/A') return null;
                const pts = baseDateStr.split('-');
                if (pts.length !== 3) return null;
                let yr = parseInt(pts[0], 10), mo = parseInt(pts[1], 10) - 1, dy = parseInt(pts[2], 10);
                return new Date(yr, mo, dy, 0, 0, 0, 0);
            };

            let nextDate = null;
            if (tenant.vencimento && tenant.vencimento !== 'N/A') {
                nextDate = calcNextDue(tenant.vencimento);
            }

            if (tenant.status === 'vencido' || tenant.status === 'inadimplente' || tenant.status === 'cancelado') {
                statusBadge = '<span style="background-color: #ef4444; color: white; padding: 4px 16px; border-radius: 6px; font-size: 12px; font-weight: 600;">Vencido</span>';
            } else if (tenant.status === 'Aviso prévio') {
                statusBadge = '<span style="background-color: #fef3c7; color: #b45309; padding: 4px 16px; border-radius: 6px; font-size: 12px; font-weight: 600;">Aviso prévio</span>';
            } else if (tenant.status === 'pago' || tenant.status === 'Ativo') {
                statusBadge = '<span style="background-color: #22c55e; color: white; padding: 4px 16px; border-radius: 6px; font-size: 12px; font-weight: 600;">Pago</span>';
            } else if (nextDate) {
                const hojeStr = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
                const hoje = new Date(hojeStr);
                hoje.setHours(0, 0, 0, 0);
                
                const diffTime = nextDate.getTime() - hoje.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays < 0) {
                    statusBadge = '<span style="background-color: #ef4444; color: white; padding: 4px 16px; border-radius: 6px; font-size: 12px; font-weight: 600;">Inadimplente</span>';
                } else if (diffDays === 0) {
                    statusBadge = '<span style="background-color: #f59e0b; color: white; padding: 4px 16px; border-radius: 6px; font-size: 12px; font-weight: 600;">Vence Hoje</span>';
                } else if (diffDays <= 3) {
                    statusBadge = `<span style="background-color: #f59e0b; color: white; padding: 4px 16px; border-radius: 6px; font-size: 12px; font-weight: 600;">Vence em ${diffDays} dias</span>`;
                }
            }

            // Formatar Data (mostrar a próxima fatura)
            let dataVenc = 'Não definido';
            let diasRestantesText = '';
            if (nextDate) {
                dataVenc = nextDate.toLocaleDateString('pt-BR');
                const hojeStr = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
                const hoje = new Date(hojeStr);
                hoje.setHours(0, 0, 0, 0);
                const diffTime = nextDate.getTime() - hoje.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays > 3) {
                    diasRestantesText = `<span style="color: #10b981; font-weight: 500;">${diffDays} dias</span>`;
                } else if (diffDays > 0 && diffDays <= 3) {
                    diasRestantesText = `<span style="color: #f59e0b; font-weight: 500;">${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}</span>`;
                } else if (diffDays === 0) {
                    diasRestantesText = `<span style="color: #f59e0b; font-weight: 500;">Vence hoje</span>`;
                } else {
                    diasRestantesText = `<span style="color: #ef4444; font-weight: 500;">Atrasado</span>`;
                }
            } else if (tenant.vencimento && tenant.vencimento !== 'N/A') {
                const [ano, mes, dia] = tenant.vencimento.split('-');
                dataVenc = `${dia}/${mes}/${ano}`;
            }

            const tr = document.createElement('tr');
            tr.style.cursor = 'pointer';
            tr.innerHTML = `
                <td>
                    <div class="user-cell" style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--color-primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600;">
                            ${(tenant.nome || '?').charAt(0).toUpperCase()}
                        </div>
                        <span class="user-name" style="font-weight: 500;">${tenant.nome || 'Empresa'}</span>
                    </div>
                </td>
                <td>${tenant.email || 'N/A'}</td>
                <td>${dataVenc}</td>
                <td>${diasRestantesText}</td>
                <td><span><strong>${tenant.total_leads || 0}</strong> leads</span></td>
                <td>${statusBadge}</td>
                <td>
                    <div style="display: inline-flex; align-items: center; gap: 8px; font-family: monospace; font-size: 12px; background: rgba(0,0,0,0.05); padding: 4px 8px; border-radius: 4px;">
                        <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;">${tenant.id_empresa}</span>
                        <button class="btn-copy-id" data-id="${tenant.id_empresa}" style="background: none; border: none; cursor: pointer; color: var(--color-primary);" title="Copiar Chave de API"><i class="ph ph-copy"></i></button>
                    </div>
                </td>
            `;

            // Adiciona evento de copiar sem disparar o click da linha
            const btnCopy = tr.querySelector('.btn-copy-id');
            if (btnCopy) {
                btnCopy.addEventListener('click', (e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(tenant.id_empresa).then(() => {
                        const icon = btnCopy.querySelector('i');
                        icon.className = 'ph ph-check';
                        icon.style.color = 'var(--color-success)';
                        setTimeout(() => {
                            icon.className = 'ph ph-copy';
                            icon.style.color = 'var(--color-primary)';
                        }, 2000);
                    });
                });
            }

            tr.addEventListener('click', () => {
                loadTenantDetails(tenant.id_empresa, tenant.nome, tenant.email);
            });

            tbody.appendChild(tr);
        });
    }

    // --- Filtros Administrativos ---
    const searchAdminInput = document.getElementById('search-empresas');
    const dateAdminInput = document.getElementById('date-filter-empresas');
    const btnClearAdminFilters = document.getElementById('btn-clear-admin-filters');

    function applyAdminFilters() {
        if (!searchAdminInput) return;
        const searchTerm = searchAdminInput.value.toLowerCase();

        const filtered = globalTenants.filter(t => {
            const nome = (t.nome || '').toLowerCase();
            const email = (t.email || '').toLowerCase();
            const matchesSearch = nome.includes(searchTerm) || email.includes(searchTerm);
            
            let matchesDate = true;
            if (adminStartDate || adminEndDate) {
                // Compara a data de vencimento (vencimento formato YYYY-MM-DD)
                if (t.vencimento && t.vencimento !== 'N/A') {
                    const [y, m, d] = t.vencimento.split('-');
                    const rowDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
                    
                    if (adminStartDate && adminEndDate) {
                        matchesDate = rowDate >= adminStartDate && rowDate <= adminEndDate;
                    } else if (adminStartDate) {
                        matchesDate = rowDate.getTime() === adminStartDate.getTime();
                    }
                } else {
                    matchesDate = false;
                }
            }
            
            return matchesSearch && matchesDate;
        });

        renderTenants(filtered);
    }

    if (searchAdminInput) searchAdminInput.addEventListener('input', applyAdminFilters);
    
    // --- Lógica do Calendário Customizado do Admin ---
    const dateBtn = document.getElementById('date-filter-btn');
    const dateDropdown = document.getElementById('date-dropdown');
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearTxt = document.getElementById('cal-month-year');
    const selectionTxt = document.getElementById('cal-selection-text');
    const prevBtn = document.getElementById('cal-prev');
    const nextBtn = document.getElementById('cal-next');
    let currentCalDate = new Date(); // Mês atual visível

    function updateAdminDateText() {
        const dateText = document.getElementById('date-filter-text');
        if (!dateText) return;
        if (adminStartDate && adminEndDate) {
            const d1Str = `${adminStartDate.getDate().toString().padStart(2, '0')}/${(adminStartDate.getMonth() + 1).toString().padStart(2, '0')}/${adminStartDate.getFullYear()}`;
            const d2Str = `${adminEndDate.getDate().toString().padStart(2, '0')}/${(adminEndDate.getMonth() + 1).toString().padStart(2, '0')}/${adminEndDate.getFullYear()}`;
            dateText.textContent = `${d1Str} - ${d2Str}`;
        } else {
            // Se nenhum selecionado, default para o mês atual
            const today = new Date();
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            const d1Str = `${firstDay.getDate().toString().padStart(2, '0')}/${(firstDay.getMonth() + 1).toString().padStart(2, '0')}/${firstDay.getFullYear()}`;
            const d2Str = `${lastDay.getDate().toString().padStart(2, '0')}/${(lastDay.getMonth() + 1).toString().padStart(2, '0')}/${lastDay.getFullYear()}`;
            dateText.textContent = `${d1Str} - ${d2Str}`;
        }
    }

    if (btnClearAdminFilters) {
        btnClearAdminFilters.addEventListener('click', (e) => {
            e.stopPropagation();
            let dropdown = btnClearAdminFilters.querySelector('.status-filter-dropdown');
            
            if (!dropdown) {
                dropdown = document.createElement('div');
                dropdown.className = 'status-filter-dropdown card';
                dropdown.style.position = 'absolute';
                dropdown.style.top = '100%';
                dropdown.style.right = '0';
                dropdown.style.marginTop = '8px';
                dropdown.style.minWidth = '200px';
                dropdown.style.zIndex = '1000';
                dropdown.style.padding = '12px';
                dropdown.style.display = 'flex';
                dropdown.style.flexDirection = 'column';
                dropdown.style.gap = '8px';
                dropdown.style.cursor = 'default';
                
                dropdown.innerHTML = `
                    <label style="font-weight: 500; font-size: 14px; margin-bottom: 8px; text-align: left; display: block; color: var(--color-text-main);">Status da Empresa</label>
                    <div class="custom-select-container" style="display: flex; flex-direction: column; gap: 4px;">
                        <div class="custom-option selected" data-value="Todos">Todos os status</div>
                        <div class="custom-option" data-value="Ativos">Ativos</div>
                        <div class="custom-option admin-opt-aviso" data-value="Aviso previo">Aviso prévio</div>
                        <div class="custom-option admin-opt-inadimplente" data-value="Inadimplente">Vencido</div>
                    </div>
                `;
                
                btnClearAdminFilters.style.position = 'relative';
                btnClearAdminFilters.appendChild(dropdown);
                
                dropdown.addEventListener('click', (ev) => ev.stopPropagation());
                
                const options = dropdown.querySelectorAll('.custom-option');
                options.forEach(opt => {
                    opt.addEventListener('click', (ev) => {
                        // Atualiza a seleção visual das opções
                        options.forEach(o => o.classList.remove('selected'));
                        opt.classList.add('selected');
                        
                        const statusVal = opt.getAttribute('data-value').toLowerCase();
                        
                        // Efeito visual de filtro ativo no botão de funil
                        if (statusVal === 'todos') {
                            btnClearAdminFilters.classList.remove('filter-active');
                        } else {
                            btnClearAdminFilters.classList.add('filter-active');
                        }
                        
                        // Primeiro, restaura visibilidade pela busca (texto e data) original
                        applyAdminFilters();
                        
                        // Em seguida, varre as linhas que estão visíveis e aplica o status (in-place)
                        const tableRows = document.querySelectorAll('.data-table tbody tr');
                        tableRows.forEach(row => {
                            if (row.style.display !== 'none') {
                                if (statusVal === 'todos') {
                                    row.style.display = '';
                                } else {
                                    const cells = row.querySelectorAll('td');
                                    if (cells.length > 5) { // O status badge está na célula 5 (índice 5)
                                        const badge = cells[5].querySelector('span');
                                        const rowStatus = badge ? badge.textContent.trim().toLowerCase() : cells[5].textContent.trim().toLowerCase();
                                        
                                        let match = false;
                                        if (statusVal === 'ativos' && (rowStatus === 'pago' || rowStatus === 'ativo' || rowStatus.includes('aviso prévio') || rowStatus.includes('aviso previo'))) {
                                            match = true;
                                        } else if (statusVal === 'aviso previo' && (rowStatus.includes('aviso prévio') || rowStatus.includes('aviso previo'))) {
                                            match = true;
                                        } else if (statusVal === 'inadimplente' && (rowStatus === 'vencido' || rowStatus === 'inadimplente')) {
                                            match = true;
                                        } else if (statusVal === rowStatus) {
                                            match = true;
                                        }
                                        
                                        if (!match) {
                                            row.style.display = 'none';
                                        }
                                    }
                                }
                            }
                        });
                        
                        setTimeout(() => {
                            if (dropdown) dropdown.style.display = 'none';
                        }, 250);
                    });
                });
                
                const closeDropdown = (ev) => {
                    if (!btnClearAdminFilters.contains(ev.target)) {
                        dropdown.style.display = 'none';
                    }
                };
                document.addEventListener('click', closeDropdown);
            } else {
                dropdown.style.display = dropdown.style.display === 'none' ? 'flex' : 'none';
            }
        });
    }

    updateAdminDateText(); // Setup inicial

    function renderAdminCalendar() {
        if (!calendarGrid) return;
        const year = currentCalDate.getFullYear();
        const month = currentCalDate.getMonth();
        
        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        if (monthYearTxt) monthYearTxt.textContent = `${monthNames[month]} ${year}`;

        // Remove todos os dias anteriores (mantendo os dias da semana)
        const daysToRemove = calendarGrid.querySelectorAll('.cal-day');
        daysToRemove.forEach(d => d.remove());

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Espaços vazios antes do dia 1
        for (let i = 0; i < firstDay; i++) {
            const emptySpan = document.createElement('span');
            emptySpan.className = 'cal-day empty';
            calendarGrid.appendChild(emptySpan);
        }

        const today = window.getBrasiliaDate ? window.getBrasiliaDate() : new Date();

        for (let i = 1; i <= daysInMonth; i++) {
            const daySpan = document.createElement('span');
            daySpan.className = 'cal-day';
            daySpan.textContent = i;
            
            const cellDate = new Date(year, month, i);

            // Highlight today
            if (cellDate.getDate() === today.getDate() && cellDate.getMonth() === today.getMonth() && cellDate.getFullYear() === today.getFullYear()) {
                daySpan.classList.add('today-date'); // Verde claro
            }

            // Highlight selected range
            if (adminStartDate && adminEndDate) {
                if (cellDate.getTime() === adminStartDate.getTime()) daySpan.classList.add('start-range');
                if (cellDate.getTime() === adminEndDate.getTime()) daySpan.classList.add('end-range');
                if (cellDate > adminStartDate && cellDate < adminEndDate) daySpan.classList.add('in-range');
            } else if (adminStartDate && cellDate.getTime() === adminStartDate.getTime()) {
                daySpan.classList.add('selected');
            }

            daySpan.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!adminStartDate || (adminStartDate && adminEndDate)) {
                    // Start new range
                    adminStartDate = new Date(cellDate);
                    adminEndDate = null;
                    if (selectionTxt) {
                        selectionTxt.textContent = `De: ${i.toString().padStart(2, '0')} de ${monthNames[month]} - Selecione o fim`;
                    }
                } else if (adminStartDate && !adminEndDate) {
                    if (cellDate < adminStartDate) {
                        adminEndDate = adminStartDate;
                        adminStartDate = new Date(cellDate);
                    } else {
                        adminEndDate = new Date(cellDate);
                    }
                    if (selectionTxt) {
                        selectionTxt.textContent = `Período selecionado: ${adminStartDate.getDate().toString().padStart(2, '0')}/${(adminStartDate.getMonth()+1).toString().padStart(2, '0')} até ${adminEndDate.getDate().toString().padStart(2, '0')}/${(adminEndDate.getMonth()+1).toString().padStart(2, '0')}`;
                    }
                }
                renderAdminCalendar(); // Re-render para atualizar os 'selected'
            });

            calendarGrid.appendChild(daySpan);
        }
    }

    const btnClearDateFilter = document.getElementById('btn-clear-date-filter');
    if (btnClearDateFilter) {
        btnClearDateFilter.addEventListener('click', (e) => {
            e.stopPropagation();
            adminStartDate = null;
            adminEndDate = null;
            if (selectionTxt) selectionTxt.textContent = "Nenhum período selecionado";
            updateAdminDateText();
            applyAdminFilters();
            loadDashboardStats();
            renderAdminCalendar();
        });
    }

    const btnApplyDate = document.getElementById('btn-apply-date');
    if (btnApplyDate) {
        btnApplyDate.addEventListener('click', (e) => {
            e.stopPropagation();
            updateAdminDateText();
            applyAdminFilters();
            loadDashboardStats();
            dateDropdown.classList.remove('show');
        });
    }
    
    if (dateBtn && dateDropdown) {
        dateBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dateDropdown.classList.toggle('show');
            const userDropdown = document.getElementById('user-dropdown');
            if (userDropdown) userDropdown.classList.remove('show');
            renderAdminCalendar();
        });

        document.addEventListener('click', (e) => {
            if (!dateBtn.contains(e.target) && !dateDropdown.contains(e.target)) {
                dateDropdown.classList.remove('show');
            }
        });

        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                currentCalDate.setMonth(currentCalDate.getMonth() - 1);
                renderAdminCalendar();
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                currentCalDate.setMonth(currentCalDate.getMonth() + 1);
                renderAdminCalendar();
            });
        }

        const btnApply = document.getElementById('btn-apply-date');
        if (btnApply) {
            btnApply.addEventListener('click', () => {
                updateAdminDateText();
                dateDropdown.classList.remove('show');
                applyAdminFilters();
                loadDashboardStats();
            });
        }

        const btnClearDate = document.getElementById('btn-clear-date-filter');
        if (btnClearDate) {
            btnClearDate.addEventListener('click', (e) => {
                e.stopPropagation();
                adminSelectedDate = null;
                adminStartDate = null;
                adminEndDate = null;
                if (selectionTxt) selectionTxt.textContent = "Nenhuma data selecionada";
                updateAdminDateText();
                applyAdminFilters();
                loadDashboardStats();
                renderAdminCalendar();
            });
        }
    }

    // 6. Carregar Detalhes de um Tenant (Mini Dashboard)
    let currentTenantId = null;
    let currentTenantName = '';
    let currentTenantEmail = '';

    document.getElementById('btn-voltar-empresas').addEventListener('click', () => {
        showSection('empresas');
        currentTenantId = null;
    });

    async function loadTenantDetails(id, nome, email) {
        currentTenantId = id;
        currentTenantName = nome;
        currentTenantEmail = email;

        showSection('detalhes-empresa');
        
        document.getElementById('page-title').textContent = "Configurações da empresa";
        document.getElementById('page-subtitle').textContent = "Gerencie as informações, o horário de atendimento e as ações desta empresa.";

        // 1. Busca os dados básicos na lista que já foi baixada pela API /api/list_tenants
        const tenantData = globalTenants.find(t => t.id_empresa === id) || {};
        
        const displayNome = tenantData.nome || nome || 'Sem Nome';
        const displayEmail = tenantData.email || email || 'Sem Email';
        
        document.getElementById('detalhe-nome-empresa').textContent = displayNome;
        document.getElementById('detalhe-email-empresa').innerHTML = `<i class="ph-fill ph-envelope-simple"></i> <span>${displayEmail}</span>`;
        document.getElementById('info-nome').textContent = displayNome;
        document.getElementById('info-email').textContent = displayEmail;

        const badge = document.getElementById('detalhe-status-badge');

        let statusStr = "Ativa";
        let statusColor = "#22c55e";
        let statusExp = "Pagamento em dia. Empresa funcionando normalmente.";
        
        if (tenantData.status === 'vencido') {
            statusStr = "Vencida";
            statusColor = "#ef4444";
            statusExp = "Pagamento está em atraso.";
        } else if (tenantData.status === 'Aviso prévio') {
            statusStr = "Aviso Prévio";
            statusColor = "#f59e0b";
            statusExp = `Pagamento próximo do vencimento.`;
        } else if (tenantData.status === 'suspenso') {
            statusStr = "Suspensa";
            statusColor = "#9ca3af";
            statusExp = "Empresa suspensa. O acesso ao CRM está bloqueado.";
        } else {
            statusStr = "Pago";
            statusColor = "#22c55e";
        }

        if (badge) {
            badge.textContent = statusStr;
            badge.style.backgroundColor = statusColor;
        }

        document.getElementById('detalhe-total-leads').textContent = tenantData.total_leads || 0;

        // 2. Tenta buscar os dados adicionais diretamente do Supabase usando a sessão do Administrador
        try {
            // Busca o usuário completo para pegar descricao, localizacao, etc (Pode falhar por RLS, se falhar usamos só o que temos)
            const { data: usuario } = await supabase.from('usuarios').select('*').eq('id', id).single();
            
            if (usuario) {
                const localEl = document.getElementById('detalhe-local-empresa');
                if (usuario.localizacao) {
                    localEl.innerHTML = `<i class="ph-fill ph-map-pin"></i> <span>${usuario.localizacao}</span>`;
                    localEl.style.display = 'flex';
                } else {
                    localEl.style.display = 'none';
                }

                const descEl = document.getElementById('detalhe-desc-empresa');
                if (usuario.descricao) {
                    descEl.textContent = usuario.descricao;
                    descEl.style.display = 'block';
                } else {
                    descEl.style.display = 'none';
                }

                const rowWpp = document.getElementById('row-whatsapp');
                if (usuario.whatsapp) {
                    document.getElementById('info-whatsapp').textContent = usuario.whatsapp;
                    rowWpp.style.display = 'flex';
                } else rowWpp.style.display = 'none';

                const rowCnpj = document.getElementById('row-cnpj');
                if (usuario.cnpj_cpf) {
                    document.getElementById('info-cnpj').textContent = usuario.cnpj_cpf;
                    rowCnpj.style.display = 'flex';
                } else rowCnpj.style.display = 'none';

                const rowSeg = document.getElementById('row-segmento');
                if (usuario.segmento) {
                    document.getElementById('info-segmento').textContent = usuario.segmento;
                    rowSeg.style.display = 'flex';
                } else rowSeg.style.display = 'none';

                const rowDesc = document.getElementById('row-descricao');
                if (usuario.descricao) {
                    document.getElementById('info-descricao').textContent = usuario.descricao;
                    rowDesc.style.display = 'flex';
                } else rowDesc.style.display = 'none';

                let dataCriada = "";
                if (usuario.criado_em) {
                    const dc = new Date(usuario.criado_em);
                    dataCriada = `${dc.toLocaleDateString('pt-BR', {timeZone:'America/Sao_Paulo'})} - ${dc.toLocaleTimeString('pt-BR', {timeZone:'America/Sao_Paulo', hour:'2-digit', minute:'2-digit'})}`;
                }
                document.getElementById('info-criada-em').textContent = dataCriada;
                
                window.tempUsuario = usuario;
            } else {
                // Oculta tudo que não temos acesso
                document.getElementById('detalhe-local-empresa').style.display = 'none';
                document.getElementById('detalhe-desc-empresa').style.display = 'none';
                document.getElementById('row-whatsapp').style.display = 'none';
                document.getElementById('row-cnpj').style.display = 'none';
                document.getElementById('row-segmento').style.display = 'none';
                document.getElementById('row-descricao').style.display = 'none';
                document.getElementById('info-criada-em').textContent = 'N/A';
                window.tempUsuario = { id: id };
            }

            // Busca os Horários
            const { data: horarios } = await supabase.from('horarios_empresa').select('*').eq('id_empresa', id);
            window.tempHorarios = horarios || [];
            
            // Busca as Reuniões Marcadas (leads com qualificacao=qualificado)
            const data30diasStr = new Date(new Date().getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString();
            const { count: reunioesCount } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('id_empresa', id)
                .or('status.eq.qualificado,qualificacao.eq.qualificado')
                .gte('criado_em', data30diasStr);
                
            document.getElementById('detalhe-total-reunioes').textContent = reunioesCount || 0;

        } catch (error) {
            console.error(error);
            document.getElementById('detalhe-total-reunioes').textContent = "0";
            window.tempHorarios = [];
        }

        const usuario = window.tempUsuario || { id: id };
        const horarios = window.tempHorarios || [];

        const hList = document.getElementById('horarios-list');
        hList.innerHTML = '';
        if (!horarios || horarios.length === 0) {
            hList.innerHTML = `
                <div style="background-color: var(--color-bg); padding: 16px; border-radius: 8px; border: 1px dashed var(--color-border); text-align: center;">
                    <p style="font-weight: 600; color: var(--color-text-main); margin-bottom: 4px;">Horário não configurado</p>
                    <p style="font-size: 13px; color: var(--color-text-mut);">Sem horário, a métrica 'Atendidos fora do horário' fica desligada pra esta empresa.</p>
                </div>
            `;
        } else {
            const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
            for (let i = 1; i <= 7; i++) {
                const idx = i === 7 ? 0 : i;
                const ds = dias[idx];
                const cfg = horarios.find(h => h.dia_semana === idx);
                const isOpen = cfg && cfg.aberto;
                const timeText = isOpen ? `${cfg.hora_abertura.substring(0,5)} - ${cfg.hora_fechamento.substring(0,5)}` : 'Fechado';
                const toggleColor = isOpen ? '#22c55e' : '#e2e8f0';
                const toggleKnob = isOpen ? 'right: 2px;' : 'left: 2px;';
                
                hList.innerHTML += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background-color: var(--color-bg); border-radius: 8px;">
                        <span style="font-weight: 600; color: var(--color-text-main); width: 80px;">${ds}</span>
                        <span style="color: ${isOpen ? 'var(--color-text-main)' : 'var(--color-text-mut)'}; font-size: 14px;">${timeText}</span>
                        <div style="position: relative; width: 40px; height: 24px; background-color: ${toggleColor}; border-radius: 12px; transition: 0.2s;">
                            <div style="position: absolute; top: 2px; ${toggleKnob} width: 20px; height: 20px; background-color: white; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"></div>
                        </div>
                    </div>
                `;
            }
        }

        const btnSuspender = document.getElementById('btn-suspender-empresa');
        const iconSuspender = document.getElementById('icon-suspender');
        const txtSuspender = document.getElementById('text-suspender');

        if (usuario.status_assinatura === 'suspenso') {
            btnSuspender.style.backgroundColor = '#dcfce7';
            btnSuspender.style.color = '#16a34a';
            iconSuspender.className = 'ph-fill ph-play-circle';
            txtSuspender.textContent = 'Reativar Empresa';
            btnSuspender.onclick = () => toggleStatus(id, 'ativo');
        } else {
            btnSuspender.style.backgroundColor = '#fee2e2';
            btnSuspender.style.color = '#dc2626';
            iconSuspender.className = 'ph-fill ph-pause-circle';
            txtSuspender.textContent = 'Suspender Empresa';
            btnSuspender.onclick = () => {
                if (confirm('Tem certeza que deseja suspender esta empresa? O acesso ao CRM será bloqueado.')) {
                    toggleStatus(id, 'suspenso');
                }
            };
        }

        document.getElementById('edit-nome').value = usuario.nome_completo || '';
        document.getElementById('edit-email').value = usuario.email || '';
        document.getElementById('edit-mensalidade').value = usuario.mensalidade || '';
        document.getElementById('edit-vencimento').value = (usuario.data_vencimento && usuario.data_vencimento !== 'N/A') ? usuario.data_vencimento : '';
        document.getElementById('edit-whatsapp').value = usuario.whatsapp || '';
        document.getElementById('edit-cnpj').value = usuario.cnpj_cpf || '';
        document.getElementById('edit-segmento').value = usuario.segmento || '';
        document.getElementById('edit-localizacao').value = usuario.localizacao || '';
        document.getElementById('edit-descricao').value = usuario.descricao || '';
        
        document.getElementById('config-fuso').value = usuario.fuso_horario || 'America/Recife';
        document.getElementById('config-horas-parado').value = usuario.horas_lead_parado || 24;

        renderConfigDias(horarios || []);
    }

    // Lógica do Modal de Cadastrar Empresa
    const modalCadastrar = document.getElementById('modal-cadastrar-empresa');
    const btnOpenCadastrar = document.getElementById('btn-open-cadastrar-modal');

    if (btnOpenCadastrar && modalCadastrar) {
        btnOpenCadastrar.addEventListener('click', () => {
            modalCadastrar.classList.add('active');
            document.getElementById('tenant-msg').textContent = '';
        });

        // Fechar ao clicar no "X" ou fora do modal
        const closeBtn = modalCadastrar.querySelector('.close-modal');
        if (closeBtn) closeBtn.addEventListener('click', () => modalCadastrar.classList.remove('active'));

        modalCadastrar.addEventListener('click', (e) => {
            if (e.target === modalCadastrar) {
                modalCadastrar.classList.remove('active');
            }
        });
    }

    const inputMensalidade = document.getElementById('tenant-mensalidade');
    if (inputMensalidade) {
        inputMensalidade.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value === '') {
                e.target.value = '';
                return;
            }
            value = (parseInt(value, 10) / 100).toFixed(2) + '';
            value = value.replace('.', ',');
            value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
            e.target.value = 'R$ ' + value;
        });
    }

    // 7. Cadastrar Empresa via API
    document.getElementById('form-create-tenant').addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = document.getElementById('btn-submit-tenant');
        const msg = document.getElementById('tenant-msg');

        btn.disabled = true;
        btn.innerHTML = '<i class="ph ph-spinner-gap" style="font-size: 20px; animation: spin 1s linear infinite;"></i> Criando ambiente...';
        msg.textContent = '';

        let rawMensalidade = document.getElementById('tenant-mensalidade').value || '0';
        rawMensalidade = rawMensalidade.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
        const mensalidadeNum = parseFloat(rawMensalidade) || 0;

        const payload = {
            nome_empresa: document.getElementById('tenant-nome').value,
            email: document.getElementById('tenant-email').value,
            password: document.getElementById('tenant-senha').value,
            data_vencimento: document.getElementById('tenant-vencimento').value,
            mensalidade: mensalidadeNum
        };

        try {
            const res = await fetch('/api/create_tenant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                msg.style.color = '#00A884';
                msg.textContent = '✅ Empresa cadastrada com sucesso!';
                document.getElementById('form-create-tenant').reset();

                // Recarregar os dados na tela e fechar o modal
                loadDashboardStats();
                loadTenantsList();

                setTimeout(() => {
                    modalCadastrar.classList.remove('active');
                    msg.textContent = '';
                }, 2000);

            } else {
                msg.style.color = '#ef4444';
                msg.textContent = '❌ Erro: ' + (data.error || 'Erro desconhecido');
            }
        } catch (err) {
            console.error(err);
            msg.style.color = '#ef4444';
            msg.textContent = '❌ Erro de conexão. Configure o Vercel corretamente.';
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="ph ph-check" style="font-size: 20px;"></i> Criar Empresa no Sistema';
        }
    });

    // 8. Alterar Senha Master
    document.getElementById('form-change-password').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('admin-new-password').value;
        const btn = document.getElementById('btn-change-password');

        btn.disabled = true;
        btn.textContent = 'Atualizando...';

        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
            alert('Erro ao alterar senha: ' + error.message);
        } else {
            alert('Senha Master atualizada com sucesso!');
            document.getElementById('form-change-password').reset();
        }

        btn.disabled = false;
        btn.textContent = 'Atualizar Senha Master';
    });

    // --- Lógica Modais de Empresa ---
    async function toggleStatus(id, newStatus) {
        try {
            if (newStatus === 'suspenso') {
                const res = await fetch('/api/suspend_tenant', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({id_empresa: id})
                });
                if (!res.ok) throw new Error('Erro ao suspender na API Serverless');
            }
            
            const { error } = await supabase.from('usuarios').update({status_assinatura: newStatus}).eq('id', id);
            if (error) throw error;
            
            alert(`Empresa ${newStatus === 'suspenso' ? 'suspensa' : 'reativada'} com sucesso!`);
            loadTenantDetails(id, currentTenantName, currentTenantEmail);
            loadTenantsList();
        } catch(e) {
            alert(e.message);
        }
    }

    function renderConfigDias(horarios) {
        const container = document.getElementById('config-dias-container');
        container.innerHTML = '';
        const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        
        for (let i = 1; i <= 7; i++) {
            const idx = i === 7 ? 0 : i;
            const ds = dias[idx];
            const cfg = horarios.find(h => h.dia_semana === idx) || { aberto: false, hora_abertura: '09:00', hora_fechamento: '18:00' };
            
            container.innerHTML += `
                <div class="config-dia-row" data-dia="${idx}" style="display: flex; align-items: center; gap: 16px; background: var(--color-bg); padding: 12px 16px; border-radius: 8px; border: 1px solid var(--color-border);">
                    <label style="width: 100px; display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" class="cb-aberto" ${cfg.aberto ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: var(--color-primary);">
                        <span style="font-weight: 500; font-size: 14px;">${ds}</span>
                    </label>
                    <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                        <input type="time" class="form-control time-abertura" value="${cfg.hora_abertura.substring(0,5)}" ${cfg.aberto ? '' : 'disabled'} style="width: 100%;">
                        <span style="color: var(--color-text-mut);">às</span>
                        <input type="time" class="form-control time-fechamento" value="${cfg.hora_fechamento.substring(0,5)}" ${cfg.aberto ? '' : 'disabled'} style="width: 100%;">
                    </div>
                </div>
            `;
        }

        container.querySelectorAll('.cb-aberto').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const row = e.target.closest('.config-dia-row');
                const tA = row.querySelector('.time-abertura');
                const tF = row.querySelector('.time-fechamento');
                tA.disabled = !e.target.checked;
                tF.disabled = !e.target.checked;
            });
        });
    }

    const modalEdit = document.getElementById('modal-editar-empresa');
    const modalSenha = document.getElementById('modal-alterar-senha');
    const modalConfig = document.getElementById('modal-configurar-horario');

    document.getElementById('btn-editar-empresa').addEventListener('click', () => modalEdit.classList.add('active'));
    document.getElementById('btn-modal-senha').addEventListener('click', () => modalSenha.classList.add('active'));
    document.getElementById('btn-configurar-horario').addEventListener('click', () => modalConfig.classList.add('active'));

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.remove('active');
        });
    });

    document.querySelectorAll('.modal').forEach(m => {
        m.addEventListener('click', (e) => {
            if (e.target === m) m.classList.remove('active');
        });
    });

    document.getElementById('form-edit-tenant').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-save-edit');
        btn.disabled = true;
        btn.textContent = 'Salvando...';

        const payload = {
            nome_completo: document.getElementById('edit-nome').value,
            email: document.getElementById('edit-email').value,
            mensalidade: document.getElementById('edit-mensalidade').value,
            data_vencimento: document.getElementById('edit-vencimento').value || 'N/A',
            whatsapp: document.getElementById('edit-whatsapp').value,
            cnpj_cpf: document.getElementById('edit-cnpj').value,
            segmento: document.getElementById('edit-segmento').value,
            localizacao: document.getElementById('edit-localizacao').value,
            descricao: document.getElementById('edit-descricao').value,
        };

        const { error } = await supabase.from('usuarios').update(payload).eq('id', currentTenantId);
        
        btn.disabled = false;
        btn.textContent = 'Salvar Alterações';

        if (error) alert('Erro: ' + error.message);
        else {
            modalEdit.classList.remove('active');
            loadTenantDetails(currentTenantId, payload.nome_completo, payload.email);
            loadTenantsList();
        }
    });

    document.getElementById('form-alterar-senha').addEventListener('submit', async (e) => {
        e.preventDefault();
        const s1 = document.getElementById('nova-senha-cliente').value;
        const s2 = document.getElementById('nova-senha-cliente-confirm').value;

        if (s1 !== s2) {
            alert('As senhas não coincidem!');
            return;
        }

        const btn = document.getElementById('btn-save-senha');
        btn.disabled = true;
        btn.textContent = 'Atualizando...';

        try {
            const res = await fetch('/api/change_tenant_password', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ id_empresa: currentTenantId, new_password: s1 })
            });
            if (!res.ok) throw new Error('Erro ao alterar senha');
            
            modalSenha.classList.remove('active');
            alert('Senha alterada com sucesso!');
            document.getElementById('form-alterar-senha').reset();
        } catch(err) {
            alert(err.message);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Salvar Nova Senha';
        }
    });

    document.getElementById('form-config-horario').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-save-horario');
        btn.disabled = true;
        btn.textContent = 'Salvando...';

        const fuso = document.getElementById('config-fuso').value;
        const horasParado = document.getElementById('config-horas-parado').value;

        await supabase.from('usuarios').update({ fuso_horario: fuso, horas_lead_parado: horasParado }).eq('id', currentTenantId);

        const rows = document.querySelectorAll('.config-dia-row');
        const novosHorarios = [];
        rows.forEach(r => {
            novosHorarios.push({
                id_empresa: currentTenantId,
                dia_semana: parseInt(r.getAttribute('data-dia')),
                aberto: r.querySelector('.cb-aberto').checked,
                hora_abertura: r.querySelector('.time-abertura').value,
                hora_fechamento: r.querySelector('.time-fechamento').value
            });
        });

        const { error } = await supabase.from('horarios_empresa').upsert(novosHorarios, { onConflict: 'id_empresa, dia_semana' });
        
        btn.disabled = false;
        btn.textContent = 'Salvar Horários';

        if (error) alert('Erro: ' + error.message);
        else {
            modalConfig.classList.remove('active');
            loadTenantDetails(currentTenantId, currentTenantName, currentTenantEmail);
        }
    });
});
