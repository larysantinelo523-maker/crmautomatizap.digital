import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Verificar se é Admin
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    const { data: userData } = await supabase
        .from('usuarios')
        .select('funcao')
        .eq('id', session.user.id)
        .single();

    if (!userData || userData.funcao !== 'admin_saas') {
        window.location.href = 'index.html'; // Não é admin master, volta pro CRM
        return;
    }

    // 2. Lógica de Navegação do Menu
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.admin-section');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');

    const sectionTitles = {
        'dashboard': { title: 'Visão Geral SaaS', sub: 'Acompanhe as métricas globais de todos os seus clientes.' },
        'cadastrar': { title: 'Cadastrar Cliente', sub: 'Crie um novo ambiente de CRM para um cliente.' },
        'configuracoes': { title: 'Configurações Master', sub: 'Gerencie a segurança da sua conta.' }
    };

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-target');
            
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            sections.forEach(s => s.style.display = 'none');
            document.getElementById('sec-' + target).style.display = 'block';

            pageTitle.textContent = sectionTitles[target].title;
            pageSubtitle.textContent = sectionTitles[target].sub;

            if (target === 'dashboard') loadStats();
        });
    });

    // 3. Logout
    document.getElementById('btn-logout').addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'login.html';
    });

    // 4. Carregar Métricas via API
    async function loadStats() {
        try {
            const res = await fetch('/api/get_stats');
            if (!res.ok) throw new Error("Erro na API");
            
            const stats = await res.json();
            document.getElementById('kpi-leads').textContent = stats.leads || 0;
            document.getElementById('kpi-empresas').textContent = stats.empresas || 0;
            document.getElementById('kpi-conversas').textContent = stats.conversas || 0;
        } catch (e) {
            console.error("Erro ao carregar estatísticas:", e);
            document.getElementById('kpi-leads').textContent = '-';
            document.getElementById('kpi-empresas').textContent = '-';
            document.getElementById('kpi-conversas').textContent = '-';
        }
    }

    // Carregar na tela inicial
    loadStats();

    // 5. Cadastrar Cliente via API
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
                msg.style.color = '#38bdf8';
                msg.textContent = '✅ Cliente cadastrado com sucesso! Já pode acessar o CRM.';
                document.getElementById('form-create-tenant').reset();
                loadStats(); // Atualiza contador de empresas
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

    // 6. Alterar Senha Master
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
