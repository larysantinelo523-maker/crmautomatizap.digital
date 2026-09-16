import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {

    // 1. Autenticação e Tema
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
    const themeCheckbox = document.getElementById('theme-toggle-checkbox');
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeCheckbox.checked = true;
    }

    themeCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
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

    // 4. Carregar Métricas Globais (Visão Geral)
    async function loadDashboardStats() {
        try {
            const res = await fetch('/api/get_stats');
            if (!res.ok) throw new Error("Erro na API (verifique chave Supabase na Vercel)");
            const stats = await res.json();

            document.getElementById('kpi-empresas').innerHTML = stats.empresas;
            document.getElementById('kpi-pagos').innerHTML = stats.pagos;
            document.getElementById('kpi-inadimplentes').innerHTML = stats.inadimplentes;
            document.getElementById('kpi-faturamento').innerHTML = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.faturamento);
        } catch (e) {
            console.error(e);
            document.querySelectorAll('.kpi-content h2').forEach(el => {
                el.innerHTML = '<span style="color:#ef4444; font-size: 14px;">Erro ao carregar</span>';
            });
        }
    }

    loadDashboardStats();
    loadTenantsList();

    // 5. Carregar Lista de Empresas (Tenants)
    let globalTenants = [];

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
            if (tenant.status === 'inadimplente' || tenant.status === 'cancelado') {
                statusBadge = '<span style="background-color: #ef4444; color: white; padding: 4px 16px; border-radius: 6px; font-size: 12px; font-weight: 600;">Inadimplente</span>';
            } else if (tenant.vencimento && tenant.vencimento !== 'N/A') {
                const hojeStr = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
                const hoje = new Date(hojeStr);
                hoje.setHours(0, 0, 0, 0);
                
                nextDate = calcNextDue(tenant.vencimento);
                if (nextDate) {
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
                if (diffDays > 0) {
                    diasRestantesText = `<br><span style="font-size: 12px; color: var(--color-text-mut);">${diffDays} ${diffDays === 1 ? 'dia restante' : 'dias restantes'}</span>`;
                } else if (diffDays === 0) {
                    diasRestantesText = `<br><span style="font-size: 12px; color: #f59e0b; font-weight: 500;">Vence hoje</span>`;
                } else {
                    diasRestantesText = `<br><span style="font-size: 12px; color: #ef4444; font-weight: 500;">Atrasado</span>`;
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
                <td style="line-height: 1.4;">${dataVenc}${diasRestantesText}</td>
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
    let adminStartDate = null;
    let adminEndDate = null;
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
                        <div class="custom-option admin-opt-inadimplente" data-value="Inadimplente">Inadimplente</div>
                        <div class="custom-option admin-opt-aviso" data-value="Aviso previo">Aviso previo</div>
                        <div class="custom-option" data-value="Pagos">Pagos</div>
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
                                    if (cells.length > 4) {
                                        const badge = cells[4].querySelector('.badge');
                                        const rowStatus = badge ? badge.textContent.trim().toLowerCase() : cells[4].textContent.trim().toLowerCase();
                                        
                                        let match = false;
                                        if (statusVal === 'pagos' && rowStatus === 'pago') {
                                            match = true;
                                        } else if (statusVal === 'aviso previo' && rowStatus.includes('vence')) {
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
            renderAdminCalendar();
        });
    }

    const btnApplyDate = document.getElementById('btn-apply-date');
    if (btnApplyDate) {
        btnApplyDate.addEventListener('click', (e) => {
            e.stopPropagation();
            updateAdminDateText();
            applyAdminFilters();
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
            });
        }

        const btnClearDate = document.getElementById('btn-clear-date-filter');
        if (btnClearDate) {
            btnClearDate.addEventListener('click', (e) => {
                e.stopPropagation();
                adminSelectedDate = null;
                if (selectionTxt) selectionTxt.textContent = "Nenhuma data selecionada";
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

        document.getElementById('detalhe-nome-empresa').textContent = nome;
        document.getElementById('detalhe-email-empresa').textContent = email;

        // Limpar gráficos
        document.getElementById('admin-chart-line').innerHTML = '<i class="ph ph-spinner-gap"></i> Carregando gráfico...';
        document.getElementById('admin-map-container').innerHTML = '<i class="ph ph-spinner-gap"></i> Carregando mapa...';

        showSection('detalhes-empresa');

        try {
            const res = await fetch(`/api/get_tenant_stats?id_empresa=${id}`);
            if (!res.ok) throw new Error("Erro na API");

            const data = await res.json();

            renderAdminLineChart(data.lineChartData.categories, data.lineChartData.series);
            renderAdminMap(data.mapData);

        } catch (e) {
            console.error(e);
            document.getElementById('admin-chart-line').innerHTML = 'Erro ao carregar';
            document.getElementById('admin-map-container').innerHTML = 'Erro ao carregar';
        }
    }

    // ApexCharts e Highcharts logic (Similar ao do Relatórios)
    let adminChartInstance = null;
    function renderAdminLineChart(categories, series) {
        const isDark = document.body.classList.contains('dark-mode');
        const textColor = isDark ? '#94a3b8' : '#64748b';

        const options = {
            series: [{ name: "Leads", data: series }],
            chart: {
                height: 350,
                type: 'area',
                toolbar: { show: false },
                fontFamily: 'Poppins, sans-serif',
                background: 'transparent'
            },
            colors: ['#00A884'],
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.4,
                    opacityTo: 0.05,
                    stops: [0, 90, 100]
                }
            },
            dataLabels: { enabled: false },
            stroke: { curve: 'smooth', width: 2 },
            xaxis: {
                categories: categories,
                labels: { style: { colors: textColor } },
                axisBorder: { show: false },
                axisTicks: { show: false }
            },
            yaxis: {
                labels: { style: { colors: textColor } }
            },
            theme: { mode: isDark ? 'dark' : 'light' }
        };

        const container = document.getElementById("admin-chart-line");
        container.innerHTML = '';

        if (adminChartInstance) adminChartInstance.destroy();
        adminChartInstance = new ApexCharts(container, options);
        adminChartInstance.render();
    }

    async function renderAdminMap(data) {
        const isDark = document.body.classList.contains('dark-mode');
        const mapConfig = {
            chart: {
                map: 'countries/br/br-all',
                backgroundColor: 'transparent',
                style: { fontFamily: 'Poppins, sans-serif' }
            },
            title: { text: null },
            mapNavigation: {
                enabled: true,
                buttonOptions: { verticalAlign: 'bottom' }
            },
            colorAxis: {
                min: 0,
                minColor: isDark ? '#1a1d2d' : '#f1f5f9',
                maxColor: '#00A884'
            },
            series: [{
                data: data,
                name: 'Leads',
                states: { hover: { color: '#25D366' } },
                dataLabels: {
                    enabled: true,
                    format: '{point.name}',
                    style: { color: isDark ? '#fff' : '#333' }
                }
            }],
            credits: { enabled: false }
        };

        Highcharts.mapChart('admin-map-container', mapConfig);
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

    // 7. Cadastrar Empresa via API
    document.getElementById('form-create-tenant').addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = document.getElementById('btn-submit-tenant');
        const msg = document.getElementById('tenant-msg');

        btn.disabled = true;
        btn.innerHTML = '<i class="ph ph-spinner-gap" style="font-size: 20px; animation: spin 1s linear infinite;"></i> Criando ambiente...';
        msg.textContent = '';

        const payload = {
            nome_empresa: document.getElementById('tenant-nome').value,
            email: document.getElementById('tenant-email').value,
            password: document.getElementById('tenant-senha').value,
            data_vencimento: document.getElementById('tenant-vencimento').value
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
});
