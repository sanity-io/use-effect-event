---
"use-effect-event": patch
---

The function returned by `useEffectEvent` now has a stable identity: the same function is returned on every render, and it always calls the latest version of the callback. Previously a new function was created on every render, matching the native hook.

Effect events should still be omitted from dependency arrays, but being listed in one is now harmless — the effect no longer re-fires on every render when a linter or codemod adds the function as a dependency. This makes the ponyfill safe with oxlint's compiler-ported `react/exhaustive-effect-dependencies` rule, which (unlike `eslint-plugin-react-hooks` and oxlint's own `exhaustive-deps`) only exempts the native `useEffectEvent` from dependency arrays and requires the ponyfill's functions to be included.
