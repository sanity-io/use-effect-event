import {useCallback, useInsertionEffect, useRef} from 'react'

/**
 * This is a ponyfill of the upcoming `useEffectEvent` hook that'll arrive in React 19.
 * https://19.react.dev/learn/separating-events-from-effects#declaring-an-effect-event
 * To learn more about the ponyfill itself, see: https://blog.bitsrc.io/a-look-inside-the-useevent-polyfill-from-the-new-react-docs-d1c4739e8072
 * @public
 */
export function useEffectEvent<
  const T extends (
    ...args: // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any[]
  ) => void,
>(fn: T): T {
  const ref = useRef<T | null>(null)
  useInsertionEffect(() => {
    ref.current = fn
  }, [fn])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useCallback((...args: any) => {
    const latestFn = ref.current!
    return latestFn(...args)
  }, []) as unknown as T
}
