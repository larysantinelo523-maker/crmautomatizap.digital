const fs = require('fs');
let html = fs.readFileSync('admin.html', 'utf8');

// Replace td:nth-child(6) with td:nth-child(5)
html = html.replace(/\.admin-table td:nth-child\(6\) \{/g, '.admin-table td:nth-child(5) {');
html = html.replace(/\.admin-table td:nth-child\(6\) \.btn-copy-id/g, '.admin-table td:nth-child(5) .btn-copy-id'); // Wait, API is now 6, so this should remain 6 or be changed from 7!

// In the old layout, API was 7. So btn-copy-id was in 7?
// Let's check what was in the original: 
// .admin-table td:nth-child(6) .btn-copy-id { ... } -> wait, in the dump, it was nth-child(6) .btn-copy-id !
// Why 6? Maybe because status was 5? No, old columns:
// 1. Empresa, 2. Email, 3. Venc, 4. Dias, 5. Leads, 6. Status, 7. API
// If btn-copy-id was on 6, that was Status? No, wait! The dump said:
// '.admin-table td:nth-child(6) .btn-copy-id {' 
// But btn-copy-id is for the API key! So maybe the previous developer had a bug and put 6 instead of 7?
// Yes, or maybe it was 6 because they changed the columns before.

// Let's just fix everything by doing a clean replace for the structural CSS of columns 5 and 6.
// I will just use regex to replace all nth-child(5), (6), (7) blocks and redefine them properly.

const regexNth5 = /\.admin-table td:nth-child\(5\) \{[\s\S]*?\}/;
const regexNth6 = /\.admin-table td:nth-child\(6\) \{[\s\S]*?\}/;
const regexNth6Btn = /\.admin-table td:nth-child\(6\) \.btn-copy-id \{[\s\S]*?\}/;
const regexNth7 = /\.admin-table td:nth-child\(7\) \{[\s\S]*?\}/;

html = html.replace(regexNth5, '');
html = html.replace(regexNth6, '');
html = html.replace(regexNth6Btn, '');
html = html.replace(regexNth7, '');

// Now inject the proper ones before </style>
const injection = `
                                    .admin-table td:nth-child(5) {
                                        position: static !important;
                                        width: 100% !important;
                                        margin: 0 !important;
                                        padding: 6px 0 !important;
                                        border-radius: 0 !important;
                                        display: flex !important;
                                        justify-content: space-between !important;
                                        align-items: center !important;
                                        overflow: visible !important;
                                        border-top: 1px solid var(--color-border);
                                        padding-top: 12px !important;
                                        margin-top: 6px !important;
                                    }
                                    .admin-table td:nth-child(6) {
                                        display: flex;
                                        justify-content: space-between;
                                        align-items: center;
                                        padding-top: 12px;
                                    }
                                    .admin-table td:nth-child(6) .btn-copy-id {
                                        position: relative !important;
                                        right: auto !important;
                                    }
`;
html = html.replace('</style>', injection + '\n</style>');

fs.writeFileSync('admin.html', html);
console.log('Mobile nth-child structural CSS fixed');
