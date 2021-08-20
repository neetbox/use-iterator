import { useCallback, useMemo, useReducer } from 'react';

export interface BaseUseIteratorResponse<TReturn, TNext> {
  next: (...args: TNext extends undefined ? [] : [TNext]) => void;
  return: (arg: TReturn) => void;
  throw: (arg: unknown) => void;
}

export interface UseIteratorIncompleteResponse<T, TReturn, TNext>
  extends BaseUseIteratorResponse<TReturn, TNext> {
  done: false | undefined;
  value: T;
}

export interface UseIteratorCompleteResponse<TReturn, TNext>
  extends BaseUseIteratorResponse<TReturn, TNext> {
  done: true;
  value: TReturn;
}

export type UseIteratorResponse<T, TReturn, TNext> =
  | UseIteratorIncompleteResponse<T, TReturn, TNext>
  | UseIteratorCompleteResponse<TReturn, TNext>;

type ReducerState<T, TReturn> = {
  value: T | TReturn;
  done?: boolean;
};

const reducer = <T, TReturn>(
  s: ReducerState<T, TReturn>,
  v: Partial<ReducerState<T, TReturn>>,
): ReducerState<T, TReturn> => {
  const next = { ...s, ...v };
  return next;
};

export const useIterator = <T, TReturn = void, TNext = undefined>(
  iterator: Iterator<T, TReturn, TNext>,
): UseIteratorResponse<T, TReturn, TNext> => {
  const initialState = useMemo(() => iterator.next(), []);
  const [result, dispatch] = useReducer(reducer, initialState);

  const next = useCallback(
    (next?: TNext) => {
      const res = iterator.next(next as TNext);
      dispatch(res);
    },
    [iterator, dispatch],
  );

  const return_ = useCallback(
    (value: TReturn) => {
      const res = iterator.return?.(value);
      if (res == null) return;
      dispatch(res);
    },
    [iterator, dispatch],
  );

  const throw_ = useCallback(
    (error: unknown) => {
      const res = iterator.throw?.(error);
      if (res == null) return;
      dispatch(res);
    },
    [iterator, dispatch],
  );

  return useMemo(
    () => ({
      done: result.done,
      value: result.value as T,
      next,
      return: return_,
      throw: throw_,
    }),
    [result, next, return_, throw_],
  ) as UseIteratorResponse<T, TReturn, TNext>;
};
