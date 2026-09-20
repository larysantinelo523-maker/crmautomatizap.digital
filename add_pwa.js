const fs = require('fs');
const path = require('path');

const dir = './';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const manifestLink = `
    <!-- PWA Setup -->
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="AutomatiZAP">
    <link rel="apple-touch-icon" href="logo.png">
    <link rel="manifest" href="manifest.json">
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('sw.js').then(registration => {
            console.log('SW registered');
          }).catch(err => {
            console.log('SW registration failed: ', err);
          });
        });
      }
    </script>
</head>`;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('rel="manifest"')) {
        content = content.replace('</head>', manifestLink);
        fs.writeFileSync(file, content);
        console.log(`PWA support added to ${file}`);
    }
});
