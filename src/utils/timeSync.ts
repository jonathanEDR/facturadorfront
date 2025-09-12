/**
 * Middleware para manejo de sincronización de tiempo y clock skew
 * Específicamente para resolver problemas con Clerk JWT
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { DateTimeManager } from '@/utils/datetime';

export function withTimeSync(request: NextRequest) {
  // Agregar headers de tiempo para ayudar con sincronización
  const response = NextResponse.next();
  
  // Agregar timestamp del servidor en timezone de Perú
  const peruTime = DateTimeManager.nowPeru();
  const utcTime = DateTimeManager.nowUtc();
  
  response.headers.set('X-Server-Time-Peru', DateTimeManager.formatForSunat(peruTime));
  response.headers.set('X-Server-Time-UTC', utcTime.toISOString());
  response.headers.set('X-Timezone', 'America/Lima');
  
  // Calcular clock skew si hay headers de tiempo del cliente
  const clientTime = request.headers.get('X-Client-Time');
  if (clientTime) {
    try {
      const clientDate = new Date(clientTime);
      const serverDate = DateTimeManager.nowUtc();
      const skewMs = Math.abs(serverDate.getTime() - clientDate.getTime());
      
      if (skewMs > 60000) { // Más de 1 minuto de diferencia
        console.warn(`Clock skew detected: ${skewMs}ms difference`);
        response.headers.set('X-Clock-Skew-Warning', 'true');
        response.headers.set('X-Clock-Skew-Ms', skewMs.toString());
      }
    } catch (error) {
      console.error('Error parsing client time:', error);
    }
  }
  
  return response;
}

/**
 * Configuración para manejo de tiempo en solicitudes a APIs
 */
export class TimeAwareApiClient {
  /**
   * Agrega headers de tiempo a las solicitudes
   */
  static addTimeHeaders(headers: HeadersInit = {}): HeadersInit {
    const peruTime = DateTimeManager.nowPeru();
    const utcTime = DateTimeManager.nowUtc();
    
    return {
      ...headers,
      'X-Client-Time-Peru': DateTimeManager.formatForSunat(peruTime),
      'X-Client-Time-UTC': utcTime.toISOString(),
      'X-Client-Timezone': 'America/Lima',
    };
  }
  
  /**
   * Wrapper para fetch con headers de tiempo
   */
  static async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    const enhancedOptions = {
      ...options,
      headers: this.addTimeHeaders(options.headers),
    };
    
    return fetch(url, enhancedOptions);
  }
}

/**
 * Hook para sincronización automática de tiempo con el servidor
 */
export function useTimeSync() {
  const syncWithServer = async () => {
    try {
      const response = await fetch('/api/time-sync', {
        method: 'GET',
        headers: TimeAwareApiClient.addTimeHeaders(),
      });
      
      if (response.ok) {
        const serverTime = response.headers.get('X-Server-Time-UTC');
        if (serverTime) {
          const serverDate = new Date(serverTime);
          const clientDate = new Date();
          const skew = Math.abs(serverDate.getTime() - clientDate.getTime());
          
          if (skew > 60000) { // Más de 1 minuto
            console.warn(`Clock skew detected: ${skew}ms`);
            // Aquí podrías mostrar una notificación al usuario
            return { skew, needsSync: true };
          }
        }
      }
    } catch (error) {
      console.error('Time sync failed:', error);
    }
    
    return { skew: 0, needsSync: false };
  };
  
  return { syncWithServer };
}
