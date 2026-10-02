const fs = require('fs');
let html = fs.readFileSync('conversas.html', 'utf8');

// Replace the buggy layout forcing height: 100vh on the grid
const badLayoutStr = `body.mobile-chat-active .chat-right-wrapper { display: flex !important; width: 100%; height: 100%; flex: 1; padding: 0 !important; }
        body.mobile-chat-active .chat-layout { height: 100vh !important; }
        body.mobile-chat-active .dashboard-grid { min-height: 100vh !important; }`;

const newLayoutStr = `body.mobile-chat-active .chat-right-wrapper { display: flex !important; width: 100%; flex: 1; padding: 0 16px 0 16px !important; }`;

html = html.replace(badLayoutStr, newLayoutStr);

// Also remove height: 100vh !important from main-content, keep it natural so header isn't ignored
html = html.replace(
    /body\.mobile-chat-active \.main-content \{ padding-bottom: 0 !important; height: 100vh !important; \}/g,
    `body.mobile-chat-active .main-content { padding-bottom: 0 !important; }`
);

fs.writeFileSync('conversas.html', html);
console.log("Fixed margins and height");
