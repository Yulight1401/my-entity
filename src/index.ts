import { useCallback, useState, useEffect, useRef } from 'react';

// Fronted Data Access Object

/**
 * @param S 状态类型
 * @param Q 查询类型
 */
interface EntityConfig<S, Q> {
  /** 视图层初始数据 */
  state: S;
  /** 查询初始数据 */
  query?: Q;
  /** 从远端拉取接口数据 */
  pull: (q?: Q) => Promise<S>;
  /** 更新接口体，同时更新本地数据 */
  put?: (data: S) => Promise<S>;
  onError?: (error: any) => void;
  /** 订阅数据进行刷新, 默认为空，也就是挂载时自动刷新 */
  refreshDeps?: any[];
}

const mergeData = (state: any, data: any) => {
  const newState = { ...state };
  Object.entries(data).forEach(([key, item]) => {
    if (typeof newState[key] === 'object') {
      newState[key] = mergeData(state[key], item);
    } else {
      newState[key] = item;
    }
  })
  return newState;
}

interface QueryConfig {
  /** 是否需要重新请求 */
  refresh?: boolean;
}

export const useEntityData = <S, Q>(config: EntityConfig<S, Q>) => {
  const { state: initState, query: initQuery } = config;
  const [state, setState] = useState<S>(initState);
  const [query, setQd] = useState<Q | undefined>(initQuery);
  const [loading, setLoading] = useState(false);
  const [putLoading, setPutLoading] = useState(false);
  const requestCounter = useRef(0);

  /** 初始化，会调用pull方法 */
  const refresh = useCallback(async (newQd?: Q) => {
    let currentQd = newQd || query;
    setLoading(true);
    try {
      const currentRequest = ++requestCounter.current; // 增加计数器
      const data = await config.pull(currentQd);
      // 仅在当前请求是最新请求时更新状态
      if (currentRequest === requestCounter.current) {
        setState(data);
      }
    } catch (error) {
      config.onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [query])

  /** 重置视图层数据 */
  const reset = useCallback(async () => {
    setState(initState);
    setQd(initQuery);
    refresh(initQuery);
  }, [])

  useEffect(() => {
    refresh();
  }, [
    ...(config.refreshDeps || []),
  ])

  const put = useCallback(async (cf?: QueryConfig) => {
    if (!config?.put) {
      return;
    }
    try {
      const currentRequest = ++requestCounter.current; // 增加计数器
      const data = await config?.put(state);
      if (cf?.refresh) {
        refresh();
      }
      // 仅在当前请求是最新请求时更新状态
      if (currentRequest === requestCounter.current) {
        setState(data);
      }
    } catch (error) {
      config.onError?.(error);
    } finally {
      setPutLoading(false);
    }
  }, [state]);

  const setQueryData = useCallback((newQ: Partial<Q>, cf?: QueryConfig) => {
    const newQd = mergeData(query, newQ);
    setQd(newQd);
    if (cf?.refresh) {
      refresh(newQd);
    }
  }, [query])

  const createQueryChange = useCallback((field: string, cf?: QueryConfig) => {
    return (value: any) => {
      setQueryData({
        [field]: value,
      } as any, cf);
    }
  }, [setQueryData])


  const createStateChange = useCallback((field: string, cf?: QueryConfig) => {
    return (value: any) => {
      const data = {
        [field]: value,
      };
      const newState = mergeData(state, data)
      setState(newState as any);
      if (cf?.refresh) {
        refresh();
      }
    }
  }, [state])


  return {
    /** 只储存接口数据，其余视图层数据可以由computed计算 */
    state,
    /** 存储查询的数据状态 */
    query,
    loading,
    putLoading,
    setQueryData,
    setState,
    createQueryChange,
    createStateChange,
    put,
    reset,
    refresh,
  }
}
