import React from 'react'

const context = React.createContext(true)

function forbiddenInRender() {
  throw new Error("A function wrapped in useEffectEvent can't be called during rendering.")
}

// We can only check if we're in a render phase, beyond initial render, in React 19, with its `React.use` hook.
const isInvalidExecutionContextForEventFunction =
  'use' in React
    ? () => {
        // There's no way to check if we're in a render phase from outside of React, the API used by useEffectEvent is private: https://github.com/facebook/react/blob/a00ca6f6b51e46a0ccec54a2231bfe7a1ed9ae1d/packages/react-reconciler/src/ReactFiberWorkLoop.js#L1785-L1788
        // So to emulate the same behavior, we call the use hook and if it doesn't throw, we're in a render phase.
        try {
          // oxlint-disable-next-line react-hooks/rules-of-hooks -- `use` throwing outside render is exactly the signal this probe needs
          return React.use(context)
        } catch {
          return false
        }
      }
    : () => false

/**
 * This is a ponyfill of the `useEffectEvent` hook that became stable in React 19.2:
 * https://react.dev/reference/react/useEffectEvent
 * It also works on React 18.3 and React 19.0/19.1, where the native hook doesn't exist yet.
 *
 * It deliberately differs from the native hook in two ways:
 * 1. The returned function has a stable identity: the same function is returned on every
 *    render (the native hook returns a new closure each render). Linters ported from the
 *    React Compiler (e.g. oxlint's `react/exhaustive-effect-dependencies`) only exempt the
 *    native hook from effect dependency arrays, so they push callers into listing this
 *    ponyfill's functions as dependencies — with a stable identity that's harmless, where an
 *    unstable one would re-fire the effect on every render.
 * 2. It doesn't reproduce the React 19.2 bug where the native hook keeps reading first-render
 *    values inside `React.memo`/`React.forwardRef` components:
 *    https://github.com/facebook/react/issues/34818
 * @public
 */
export function useEffectEvent<const T extends (...args: any[]) => void>(fn: T): T {
  /**
   * For both React 18 and 19 we set the ref to the forbiddenInRender function, to catch illegal calls to the function during render.
   * Once the insertion effect runs, we set the ref to the actual function.
   */
  const ref = React.useRef(forbiddenInRender as T)

  React.useInsertionEffect(() => {
    ref.current = fn
  }, [fn])

  /**
   * The stable wrapper is created exactly once per component instance — `useState` with a lazy
   * initializer guarantees the identity survives re-renders — and reads `ref.current` on every
   * call, so it always invokes the latest `fn` without ever being stale.
   */
  const [stableFn] = React.useState(() => {
    return ((...args: any[]) => {
      // Performs a similar check to what React does for `useEffectEvent`:
      // 1. https://github.com/facebook/react/blob/b7e2de632b2a160bc09edda1fbb9b8f85a6914e8/packages/react-reconciler/src/ReactFiberHooks.js#L2729-L2733
      // 2. https://github.com/facebook/react/blob/b7e2de632b2a160bc09edda1fbb9b8f85a6914e8/packages/react-reconciler/src/ReactFiberHooks.js#L2746C9-L2750
      if (isInvalidExecutionContextForEventFunction()) {
        forbiddenInRender()
      }

      const latestFn = ref.current!
      return latestFn(...args)
    }) as T
  })

  return stableFn
}
