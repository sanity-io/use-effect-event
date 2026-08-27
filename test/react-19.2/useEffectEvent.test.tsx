/**
 * React 19.2 — still `react@latest` — ships a native `useEffectEvent` with a bug: inside
 * components wrapped in `React.memo` or `React.forwardRef`, effect events read first-render
 * values forever, because the commit phase only applies effect-event impl updates to plain
 * function-component fibers.
 *
 * - Bug report: https://github.com/facebook/react/issues/34818
 * - Fix (merged, but only shipped in 19.3 canary/experimental builds so far):
 *   https://github.com/facebook/react/pull/34831
 * - Real-world fallout that keeps sanity-io/ui and radix-ui on ponyfills:
 *   https://github.com/radix-ui/primitives/issues/4014
 *
 * The native tests below assert the buggy behavior on purpose: react is pinned to the 19.2
 * release line (package.json + renovate), so if a 19.2.x patch ever picks up the fix these
 * pins break loudly and the documentation here can be updated. The ponyfill tests prove this
 * package never shared the bug (its `useInsertionEffect` update path runs for every fiber
 * type). test/react-experimental verifies the fix has landed in experimental builds.
 */
import {render} from '@testing-library/react'
import {forwardRef, memo, useEffectEvent as nativeUseEffectEvent} from 'react'
import {describe, expect, test} from 'vitest'

import {useEffectEvent} from '../../src/useEffectEvent'

/**
 * The hooks must run inside the fiber the wrapper creates (SimpleMemoComponent/ForwardRef) —
 * nesting a plain child component underneath would dodge the native bug and document nothing.
 */
function renderFreshnessProbe(
  useEffectEventImpl: typeof useEffectEvent,
  wrap: 'plain' | 'memo' | 'forwardRef',
) {
  const stack: Array<number> = []
  const useProbe = (value: number) =>
    useEffectEventImpl(() => {
      stack.push(value)
    })

  const Plain = ({value}: {value: number}) => {
    const logValue = useProbe(value)

    return <button onClick={() => logValue()}>log</button>
  }
  const Child =
    wrap === 'memo'
      ? memo(Plain)
      : wrap === 'forwardRef'
        ? forwardRef<HTMLButtonElement, {value: number}>(({value}, ref) => {
            const logValue = useProbe(value)

            return (
              <button ref={ref} onClick={() => logValue()}>
                log
              </button>
            )
          })
        : Plain

  const {container, rerender} = render(<Child value={0} />)
  rerender(<Child value={1} />)
  container.querySelector('button')!.click()

  return stack
}

describe('native useEffectEvent (react 19.2)', () => {
  test('reads the latest value in a plain function component (control)', () => {
    expect(renderFreshnessProbe(nativeUseEffectEvent, 'plain')).toEqual([1])
  })

  test('DOCUMENTED BUG: keeps reading the first-render value inside React.memo', () => {
    // The latest value is 1 — the native hook reports the mount-time 0 (facebook/react#34818).
    expect(renderFreshnessProbe(nativeUseEffectEvent, 'memo')).toEqual([0])
  })

  test('DOCUMENTED BUG: keeps reading the first-render value inside React.forwardRef', () => {
    // The latest value is 1 — the native hook reports the mount-time 0 (facebook/react#34818).
    expect(renderFreshnessProbe(nativeUseEffectEvent, 'forwardRef')).toEqual([0])
  })

  test('creates a new function on every render', () => {
    const stack: Array<() => void> = []
    const Component = () => {
      const event = nativeUseEffectEvent(() => {})
      stack.push(event)

      return null
    }

    const {rerender} = render(<Component />)
    rerender(<Component />)

    expect(stack).toHaveLength(2)
    expect(stack[0]).not.toBe(stack[1])
  })
})

describe('ponyfill useEffectEvent', () => {
  test('reads the latest value in a plain function component', () => {
    expect(renderFreshnessProbe(useEffectEvent, 'plain')).toEqual([1])
  })

  test('reads the latest value inside React.memo', () => {
    expect(renderFreshnessProbe(useEffectEvent, 'memo')).toEqual([1])
  })

  test('reads the latest value inside React.forwardRef', () => {
    expect(renderFreshnessProbe(useEffectEvent, 'forwardRef')).toEqual([1])
  })

  test('returns a stable function reference on every render', () => {
    const stack: Array<() => void> = []
    const Component = () => {
      const event = useEffectEvent(() => {})
      stack.push(event)

      return null
    }

    const {rerender} = render(<Component />)
    rerender(<Component />)

    expect(stack).toHaveLength(2)
    expect(stack[0]).toBe(stack[1])
  })
})
