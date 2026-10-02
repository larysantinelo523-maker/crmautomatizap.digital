const fs = require('fs');
let html = fs.readFileSync('conversas.html', 'utf8');

// Ensure chat-card has no bottom margin and the virtual keyboard has no padding when closed
html = html.replace(
    /body\.mobile-chat-active \.chat-card \{/g,
    `body.mobile-chat-active .chat-card {\n            margin-bottom: 0 !important;`
);

html = html.replace(
    /#virtual-keyboard-container \{[\s\S]*?visibility: hidden;\s*\}/,
    `#virtual-keyboard-container {
        flex-shrink: 0;
        background-color: #D1D5DB;
        padding: 0 !important;
        display: flex;
        flex-direction: column;
        gap: 0;
        z-index: 99999;
        height: 0;
        transition: height 0.25s ease-out, padding 0.25s ease-out;
        user-select: none;
        -webkit-user-select: none;
        visibility: hidden;
    }`
);

html = html.replace(
    /#virtual-keyboard-container\.vk-open \{[\s\S]*?visibility: visible;\s*\}/,
    `#virtual-keyboard-container.vk-open {
        height: 260px;
        padding: 8px 4px 20px 4px !important;
        gap: 6px;
        visibility: visible;
    }`
);

fs.writeFileSync('conversas.html', html);
console.log("Fixed bottom gap and keyboard padding");
