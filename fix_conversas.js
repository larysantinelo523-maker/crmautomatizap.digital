const fs = require('fs');
let f = fs.readFileSync('c:/Users/joaoa/Desktop/CRM - AutomatiZAP/conversas.html', 'utf8');

const replacement = `                const date = new Date(lead.criado_em);
                const timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                const initials = lead.nome.charAt(0).toUpperCase();
                const avatarContent = lead.foto_perfil ? \`<img src="\${lead.foto_perfil}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">\` : initials;
                const avatarStyle = lead.foto_perfil ? 'background: transparent;' : 'background: var(--color-primary); color: white; font-weight: bold;';

                const div = document.createElement('div');
                div.className = 'chat-contact-item';
                div.style = 'padding: 10px 16px; border-bottom: 1px solid var(--color-border); display: flex; gap: 12px; align-items: center; cursor: pointer; transition: background 0.2s;';
                div.innerHTML = \``;

f = f.replace(/                const date = new Date\(lead\.criado_em\);\s+const timeStr = date\.toLocaleTimeString\(\[\], \{hour: '2-digit', minute:'2-digit'\}\);\s+const date = new Date\(lead\.criado_em\);\s+const timeStr = date\.toLocaleTimeString\(\[\], \{hour: '2-digit', minute:'2-digit'\}\);\s+const initials = lead\.nome\.charAt\(0\)\.toUpperCase\(\);\s+const avatarContent = lead\.foto_perfil \? \\`<img src="\$\{lead\.foto_perfil\}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">\\` : initials;\s+const avatarStyle = lead\.foto_perfil \? 'background: transparent;' : 'background: var\(--color-primary\); color: white; font-weight: bold;';\s+const div = document\.createElement\('div'\);\s+div\.className = 'chat-contact-item';\s+div\.style = 'padding: 10px 16px; border-bottom: 1px solid var\(--color-border\); display: flex; gap: 12px; align-items: center; cursor: pointer; transition: background 0\.2s;';\s+div\.innerHTML = `/, replacement);

fs.writeFileSync('c:/Users/joaoa/Desktop/CRM - AutomatiZAP/conversas.html', f);
console.log("Success");
