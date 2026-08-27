/**
 * Runs only in the `react-compiler` vitest project: every component here is compiled by the
 * React Compiler (the oxc port, `oxc-transform-react`) before the assertions run, the way a
 * compiled consumer app would use this package.
 *
 * Unlike the main suite, components are declared at module scope with module-scope sinks.
 * The React Compiler assumes components are static: it hoists non-reactive function
 * expressions to module scope, so a component created inside a test callback loses access to
 * variables it captured from that callback (see the `test.fails` pin at the bottom).
 */
import {render} from '@testing-library/react'
import {useEffect, useInsertionEffect, useLayoutEffect} from 'react'
import {beforeEach, expect, test, vi} from 'vitest'

import {useEffectEvent} from './useEffectEvent'

const effectStack: Array<string> = []
const freshStack: Array<string> = []

beforeEach(() => {
  effectStack.length = 0
  freshStack.length = 0
})

function EffectCaller({value}: {value: string}) {
  const logValue = useEffectEvent((source: string) => {
    effectStack.push(`${source}:${value}`)
  })

  useInsertionEffect(() => {
    logValue('useInsertionEffect')
  }, [])
  useLayoutEffect(() => {
    logValue('useLayoutEffect')
  }, [])
  useEffect(() => {
    logValue('useEffect')
  }, [])

  return null
}

test('created functions can be called from all use*Effect hooks', () => {
  render(<EffectCaller value="a" />)

  expect(effectStack).toEqual(['useInsertionEffect:a', 'useLayoutEffect:a', 'useEffect:a'])
})

function FreshReader({value}: {value: string}) {
  const read = useEffectEvent(() => {
    freshStack.push(value)
  })

  useEffect(() => {
    read()
  }, [value])

  return null
}

test('effect events read the latest value on every call', () => {
  const {rerender} = render(<FreshReader value="first" />)
  rerender(<FreshReader value="second" />)

  expect(freshStack).toEqual(['first', 'second'])
})

/**
 * Upstream React Compiler bug, present in both `babel-plugin-react-compiler@1.0.0` and the oxc
 * port (`oxc-transform-react@0.147.0`): a callback that only captures non-reactive values is
 * hoisted to module scope (`function _temp(event) {stack.push(event)}`), which breaks
 * components created inside another function — the hoisted callback throws
 * `ReferenceError: stack is not defined` because the captured variable never existed at module
 * scope. This is why the other tests in this file keep their sinks at module scope.
 *
 * `test.fails` pins the bug: when a compiler release fixes the hoisting, this test starts
 * passing, vitest reports it as a failure, and the pin (plus the module-scope workaround
 * above) can be removed.
 */
test.fails('components created inside factories keep closure access to captured variables', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const stack: Array<string> = []
  const Component = () => {
    const log = useEffectEvent((event: string) => {
      stack.push(event)
    })
    useEffect(() => {
      log('effect')
    }, [])
    return null
  }

  render(<Component />)

  expect(stack).toEqual(['effect'])
})
