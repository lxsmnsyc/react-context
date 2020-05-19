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

type BaseContextInterface<State, Props> =
  ContextInterface<
    AsyncContextProviderProps<Props>,
    AsyncContextConsumerProps<State>
  >;

export interface AsyncContextInterface<State, Props> extends BaseContextInterface<State, Props> {
  useValue(): AsyncState<State>;
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

  return {
    Provider,
    Consumer,

    set displayName(value: string | undefined) {
      InternalContext.displayName = value;
    },
    get displayName(): string | undefined {
      return InternalContext.displayName;
    },

    useValue,
  };
}
