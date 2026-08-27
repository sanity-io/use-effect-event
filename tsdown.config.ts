import {defineConfig} from '@sanity/tsdown-config'
import type {UserConfig} from 'tsdown'

// `satisfies Promise<UserConfig>` names the return type through this package's own `tsdown`
// dependency. Without it, declaration emit can only reach the type through
// `@sanity/tsdown-config`'s copy, which is not portable (TS2883).
//
// No `reactCompiler` here on purpose: this package is the `useEffectEvent` primitive itself,
// and its identity/ref semantics must ship exactly as written. Consumers run the compiler,
// not us — the `react-compiler` vitest project covers that interaction.
export default defineConfig({
  tsconfig: 'tsconfig.build.json',
  entry: ['./src/index.ts'],
  format: ['esm', 'cjs'],
}) satisfies Promise<UserConfig>
