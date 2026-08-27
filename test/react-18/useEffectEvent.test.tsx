import {render} from '@testing-library/react'
import {
  forwardRef,
  memo,
  useEffect,
  useInsertionEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
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

test('useEffectEvent creates functions with a stable reference (the same function on every render)', () => {
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

test('the returned function can be listed in effect dependency arrays without re-firing effects', () => {
  const effectRuns: Array<number> = []
  const Component = ({value}: {value: number}) => {
    const event = useEffectEvent(() => value)
    useEffect(() => {
      effectRuns.push(value)
      event()
    }, [event])

    return null
  }

  const {rerender} = render(<Component value={0} />)
  rerender(<Component value={1} />)

  expect(effectRuns).toEqual([0])
})

describe('freshness inside wrapper components (facebook/react#34818)', () => {
  // React 18 has no native useEffectEvent, but the ponyfill must stay fresh inside
  // React.memo/React.forwardRef here too — the React 19.2 native hook does not.
  test('stays fresh when the component is wrapped in React.memo', () => {
    const stack: Array<number> = []
    const Child = memo(function Child({value}: {value: number}) {
      const logValue = useEffectEvent(() => {
        stack.push(value)
      })

      return <button onClick={() => logValue()}>log</button>
    })

    const {container, rerender} = render(<Child value={0} />)
    rerender(<Child value={1} />)
    container.querySelector('button')!.click()

    expect(stack).toEqual([1])
  })

  test('stays fresh when the component is wrapped in React.forwardRef', () => {
    const stack: Array<number> = []
    const Child = forwardRef<HTMLButtonElement, {value: number}>(function Child({value}, ref) {
      const logValue = useEffectEvent(() => {
        stack.push(value)
      })

      return (
        <button ref={ref} onClick={() => logValue()}>
          log
        </button>
      )
    })

    const {container, rerender} = render(<Child value={0} />)
    rerender(<Child value={1} />)
    container.querySelector('button')!.click()

    expect(stack).toEqual([1])
  })
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
