import { Effect } from "effect";
import { useEffect, useState } from "react";

type AsyncState<T> =
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: unknown };

export function useEffectQuery<T>(program: Effect.Effect<T, unknown, never>): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    Effect.runPromise(program).then(
      (data) => {
        if (!cancelled) {
          setState({ status: "success", data });
        }
      },
      (error: unknown) => {
        if (!cancelled) {
          setState({ status: "error", error });
        }
      }
    );

    return () => {
      cancelled = true;
    };
  }, [program]);

  return state;
}
