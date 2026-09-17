const fs = require('fs');
let css = fs.readFileSync('style.css', 'utf8');

const desktopCss = `
/* ==========================================================================
   DESKTOP CHAT LAYOUT (Conversas CRM)
   ========================================================================== */
@media (min-width: 992px) {
    /* Hide iPhone Mockup */
    .mockup-overlay {
        display: none !important;
    }
    .iphone-mockup-wrapper {
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        transform: none !important;
        left: auto !important;
        position: static !important;
    }
    .mockup-container {
        padding: 0 16px 16px 16px !important;
    }
    
    /* Full Screen Chat */
    .mockup-screen {
        position: static !important;
        width: 100% !important;
        height: 100% !important;
        border-radius: 12px !important;
        box-shadow: var(--shadow-card) !important;
        border: 1px solid var(--color-border) !important;
    }

    /* Adjust Chat Header for Desktop */
    .mockup-screen > div:first-child {
        background: #fff !important;
        color: var(--color-text-main) !important;
        padding: 16px 24px !important;
        border-bottom: 1px solid var(--color-border) !important;
        box-shadow: none !important;
    }
    .mockup-screen > div:first-child i.ph-arrow-left {
        display: none !important;
    }
    #chat-header-name {
        font-size: 16px !important;
        font-weight: 600 !important;
        color: var(--color-text-main) !important;
    }
    #chat-header-status {
        color: var(--color-success) !important;
    }
    
    /* Botões Intervenção Desktop */
    .bot-toggle-container {
        display: none !important; /* Esconde switch original no desktop */
    }
    .desktop-bot-actions {
        display: flex !important;
        gap: 12px;
        align-items: center;
    }
    
    /* Background Pattern for Chat Area */
    #chat-messages-container {
        background-color: #f0f2f5 !important; /* WhatsApp Web BG */
        background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png') !important;
        padding: 24px !important;
    }

    /* Fake input container to look like WhatsApp Web */
    .fake-chat-input-container {
        background: #f0f2f5 !important;
        padding: 12px 24px !important;
        border-top: none !important;
    }
    .fake-chat-input {
        background: #fff !important;
        border: none !important;
        border-radius: 8px !important;
        padding: 12px 16px !important;
        box-shadow: 0 1px 1px rgba(0,0,0,0.05) !important;
    }
    #btn-send-message {
        width: 40px !important;
        height: 40px !important;
        background: var(--color-task-green) !important;
    }
    #btn-send-message i {
        font-size: 20px !important;
    }
    
    /* Chat Contact Items (Left List) */
    .chat-contact-item {
        background: #fff;
        border-radius: 12px;
        margin: 8px 16px;
        border: 1px solid var(--color-border) !important;
        box-shadow: 0 1px 2px rgba(0,0,0,0.02);
    }
    .chat-contact-item:hover {
        background: var(--color-bg-main) !important;
    }
    
    /* Hide Hint Box */
    .hint-box {
        display: none !important;
    }
}

/* Chat message bubbles styles */
.msg-bubble-client {
    align-self: flex-start;
    background: #fff;
    padding: 8px 12px;
    border-radius: 0 12px 12px 12px;
    max-width: 80%;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    margin-bottom: 12px;
    position: relative;
}
.msg-bubble-ia {
    align-self: flex-end;
    background: var(--color-task-green-light);
    padding: 8px 12px;
    border-radius: 12px 0 12px 12px;
    max-width: 80%;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    margin-bottom: 12px;
    position: relative;
    border: 1px solid rgba(0,0,0,0.05);
}

.desktop-bot-actions {
    display: none; /* hidden on mobile by default */
}
.btn-intervencao {
    background: #0f5b46;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 6px 16px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
}
.btn-intervencao:hover {
    background: #0c4d3b;
}
.btn-ativacao {
    background: white;
    color: #0f5b46;
    border: 1px solid #0f5b46;
    border-radius: 6px;
    padding: 6px 16px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
}
.btn-ativacao:hover {
    background: #f0fdf4;
}

`;

if (!css.includes('DESKTOP CHAT LAYOUT')) {
    fs.writeFileSync('style.css', css + desktopCss);
}
