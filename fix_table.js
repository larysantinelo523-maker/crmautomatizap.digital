const fs = require('fs');
let html = fs.readFileSync('admin.html', 'utf8');

// The badly formatted string that was injected
const badString = `</div></div><div class="card" style="margin-top: 24px;"><div class="card-title" style="margin-bottom: 16px;"><i class="ph-fill ph-warning-circle text-primary"></i><h3>Correções Solicitadas pelo Usuário</h3></div><div class="table-responsive"><table class="table"><thead><tr><th>Data/Hora</th><th>Motivo Principal</th><th>Descrição do Problema</th></tr></thead><tbody id="table-correcoes-body"><tr><td colspan="3" style="text-align: center; color: var(--color-text-mut);">Carregando correções...</td></tr></tbody></table></div></div></section>`;

if (html.includes(badString)) {
    // Revert the bad injection
    html = html.replace(badString, '</div></div></section>');
    console.log('Removed bad string');
}

// Now inject correctly right after the Horarios card
const targetBlock = `                                <div id="horarios-list" style="display: flex; flex-direction: column; gap: 12px;">
                                    <!-- JS vai inserir aqui -->
                                </div>
                            </div>`;

const newTable = `                                <div id="horarios-list" style="display: flex; flex-direction: column; gap: 12px;">
                                    <!-- JS vai inserir aqui -->
                                </div>
                            </div>
                            
                            <!-- Correções Solicitadas -->
                            <div class="card" style="margin-top: 24px;">
                                <div class="card-title" style="margin-bottom: 16px;">
                                    <i class="ph-fill ph-warning-circle text-primary"></i>
                                    <h3>Correções Solicitadas pelo Usuário</h3>
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

if (!html.includes('id="table-correcoes-body"')) {
    html = html.replace(targetBlock, newTable);
    fs.writeFileSync('admin.html', html);
    console.log('Injected table in the correct location.');
} else {
    fs.writeFileSync('admin.html', html);
    console.log('File written, table already exists or was fixed.');
}
