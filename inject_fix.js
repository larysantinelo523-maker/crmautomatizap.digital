const fs = require('fs');
let html = fs.readFileSync('conversas.html', 'utf8');

// 1. Fix Navigation & Full Screen
html = html.replace(
    /body\.mobile-chat-active \.chat-left-sidebar \{ display: none !important; \}/,
    `body.mobile-chat-active .chat-left-sidebar { display: none !important; }\n        body.mobile-chat-active .sidebar { display: none !important; }\n        body.mobile-chat-active .main-content { padding-bottom: 0 !important; height: 100vh !important; }`
);

// Also ensure chat-left-sidebar is visible when NOT active
html = html.replace(
    /\.chat-left-sidebar \{ display: flex !important; \}/,
    `.chat-left-sidebar { display: flex !important; flex-direction: column !important; flex: 1 !important; height: auto !important; }`
);

html = html.replace(
    /\.chat-right-wrapper \{ display: none !important; \}/,
    `.chat-right-wrapper { display: none !important; }`
);

// 2. Fix Keyboard Overlapping Input (Switch from absolute to flex child)
html = html.replace(
    /#virtual-keyboard-container \{\s*position: absolute;\s*bottom: 0;\s*left: 0;\s*width: 100%;\s*background-color: #D1D5DB;\s*padding: 8px 4px 20px 4px; \/\* padding-bottom extra para iPhone\/Android edge \*\/\s*display: flex;\s*flex-direction: column;\s*gap: 6px;\s*z-index: 99999;\s*transform: translateY\(100%\);\s*transition: transform 0\.25s ease-out;\s*user-select: none;\s*-webkit-user-select: none;\s*visibility: hidden; \/\* Evita focar enquanto invis.*?vel \*\/\s*\}/,
    `#virtual-keyboard-container {
        flex-shrink: 0;
        background-color: #D1D5DB;
        padding: 0 4px 0 4px; 
        display: flex;
        flex-direction: column;
        gap: 6px;
        z-index: 99999;
        height: 0;
        transition: height 0.25s ease-out, padding 0.25s ease-out;
        user-select: none;
        -webkit-user-select: none;
        visibility: hidden;
    }`
);

html = html.replace(
    /#virtual-keyboard-container\.vk-open \{\s*transform: translateY\(0\);\s*visibility: visible;\s*\}/,
    `#virtual-keyboard-container.vk-open {
        height: 260px;
        padding: 8px 4px 20px 4px;
        visibility: visible;
    }`
);

// Remove the obsolete padding-bottom on chat-messages-container
html = html.replace(
    /body\.virtual-keyboard-active #chat-messages-container \{\s*padding-bottom: 260px !important;.*?\n\s*\}/,
    ``
);

// Ensure the chat-card doesn't hide the input when flex grows
html = html.replace(
    /body\.mobile-chat-active \.chat-right-wrapper \{ display: flex !important; width: 100%; height: 100%; \}/,
    `body.mobile-chat-active .chat-right-wrapper { display: flex !important; width: 100%; height: 100%; flex: 1; padding: 0 !important; }
        body.mobile-chat-active .chat-layout { height: 100vh !important; }
        body.mobile-chat-active .dashboard-grid { min-height: 100vh !important; }`
);

fs.writeFileSync('conversas.html', html);
console.log("Fixed");
