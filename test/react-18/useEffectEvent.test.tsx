import {render} from '@testing-library/react'
import {useEffect, useInsertionEffect, useLayoutEffect, useRef, useState} from 'react'
import {flushSync} from 'react-dom'
import {describe, expect, test, vi} from 'vitest'

import {useEffectEvent} from '../../src/useEffectEvent'

test('useEffectEvent is always up-to-date with latest render', () => {
  const stack: Array<number> = []
  const Component = () => {
    const [count, setCount] = useState(0)
    const logCount = useEffectEvent(() => {
      stack.push(count)
    })

    return (
      <button
        onClick={() => {
          logCount()
          setCount((c) => c + 1)
          logCount()
          flushSync(() => setCount((c) => c + 1))
          logCount()
        }}
      >
        hello
      </button>
    )
  }

  const {container} = render(<Component />)
  container.querySelector('button')!.click()

  // 0,0,2 because:
  // 0 -> before the update, so base value
  // 0 -> technically after the 1st call of `setCount`, but the component didn’t re-render yet, so `count` wasn't updated
  // 2 -> as we call `flushSync`, the component updates, and the two different setCount get applied
  expect(stack).toEqual([0, 0, 2])
})

describe('render cycle', () => {
  test('functions created by useEffectEvent cannot be called in render', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const Component = () => {
      const onRender = useEffectEvent(() => {})
      onRender()

      return null
    }

    expect(() => render(<Component />)).toThrow(
      "A function wrapped in useEffectEvent can't be called during rendering.",
    )
  })

  /**
   * Re-renders that throw are not currently supported in React 18, so we skip this test.
   */
  test.skip('functions created by useEffectEvent cannot be called in re-renders', () => {
    const Component = () => {
      const isInitialRenderRef = useRef(true)
      useEffect(() => {
        isInitialRenderRef.current = false
      })
      const onRender = useEffectEvent(() => {})

      if (!isInitialRenderRef.current) {
        onRender()
      }

      return null
    }

    const {rerender} = render(<Component />)

    expect(() => rerender(<Component />)).toThrow(
      "A function wrapped in useEffectEvent can't be called during rendering.",
    )
  })
})

test('useEffectEvent creates functions with unstable references (they change at each render)', () => {
  const stack: Array<() => void> = []
  const Component = () => {
    const event = useEffectEvent(() => {})
    stack.push(event)

    return null
  }

  const {rerender} = render(<Component />)
  rerender(<Component />)

  expect(stack).toHaveLength(2)
  expect(stack[0]).not.toBe(stack[1])
})

test('useEffectEvent’s created function can be called in all use*Effect without throwing', () => {
  const stack: Array<string> = []
  const Component = () => {
    const logToStack = useEffectEvent((event: string) => {
      stack.push(event)
    })

    // logToStack should also be omitted by the linter from all of those dependencies
    // For now, only enabled in the experimental build of `eslint-plugin-react-hooks`
    useInsertionEffect(() => {
      logToStack('useInsertionEffect')
    }, [])
    useLayoutEffect(() => {
      logToStack('useLayoutEffect')
    }, [])
    useEffect(() => {
      logToStack('useEffect')
    }, [])

    return null
  }

  render(<Component />)

  expect(stack).toEqual(['useInsertionEffect', 'useLayoutEffect', 'useEffect'])
})

test('useEffectEvent’s created function can be called in all use*Effect without throwing in strict mode', () => {
  const stack: Array<string> = []
  const Component = () => {
    const logToStack = useEffectEvent((event: string) => {
      stack.push(event)
    })

    // logToStack should also be omitted by the linter from all of those dependencies
    // For now, only enabled in the experimental build of `eslint-plugin-react-hooks`
    useInsertionEffect(() => {
      logToStack('useInsertionEffect')
    }, [])
    useLayoutEffect(() => {
      logToStack('useLayoutEffect')
    }, [])
    useEffect(() => {
      logToStack('useEffect')
    }, [])

    return null
  }

  render(<Component />, {reactStrictMode: true})

  expect(stack).toEqual([
    'useInsertionEffect',
    'useLayoutEffect',
    'useEffect',
    'useLayoutEffect',
    'useEffect',
  ])
})
