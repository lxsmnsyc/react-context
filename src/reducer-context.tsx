import React, {
  Dispatch, createContext, useContext, useEffect, Reducer,
} from 'react';
import { ContextInterface } from './types';
import useConstant from './hooks/useConstant';
import Notifier from './utils/notifier';
import MissingStateContextError from './error/missing-state-context';
import useForceUpdate from './hooks/useForceUpdate';
import didDependencyChange from './utils/did-dependency-change';

export interface ReducerContextProviderProps<State> {
  value?: State;
  children?: React.ReactNode;
}

export interface ReducerContextConsumerProps<State, Action> {
  children: (value: State, set: Dispatch<Action>) => JSX.Element;
}
export interface ReducerContextSelectorProps<State, R, Action> {
  selector: (value: State) => R;
  children: (value: R, set: Dispatch<Action>) => JSX.Element;
}

export interface ReducerContextSelectorsProps<State, R extends any[], Action> {
  selector: (value: State) => R;
  children: (value: R, set: Dispatch<Action>) => JSX.Element;
}

type BaseContextInterface<State, Action> =
  ContextInterface<
    ReducerContextProviderProps<State>,
    ReducerContextConsumerProps<State, Action>
  >;

type ContextValue<State, Action> = [State, Dispatch<Action>];

export interface ReducerContextInterface<State, Action>
  extends BaseContextInterface<State, Action> {
  useState(): ContextValue<State, Action>;
  useValue(): State;
  useDispatch(): Dispatch<Action>;
  useSelectedValue<R>(selector: (value: State) => R): R;
  useSelectedState<R>(selector: (value: State) => R): [R, Dispatch<Action>];
  useSelectedValues<R extends any[]>(selector: (value: State) => R): R;
  useSelectedStates<R extends any[]>(selector: (value: State) => R): [R, Dispatch<Action>];

  Selector<R>(props: ReducerContextSelectorProps<State, R, Action>): JSX.Element;
  Selectors<R extends any[]>(props: ReducerContextSelectorsProps<State, R, Action>): JSX.Element;
}

export default function createReducerContext<State, Action>(
  reducer: Reducer<State, Action>,
  defaultValue: State,
): ReducerContextInterface<State, Action> {
  const InternalContext = createContext<Notifier<ContextValue<State, Action>> | null>(null);

  function useNotifier(): Notifier<ContextValue<State, Action>> {
    const notifier = useContext(InternalContext);

    if (!notifier) {
      throw new MissingStateContextError(InternalContext.displayName);
    }

    return notifier;
  }

  function NotifierConsumer(
    { value, children }: ReducerContextProviderProps<State>,
  ): JSX.Element {
    const [state, dispatch] = React.useReducer(
      reducer,
      value ?? defaultValue,
    );

    const notifier = useNotifier();

    notifier.sync([state, dispatch]);

    useEffect(() => {
      notifier.consume([state, dispatch]);
    }, [notifier, state]);

    return (
      <>
        { children }
      </>
    );
  }

  function Provider(
    { value, children }: ReducerContextProviderProps<State>,
  ): JSX.Element {
    const notifier = useConstant(
      () => new Notifier<ContextValue<State, Action>>([defaultValue, (): State => defaultValue]),
    );

    return (
      <InternalContext.Provider value={notifier}>
        <NotifierConsumer value={value}>
          { children }
        </NotifierConsumer>
      </InternalContext.Provider>
    );
  }

  function useState(): ContextValue<State, Action> {
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

  function useDispatch(): Dispatch<Action> {
    return useNotifier().value[1];
  }

  function useSelectedState<R>(selector: (value: State) => R): [R, Dispatch<Action>] {
    const notifier = useNotifier();

    const [state, setState] = React.useState(() => selector(notifier.value[0]));

    useEffect(() => {
      const callback = ([next]: ContextValue<State, Action>): void => {
        setState(() => selector(next));
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

  function useSelectedStates<R extends any[]>(
    selector: (value: State) => R,
  ): [R, Dispatch<Action>] {
    const notifier = useNotifier();

    const [state, setState] = React.useState(() => selector(notifier.value[0]));

    useEffect(() => {
      const callback = ([next]: ContextValue<State, Action>): void => {
        const selected = selector(next);

        setState((prev) => (didDependencyChange(prev, selected) ? selected : prev));
      };

      notifier.on(callback);

      return (): void => notifier.off(callback);
    }, [notifier, selector, setState]);

    return React.useMemo(
      () => [state, notifier.value[1]],
      [state, notifier.value],
    );
  }

  function useSelectedValues<R extends any[]>(selector: (value: State) => R): R {
    const [state] = useSelectedStates(selector);

    return state;
  }

  function Consumer({ children }: ReducerContextConsumerProps<State, Action>): JSX.Element {
    const [state, setState] = useState();

    return children(state, setState);
  }

  function Selector<R>(
    { selector, children }: ReducerContextSelectorProps<State, R, Action>,
  ): JSX.Element {
    const [state, setState] = useSelectedState(selector);

    return children(state, setState);
  }

  function Selectors<R extends any[]>(
    { selector, children }: ReducerContextSelectorsProps<State, R, Action>,
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
    useDispatch,
    useSelectedState,
    useSelectedValue,
    useSelectedStates,
    useSelectedValues,
  };
}
