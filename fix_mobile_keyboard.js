const fs = require('fs');
const file = 'conversas.html';
let html = fs.readFileSync(file, 'utf8');

const injection = `
<!-- FIX MOBILE KEYBOARD CHAT LAYOUT -->
<script>
    document.addEventListener('DOMContentLoaded', () => {
        if (window.innerWidth <= 768 && window.visualViewport) {
            const setViewport = () => {
                document.documentElement.style.setProperty('--vvh', window.visualViewport.height + 'px');
                
                if (window.visualViewport.height < window.innerHeight - 50) {
                    document.body.classList.add('keyboard-open');
                    setTimeout(() => {
                        const container = document.getElementById('chat-messages-container');
                        if (container) container.scrollTop = container.scrollHeight;
                        window.scrollTo(0, 0);
                    }, 50);
                } else {
                    document.body.classList.remove('keyboard-open');
                }
            };
            
            window.visualViewport.addEventListener('resize', setViewport);
            window.visualViewport.addEventListener('scroll', setViewport);
            setViewport();
            
            const input = document.getElementById('real-chat-input');
            if (input) {
                input.addEventListener('focus', () => {
                    setTimeout(() => window.scrollTo(0, 0), 100);
                });
            }
        }
    });
</script>
<style>
    @media (max-width: 768px) {
        :root {
            --vvh: 100dvh;
        }

        body {
            height: var(--vvh) !important;
            min-height: var(--vvh) !important;
            overflow: hidden !important;
            position: fixed;
            width: 100%;
            display: flex;
            flex-direction: column;
        }

        #app-container {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-height: 0;
            width: 100%;
        }

        .main-content {
            flex: 1 !important;
            min-height: 0 !important;
            height: 100% !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            padding-bottom: 70px !important;
        }

        .dashboard-grid.chat-layout {
            flex: 1 !important;
            min-height: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            overflow: hidden !important;
        }

        .chat-right-wrapper {
            flex: 1 !important;
            min-height: 0 !important;
            height: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            padding: 8px !important;
        }
        
        .chat-left-sidebar {
            flex-shrink: 0;
            max-height: 180px !important;
        }

        .chat-card {
            flex: 1 !important;
            min-height: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            margin: 0 !important;
        }

        #chat-messages-container {
            overscroll-behavior: contain;
            flex: 1 !important;
            min-height: 0 !important;
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch;
        }
        
        #real-chat-input {
            font-size: 16px !important;
        }

        body.keyboard-open .sidebar,
        body.keyboard-open .sidebar-nav,
        body.keyboard-open .glass-bubble {
            display: none !important;
        }

        body.keyboard-open .main-content {
            padding-bottom: 0 !important;
        }

        body.keyboard-open .mobile-page-header,
        body.keyboard-open .chat-left-sidebar,
        body.keyboard-open .header,
        body.keyboard-open .hint-box {
            display: none !important;
        }
    }
</style>
</body>`;

if (!html.includes('<!-- FIX MOBILE KEYBOARD CHAT LAYOUT -->')) {
    html = html.replace('</body>', injection);
    fs.writeFileSync(file, html);
    console.log('Injected mobile layout fix');
} else {
    console.log('Already injected');
}
