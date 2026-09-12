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
        'cadastrar': { title: 'Cadastrar Cliente', sub: 'Crie um novo ambiente de CRM para um cliente.' },
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
        userMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });
        document.addEventListener('click', function(e) {
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
            document.getElementById('kpi-leads').innerHTML = stats.leads;
            document.getElementById('kpi-conversas').innerHTML = stats.conversas;
            document.getElementById('kpi-usuarios').innerHTML = stats.usuarios;
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
    async function loadTenantsList() {
        const tbody = document.getElementById('empresas-tbody');
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 24px;">Carregando empresas... <i class="ph ph-spinner-gap"></i></td></tr>';

        try {
            const res = await fetch('/api/list_tenants');
            if (!res.ok) throw new Error("Erro na API");
            
            const tenants = await res.json();
            tbody.innerHTML = '';

            if (tenants.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 24px;">Nenhuma empresa cadastrada.</td></tr>';
                return;
            }

            tenants.forEach(tenant => {
                let statusBadge = tenant.status === 'ativo' ? '<span class="badge success">Ativo</span>' : '<span class="badge danger">Inadimplente</span>';
                
                // Formatar Data
                let dataVenc = 'Não definido';
                if (tenant.vencimento && tenant.vencimento !== 'N/A') {
                    const [ano, mes, dia] = tenant.vencimento.split('-');
                    dataVenc = `${dia}/${mes}/${ano}`;
                }

                const tr = document.createElement('tr');
                tr.style.cursor = 'pointer';
                tr.innerHTML = `
                    <td>
                        <div class="user-cell" style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--color-primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600;">
                                ${tenant.nome.charAt(0).toUpperCase()}
                            </div>
                            <span class="user-name" style="font-weight: 500;">${tenant.nome}</span>
                        </div>
                    </td>
                    <td>${tenant.email}</td>
                    <td>${dataVenc}</td>
                    <td><strong>${tenant.total_leads}</strong> leads</td>
                    <td>${statusBadge}</td>
                `;

                tr.addEventListener('click', () => {
                    loadTenantDetails(tenant.id_empresa, tenant.nome, tenant.email);
                });

                tbody.appendChild(tr);
            });

        } catch (e) {
            console.error(e);
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 24px; color: red;">Erro ao carregar lista. Verifique a chave na Vercel.</td></tr>';
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
        
        if(adminChartInstance) adminChartInstance.destroy();
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

    // 7. Cadastrar Cliente via API
    document.getElementById('form-create-tenant').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('btn-submit-tenant');
        const msg = document.getElementById('tenant-msg');
        
        btn.disabled = true;
        btn.textContent = 'Criando ambiente...';
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
                msg.textContent = '✅ Cliente cadastrado com sucesso! Já pode acessar o CRM.';
                document.getElementById('form-create-tenant').reset();
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
            btn.textContent = 'Criar Cliente no Sistema';
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
