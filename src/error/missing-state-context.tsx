export default class MissingContextError extends Error {
  constructor(displayName?: string) {
    super(`
      Attempt to read value from context '${displayName}',
      make sure that the context provider is being used and is mounted
      in the component tree.
    `);
  }
}
