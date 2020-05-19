export default function didDependencyChange<L extends any[], R extends any[]>(a: L, b: R): boolean {
  if (Object.is(a, b)) {
    return false;
  }

  if (a.length !== b.length) {
    return true;
  }

  for (let i = 0; i < a.length; i += 1) {
    if (!Object.is(a[i], b[i])) {
      return true;
    }
  }

  return false;
}
