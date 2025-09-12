import { useState, useCallback, useRef, useEffect } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiCallState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface UseOptimizedApiOptions {
  cacheKey?: string;
  cacheDuration?: number; // en milisegundos
  enableCache?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

// Cache global para datos de API
const globalCache = new Map<string, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  timestamp: number;
  expiresAt: number;
}>();

/**
 * Hook optimizado para llamadas API con cache, retry y manejo de estado
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useOptimizedApi<T = any>(
  options: UseOptimizedApiOptions = {}
) {
  const {
    cacheKey = '',
    cacheDuration = 5 * 60 * 1000, // 5 minutos por defecto
    enableCache = true,
    retryAttempts = 3,
    retryDelay = 1000
  } = options;

  const [state, setState] = useState<ApiCallState<T>>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Limpiar recursos al desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Función para obtener datos del cache
  const getCachedData = useCallback((key: string): T | null => {
    if (!enableCache || !key) return null;
    
    const cached = globalCache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiresAt) {
      globalCache.delete(key);
      return null;
    }

    return cached.data;
  }, [enableCache]);

  // Función para guardar datos en cache
  const setCachedData = useCallback((key: string, data: T) => {
    if (!enableCache || !key) return;
    
    globalCache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + cacheDuration
    });
  }, [enableCache, cacheDuration]);

  // Función principal para ejecutar API calls
  const execute = useCallback(async <TResult = T>(
    apiCall: (signal?: AbortSignal) => Promise<TResult>,
    options: {
      useCache?: boolean;
      cacheKey?: string;
      onSuccess?: (data: TResult) => void;
      onError?: (error: Error) => void;
      skipLoading?: boolean;
    } = {}
  ): Promise<TResult | null> => {
    const {
      useCache = enableCache,
      cacheKey: callCacheKey = cacheKey,
      onSuccess,
      onError,
      skipLoading = false
    } = options;

    // Verificar cache primero
    if (useCache && callCacheKey) {
      const cachedData = getCachedData(callCacheKey);
      if (cachedData) {
        setState(prev => ({
          ...prev,
          data: cachedData,
          loading: false,
          error: null
        }));
        return cachedData as TResult;
      }
    }

    // Cancelar request anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    if (!skipLoading) {
      setState(prev => ({
        ...prev,
        loading: true,
        error: null
      }));
    }

    let lastError: Error | null = null;

    // Función de retry con backoff exponencial
    const attemptCall = async (attempt: number): Promise<TResult | null> => {
      try {
        const result = await apiCall(abortControllerRef.current?.signal);
        
        // Guardar en cache
        if (useCache && callCacheKey) {
          setCachedData(callCacheKey, result as T);
        }

        setState(prev => ({
          ...prev,
          data: result as T,
          loading: false,
          error: null,
          lastUpdated: new Date()
        }));

        onSuccess?.(result);
        return result;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Error desconocido');
        
        // Si es el último intento o es un error de cancelación, no reintentar
        if (attempt >= retryAttempts || lastError.name === 'AbortError') {
          setState(prev => ({
            ...prev,
            loading: false,
            error: lastError?.message || 'Error desconocido'
          }));

          onError?.(lastError);
          return null;
        }

        // Esperar antes del siguiente intento (backoff exponencial)
        const delay = retryDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => {
          retryTimeoutRef.current = setTimeout(resolve, delay);
        });

        return attemptCall(attempt + 1);
      }
    };

    return attemptCall(1);
  }, [
    enableCache,
    cacheKey,
    cacheDuration,
    retryAttempts,
    retryDelay,
    getCachedData,
    setCachedData
  ]);

  // Función para limpiar el estado
  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      lastUpdated: null
    });
  }, []);

  // Función para invalidar cache
  const invalidateCache = useCallback((key?: string) => {
    const keyToInvalidate = key || cacheKey;
    if (keyToInvalidate) {
      globalCache.delete(keyToInvalidate);
    }
  }, [cacheKey]);

  // Función para limpiar todo el cache
  const clearAllCache = useCallback(() => {
    globalCache.clear();
  }, []);

  return {
    ...state,
    execute,
    reset,
    invalidateCache,
    clearAllCache,
    isLoading: state.loading,
    hasError: !!state.error,
    hasData: !!state.data,
    cacheSize: globalCache.size
  };
}

/**
 * Hook para manejar múltiples estados de loading
 */
export function useLoadingStates() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading
    }));
  }, []);

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);

  const clearAll = useCallback(() => {
    setLoadingStates({});
  }, []);

  return {
    setLoading,
    isLoading,
    isAnyLoading,
    clearAll,
    loadingStates
  };
}

/**
 * Hook para debounce de funciones
 */
export function useDebounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedFunc = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      func(...args);
    }, delay);
  }, [func, delay]) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedFunc;
}

/**
 * Hook para throttle de funciones
 */
export function useThrottle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  const lastCallRef = useRef<number>(0);

  const throttledFunc = useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCallRef.current >= delay) {
      lastCallRef.current = now;
      func(...args);
    }
  }, [func, delay]) as T;

  return throttledFunc;
}
