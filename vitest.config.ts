import react from '@vitejs/plugin-react'
import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
  plugins: [react()],
})
