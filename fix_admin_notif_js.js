const fs = require('fs');
let js = fs.readFileSync('admin.js', 'utf8');

const regex = /document\.addEventListener\('click',\s*function\s*\(\w\)\s*\{\s*if\s*\(!userMenuBtn\.contains\(\w\.target\)\)\s*\{\s*userDropdown\.classList\.remove\('show'\);\s*\}\s*\}\);\s*\}/;

const replaceStr = `document.addEventListener('click', function (e) {
            if (!userMenuBtn.contains(e.target)) {
                userDropdown.classList.remove('show');
            }
        });
    }

    // Dropdown de Notificações
    const notifBtn = document.getElementById('notification-btn');
    const notifDropdown = document.getElementById('notification-dropdown');

    if (notifBtn && notifDropdown) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notifDropdown.classList.toggle('show');
            
            if (notifDropdown.classList.contains('show')) {
                const btnReadAll = document.getElementById('btn-read-all');
                if (btnReadAll && btnReadAll.style.display !== 'none') {
                    btnReadAll.click();
                }
            }
            if (typeof userDropdown !== 'undefined' && userDropdown) userDropdown.classList.remove('show');
        });

        document.addEventListener('click', (e) => {
            if (!notifBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
                notifDropdown.classList.remove('show');
            }
        });
    }`;

if (regex.test(js)) {
    js = js.replace(regex, replaceStr);
    fs.writeFileSync('admin.js', js);
    console.log('Injected notif btn logic via regex');
} else {
    console.log('Regex did not match');
}
