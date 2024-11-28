import React, { useCallback, useState, useEffect, useRef } from 'react';

// Fronted Data Access Object

type PostReturnType<S> = Promise<S | void> | void;

/**
 * @param S 状态类型
 * @param Q 查询类型
 */
interface EntityConfig<S = Record<string, any>, Q = Record<string, any>> {
  /** 视图层初始数据 */
  state?: S;
  /** 查询初始数据 */
  query?: Q;
  /** 从远端拉取接口数据 */
  pull?: (q?: Q) => Promise<S>;
  /** 更新接口体，同时更新本地数据 */
  put?: (data?: S) => PostReturnType<S>;
  /** 创建接口体，同时更新本地数据 */
  create?: (data?: S) => PostReturnType<S>;
  /** 删除实体， 同时更新本地数据 */
  delete?: (data?: S) => PostReturnType<S>;
  onError?: (error: any) => void;
  /** 订阅数据进行刷新, 默认为null，任何时候都不自动刷新。 传空数组，则挂载时自动刷新 */
  refreshDeps?: any[] | null;
  /** 是否吞掉报错 */
  noEmitError?: boolean;
}

const mergeData = (state: any = {}, data: any = {}) => {
  const newState = { ...state };
  
  // data 进行了清空
  if (data === undefined || data === null || state === undefined || state === null) {
    return data;
  }
  
  Object.entries(data).forEach(([key, item]) => {
    if (
      typeof newState[key] === 'object' && 
      typeof item === 'object' && 
      !Array.isArray(newState[key]) && 
      !Array.isArray(item)
    ) {
      // 如果两个都是对象（且不是数组），则递归合并对象
      newState[key] = mergeData(state[key], item);
    } else {
      // 否则，直接赋值
      newState[key] = item;
    }
  });
  
  return newState;
};

type PutMethod = 'put' | 'create' | 'delete';

interface QueryConfig {
  /** 是否需要重新请求 */
  refresh?: boolean;
}

export const useEntityData = <S, Q>(config: EntityConfig<S, Q>) => {
  const { state: initState, query: initQuery, refreshDeps = null, noEmitError = false } = config;
  const [state, _setState] = useState<S | undefined>(initState);
  const [newState, _setNewState] = useState<S | undefined>(initState);
  const [query, setQd] = useState<Q | undefined>(initQuery);
  const [loading, setLoading] = useState(false);
  const [putLoading, setPutLoading] = useState(false);
  const requestCounter = useRef(0);
  const newStateRef = useRef(newState);
  newStateRef.current = newState;

  const setNewState = useCallback((data?: Partial<S>) => {
    const nextState = mergeData(newStateRef.current, data);
    _setNewState(nextState);
    newStateRef.current = nextState;
  }, [])

  /** 直接设置视图层数据 */
  const setAllState = useCallback((data?: S) => {
    _setState(data);
    _setNewState(data);
    newStateRef.current = data;
  }, []);

  /** 初始化，会调用pull方法 */
  const refresh = useCallback(async (newQd?: Q) => {
    if (!config.pull) {
      console.warn('pull is not defined')
      return;
    }
    const currentQd = newQd || query;
    setLoading(true);
    try {
      const currentRequest = ++requestCounter.current; // 增加计数器
      const data = await config.pull(currentQd);
      // 仅在当前请求是最新请求时更新状态
      if (currentRequest === requestCounter.current) {
        setAllState(data);
      }
    } catch (error) {
      config.onError?.(error);
      if (!noEmitError) {
        throw error;
      }
    } finally {
      setLoading(false);
    }
  }, [query])

  /** 重置视图层数据 */
  const reset = useCallback(async (cf?: QueryConfig) => {
    setAllState(initState);
    setQd(initQuery);
    if (cf?.refresh) {
      refresh(initQuery);
    }
  }, [])

  useEffect(() => {
    if (refreshDeps === null) {
      return;
    }
    refresh();
  }, [
    ...(refreshDeps || []),
  ])

  const postReq = useCallback(async (key: PutMethod, cf?: QueryConfig) => {
    if (!config?.[key]) {
      console.warn(`${key} is not defined`)
      return;
    }
    setPutLoading(true);
    try {
      const currentState = newStateRef.current;
      const currentRequest = ++requestCounter.current; // 增加计数器
      const data = await config?.[key](currentState);
      if (cf?.refresh) {
        refresh();
      }
      // 仅在当前请求是最新请求时更新状态
      if (currentRequest === requestCounter.current && data) {
        setAllState(data);
      }
    } catch (error) {
      config.onError?.(error);
    } finally {
      setPutLoading(false);
    }
  }, [newState]);


  const mergeStateData = useCallback((data: Partial<S>, action?: PutMethod, cf?: QueryConfig) => {
    return new Promise((res, rej) => {
      setNewState(data);
      if (action) {
        postReq(action, cf).then(res).catch(rej);
      }
    })
  }, [postReq, newState]);

  const create = useCallback(async (cf?: QueryConfig) => {
    if (!config?.create) {
      return;
    }
    postReq('create', cf);
  }, [postReq]);

  const put = useCallback(async (cf?: QueryConfig) => {
    if (!config?.put) {
      return;
    }
    postReq('put', cf);
  }, [postReq]);

  const del = useCallback(async (cf?: QueryConfig) => {
    if (!config?.delete) {
      return;
    }
    postReq('delete', cf);
  }, [postReq]);

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


  const createStateChange = useCallback((field: keyof S) => {
    return (value: any) => {
      const data = {
        [field]: value,
      };
      mergeStateData(data as any);
    }
  }, [state])


  return {
    /** 只储存接口数据, 只能通过pull、put、create、del接口改变，其余视图层数据可以由computed计算 */
    state,
    /** 储存 setState 改变后的 新数据 */
    newState,
    /** 存储查询的数据状态 */
    query,
    loading,
    putLoading,
    setQueryData,
    /** 合并state */
    setState: mergeStateData,
    createQueryChange,
    createStateChange,
    put,
    create,
    del,
    reset,
    refresh,
  }
}


export function createEntityContext <S, Q>() {
  const Context = React.createContext<ReturnType<typeof useEntityData<S, Q>> | undefined>(undefined);

  return {
    Provider: Context.Provider,
    useContext: () => {
      return React.useContext(Context);
    }
  };
}