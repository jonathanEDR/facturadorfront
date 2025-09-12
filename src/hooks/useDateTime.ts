/**
 * Hook personalizado para manejo de fecha y hora con timezone de Perú
 */
import { useState, useEffect, useCallback } from 'react';
import { DateTimeManager } from '@/utils/datetime';

export interface UseDateTimeReturn {
  currentTime: Date;
  peruTime: Date;
  formatForDisplay: (date?: Date | string, includeTime?: boolean) => string;
  formatForBackend: (date?: Date | string) => string;
  formatForSunat: (date?: Date | string) => string;
  isBusinessHours: (date?: Date | string) => boolean;
  refresh: () => void;
}

/**
 * Hook para obtener y manejar fechas/horas con timezone de Perú
 */
export function useDateTime(autoRefresh: boolean = true, refreshInterval: number = 1000): UseDateTimeReturn {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [peruTime, setPeruTime] = useState<Date>(DateTimeManager.nowPeru());

  const refresh = useCallback(() => {
    const now = new Date();
    setCurrentTime(now);
    setPeruTime(DateTimeManager.nowPeru());
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refresh]);

  const formatForDisplay = useCallback((date?: Date | string, includeTime?: boolean) => {
    return DateTimeManager.formatForDisplay(date, includeTime);
  }, []);

  const formatForBackend = useCallback((date?: Date | string) => {
    return DateTimeManager.formatForBackend(date);
  }, []);

  const formatForSunat = useCallback((date?: Date | string) => {
    return DateTimeManager.formatForSunat(date);
  }, []);

  const isBusinessHours = useCallback((date?: Date | string) => {
    return DateTimeManager.isBusinessHours(date);
  }, []);

  return {
    currentTime,
    peruTime,
    formatForDisplay,
    formatForBackend,
    formatForSunat,
    isBusinessHours,
    refresh,
  };
}

/**
 * Hook para formatear fechas de manera reactiva
 */
export function useDateFormatter() {
  return {
    formatForDisplay: DateTimeManager.formatForDisplay,
    formatForBackend: DateTimeManager.formatForBackend,
    formatForSunat: DateTimeManager.formatForSunat,
    formatForFilename: DateTimeManager.formatForFilename,
    parseISOString: DateTimeManager.parseISOString,
  };
}

/**
 * Hook para validaciones de tiempo
 */
export function useTimeValidation() {
  return {
    isBusinessHours: DateTimeManager.isBusinessHours,
    isSameDay: DateTimeManager.isSameDay,
    daysDifference: DateTimeManager.daysDifference,
    startOfDay: DateTimeManager.startOfDay,
    endOfDay: DateTimeManager.endOfDay,
  };
}
