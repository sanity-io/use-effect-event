import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  tsconfig: 'tsconfig.dist.json',
  extract: {
    rules: {
      'ae-incompatible-release-tags': 'warn',
      'ae-internal-missing-underscore': 'off',
    },
  },
  dts: 'rolldown',
})
