import {defineConfig} from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'react experimental',
    environment: 'jsdom',
    setupFiles: ['../../vitest-cleanup-after-each.ts'],
  },
})
