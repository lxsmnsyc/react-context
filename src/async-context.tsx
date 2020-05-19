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
  PropsWithChildren, useState, useEffect, DependencyList,
} from 'react';
import {
  AccessibleObject, ContextInterface, AsyncState,
} from './types';
import createHookedContext from './hooked-context';

export type AsyncContextProviderProps<Props extends AccessibleObject> =
  PropsWithChildren<Props>

export interface AsyncContextConsumerProps<State> {
  children: (value: AsyncState<State>) => JSX.Element;
}
export interface AsyncContextSelectorProps<State, R> {
  selector: (value: AsyncState<State>) => R;
  children: (value: R) => JSX.Element;
}

export interface AsyncContextSelectorsProps<State, R extends any[]> {
  selector: (value: AsyncState<State>) => R;
  children: (value: R) => JSX.Element;
}

type BaseContextInterface<State, Props> =
  ContextInterface<
    AsyncContextProviderProps<Props>,
    AsyncContextConsumerProps<State>
  >;

export interface AsyncContextInterface<State, Props> extends BaseContextInterface<State, Props> {
  useValue(): AsyncState<State>;
  useSelectedValue<R>(selector: (value: AsyncState<State>) => R): R;
  useSelectedValues<R extends any[]>(selector: (value: AsyncState<State>) => R): R;

  Selector<R>(props: AsyncContextSelectorProps<State, R>): JSX.Element;
  Selectors<R extends any[]>(props: AsyncContextSelectorsProps<State, R>): JSX.Element;
}

export default function createAsyncContext<State, Props extends AccessibleObject = {}>(
  supplier: (props: Props) => Promise<State>,
  mapToDependencies: (props: Props) => DependencyList,
): AsyncContextInterface<State, Props> {
  const InternalContext = createHookedContext<AsyncState<State>, Props>((props) => {
    const [state, setState] = useState<AsyncState<State>>({ status: 'pending' });

    useEffect(() => {
      setState({ status: 'pending' });

      let mounted = true;

      supplier(props)
        .then(
          (data) => {
            if (mounted) {
              setState({ data, status: 'success' });
            }
          },
          (data) => {
            if (mounted) {
              setState({ data, status: 'failure' });
            }
          },
        );

      return (): void => {
        mounted = false;
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, mapToDependencies(props));

    return state;
  });

  function useValue(): AsyncState<State> {
    return InternalContext.useValue();
  }

  function useSelectedValue<R>(selector: (value: AsyncState<State>) => R): R {
    return InternalContext.useSelectedValue(selector);
  }

  function useSelectedValues<R extends any[]>(selector: (value: AsyncState<State>) => R): R {
    return InternalContext.useSelectedValues(selector);
  }

  function Consumer(
    { children }: AsyncContextConsumerProps<State>,
  ): JSX.Element {
    const state = useValue();

    return children(state);
  }

  function Provider(
    { children, ...props }: AsyncContextProviderProps<Props>,
  ): JSX.Element {
    return (
      <InternalContext.Provider {...props as Props}>
        { children }
      </InternalContext.Provider>
    );
  }

  function Selector<R>(
    { selector, children }: AsyncContextSelectorProps<State, R>,
  ): JSX.Element {
    const value = useSelectedValue(selector);

    return children(value);
  }

  function Selectors<R extends any[]>(
    { selector, children }: AsyncContextSelectorsProps<State, R>,
  ): JSX.Element {
    const value = useSelectedValues(selector);

    return children(value);
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

    useValue,
    useSelectedValue,
    useSelectedValues,
  };
}
