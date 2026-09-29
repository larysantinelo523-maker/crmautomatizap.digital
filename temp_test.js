
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
    