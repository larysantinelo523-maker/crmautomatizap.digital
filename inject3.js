const fs = require('fs');
let js = fs.readFileSync('admin.js', 'utf8');

const target = `        renderConfigDias(horarios || []);
    }`;

const replacement = `        renderConfigDias(horarios || []);

        // Fetch Correções Solicitadas
        const tableCorrecoes = document.getElementById('table-correcoes-body');
        if (tableCorrecoes) {
            tableCorrecoes.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--color-text-mut);">Carregando correções...</td></tr>';
            supabase.from('reportes_agente').select('*').eq('id_empresa', id).order('criado_em', { ascending: false }).then(({ data, error }) => {
                if (error || !data || data.length === 0) {
                    tableCorrecoes.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--color-text-mut);">Nenhuma correção solicitada</td></tr>';
                } else {
                    tableCorrecoes.innerHTML = '';
                    data.forEach(rep => {
                        const tr = document.createElement('tr');
                        const dt = new Date(rep.criado_em);
                        const dateStr = dt.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) + ' às ' + dt.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
                        
                        tr.innerHTML = \`
                            <td style="font-size: 13px; color: var(--color-text-mut);">\${dateStr}</td>
                            <td style="font-weight: 500; color: var(--color-text-main);">\${rep.motivo_principal || 'Outros'}</td>
                            <td style="font-size: 13px; color: var(--color-text-main); white-space: pre-wrap;">\${rep.descricao_detalhada || 'Sem descrição'}</td>
                        \`;
                        tableCorrecoes.appendChild(tr);
                    });
                }
            });
        }
    }`;

js = js.replace(target, replacement);
fs.writeFileSync('admin.js', js);
console.log('injected fetching table correcoes');
