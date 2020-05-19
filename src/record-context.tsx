import React, {
  createContext, useContext, ReactNode, useEffect,
} from 'react';
import Notifier from './utils/notifier';
import MissingStateContextError from './error/missing-state-context';
import useConstant from './hooks/useConstant';
import { ContextInterface } from '.';

export type RecordContextProviderProps<Value extends AccessibleObject> =
  Value & { children?: ReactNode };

export interface RecordContextConsumerProps<Value extends AccessibleObject> {
  children: (value: Value) => JSX.Element;
}

export interface RecordContextSelectorProps<Value extends AccessibleObject, R> {
  selector: (value: Value) => R;
  children: (value: R) => JSX.Element;
}

interface AccessibleObject {
  [key: string]: any;
}

type BaseContextInterface<Value extends AccessibleObject> =
  ContextInterface<RecordContextProviderProps<Value>, RecordContextConsumerProps<Value>>;


export interface StateContextInterface<Value extends AccessibleObject>
extends BaseContextInterface<Value> {
  useValue(): Value;
  useSelectedValue<R>(selector: (value: Value) => R): R;
  Selector<R>(props: RecordContextSelectorProps<Value, R>): JSX.Element;
}

export default function createRecordContext<Value extends AccessibleObject>(
): StateContextInterface<Value> {
  const InternalContext = createContext<Notifier<Value> | null>(null);

  function useNotifier(): Notifier<Value> {
    const notifier = useContext(InternalContext);

    if (!notifier) {
      throw new MissingStateContextError(InternalContext.displayName);
    }

    return notifier;
  }

  function NotifierConsumer(
    { children, ...value }: RecordContextProviderProps<Value>,
  ): JSX.Element {
    const notifier = useNotifier();

    notifier.sync(value as Value);

    useEffect(() => {
      notifier.consume(value as Value);
    }, [notifier, value]);

    return (
      <>
        { children }
      </>
    );
  }

  function Provider(
    { children, ...value }: RecordContextProviderProps<Value>,
  ): JSX.Element {
    const notifier = useConstant(
      () => new Notifier<Value>({} as Value),
    );

    return (
      <InternalContext.Provider value={notifier}>
        <NotifierConsumer {...value as Value}>
          { children }
        </NotifierConsumer>
      </InternalContext.Provider>
    );
  }

  function useValue(): Value {
    const notifier = useNotifier();

    const [state, setState] = React.useState(() => notifier.value);

    useEffect(() => {
      notifier.on(setState);

      return notifier.off(setState);
    }, [notifier]);

    return state;
  }

  function useSelectedValue<R>(selector: (value: Value) => R): R {
    const notifier = useNotifier();

    const [state, setState] = React.useState(() => selector(notifier.value));

    useEffect(() => {
      const callback = (next: Value): void => {
        setState(() => selector(next));
      };

      notifier.on(callback);

      return notifier.off(callback);
    }, [notifier, selector]);

    return state;
  }

  function Consumer({ children }: RecordContextConsumerProps<Value>): JSX.Element {
    const value = useValue();

    return children(value);
  }

  function Selector<R>({ selector, children }: RecordContextSelectorProps<Value, R>): JSX.Element {
    const value = useSelectedValue(selector);

    return children(value);
  }

  return {
    Provider,
    Consumer,
    Selector,

    set displayName(value: string | undefined) {
      InternalContext.displayName = value;
    },
    get displayName(): string | undefined {
      return InternalContext.displayName;
    },

    useValue,
    useSelectedValue,
  };
}
