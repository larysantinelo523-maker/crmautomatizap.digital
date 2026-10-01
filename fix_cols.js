const fs = require('fs');
let text = fs.readFileSync('style.css', 'utf8');

const target = `.data-table td:nth-child(2)::before {
        content: "Origem";
    }

    .data-table td:nth-child(3)::before {
        content: "Interesse";
    }

    .data-table td:nth-child(4)::before {
        content: "Status";
    }`;

const targetCRLF = target.replace(/\n/g, '\r\n');

const replacement = `.data-table td:nth-child(2)::before {
        content: "Interesse";
    }

    .data-table td:nth-child(3)::before {
        content: "Status";
    }

    .data-table td:nth-child(4)::before {
        content: "Lead criado em:";
    }`;
const replacementCRLF = replacement.replace(/\n/g, '\r\n');

text = text.replace(targetCRLF, replacementCRLF);
text = text.replace(target, replacementCRLF);

fs.writeFileSync('style.css', text);
console.log('Done!');
