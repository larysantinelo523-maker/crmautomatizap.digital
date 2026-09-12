import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        // login.html é a tela inicial — mas a Vercel serve index.html por padrão em /
        // Então fazemos o index.html redirecionar para login e aqui declaramos todas as páginas
        login: resolve(__dirname, 'login.html'),
        main: resolve(__dirname, 'index.html'),
        leads: resolve(__dirname, 'leads.html'),
        relatorios: resolve(__dirname, 'relatorios.html'),
        conversas: resolve(__dirname, 'conversas.html'),
        tarefas: resolve(__dirname, 'tarefas.html'),
        configuracoes: resolve(__dirname, 'configuracoes.html'),
        notificacoes: resolve(__dirname, 'notificacoes.html')
      }
    }
  }
});
