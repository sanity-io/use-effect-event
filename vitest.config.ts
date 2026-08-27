import react from '@vitejs/plugin-react'
import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: ['vitest-cleanup-after-each.ts'],
    environment: 'jsdom',
    projects: [
      'test/*',
      {
        extends: true,
        plugins: [react()],
        test: {
          name: 'react 19',
          include: ['src/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
          exclude: ['src/**/*.compiler.test.tsx'],
        },
      },
      {
        extends: true,
        // React Compiler on oxc (`oxc-transform-react`) — one native pass, no babel.
        // Verifies the ponyfill keeps its semantics when consumers compile with it.
        plugins: [react({compiler: {target: '19'}})],
        test: {
          name: 'react-compiler',
          include: ['src/**/*.compiler.test.tsx'],
        },
      },
    ],
  },
})
