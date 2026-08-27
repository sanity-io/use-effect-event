import react from '@vitejs/plugin-react'
import {defineConfig} from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  // Pin every react import (the shim in ../../src, @testing-library/react) to this
  // workspace's react version. @vitejs/plugin-react stopped setting `dedupe` in v5.
  resolve: {dedupe: ['react', 'react-dom']},
  test: {
    name: 'react experimental',
    environment: 'jsdom',
    setupFiles: ['../../vitest-cleanup-after-each.ts'],
  },
})
