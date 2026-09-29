const fs = require('fs');
let html = fs.readFileSync('admin.html', 'utf8');

const tableHtml = `
                            <!-- Correções Solicitadas -->
                            <div style="margin-top: 24px; border-top: 1px solid var(--color-border); padding-top: 24px;">
                                <div class="card-title" style="margin-bottom: 16px;">
                                    <i class="ph-fill ph-warning-circle text-primary"></i>
                                    <h3 style="font-size: 15px;">Correções Solicitadas pelo Usuário</h3>
                                </div>
                                <div class="table-responsive">
                                    <table class="table">
                                        <thead>
                                            <tr>
                                                <th>Data/Hora</th>
                                                <th>Motivo Principal</th>
                                                <th>Descrição do Problema</th>
                                            </tr>
                                        </thead>
                                        <tbody id="table-correcoes-body">
                                            <tr><td colspan="3" style="text-align: center; color: var(--color-text-mut);">Carregando correções...</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>`;

const insertionPointRegex = /<\/div>\s*<\/div>\s*<\/div>\s*<!-- Right -->/m;

if (insertionPointRegex.test(html)) {
    html = html.replace(insertionPointRegex, `</div></div>${tableHtml}</div><!-- Right -->`);
    fs.writeFileSync('admin.html', html);
    console.log('Injected successfully');
} else {
    console.log('Regex did not match');
}
