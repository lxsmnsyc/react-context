import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { createStateContext } from '../.';

const Counter = createStateContext(0);

function Count() {
  const value = Counter.useSelectedValue((state) => `Count: ${state}`);

  return (
    <h1>{ value }</h1>
  );
}

function Increment() {
  const setCount = Counter.useSetState();

  const increment = React.useCallback(() => {
    setCount((count) => count + 1);
  }, []);

  return (
    <button onClick={increment} type="button">Increment</button>
  );
}

function Decrement() {
  const setCount = Counter.useSetState();

  const decrement = React.useCallback(() => {
    setCount((count) => count - 1);
  }, []);

  return (
    <button onClick={decrement} type="button">Decrement</button>
  );
}


const App = () => {
  return (
    <Counter.Provider value={12}>
      <Count />
      <Increment />
      <Decrement />
    </Counter.Provider>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
