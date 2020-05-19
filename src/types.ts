
export interface AccessibleObject {
  [key: string]: any;
}

export interface ContextInterface<P, C> {
  Provider(props: P): JSX.Element;
  Consumer(props: C): JSX.Element;
  displayName?: string;
}

interface AsyncPending {
  data?: undefined;
  status: 'pending';
}

interface AsyncSuccess<T> {
  data: T;
  status: 'success';
}

interface AsyncFailure {
  data: any;
  status: 'failure';
}

export type AsyncState<T> = AsyncPending | AsyncSuccess<T> | AsyncFailure;
export type AsyncStatus<T> = AsyncState<T>['status'];
export type AsyncData<T> = AsyncState<T>['data'];
