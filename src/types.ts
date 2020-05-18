export interface ContextInterface<P, C> {
  Provider: React.FC<P>;
  Consumer: React.FC<C>;
  displayName?: string;
}
