import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

const alias = {
  '@': resolve(__dirname, 'src')
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias
    },
    build: {
      rollupOptions: {
        input: {
          background: resolve(__dirname, 'src/background.ts')
        }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias
    },
    build: {
      rollupOptions: {
        input: {
          preload: resolve(__dirname, 'src/server/electron/preload.ts')
        }
      }
    }
  },
  renderer: {
    root: '.',
    publicDir: resolve(__dirname, 'public'),
    plugins: [vue()],
    resolve: {
      alias: {
        ...alias,
        events: 'events',
        stream: 'stream-browserify',
        timers: 'timers-browserify'
      }
    },
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true
        }
      }
    },
    build: {
      rollupOptions: {
        input: resolve(__dirname, 'index.html')
      }
    }
  }
})
