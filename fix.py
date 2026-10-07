import re

with open('conversas.html', 'r', encoding='utf-8') as f:
    text = f.read()

pattern = r"// Mostra otimisticamente\s+const container = document.getElementById\('chat-messages-container'\);\s+const timeStr = new Date\(\).toLocaleTimeString\(\[\], \{hour: '2-digit', minute:'2-digit'\}\);\s+container.innerHTML \+= `\s+<div class=\"msg-bubble-ia\" style=\"opacity: 0.7;\">\s+<p style=\"margin: 0; font-size: 13px; color: #111; line-height: 1.35;\">\$\{text\}</p>\s+<div style=\"text-align: right; margin-top: 2px; margin-bottom: -2px;\"><span style=\"font-size: 10px; color: #667781;\">Enviando...</span></div>\s+</div>`;\s+container.scrollTop = container.scrollHeight;\s+await window.dbAPI.sendMessage\(currentLeadId, text\);\s+// Recarrega do banco pra garantir\s+const fullLead = window.localLeadsData \? window.localLeadsData.find\(l => l.id === currentLeadId\) : null;\s+const existingAvatarImg = document.getElementById\('chat-header-avatar'\)\?.querySelector\('img'\);\s+carregarMensagens\(fullLead \|\| \{\s+id: currentLeadId,\s+nome: document.getElementById\('chat-header-name'\).innerText,\s+status: '',\s+foto_perfil: existingAvatarImg \? existingAvatarImg.src : null\s+\}\);"

replacement = """// Dispara o envio
            window.dbAPI.sendMessage(currentLeadId, text);"""

new_text = re.sub(pattern, replacement, text)

with open('conversas.html', 'w', encoding='utf-8') as f:
    f.write(new_text)

print("Replaced!")
