const fs = require('fs');
let html = fs.readFileSync('admin.html', 'utf8');

const regexInjected1 = /@media\s*\(min-width:\s*769px\)\s*\{\s*\.admin-table\s*td\s*\{\s*white-space:\s*nowrap\s*!important;[\s\S]*?\s*\}\s*\}/g;
const regexInjected2 = /@media\s*\(max-width:\s*768px\)\s*\{\s*\.admin-table\s*td:nth-child\(2\)::before[\s\S]*?right:\s*auto\s*!important;\s*\}\s*\}/g;

html = html.replace(regexInjected1, '');
html = html.replace(regexInjected2, '');

const finalCss = `
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
                                        content: none !important;
                                    }
                                }

                                @media (max-width: 768px) {
                                    .admin-table td:nth-child(2)::before { content: "Email responsável"; display: block !important; }
                                    .admin-table td:nth-child(3)::before { content: "Vencimento"; display: block !important; }
                                    .admin-table td:nth-child(4)::before { content: "Valor Cobrado"; display: block !important; }
                                    .admin-table td:nth-child(5)::before { content: "Status" !important; display: block !important; }
                                    .admin-table td:nth-child(6)::before { content: "API"; display: block !important; }
                                    
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

// Also clean up the empty @media (max-width: 768px) that might be lingering.
html = html.replace(/@media\s*\(max-width:\s*768px\)\s*\{\s*\.admin-table\s*td:nth-child\(5\)[\s\S]*?right:\s*auto\s*!important;\s*\}\s*\}/g, '');

const targetStr = '</style>\r\n                            <table class="data-table admin-table">';
const targetStr2 = '</style>\n                            <table class="data-table admin-table">';
const targetStr3 = /<\/style>\s*<table class="data-table admin-table">/;

if (html.match(targetStr3)) {
    html = html.replace(targetStr3, finalCss + '\n</style>\n                            <table class="data-table admin-table">');
} else {
    // just put it at the very last </style>
    const parts = html.split('</style>');
    if (parts.length > 1) {
        const lastPart = parts.pop();
        html = parts.join('</style>') + finalCss + '\n</style>' + lastPart;
    }
}

// Ensure the grid columns are correct
const newGrid = 'grid-template-columns: minmax(140px, 1.5fr) minmax(180px, 2fr) minmax(110px, 1.2fr) minmax(110px, 1.2fr) minmax(100px, 1fr) minmax(140px, 1.5fr);';
html = html.replace(/grid-template-columns:[^;]+;/g, newGrid);

fs.writeFileSync('admin.html', html);
console.log('Final precise CSS replacement done');
