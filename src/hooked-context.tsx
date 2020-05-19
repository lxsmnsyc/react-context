import React, {
  createContext, useContext, useEffect, PropsWithChildren,
} from 'react';
import { ContextInterface, AccessibleObject } from './types';
import useConstant from './hooks/useConstant';
import Notifier from './utils/notifier';
import MissingStateContextError from './error/missing-state-context';
import useForceUpdate from './hooks/useForceUpdate';
import didDependencyChange from './utils/did-dependency-change';
import DesyncContextError from './error/desync-hooked-context';

export type HookedContextProviderProps<Props extends AccessibleObject> =
  PropsWithChildren<Props>

export interface HookedContextConsumerProps<State> {
  children: (value: State) => JSX.Element;
}

export interface HookedContextSelectorProps<State, R> {
  selector: (value: State) => R;
  children: (value: R) => JSX.Element;
}

export interface HookedContextSelectorsProps<State, R extends any[]> {
  selector: (value: State) => R;
  children: (value: R) => JSX.Element;
}

type BaseContextInterface<State, Props> =
  ContextInterface<
    HookedContextProviderProps<Props>,
    HookedContextConsumerProps<State>
  >;

export interface HookedContextInterface<State, Props> extends BaseContextInterface<State, Props> {
  useValue(): State;
  useSelectedValue<R>(selector: (value: State) => R): R;
  useSelectedValues<R extends any[]>(selector: (value: State) => R): R;

  Selector<R>(props: HookedContextSelectorProps<State, R>): JSX.Element;
  Selectors<R extends any[]>(props: HookedContextSelectorsProps<State, R>): JSX.Element;
}

interface Ref<T> {
  current: T;
}

export default function createHookedContext<State, Props extends AccessibleObject = {}>(
  useHook: (props: Props) => State,
): HookedContextInterface<State, Props> {
  const InternalContext = createContext<Notifier<Ref<State> | null> | null>(null);

  function useNotifier(): Notifier<Ref<State> | null> {
    const notifier = useContext(InternalContext);

    if (!notifier) {
      throw new MissingStateContextError(InternalContext.displayName);
    }

    return notifier;
  }

  function useNotifierValue(notifier: Notifier<Ref<State> | null>): State {
    if (notifier.value == null) {
      throw new DesyncContextError(InternalContext.displayName);
    }

    return notifier.value.current;
  }

  function NotifierConsumer(
    { children, ...props }: HookedContextProviderProps<Props>,
  ): JSX.Element {
    const notifier = useNotifier();

    const current = useHook(props as Props);

    notifier.sync({ current });

    useEffect(() => {
      notifier.consume({ current });
    }, [notifier, current]);

    return (
      <>
        { children }
      </>
    );
  }

  function Provider(
    { children, ...props }: HookedContextProviderProps<Props>,
  ): JSX.Element {
    const notifier = useConstant(
      () => new Notifier<Ref<State> | null>(null),
    );

    return (
      <InternalContext.Provider value={notifier}>
        <NotifierConsumer {...props as Props}>
          { children }
        </NotifierConsumer>
      </InternalContext.Provider>
    );
  }

  function useValue(): State {
    const notifier = useNotifier();

    const forceUpdate = useForceUpdate();

    useEffect(() => {
      const callback = (): void => {
        forceUpdate();
      };

      notifier.on(callback);

      return (): void => notifier.off(callback);
    }, [notifier, forceUpdate]);

    return useNotifierValue(notifier);
  }

  function useSelectedValue<R>(selector: (value: State) => R): R {
    const notifier = useNotifier();

    const currentValue = useNotifierValue(notifier);

    const [state, setState] = React.useState(() => selector(currentValue));

    useEffect(() => {
      const callback = (value: Ref<State> | null): void => {
        if (value == null) {
          throw new DesyncContextError(InternalContext.displayName);
        }
        setState(() => selector(value.current));
      };

      notifier.on(callback);

      return (): void => notifier.off(callback);
    }, [notifier, selector, setState]);

    return state;
  }

  function useSelectedValues<R extends any[]>(selector: (value: State) => R): R {
    const notifier = useNotifier();

    const currentValue = useNotifierValue(notifier);

    const [state, setState] = React.useState(() => selector(currentValue));

    useEffect(() => {
      const callback = (value: Ref<State> | null): void => {
        if (value == null) {
          throw new DesyncContextError(InternalContext.displayName);
        }
        const selected = selector(value.current);
        setState((prev) => (
          didDependencyChange(prev, selected)
            ? selected
            : prev
        ));
      };

      notifier.on(callback);

      return (): void => notifier.off(callback);
    }, [notifier, selector, setState]);

    return state;
  }

  function Consumer({ children }: HookedContextConsumerProps<State>): JSX.Element {
    const state = useValue();

    return children(state);
  }

  function Selector<R>(
    { selector, children }: HookedContextSelectorProps<State, R>,
  ): JSX.Element {
    const state = useSelectedValue(selector);

    return children(state);
  }

  function Selectors<R extends any[]>(
    { selector, children }: HookedContextSelectorsProps<State, R>,
  ): JSX.Element {
    const state = useSelectedValue(selector);

    return children(state);
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
