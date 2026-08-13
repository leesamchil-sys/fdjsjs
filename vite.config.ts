import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import javascriptObfuscator from 'rollup-plugin-javascript-obfuscator';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const isProduction = mode === 'production';

  return {
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
        },
        format: {
          comments: false,
        },
      },
    },
    plugins: [
      react(), 
      tailwindcss(),
      isProduction && (javascriptObfuscator as any)({
        compact: true,
        controlFlowFlattening: false,
        controlFlowFlatteningThreshold: 0,
        deadCodeInjection: false,
        debugProtection: false,
        disableConsoleOutput: true,
        selfDefending: false,
        splitStrings: false,
        stringArray: true,
        stringArrayThreshold: 0.75,
        transformObjectKeys: false,
        unicodeEscapeSequence: false,
      }),
    ].filter(Boolean),
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
