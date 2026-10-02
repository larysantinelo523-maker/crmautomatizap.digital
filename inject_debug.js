const fs = require('fs');
let html = fs.readFileSync('conversas.html', 'utf8');

const injection = `
<!-- FIX MOBILE KEYBOARD CHAT LAYOUT -->
<script>
    document.addEventListener('DOMContentLoaded', () => {
        if (window.innerWidth <= 768) {
            // DEBUG LABEL
            const debugLabel = document.createElement('div');
            debugLabel.id = 'kb-debug-label';
            debugLabel.style.position = 'fixed';
            debugLabel.style.top = '10px';
            debugLabel.style.right = '10px';
            debugLabel.style.background = 'rgba(0,0,0,0.8)';
            debugLabel.style.color = 'lime';
            debugLabel.style.padding = '5px 10px';
            debugLabel.style.fontSize = '12px';
            debugLabel.style.zIndex = '99999';
            debugLabel.style.pointerEvents = 'none';
            document.body.appendChild(debugLabel);

            let maxViewportHeight = window.innerHeight;
            if (window.visualViewport) maxViewportHeight = Math.max(maxViewportHeight, window.visualViewport.height);
            
            const setViewport = () => {
                const currentHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
                if (currentHeight > maxViewportHeight) {
                    maxViewportHeight = currentHeight;
                }
                
                document.documentElement.style.setProperty('--vvh', currentHeight + 'px');
                
                // If the current viewport is less than 85% of the max, the keyboard is likely open
                const isKeyboardOpen = currentHeight < (maxViewportHeight * 0.85);
                
                debugLabel.innerHTML = \`H: \${currentHeight} <br> Max: \${maxViewportHeight} <br> KB: \${isKeyboardOpen}\`;

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
                    setTimeout(setViewport, 300); // Força checagem depois de um tempinho
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

        /* Garante que a lista de contatos não tenha rolagem interna no mobile */
        .chat-left-sidebar {
            height: auto !important;
        }
        #contact-list-container {
            overflow: visible !important;
            flex: none !important;
        }

        /* SOMENTE quando o teclado abrir, aplicamos o travamento de tela e layout de app */
        body.keyboard-open {
            height: var(--vvh) !important;
            min-height: var(--vvh) !important;
            overflow: hidden !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            display: flex !important;
            flex-direction: column !important;
        }

        body.keyboard-open #app-container {
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
            padding: 0 !important; /* FORCA REMOCAO DE PADDING DO GRID */
        }

        body.keyboard-open .chat-right-wrapper {
            flex: 1 !important;
            min-height: 0 !important;
            height: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            padding: 0 !important; /* FORCA REMOCAO DO PADDING PRA CABER TUDO */
        }

        body.keyboard-open .chat-card {
            flex: 1 !important;
            min-height: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            margin: 0 !important;
            border-radius: 0 !important; /* Tira borda redonda pra parecer tela cheia */
        }

        body.keyboard-open #chat-messages-container {
            flex: 1 !important;
            min-height: 0 !important;
            overflow-y: auto !important;
            padding: 12px !important; /* padding interno menor */
        }

        /* Ocultar tudo o que não for o chat ativo para dar espaco */
        body.keyboard-open .sidebar,
        body.keyboard-open .sidebar-nav,
        body.keyboard-open .glass-bubble,
        body.keyboard-open .mobile-page-header,
        body.keyboard-open .chat-left-sidebar,
        body.keyboard-open .header,
        body.keyboard-open .hint-box {
            display: none !important;
        }
    }
</style>
</body>`;

// Find everything from <!-- FIX MOBILE KEYBOARD CHAT LAYOUT --> to </body>
const startIndex = html.indexOf('<!-- FIX MOBILE KEYBOARD CHAT LAYOUT -->');
if(startIndex !== -1) {
    const startStr = html.substring(0, startIndex);
    fs.writeFileSync('conversas.html', startStr + injection + '\n</html>');
}
