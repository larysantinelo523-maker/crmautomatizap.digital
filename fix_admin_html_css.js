const fs = require('fs');
let html = fs.readFileSync('admin.html', 'utf8');

// Replace grid-template-columns in desktop view
html = html.replace(/grid-template-columns:\s*repeat\(6,\s*1fr\);/g, 'grid-template-columns: 1.5fr 1.5fr 1fr 1fr 1fr 1.2fr;');

// Replace mobile pseudo elements
// First, remove the old nth-child(2) to nth-child(7) blocks to clean up
const regexMobileBefore = /\.admin-table\s+td:nth-child\(\d+\)::before\s*\{[\s\S]*?\}/g;
html = html.replace(regexMobileBefore, '');

// There is also some nth-child(5) and nth-child(6) without ::before that we should clean or adjust.
// Let's just adjust the HTML safely by finding the @media (max-width: 768px) block or similar.
// Wait, the easiest way is to inject the new pseudo-elements right before `</style>`.
const injection = `
                                    .admin-table td:nth-child(2)::before { content: "Email responsável"; }
                                    .admin-table td:nth-child(3)::before { content: "Vencimento"; }
                                    .admin-table td:nth-child(4)::before { content: "Valor Cobrado"; }
                                    .admin-table td:nth-child(5)::before { content: "Status" !important; display: block !important; }
                                    .admin-table td:nth-child(6)::before { content: "API"; }
`;
html = html.replace('</style>', injection + '\n</style>');

fs.writeFileSync('admin.html', html);
console.log('CSS updated successfully');
