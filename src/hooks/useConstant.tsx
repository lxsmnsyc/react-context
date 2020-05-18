import { useRef } from 'react';

interface Value<T> {
  value: T;
}

export default function useConstant<T>(supplier: () => T): T {
  const ref = useRef<Value<T> | undefined>();

  if (ref.current == null) {
    ref.current = {
      value: supplier(),
    };
  }

  return ref.current.value;
}
