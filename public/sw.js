const CACHE_NAME = 'automatizap-crm-v19';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/conversas.html',
  '/tarefas.html',
  '/teste-agente.html',
  '/jarvis.html',
  '/relatorios.html',
  '/configuracoes.html',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png'
];

// Install Event - Pre-cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('SW: Cache parcial ignorado:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event - Limpa caches antigos e assume controle imediato
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Network first com fallback para cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // Não interceptar requisições para Supabase Realtime, API externa ou extensões
  if (url.protocol.startsWith('chrome-extension') || url.pathname.includes('/realtime/') || url.hostname.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// Push Event - Recebe notificações Push do servidor (OneSignal / WebPush)
self.addEventListener('push', (event) => {
  let data = {
    title: 'AutomatiZAP CRM',
    body: 'Você tem uma nova notificação!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    url: '/index.html'
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = Object.assign({}, data, parsed);
    } catch (e) {
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || 'crm-notif-' + Date.now(),
    renotify: true,
    data: {
      url: data.url || '/index.html'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click Event - Foca ou abre o CRM quando o usuário toca no alerta do celular
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/index.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url.includes(targetUrl) || targetUrl === '/index.html') {
            return client.focus();
          }
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// --- Modo de Teste Contínuo em Segundo Plano (a cada 2 min ou sob demanda) ---
let swTestTimer = null;
let swTestCount = 0;

const SW_MOCK_NOTIFICATIONS = [
  {
    title: '🔥 [TESTE] Novo Lead Recebido!',
    body: 'Mariana Silva acabou de mandar mensagem! Interesse: Automação WhatsApp'
  },
  {
    title: '💬 [TESTE] Nova Mensagem no WhatsApp',
    body: 'Lucas Pereira: "Olá! Gostaria de saber os valores dos planos."'
  },
  {
    title: '🔥 [TESTE] Novo Lead Qualificado!',
    body: 'Roberto Costa entrou em contato! Orçamento: R$ 5.000+'
  },
  {
    title: '💬 [TESTE] Nova Mensagem no WhatsApp',
    body: 'Camila Lima: "Vocês atendem no final de semana?"'
  },
  {
    title: '📅 [TESTE] Reunião Agendada!',
    body: 'Apresentação com Dr. Paulo confirmada para amanhã às 14:00.'
  }
];

function fireSwTestNotification() {
  const item = SW_MOCK_NOTIFICATIONS[swTestCount % SW_MOCK_NOTIFICATIONS.length];
  swTestCount++;

  self.registration.showNotification(item.title, {
    body: item.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [300, 100, 300, 100, 300],
    tag: 'test-loop-' + Date.now(),
    renotify: true,
    data: {
      url: '/conversas.html'
    }
  });
}

// Escuta comandos do cliente (Iniciar/Pausar testes)
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.action === 'START_TEST_LOOP') {
    const intervalMs = event.data.intervalMs || 120000;
    if (swTestTimer) clearInterval(swTestTimer);

    if (event.data.immediate) {
      setTimeout(fireSwTestNotification, 600);
    }

    swTestTimer = setInterval(fireSwTestNotification, intervalMs);
  } else if (event.data.action === 'STOP_TEST_LOOP') {
    if (swTestTimer) {
      clearInterval(swTestTimer);
      swTestTimer = null;
    }
  } else if (event.data.action === 'TRIGGER_IN_SECONDS') {
    const sec = event.data.seconds || 5;
    setTimeout(fireSwTestNotification, sec * 1000);
  }
});

