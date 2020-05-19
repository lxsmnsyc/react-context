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
