const fs = require('fs');
let js = fs.readFileSync('admin.js', 'utf8');

const regex = /if \(badgeEl\) badgeEl\.style\.display = 'none';\s*return;\s*\}\s*if \(badgeEl\) \{\s*badgeEl\.textContent = notifications\.length;\s*badgeEl\.style\.display = 'inline-flex';\s*\}/;

const replacement = `
    const notifDot = document.querySelector('.notification-dot');

    if (notifications.length === 0) {
        listEl.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--color-text-mut); font-size: 13px;">Nenhuma notificação.</div>';
        if (badgeEl) badgeEl.style.display = 'none';
        if (notifDot) notifDot.style.display = 'none';
        return;
    }

    if (badgeEl) {
        badgeEl.textContent = notifications.length;
        badgeEl.style.display = 'inline-flex';
    }
    if (notifDot) {
        notifDot.style.display = 'block';
    }
`;

if (regex.test(js)) {
    js = js.replace(regex, replacement.trim());
    fs.writeFileSync('admin.js', js);
    console.log('Replaced badge logic successfully');
} else {
    console.log('Regex did not match admin.js logic');
}
