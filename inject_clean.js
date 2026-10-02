const fs = require('fs');
let html = fs.readFileSync('conversas.html', 'utf8');

const injection = `
<!-- FIX MOBILE KEYBOARD CHAT LAYOUT -->
<script>
    document.addEventListener('DOMContentLoaded', () => {
        if (window.innerWidth <= 768) {
            let maxViewportHeight = window.screen.availHeight || window.innerHeight;
            if (window.visualViewport) maxViewportHeight = Math.max(maxViewportHeight, window.visualViewport.height);
            
            const setViewport = () => {
                const currentHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
                if (currentHeight > maxViewportHeight) {
                    maxViewportHeight = currentHeight;
                }
                
                document.documentElement.style.setProperty('--vvh', currentHeight + 'px');
                
                const isKeyboardOpen = currentHeight < (maxViewportHeight * 0.85);
                
                if (isKeyboardOpen) {
                    if (!document.body.classList.contains('keyboard-open')) {
                        document.body.classList.add('keyboard-open');
                        setTimeout(() => {
                            window.scrollTo(0, 0);
                            const container = document.getElementById('chat-messages-container');
                            if (container) container.scrollTop = container.scrollHeight;
                        }, 100);
                    }
                } else {
                    document.body.classList.remove('keyboard-open');
                }
            };
            
            if (window.visualViewport) {
                window.visualViewport.addEventListener('resize', setViewport);
                window.visualViewport.addEventListener('scroll', setViewport);
            }
            window.addEventListener('resize', setViewport);
            setViewport();
            
            const input = document.getElementById('real-chat-input');
            if (input) {
                input.addEventListener('focus', () => {
                    setTimeout(() => window.scrollTo(0, 0), 100);
                    setTimeout(setViewport, 300);
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

        #real-chat-input {
            font-size: 16px !important;
        }
        
        #chat-messages-container {
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
        }

        .chat-left-sidebar {
            height: auto !important;
        }
        #contact-list-container {
            overflow: visible !important;
            flex: none !important;
        }

        body.keyboard-open {
            height: var(--vvh) !important;
            min-height: var(--vvh) !important;
            overflow: hidden !important;
            width: 100% !important;
            display: flex !important;
            flex-direction: column !important;
        }

        body.keyboard-open .layout {
            display: flex !important;
            flex-direction: column !important;
            flex: 1 !important;
            min-height: 0 !important;
            width: 100% !important;
            height: 100% !important;
        }

        body.keyboard-open .main-content {
            flex: 1 !important;
            min-height: 0 !important;
            height: 100% !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            padding-bottom: 0 !important;
        }

        body.keyboard-open .dashboard-grid.chat-layout {
            flex: 1 !important;
            min-height: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            overflow: hidden !important;
            padding: 0 !important;
        }

        body.keyboard-open .chat-right-wrapper {
            flex: 1 !important;
            min-height: 0 !important;
            height: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            padding: 0 !important;
        }

        body.keyboard-open .chat-card {
            flex: 1 !important;
            min-height: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            margin: 0 !important;
            border-radius: 0 !important;
        }

        body.keyboard-open #chat-messages-container {
            flex: 1 !important;
            min-height: 0 !important;
            overflow-y: auto !important;
            padding: 12px !important;
            pointer-events: auto !important;
        }

        body.keyboard-open .sidebar,
        body.keyboard-open .sidebar-nav,
        body.keyboard-open .glass-bubble,
        body.keyboard-open .mobile-page-header,
        body.keyboard-open .chat-left-sidebar {
            display: none !important;
        }
    }
</style>
</body>`;

const startIndex = html.indexOf('<!-- FIX MOBILE KEYBOARD CHAT LAYOUT -->');
if(startIndex !== -1) {
    const startStr = html.substring(0, startIndex);
    fs.writeFileSync('conversas.html', startStr + injection + '\n</html>');
}
