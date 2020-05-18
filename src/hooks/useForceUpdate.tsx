import { useState } from 'react';
import useConstant from './useConstant';

export default function useForceUpdate(): () => void {
  const [, setState] = useState({});

  return useConstant(() => (): void => setState({}));
}
