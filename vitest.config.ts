import react from '@vitejs/plugin-react'
import {defineConfig} from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    setupFiles: ['vitest-cleanup-after-each.ts'],
    environment: 'jsdom',
    workspace: [
      'test/*',
      {
        extends: true,
        test: {name: 'react 19', include: ['src/**\/*.{test,spec}.?(c|m)[jt]s?(x)']},
      },
    ],
  },
})
