import { useEffect } from "react";

export function useDebounceEffect(
  fn: () => void,
  waitTime: number,
  dependencies?: any
) {
  useEffect(() => {
    const t = setTimeout(() => {
      fn();
    }, waitTime);

    return () => {
      clearTimeout(t);
    };
  }, dependencies);
}
