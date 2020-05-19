/**
 * @license
 * MIT License
 *
 * Copyright (c) 2020 Alexis Munsayac
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 *
 * @author Alexis Munsayac <alexis.munsayac@gmail.com>
 * @copyright Alexis Munsayac 2020
 */
import React, {
  SetStateAction, Dispatch, useCallback, useMemo,
} from 'react';
import { ContextInterface } from './types';
import createHookedContext from './hooked-context';

export interface StateContextProviderProps<State> {
  value?: State | (() => State);
  children?: React.ReactNode;
}

type SetState<State> = Dispatch<SetStateAction<State>>;

export interface StateContextConsumerProps<State> {
  children: (value: State, set: SetState<State>) => JSX.Element;
}

export interface StateContextSelectorProps<State, R> {
  selector: (value: State) => R;
  children: (value: R, set: SetState<State>) => JSX.Element;
}

export interface StateContextSelectorsProps<State, R extends any[]> {
  selector: (value: State) => R;
  children: (value: R, set: SetState<State>) => JSX.Element;
}

type BaseContextInterface<State> =
  ContextInterface<StateContextProviderProps<State>, StateContextConsumerProps<State>>;


type ContextValue<State> = [State, SetState<State>];

export interface StateContextInterface<State> extends BaseContextInterface<State> {
  useState(): ContextValue<State>;
  useValue(): State;
  useSetState(): SetState<State>;
  useSelectedValue<R>(selector: (value: State) => R): R;
  useSelectedState<R>(selector: (value: State) => R): [R, SetState<State>];
  useSelectedValues<R extends any[]>(selector: (value: State) => R): R;
  useSelectedStates<R extends any[]>(selector: (value: State) => R): [R, SetState<State>];

  Selector<R>(props: StateContextSelectorProps<State, R>): JSX.Element;
  Selectors<R extends any[]>(props: StateContextSelectorsProps<State, R>): JSX.Element;
}

export default function createStateContext<State>(
  defaultValue: State,
): StateContextInterface<State> {
  type StateTuple = ContextValue<State>;
  type StateProvider = StateContextProviderProps<State>;

  const InternalContext = createHookedContext<StateTuple, StateProvider>(
    ({ value }) => (
      React.useState(value ?? defaultValue)
    ),
  );

  function useState(): ContextValue<State> {
    return InternalContext.useValue();
  }

  function useValue(): State {
    return useState()[0];
  }

  function useSetState(): SetState<State> {
    return useState()[1];
  }

  function useSelectedState<R>(selector: (value: State) => R): [R, SetState<State>] {
    const internalSelector = useCallback(([next, dispatch]): [R, SetState<State>] => (
      [selector(next), dispatch]
    ), [selector]);

    return InternalContext.useSelectedValues(internalSelector);
  }

  function useSelectedValue<R>(selector: (value: State) => R): R {
    const internalSelector = useCallback(([next]): R => (
      selector(next)
    ), [selector]);

    return InternalContext.useSelectedValue(internalSelector);
  }

  function useSelectedStates<R extends any[]>(
    selector: (value: State) => R,
  ): [R, SetState<State>] {
    const internalSelector = useCallback(([next, dispatch]) => (
      [dispatch, ...selector(next)]
    ), [selector]);

    const values = InternalContext.useSelectedValues(internalSelector);

    return useMemo<[R, SetState<State>]>(() => {
      const [dispatch, ...states] = values;

      return [states as R, dispatch];
    }, [values]);
  }

  function useSelectedValues<R extends any[]>(selector: (value: State) => R): R {
    const internalSelector = useCallback(([next]): R => (
      selector(next)
    ), [selector]);

    return InternalContext.useSelectedValues(internalSelector);
  }

  function Provider(
    { value, children }: StateProvider,
  ): JSX.Element {
    return (
      <InternalContext.Provider value={value}>
        { children }
      </InternalContext.Provider>
    );
  }

  function Consumer({ children }: StateContextConsumerProps<State>): JSX.Element {
    const [state, setState] = useState();

    return children(state, setState);
  }

  function Selector<R>(
    { selector, children }: StateContextSelectorProps<State, R>,
  ): JSX.Element {
    const [state, setState] = useSelectedState(selector);

    return children(state, setState);
  }

  function Selectors<R extends any[]>(
    { selector, children }: StateContextSelectorsProps<State, R>,
  ): JSX.Element {
    const [state, setState] = useSelectedStates(selector);

    return children(state, setState);
  }

  return {
    Provider,
    Consumer,
    Selector,
    Selectors,

    set displayName(value: string | undefined) {
      InternalContext.displayName = value;
    },
    get displayName(): string | undefined {
      return InternalContext.displayName;
    },

    useState,
    useValue,
    useSetState,
    useSelectedState,
    useSelectedValue,
    useSelectedStates,
    useSelectedValues,
  };
}
