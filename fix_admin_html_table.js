const fs = require('fs');
let html = fs.readFileSync('admin.html', 'utf8');

// 1. Change grid columns
html = html.replace(
    /grid-template-columns: minmax\(140px, 1\.5fr\) minmax\(160px, 1\.5fr\) minmax\(100px, 1fr\) minmax\(100px, 1fr\) minmax\(90px, 0\.8fr\) minmax\(90px, 0\.8fr\) minmax\(140px, 1\.2fr\);/g,
    'grid-template-columns: repeat(6, 1fr);'
);

// 2. Change Mobile pseudo headers
const oldMobilePseudo = `.admin-table td:nth-child(4)::before {
                                        content: "Dias Restantes";
                                    }

                                    .admin-table td:nth-child(5)::before {
                                        content: "Total de Leads";
                                    }

                                    .admin-table td:nth-child(6)::before {
                                        content: "Status" !important;
                                        display: block !important;
                                    }

                                    .admin-table td:nth-child(7)::before {
                                        content: "Chave de API";
                                    }`;

const newMobilePseudo = `.admin-table td:nth-child(4)::before {
                                        content: "Mensalidade";
                                    }

                                    .admin-table td:nth-child(5)::before {
                                        content: "Status" !important;
                                        display: block !important;
                                    }

                                    .admin-table td:nth-child(6)::before {
                                        content: "Chave de API";
                                    }`;

// Normalize spaces for replacement
html = html.replace(new RegExp(oldMobilePseudo.replace(/\\s+/g, '\\\\s+')), newMobilePseudo);

// 3. Update flex containers in mobile
html = html.replace(/\.admin-table td:nth-child\(6\) \{[\s\S]*?position: static !important;[\s\S]*?\}/, 
    `.admin-table td:nth-child(5) {
                                        position: static !important;
                                        width: 100% !important;
                                        margin: 0 !important;
                                        padding: 6px 0 !important;
                                        border-radius: 0 !important;
                                        display: flex !important;
                                        justify-content: space-between !important;
                                        align-items: center !important;
                                        overflow: visible !important;
                                    }`);

html = html.replace(/\.admin-table td:nth-child\(7\) \{[\s\S]*?display: flex;[\s\S]*?justify-content: space-between;[\s\S]*?\}/, 
    `.admin-table td:nth-child(6) {
                                        display: flex;
                                        justify-content: space-between;
                                        align-items: center;
                                        border-top: 1px solid var(--color-border);
                                        padding-top: 12px;
                                        margin-top: 6px;
                                    }`);
html = html.replace(/\.admin-table td:nth-child\(7\) \.btn-copy-id/g, '.admin-table td:nth-child(6) .btn-copy-id');

// 4. Update table headers
const oldHeaders = `<th>Empresa</th>
                                        <th>Email Responsável</th>
                                        <th>Data de Vencimento</th>
                                        <th>Dias Restantes</th>
                                        <th>Total de Leads</th>
                                        <th>Status</th>
                                        <th>Chave de API</th>`;
const newHeaders = `<th>Empresa</th>
                                        <th>Email Responsável</th>
                                        <th>Data de Vencimento</th>
                                        <th>Mensalidade</th>
                                        <th>Status</th>
                                        <th>Chave de API</th>`;

html = html.replace(new RegExp(oldHeaders.replace(/\\s+/g, '\\\\s+')), newHeaders);

// And update colspan for loading from 7 to 6 (it was 6 actually, I'll change it to 6)
html = html.replace('<td colspan="6" style="text-align: center; padding: 24px;">Carregando', '<td colspan="6" style="text-align: center; padding: 24px;">Carregando');


fs.writeFileSync('admin.html', html);
console.log('admin.html updated');
