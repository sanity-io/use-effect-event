[![CI & Release](https://github.com/sanity-io/use-effect-event/actions/workflows/ci.yml/badge.svg?event=push)](https://github.com/sanity-io/use-effect-event/actions/workflows/ci.yml) [![npm version](https://img.shields.io/npm/v/use-effect-event.svg)](https://www.npmjs.com/package/use-effect-event)

# use-effect-event

> Ponyfill of the experimental `React.useEffectEvent` hook

## Usage

> [!IMPORTANT]
> Make sure you read about [the limitations and understand them](https://react.dev/learn/separating-events-from-effects#limitations-of-effect-events) before you start using this hook, it's not a silver bullet.

This package implements the [same](https://react.dev/learn/separating-events-from-effects#declaring-an-effect-event) [API](https://react.dev/learn/separating-events-from-effects#reading-latest-props-and-state-with-effect-events) as the [experimental](https://19.react.dev/reference/react/experimental_useEffectEvent) `React.useEffectEvent` hook, based on its [implementation in Bluesky](https://github.com/bluesky-social/social-app/blob/ce0bf867ff3b50a495d8db242a7f55371bffeadc/src/lib/hooks/useNonReactiveCallback.ts#L3-L23).
The only difference is that instead of installing an experimental build of React, you can use this package as a ponyfill. Here's an example, [from the official docs](https://react.dev/learn/separating-events-from-effects#reading-latest-props-and-state-with-effect-events), that shows how it can be used to log whenever `url` changes, and still access the latest value of `numberOfItems` without needing to resort to `useRef` proxying:

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
