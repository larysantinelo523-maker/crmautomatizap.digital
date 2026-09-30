const fs = require('fs');
let html = fs.readFileSync('admin.html', 'utf8');

// 1. Remove the globally injected pseudo-elements and structural CSS I added earlier.
const regexInjected = /\.admin-table td:nth-child\(2\)::before \{ content: "Email responsável"; \}[\s\S]*?right: auto !important;\s*\}/g;
html = html.replace(regexInjected, '');

// 2. Look for any remaining nth-child(5) or (6) that has space-between and remove it from desktop.
// Actually, let's just add desktop-specific CSS to force left alignment and no-wrap for all td's.
const desktopCssFix = `
@media (min-width: 769px) {
    .admin-table td {
        white-space: nowrap !important;
        justify-content: flex-start !important;
    }
    .admin-table td:nth-child(5),
    .admin-table td:nth-child(6) {
        display: flex !important;
        justify-content: flex-start !important;
        padding-top: 16px !important;
        margin-top: 0 !important;
        border-top: none !important;
    }
    .admin-table td::before {
        display: none !important;
    }
}

@media (max-width: 768px) {
    .admin-table td:nth-child(2)::before { content: "Email responsável"; }
    .admin-table td:nth-child(3)::before { content: "Vencimento"; }
    .admin-table td:nth-child(4)::before { content: "Valor Cobrado"; }
    .admin-table td:nth-child(5)::before { content: "Status" !important; display: block !important; }
    .admin-table td:nth-child(6)::before { content: "API"; }
    
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
}
`;

// Insert before </style>
html = html.replace('</style>', desktopCssFix + '\n</style>');

// Also update the grid-template-columns to give enough space to email and others so they don't overlap if nowrap is applied.
// Currently it is: grid-template-columns: 1.5fr 1.5fr 1fr 1fr 1fr 1.2fr;
// To make it equal spacing without breaking, maybe we use minmax for everything.
// Let's change to: grid-template-columns: minmax(140px, 1.5fr) minmax(200px, 2fr) minmax(120px, 1.2fr) minmax(120px, 1.2fr) minmax(100px, 1fr) minmax(140px, 1.5fr);
const newGrid = 'grid-template-columns: minmax(140px, 1.5fr) minmax(180px, 2fr) minmax(110px, 1.2fr) minmax(110px, 1.2fr) minmax(100px, 1fr) minmax(140px, 1.5fr);';
html = html.replace(/grid-template-columns:[^;]+;/g, newGrid);

fs.writeFileSync('admin.html', html);
console.log('Fixed CSS layout');
