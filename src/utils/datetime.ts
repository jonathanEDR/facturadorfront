/**
 * Utilidades centralizadas para manejo de fecha y hora en Perú (Frontend)
 * Proporciona funciones consistentes para timezone, formateo y sincronización
 */

// Zona horaria de Perú (UTC-5)
export const PERU_TIMEZONE = 'America/Lima';
export const PERU_UTC_OFFSET = '-05:00';

/**
 * Gestor centralizado de fecha y hora para el frontend
 */
export class DateTimeManager {
  /**
   * Obtiene la fecha y hora actual en zona horaria de Perú
   */
  static nowPeru(): Date {
    return new Date(new Date().toLocaleString("en-US", { timeZone: PERU_TIMEZONE }));
  }

  /**
   * Obtiene la fecha y hora actual en UTC
   */
  static nowUtc(): Date {
    return new Date();
  }

  /**
   * Convierte una fecha a zona horaria de Perú
   */
  static toPeruTimezone(date: Date | string): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Date(dateObj.toLocaleString("en-US", { timeZone: PERU_TIMEZONE }));
  }

  /**
   * Formatea fecha para mostrar al usuario en formato peruano
   */
  static formatForDisplay(date?: Date | string, includeTime: boolean = true): string {
    const dateObj = date ? (typeof date === 'string' ? new Date(date) : date) : this.nowPeru();
    
    const options: Intl.DateTimeFormatOptions = {
      timeZone: PERU_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };

    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.second = '2-digit';
      options.hour12 = false;
    }

    return new Intl.DateTimeFormat('es-PE', options).format(dateObj);
  }

  /**
   * Obtiene la fecha actual en zona horaria de Perú como string (YYYY-MM-DD)
   */
  static getDateString(date?: Date | string): string {
    const dateObj = date ? (typeof date === 'string' ? new Date(date) : date) : this.nowPeru();
    const peruDate = this.toPeruTimezone(dateObj);
    
    const year = peruDate.getFullYear();
    const month = String(peruDate.getMonth() + 1).padStart(2, '0');
    const day = String(peruDate.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  /**
   * Formatea fecha para envío al backend (ISO format con timezone)
   */
  static formatForBackend(date?: Date | string): string {
    const dateObj = date ? (typeof date === 'string' ? new Date(date) : date) : this.nowPeru();
    return dateObj.toISOString();
  }

  /**
   * Formatea fecha para SUNAT (formato requerido)
   */
  static formatForSunat(date?: Date | string): string {
    const dateObj = date ? (typeof date === 'string' ? new Date(date) : date) : this.nowPeru();
    const peruDate = this.toPeruTimezone(dateObj);
    
    const year = peruDate.getFullYear();
    const month = String(peruDate.getMonth() + 1).padStart(2, '0');
    const day = String(peruDate.getDate()).padStart(2, '0');
    const hours = String(peruDate.getHours()).padStart(2, '0');
    const minutes = String(peruDate.getMinutes()).padStart(2, '0');
    const seconds = String(peruDate.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${PERU_UTC_OFFSET}`;
  }

  /**
   * Formatea fecha para nombres de archivo
   */
  static formatForFilename(date?: Date | string): string {
    const dateObj = date ? (typeof date === 'string' ? new Date(date) : date) : this.nowPeru();
    const peruDate = this.toPeruTimezone(dateObj);
    
    const year = peruDate.getFullYear();
    const month = String(peruDate.getMonth() + 1).padStart(2, '0');
    const day = String(peruDate.getDate()).padStart(2, '0');
    const hours = String(peruDate.getHours()).padStart(2, '0');
    const minutes = String(peruDate.getMinutes()).padStart(2, '0');
    const seconds = String(peruDate.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
  }

  /**
   * Parsea string ISO a Date
   */
  static parseISOString(isoString: string): Date {
    return new Date(isoString);
  }

  /**
   * Verifica si está en horario comercial de Perú
   */
  static isBusinessHours(date?: Date | string): boolean {
    const dateObj = date ? (typeof date === 'string' ? new Date(date) : date) : this.nowPeru();
    const peruDate = this.toPeruTimezone(dateObj);
    
    const dayOfWeek = peruDate.getDay(); // 0 = Domingo, 6 = Sábado
    const hour = peruDate.getHours();
    
    // Lunes a Viernes (1-5), 8 AM a 6 PM
    return dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 8 && hour < 18;
  }

  /**
   * Obtiene el inicio del día
   */
  static startOfDay(date?: Date | string): Date {
    const dateObj = date ? (typeof date === 'string' ? new Date(date) : date) : this.nowPeru();
    const peruDate = this.toPeruTimezone(dateObj);
    
    return new Date(peruDate.getFullYear(), peruDate.getMonth(), peruDate.getDate());
  }

  /**
   * Obtiene el final del día
   */
  static endOfDay(date?: Date | string): Date {
    const dateObj = date ? (typeof date === 'string' ? new Date(date) : date) : this.nowPeru();
    const peruDate = this.toPeruTimezone(dateObj);
    
    return new Date(peruDate.getFullYear(), peruDate.getMonth(), peruDate.getDate(), 23, 59, 59, 999);
  }

  /**
   * Calcula la diferencia en días entre dos fechas
   */
  static daysDifference(date1: Date | string, date2: Date | string): number {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    
    const timeDiff = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  /**
   * Verifica si dos fechas son del mismo día
   */
  static isSameDay(date1: Date | string, date2: Date | string): boolean {
    const d1 = this.toPeruTimezone(typeof date1 === 'string' ? new Date(date1) : date1);
    const d2 = this.toPeruTimezone(typeof date2 === 'string' ? new Date(date2) : date2);
    
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }
}

// Funciones de conveniencia para uso directo
export const nowPeru = () => DateTimeManager.nowPeru();
export const nowUtc = () => DateTimeManager.nowUtc();
export const formatForDisplay = (date?: Date | string, includeTime?: boolean) => 
  DateTimeManager.formatForDisplay(date, includeTime);
export const formatForBackend = (date?: Date | string) => 
  DateTimeManager.formatForBackend(date);
export const formatForSunat = (date?: Date | string) => 
  DateTimeManager.formatForSunat(date);

// Tipos TypeScript para mejor intellisense
export interface DateTimeRange {
  start: Date;
  end: Date;
}

export interface BusinessHoursConfig {
  startHour: number;
  endHour: number;
  workingDays: number[];
}

export const DEFAULT_BUSINESS_HOURS: BusinessHoursConfig = {
  startHour: 8,
  endHour: 18,
  workingDays: [1, 2, 3, 4, 5], // Lunes a Viernes
};
