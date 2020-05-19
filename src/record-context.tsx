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
import React, { PropsWithChildren } from 'react';
import createHookedContext from './hooked-context';
import { ContextInterface, AccessibleObject } from './types';

export type RecordContextProviderProps<Value extends AccessibleObject> = PropsWithChildren<Value>;

export interface RecordContextConsumerProps<Value extends AccessibleObject> {
  children: (value: Value) => JSX.Element;
}

export interface RecordContextSelectorProps<Value extends AccessibleObject, R> {
  selector: (value: Value) => R;
  children: (value: R) => JSX.Element;
}

export interface RecordContextSelectorsProps<Value extends AccessibleObject, R extends any[]> {
  selector: (value: Value) => R;
  children: (value: R) => JSX.Element;
}


type BaseContextInterface<Value extends AccessibleObject> =
  ContextInterface<RecordContextProviderProps<Value>, RecordContextConsumerProps<Value>>;


export interface RecordContextInterface<Value extends AccessibleObject>
extends BaseContextInterface<Value> {
  useValue(): Value;
  useSelectedValue<R>(selector: (value: Value) => R): R;
  useSelectedValues<R extends any[]>(selector: (value: Value) => R): R;

  Selector<R>(props: RecordContextSelectorProps<Value, R>): JSX.Element;
  Selectors<R extends any[]>(props: RecordContextSelectorsProps<Value, R>): JSX.Element;
}

export default function createRecordContext<Value extends AccessibleObject>(
): RecordContextInterface<Value> {
  const InternalContext = createHookedContext<Value, Value>((props) => props);

  function useValue(): Value {
    return InternalContext.useValue();
  }

  function useSelectedValue<R>(selector: (value: Value) => R): R {
    return InternalContext.useSelectedValue(selector);
  }

  function useSelectedValues<R extends any[]>(selector: (value: Value) => R): R {
    return InternalContext.useSelectedValues(selector);
  }

  function Provider(
    { children, ...props }: RecordContextProviderProps<Value>,
  ): JSX.Element {
    return (
      <InternalContext.Provider {...props as Value}>
        { children }
      </InternalContext.Provider>
    );
  }

  function Consumer(
    { children }: RecordContextConsumerProps<Value>,
  ): JSX.Element {
    const value = useValue();

    return children(value);
  }

  function Selector<R>(
    { selector, children }: RecordContextSelectorProps<Value, R>,
  ): JSX.Element {
    const value = useSelectedValue(selector);

    return children(value);
  }

  function Selectors<R extends any[]>(
    { selector, children }: RecordContextSelectorsProps<Value, R>,
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
