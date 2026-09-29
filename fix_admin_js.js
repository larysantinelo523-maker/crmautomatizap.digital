const fs = require('fs');
let js = fs.readFileSync('admin.js', 'utf8');

const targetStr = `        renderConfigDias(horarios || []);\r\n    }`;
const targetStr2 = `        renderConfigDias(horarios || []);\n    }`;

const replaceStr = `        renderConfigDias(horarios || []);

        // Fetch Correções Solicitadas
        const cardsContainer = document.getElementById('correcoes-cards-container');
        if (cardsContainer) {
            cardsContainer.innerHTML = '<div style="text-align: center; color: var(--color-text-mut); padding: 24px; font-size: 13px;">Carregando correções...</div>';
            supabase.from('reportes_agente').select('*').eq('id_empresa', id).order('criado_em', { ascending: false }).then(({ data, error }) => {
                if (error || !data || data.length === 0) {
                    cardsContainer.innerHTML = '<div style="text-align: center; color: var(--color-text-mut); padding: 24px; font-size: 13px;">Nenhuma correção solicitada</div>';
                } else {
                    cardsContainer.innerHTML = '';
                    data.forEach(rep => {
                        const dt = new Date(rep.criado_em);
                        const dateStr = dt.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) + ' às ' + dt.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
                        
                        const card = document.createElement('div');
                        card.style.cssText = 'background: #fff; border: 1px solid var(--color-border); border-radius: 8px; padding: 16px; margin-bottom: 8px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);';
                        
                        let motivoColor = 'var(--color-primary)';
                        let motivoBg = 'var(--color-primary-light)';
                        if (rep.motivo_principal && rep.motivo_principal.includes('errado')) {
                            motivoColor = '#DC2626';
                            motivoBg = '#FEE2E2';
                        } else if (rep.motivo_principal && rep.motivo_principal.includes('esqueceu')) {
                            motivoColor = '#D97706';
                            motivoBg = '#FEF3C7';
                        }

                        card.innerHTML = \`
                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <span style="background: \${motivoBg}; color: \${motivoColor}; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
                                    \${rep.motivo_principal || 'Outros'}
                                </span>
                                <span style="font-size: 12px; color: var(--color-text-mut);">\${dateStr}</span>
                            </div>
                            <p style="margin: 0; font-size: 13.5px; color: var(--color-text-main); line-height: 1.4;">
                                \${rep.descricao_detalhada || 'Sem descrição'}
                            </p>
                        \`;
                        cardsContainer.appendChild(card);
                    });
                }
            });
        }
    }`;

if (js.includes(targetStr)) {
    js = js.replace(targetStr, replaceStr);
    fs.writeFileSync('admin.js', js);
    console.log('Injected fetch logic');
} else if (js.includes(targetStr2)) {
    js = js.replace(targetStr2, replaceStr);
    fs.writeFileSync('admin.js', js);
    console.log('Injected fetch logic (LF)');
} else {
    console.log('Target string not found in admin.js');
}
