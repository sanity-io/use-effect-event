import react from '@vitejs/plugin-react'
import {defineConfig} from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'react experimental',
    environment: 'jsdom',
    setupFiles: ['../../vitest-cleanup-after-each.ts'],
  },
})
