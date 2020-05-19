export default class DesyncContextError extends Error {
  constructor(displayName?: string) {
    super(`
      Attempt to read value from context '${displayName}' with an unsynced state.
    `);
  }
}
