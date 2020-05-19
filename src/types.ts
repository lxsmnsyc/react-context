export interface ContextInterface<P, C> {
  Provider(props: P): JSX.Element;
  Consumer(props: C): JSX.Element;
  displayName?: string;
}
