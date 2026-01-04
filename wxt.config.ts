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
  hooks: {
    'build:manifestGenerated': async (wxt, manifest) => {
      // Add open_in_tab to options_ui
      if (manifest.options_ui) {
        manifest.options_ui.open_in_tab = true;
      }
    },
  },
  vite: () => ({
    resolve: {
      alias: {
        '@': '',
      },
    },
  }),
});
