[![CI](https://github.com/sanity-io/use-effect-event/actions/workflows/ci.yml/badge.svg?event=push)](https://github.com/sanity-io/use-effect-event/actions/workflows/ci.yml) [![npm version](https://img.shields.io/npm/v/use-effect-event.svg)](https://www.npmjs.com/package/use-effect-event)

# use-effect-event

> Ponyfill of the [`React.useEffectEvent`](https://react.dev/reference/react/useEffectEvent) hook, which became stable in React 19.2

## Usage

> [!IMPORTANT]
> Make sure you read about [the limitations and understand them](https://react.dev/learn/separating-events-from-effects#limitations-of-effect-events) before you start using this hook, it's not a silver bullet.

This package implements the [same](https://react.dev/learn/separating-events-from-effects#declaring-an-effect-event) [API](https://react.dev/learn/separating-events-from-effects#reading-latest-props-and-state-with-effect-events) as the native [`React.useEffectEvent`](https://react.dev/reference/react/useEffectEvent) hook. Here's an example, [from the official docs](https://react.dev/learn/separating-events-from-effects#reading-latest-props-and-state-with-effect-events), that shows how it can be used to log whenever `url` changes, and still access the latest value of `numberOfItems` without needing to resort to `useRef` proxying:

```tsx
// import {useEffectEvent} from 'react'
import {useEffectEvent} from 'use-effect-event'

function Page({url}) {
  const {items} = useContext(ShoppingCartContext)
  const numberOfItems = items.length

  const onVisit = useEffectEvent((visitedUrl) => {
    logVisit(visitedUrl, numberOfItems)
  })

  useEffect(() => {
    onVisit(url)
  }, [url])
}
```

## Why use this instead of the native hook?

- It works all the way back to React 18.3, while the native hook requires React 19.2.
- React 19.2 (the current `react@latest` line) ships the native hook with a bug: inside components wrapped in `React.memo` or `React.forwardRef`, effect events keep reading first-render props and state forever ([facebook/react#34818](https://github.com/facebook/react/issues/34818), fixed by [facebook/react#34831](https://github.com/facebook/react/pull/34831) but only shipped in 19.3 canary/experimental builds so far). This ponyfill doesn't share the bug — its update path (`useInsertionEffect`) runs for every component type. The regression tests in [`test/react-19.2`](test/react-19.2/useEffectEvent.test.tsx) document the native bug side by side with the ponyfill, and [`test/react-experimental`](test/react-experimental/useEffectEvent.test.tsx) verifies the upstream fix in experimental builds.

## Function identity

The ponyfill deliberately differs from the native hook in one way: **the returned function has a stable identity** — you get the same function on every render, like a `useCallback` with no dependencies that can never grow stale. The native hook returns a new closure on every render.

You should still omit effect-event functions from dependency arrays (that's the contract both the official linter and this package's docs teach), but with a stable identity nothing breaks when a dependency array includes one anyway — whether a teammate, a codemod, or a linter put it there. This matters in practice because the ecosystem disagrees about that array:

- `eslint-plugin-react-hooks` (stable, v6+) recognizes `useEffectEvent` functions by name — including this ponyfill's — and its `exhaustive-deps` rule **forbids** listing them as dependencies.
- oxlint's `react-hooks/exhaustive-deps` port behaves the same way.
- oxlint's compiler-ported `react/exhaustive-effect-dependencies` rule (part of the [React Compiler rules](https://oxc.rs/blog/2026-08-18-react-compiler-support), enabled by its `suspicious` category) only exempts the **native** hook and **requires** this ponyfill's functions in the dependency array — the exact opposite. With an unstable identity that inclusion would re-fire the effect on every render; with a stable identity it's harmless.
- The React Compiler itself (both `babel-plugin-react-compiler` and the oxc port, which produce identical output for this package) never rewrites your dependency arrays, but it does memoize effect callbacks keyed on the identity of the functions they call — a stable identity means those memo slots actually hit.

## Linting

`eslint-plugin-react-hooks` v6 and later (and oxlint's `react-hooks` rules) understand effect events created by this package out of the box, matched by the `useEffectEvent` name: `rules-of-hooks` checks they aren't passed around or called during render, and `exhaustive-deps` excludes them from dependency arrays. The `eslint-plugin-react-hooks@experimental` install this README used to recommend is no longer needed.
