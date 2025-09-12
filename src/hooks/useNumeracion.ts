/**
 * Hook para gestión de numeración de facturas
 */
import { useState, useCallback, useEffect } from 'react';
import { 
  obtenerSeries, 
  obtenerContadores, 
  configurarNumeracion, 
  configurarNumeracionMasiva,
  obtenerEstadisticas,
  validarNumeracion,
  obtenerSiguienteNumero,
  resetearContador,
  activarDesactivarSerie,
  ContadorResponse, 
  ConfigurarNumeracionRequest, 
  EstadisticasSerieResponse 
} from '@/services/numeracion';
import { toast } from 'react-hot-toast';

export interface NumeracionState {
  contadores: ContadorResponse[];
  series: string[];
  loading: boolean;
  error: string | null;
}

export function useNumeracion() {
  const [state, setState] = useState<NumeracionState>({
    contadores: [],
    series: [],
    loading: false,
    error: null,
  });

  // Cargar datos iniciales - Función manual para recargar datos
  const cargarContadores = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const [contadoresData, seriesData] = await Promise.all([
        obtenerContadores(),
        obtenerSeries()
      ]);
      
      setState(prev => ({
        ...prev,
        contadores: contadoresData,
        series: seriesData,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }));
    }
  }, []); // Sin dependencias para evitar recreación

  // Configurar numeración individual
  const configurarSerie = useCallback(async (configuracion: ConfigurarNumeracionRequest) => {
    try {
      const contador = await configurarNumeracion(configuracion);
      
      setState(prev => ({
        ...prev,
        contadores: prev.contadores.some(c => c.serie === contador.serie)
          ? prev.contadores.map(c => c.serie === contador.serie ? contador : c)
          : [...prev.contadores, contador],
        series: prev.series.includes(contador.serie) 
          ? prev.series 
          : [...prev.series, contador.serie]
      }));
      
      toast.success(`Serie ${contador.serie} configurada correctamente`);
      return contador;
    } catch (error) {
      toast.error(`Error configurando serie: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      throw error;
    }
  }, []); // Sin dependencias

  // Configurar múltiples series
  const configurarMultiplesSeries = useCallback(async (configuraciones: ConfigurarNumeracionRequest[]) => {
    try {
      const contadores = await configurarNumeracionMasiva(configuraciones);
      
      setState(prev => {
        const nuevosContadores = [...prev.contadores];
        const nuevasSeries = [...prev.series];
        
        contadores.forEach((contador: ContadorResponse) => {
          const index = nuevosContadores.findIndex(c => c.serie === contador.serie);
          if (index >= 0) {
            nuevosContadores[index] = contador;
          } else {
            nuevosContadores.push(contador);
          }
          
          if (!nuevasSeries.includes(contador.serie)) {
            nuevasSeries.push(contador.serie);
          }
        });
        
        return {
          ...prev,
          contadores: nuevosContadores,
          series: nuevasSeries
        };
      });
      
      toast.success(`${contadores.length} series configuradas correctamente`);
      return contadores;
    } catch (error) {
      console.error('Error configurando múltiples series:', error);
      toast.error(`Error configurando series: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      throw error;
    }
  }, []);

  // Obtener siguiente número para una serie
  const obtenerSiguienteNumeroHook = useCallback(async (serie: string) => {
    try {
      return await obtenerSiguienteNumero(serie);
    } catch (error) {
      console.error('Error obteniendo siguiente número:', error);
      toast.error(`Error obteniendo número para serie ${serie}`);
      throw error;
    }
  }, []);

  // Obtener estadísticas de una serie
  const obtenerEstadisticasHook = useCallback(async (serie: string): Promise<EstadisticasSerieResponse> => {
    try {
      return await obtenerEstadisticas(serie);
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }, []);

  // Validar numeración de una serie
  const validarSerie = useCallback(async (serie: string) => {
    try {
      const validacion = await validarNumeracion(serie);
      
      if (!validacion.es_valida) {
        toast.error(`Serie ${serie} tiene problemas de numeración`);
      }
      
      return validacion;
    } catch (error) {
      console.error('Error validando serie:', error);
      toast.error(`Error validando serie ${serie}`);
      throw error;
    }
  }, []);

  // Resetear contador
  const resetearContadorHook = useCallback(async (serie: string, nuevoNumero: number) => {
    try {
      const contador = await resetearContador(serie, nuevoNumero);
      
      setState(prev => ({
        ...prev,
        contadores: prev.contadores.map(c => 
          c.serie === contador.serie ? contador : c
        )
      }));
      
      toast.success(`Contador de serie ${serie} reseteado a ${nuevoNumero}`);
      return contador;
    } catch (error) {
      console.error('Error reseteando contador:', error);
      toast.error(`Error reseteando contador: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      throw error;
    }
  }, []);

  // Activar/desactivar serie
  const cambiarEstadoSerie = useCallback(async (serie: string, activo: boolean) => {
    try {
      const contador = await activarDesactivarSerie(serie, activo);
      
      setState(prev => ({
        ...prev,
        contadores: prev.contadores.map(c => 
          c.serie === contador.serie ? contador : c
        )
      }));
      
      toast.success(`Serie ${serie} ${activo ? 'activada' : 'desactivada'}`);
      return contador;
    } catch (error) {
      console.error('Error cambiando estado serie:', error);
      toast.error(`Error cambiando estado de serie: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      throw error;
    }
  }, []);

  // Obtener contador específico
  const obtenerContador = useCallback((serie: string): ContadorResponse | undefined => {
    return state.contadores.find(c => c.serie === serie);
  }, [state.contadores]);

  // Verificar si una serie está configurada
  const estaConfigurada = useCallback((serie: string): boolean => {
    return state.contadores.some(c => c.serie === serie && c.activo);
  }, [state.contadores]);

  // Cargar datos al montar el componente
  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      if (!mounted) return;
      
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        const [contadores, series] = await Promise.all([
          obtenerContadores(),
          obtenerSeries()
        ]);
        
        if (!mounted) return;
        
        setState(prev => ({
          ...prev,
          contadores,
          series,
          loading: false,
        }));
      } catch (error) {
        if (!mounted) return;
        
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        }));
      }
    };
    
    loadData();
    
    return () => {
      mounted = false;
    };
  }, []); // Sin dependencias para ejecutar solo una vez

  return {
    // Estado
    contadores: state.contadores,
    series: state.series,
    loading: state.loading,
    error: state.error,
    
    // Acciones
    cargarContadores,
    configurarSerie,
    configurarMultiplesSeries,
    obtenerSiguienteNumero: obtenerSiguienteNumeroHook,
    obtenerEstadisticas: obtenerEstadisticasHook,
    validarSerie,
    resetearContador: resetearContadorHook,
    cambiarEstadoSerie,
    
    // Utilidades
    obtenerContador,
    estaConfigurada,
  };
}
