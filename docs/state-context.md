## State Context

State Context is a Context that passes down a single value and a function that updates this value.

### Creating a State Context

```tsx
import { createStateContext } from '@lxsmnsyc/react-context';

// Create a State Context that has a default initial value of 0
const Counter = createStateContext(0);
```

Creating a state context returns an object that holds components and hooks.

### Using the State Context Components

#### Provider

A `Provider` may receive a value which serves as the initial value for that instance.

```tsx
<Counter.Provider value={5}>
  <CounterApp>
</Counter.Provider>
```

If the `value` property is not provided, the initial value for the state resolves to the default value.

#### Consumer

A `Consumer` accepts a function as a child. This function receives the state and the state setter function as a parameter, and must return a `JSX.Element` to render as a child. This function is called every time the state updates.

```tsx
<Counter.Consumer>
  {(state, setState) => (
    <>
      <h1>Count: {state}</h1>
      <button onClick={() => setState(state + 1)}>Increment</button>
      <button onClick={() => setState(state - 1)}>Decrement</button>
    </>
  )}
</Counter.Consumer>
```

#### Selector

A `Selector` is a kind of `Consumer` that transforms the state before rendering the child. The child function is only called whenever the transformed value changes.

```tsx
<Counter.Selector
  selector={(state) => `Count: ${state}`}
>
  {(mappedState, setState) => (
    <>
      <h1>mappedState</h1>
      <button onClick={(state) => setState(state + 1)}>Increment</button>
      <button onClick={(state) => setState(state - 1)}>Decrement</button>
    </>
  )}
</Counter.Selector>
```

#### Selectors

A `Selectors` is similar to `Selector`, but it allows the state to be transformed into an array of values. The child function is only called whenever one of the transformed values changes.