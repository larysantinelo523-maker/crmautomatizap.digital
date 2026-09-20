const fs = require('fs');
const path = require('path');

const dir = './';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const manifestLink = `
    <!-- PWA Setup -->
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="AutomatiZAP">
    <link rel="apple-touch-icon" href="icon-192.png">
    <link rel="manifest" href="manifest.json">
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('sw.js').catch(err => console.log('SW fail: ', err));
        });
      }
      let deferredPrompt;
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        const installBtns = document.querySelectorAll('.install-pwa-btn');
        installBtns.forEach(btn => {
          btn.style.display = 'flex';
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            if(deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                  if (choiceResult.outcome === 'accepted') {
                    installBtns.forEach(b => b.style.display = 'none');
                  }
                  deferredPrompt = null;
                });
            }
          });
        });
      });
    </script>
</head>`;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace old PWA script if it exists
    if (content.includes('<!-- PWA Setup -->')) {
        content = content.replace(/<!-- PWA Setup -->[\s\S]*?<\/head>/, manifestLink);
    } else {
        content = content.replace('</head>', manifestLink);
    }

    // Add Install button to sidebar if not exists
    if (!content.includes('install-pwa-btn') && content.includes('class="nav-item"><i class="ph ph-shield-check"></i> Admin</a>')) {
        content = content.replace(
            '<a href="admin.html" class="nav-item"><i class="ph ph-shield-check"></i> Admin</a>',
            '<a href="admin.html" class="nav-item"><i class="ph ph-shield-check"></i> Admin</a>\n                <a href="#" class="nav-item install-pwa-btn" style="display: none; color: var(--color-primary); font-weight: 600;"><i class="ph ph-download-simple"></i> Instalar App</a>'
        );
    }
    
    fs.writeFileSync(file, content);
    console.log(`PWA support added to ${file}`);
});
