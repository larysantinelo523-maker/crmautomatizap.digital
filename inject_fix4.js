const fs = require('fs');
let html = fs.readFileSync('conversas.html', 'utf8');

// Ensure main-content is strictly 100dvh so that it doesn't stretch infinitely,
// which is required for flex scrolling to work properly without pushing the footer out of view.
html = html.replace(
    /body\.mobile-chat-active \.main-content \{ padding-bottom: 0 !important; \}/,
    `body.mobile-chat-active .main-content { padding-bottom: 0 !important; height: 100dvh !important; max-height: 100dvh !important; overflow: hidden; }`
);

fs.writeFileSync('conversas.html', html);
console.log("Fixed main-content constraint");
