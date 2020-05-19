export default class Notifier<T> {
  private currentValue: T;

  private listeners: Set<(value: T) => void>;

  constructor(defaultValue: T) {
    this.currentValue = defaultValue;

    this.listeners = new Set();
  }

  on(callback: (value: T) => void): void {
    this.listeners.add(callback);
  }

  off(callback: (value: T) => void): void {
    this.listeners.delete(callback);
  }

  consume(value: T): void {
    this.currentValue = value;
    new Set(this.listeners).forEach((cb) => cb(value));
  }

  sync(value: T): void {
    this.currentValue = value;
  }

  get value(): T {
    return this.currentValue;
  }
}
