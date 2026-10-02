const fs = require('fs');
let html = fs.readFileSync('conversas.html', 'utf8');

// Add border-radius to the chat card to make the margins look good
const newStyles = `body.mobile-chat-active .chat-card {
            position: relative; /* Para ancorar o teclado absoluto dentro dela */
            border-radius: 12px 12px 0 0 !important;
            border-left: 1px solid var(--color-border) !important;
            border-right: 1px solid var(--color-border) !important;
            border-top: 1px solid var(--color-border) !important;
        }`;

html = html.replace(
    /\.chat-card \{\s*position: relative; \/\* Para ancorar o teclado absoluto dentro dela \*\/\s*\}/,
    newStyles
);

fs.writeFileSync('conversas.html', html);
console.log("Added border-radius to chat card");
