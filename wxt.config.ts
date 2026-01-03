import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: 'SyncParty',
    description: '테스트',
    permissions: [
        'storage',
        'tabs',
        'notifications'
    ],
  },
  modules: ['@wxt-dev/module-vue'],
  vite: () => ({
    resolve: {
      alias: {
        '@': '',
      },
    },
  }),
});
