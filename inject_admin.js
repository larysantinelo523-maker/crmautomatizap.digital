const fs = require('fs');
let html = fs.readFileSync('admin.html', 'utf8');

const replacement = `</div></div><div class="card" style="margin-top: 24px;"><div class="card-title" style="margin-bottom: 16px;"><i class="ph-fill ph-warning-circle text-primary"></i><h3>Correções Solicitadas pelo Usuário</h3></div><div class="table-responsive"><table class="table"><thead><tr><th>Data/Hora</th><th>Motivo Principal</th><th>Descrição do Problema</th></tr></thead><tbody id="table-correcoes-body"><tr><td colspan="3" style="text-align: center; color: var(--color-text-mut);">Carregando correções...</td></tr></tbody></table></div></div></section>`;

html = html.replace(/<\/div>\s*<\/div>\s*<\/section>/, replacement);
fs.writeFileSync('admin.html', html);
console.log('success inject admin.html');
