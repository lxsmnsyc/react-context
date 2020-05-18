import React, {
  SetStateAction, Dispatch, createContext, useContext, useEffect,
} from 'react';
import { ContextInterface } from './types';
import useConstant from './hooks/useConstant';
import Notifier from './notifier';
import MissingStateContextError from './error/missing-state-context';
import useForceUpdate from './hooks/useForceUpdate';

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

type BaseContextInterface<State> =
  ContextInterface<StateContextProviderProps<State>, StateContextConsumerProps<State>>;


type ContextValue<State> = [State, SetState<State>];

export interface StateContextInterface<State> extends BaseContextInterface<State> {
  useState(): ContextValue<State>;
  useValue(): State;
  useSetState(): SetState<State>;
  useSelectedValue<R>(selector: (value: State) => R): R;
  useSelectedState<R>(selector: (value: State) => R): [R, SetState<State>];

  Selector<R>(props: StateContextSelectorProps<State, R>): JSX.Element;
}

export default function createStateContext<State>(
  defaultValue: State,
): StateContextInterface<State> {
  const InternalContext = createContext<Notifier<ContextValue<State>> | null>(null);

  function useNotifier(): Notifier<ContextValue<State>> {
    const notifier = useContext(InternalContext);

    if (!notifier) {
      throw new MissingStateContextError(InternalContext.displayName);
    }

    return notifier;
  }

  function NotifierConsumer({ value, children }: StateContextProviderProps<State>): JSX.Element {
    const [state, setState] = React.useState<State>(value ?? defaultValue);

    const notifier = useNotifier();

    notifier.sync([state, setState]);

    useEffect(() => {
      notifier.consume([state, setState]);
    }, [notifier, state]);

    return (
      <>
        { children }
      </>
    );
  }

  function Provider({ value, children }: StateContextProviderProps<State>): JSX.Element {
    const notifier = useConstant(
      () => new Notifier<ContextValue<State>>([defaultValue, (): State => defaultValue]),
    );

    return (
      <InternalContext.Provider value={notifier}>
        <NotifierConsumer value={value}>
          { children }
        </NotifierConsumer>
      </InternalContext.Provider>
    );
  }

  function useState(): ContextValue<State> {
    const notifier = useNotifier();

    const forceUpdate = useForceUpdate();

    useEffect(() => {
      const callback = (): void => {
        forceUpdate();
      };

      notifier.on(callback);

      return (): void => notifier.off(callback);
    }, [notifier, forceUpdate]);

    return notifier.value;
  }

  function useValue(): State {
    const [state] = useState();

    return state;
  }

  function useSetState(): SetState<State> {
    return useNotifier().value[1];
  }

  function useSelectedState<R>(selector: (value: State) => R): [R, SetState<State>] {
    const notifier = useNotifier();

    const [state, setState] = React.useState(() => selector(notifier.value[0]));

    useEffect(() => {
      const callback = ([next]: ContextValue<State>): void => {
        setState(selector(next));
      };

      notifier.on(callback);

      return (): void => notifier.off(callback);
    }, [notifier, selector, setState]);

    return React.useMemo(
      () => [state, notifier.value[1]],
      [state, notifier.value],
    );
  }

  function useSelectedValue<R>(selector: (value: State) => R): R {
    const [state] = useSelectedState(selector);

    return state;
  }

  function Consumer({ children }: StateContextConsumerProps<State>): JSX.Element {
    const [state, setState] = useState();

    return children(state, setState);
  }

  function Selector<R>({ selector, children }: StateContextSelectorProps<State, R>): JSX.Element {
    const [state, setState] = useSelectedState(selector);

    return children(state, setState);
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

    useState,
    useValue,
    useSetState,
    useSelectedState,
    useSelectedValue,
  };
}
