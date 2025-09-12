'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback, useMemo } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui';
import { RefreshCw, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useFacturasApi } from '@/services/facturas';
import { useFacturasAuth } from '@/hooks/useAuthenticatedFacturas';
import { construirNumeroDocumento, EMPRESA_CONFIG } from '@/constants/empresa';
import InvoiceTable from './InvoiceTable';

interface Factura {
  id?: string;
  _id?: string;
  nombre_archivo?: string;
  serie?: string;
  numero?: string | number;
  fecha_emision?: string;
  cliente?: {
    razon_social?: string;
    numero_documento?: string;
  };
  totales?: {
    importe_total?: number;
  };
  estado_sunat?: string;
  estado_xml?: string;
  estado?: string;
  total?: number;
  ruta_xml?: string;
  ruta_pdf?: string;
  moneda?: string;
}

export interface InvoiceListRef {
  refreshFacturas: () => void;
}

interface LoadingState {
  isLoading: boolean;
  isRefreshing: boolean;
  hasError: boolean;
  errorMessage: string | null;
  lastUpdated: Date | null;
}

class InvoiceCache {
  private static instance: InvoiceCache;
  private cache = new Map<string, { data: Factura[], timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000;

  static getInstance(): InvoiceCache {
    if (!InvoiceCache.instance) {
      InvoiceCache.instance = new InvoiceCache();
    }
    return InvoiceCache.instance;
  }

  set(key: string, data: Factura[]): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get(key: string): Factura[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > this.CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const isExpired = Date.now() - entry.timestamp > this.CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

const InvoiceList = forwardRef<InvoiceListRef>((_, ref) => {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    isRefreshing: false,
    hasError: false,
    errorMessage: null,
    lastUpdated: null
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Hook de autenticación con Clerk JWT
  const { client: authenticatedClient, isAuthenticated, isLoading: authLoading } = useFacturasAuth();

  // Fallback para compatibilidad
  const legacyFacturasApi = useFacturasApi();

  // Cache instance
  const cacheInstance = useMemo(() => InvoiceCache.getInstance(), []);

  // Función para cargar facturas
  const cargarFacturas = useCallback(async (isRefresh: boolean = false) => {
    const cacheKey = `facturas_page_${page}`;

    if (!isRefresh && cacheInstance.has(cacheKey)) {
      const cachedData = cacheInstance.get(cacheKey);
      if (cachedData) {
        setFacturas(cachedData);
        setLoadingState(prev => ({
          ...prev,
          isLoading: false,
          hasError: false,
          errorMessage: null
        }));
        return;
      }
    }

    try {
      setLoadingState(prev => ({
        ...prev,
        isLoading: !isRefresh,
        isRefreshing: isRefresh,
        hasError: false,
        errorMessage: null
      }));

      let response;
      
      if (!isAuthenticated || !authenticatedClient) {
        response = await legacyFacturasApi.listarFacturas();
      } else {
        response = await authenticatedClient.listarFacturas({
          page: page,
          limit: 20
        });
      }

      if (response.success && response.data) {
        const newFacturas = response.data;
        cacheInstance.set(cacheKey, newFacturas);
        setFacturas(newFacturas);

        if ('pagination' in response && response.pagination) {
          const pagination = response.pagination as { total_pages?: number; pages?: number };
          setTotalPages(pagination.total_pages || pagination.pages || 1);
        }

        setLoadingState(prev => ({
          ...prev,
          isLoading: false,
          isRefreshing: false,
          hasError: false,
          errorMessage: null,
          lastUpdated: new Date()
        }));
      } else {
        throw new Error(response.message || 'Error al cargar las facturas');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión al cargar las facturas';

      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        isRefreshing: false,
        hasError: true,
        errorMessage
      }));

      const cachedData = cacheInstance.get(cacheKey);
      if (cachedData) {
        setFacturas(cachedData);
      }
    }
  }, [page, isAuthenticated, authenticatedClient]); // Removemos legacyFacturasApi y cacheInstance

  // Función de refresh
  const refreshFacturas = useCallback(() => {
    cacheInstance.clear();
    cargarFacturas(true);
  }, [cargarFacturas]); // Removemos cacheInstance

  // Cargar facturas cuando cambie la página
  useEffect(() => {
    cargarFacturas();
  }, [cargarFacturas]);

  // Exponer método refresh
  useImperativeHandle(ref, () => ({
    refreshFacturas
  }), [refreshFacturas]);

  // Función para obtener color del badge
  const getEstadoBadgeColor = useCallback((estado: string) => {
    switch (estado) {
      case 'ACEPTADO':
        return 'bg-green-100 text-green-800';
      case 'ENVIADO':
        return 'bg-blue-100 text-blue-800';
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800';
      case 'RECHAZADO':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  // Construir nombre del documento completo
  const construirNombreDocumento = useCallback((factura: Factura): string => {
    const numeroStr = typeof factura.numero === 'string' ? factura.numero : String(factura.numero || '');
    const serie = factura.serie || 'F001';
    return construirNumeroDocumento(
      EMPRESA_CONFIG.RUC,
      EMPRESA_CONFIG.TIPOS_DOCUMENTO.FACTURA,
      serie,
      numeroStr
    );
  }, []);

  // Construir nombre corto para UI
  const construirNombreCorto = useCallback((factura: Factura): string => {
    const numeroStr = typeof factura.numero === 'string' ? factura.numero : String(factura.numero || '');
    const numeroFormateado = numeroStr.padStart(8, '0');
    const serie = factura.serie || 'F001';
    return `${serie}-${numeroFormateado}`;
  }, []);

  // Funciones de descarga
  const descargarPDF = useCallback(async (factura: Factura) => {
    try {
      const documentoId = factura.id || factura._id;
      if (!documentoId) {
        throw new Error('ID del documento no encontrado');
      }

      if (isAuthenticated && authenticatedClient) {
        await authenticatedClient.descargarPDF(documentoId);
      } else {
        await legacyFacturasApi.descargarPDF(documentoId);
      }
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      throw error;
    }
  }, [isAuthenticated, authenticatedClient]); // Removemos legacyFacturasApi

  const descargarXMLFunc = useCallback(async (factura: Factura) => {
    try {
      const numeroDocumento = construirNombreDocumento(factura);
      if (!numeroDocumento) {
        throw new Error('Número de documento no encontrado');
      }
      await legacyFacturasApi.descargarXML(numeroDocumento);
    } catch (error) {
      console.error('Error al descargar XML:', error);
    }
  }, [construirNombreDocumento]); // Removemos legacyFacturasApi

  const descargarZIPFunc = useCallback(async (factura: Factura) => {
    try {
      const numeroDocumento = construirNombreDocumento(factura);
      if (!numeroDocumento) {
        throw new Error('Número de documento no encontrado');
      }
      await legacyFacturasApi.descargarZIP(numeroDocumento);
    } catch (error) {
      console.error('Error al descargar ZIP:', error);
    }
  }, [construirNombreDocumento]); // Removemos legacyFacturasApi

  const descargarCDRFunc = useCallback(async (factura: Factura) => {
    try {
      const numeroDocumento = construirNombreDocumento(factura);
      if (!numeroDocumento) {
        throw new Error('Número de documento no encontrado');
      }
      await legacyFacturasApi.descargarCDR(numeroDocumento);
    } catch (error) {
      console.error('Error al descargar CDR:', error);
    }
  }, [construirNombreDocumento]); // Removemos legacyFacturasApi

  const reenviarSunatFunc = useCallback(async (factura: Factura) => {
    try {
      const documentoId = factura.id || factura._id;
      if (!documentoId) {
        throw new Error('ID del documento no encontrado');
      }
      await legacyFacturasApi.reenviarSunat(documentoId);
      cacheInstance.clear();
      cargarFacturas(true);
    } catch (error) {
      console.error('Error al reenviar a SUNAT:', error);
    }
  }, [cargarFacturas]); // Removemos cacheInstance y legacyFacturasApi

  // Componente de loading
  const LoadingStateComponent = useMemo(() => {
    if (authLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-gray-600">Verificando autenticación...</span>
        </div>
      );
    }

    if (loadingState.isLoading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex space-x-4 p-4 border rounded">
              <div className="rounded-full bg-gray-300 h-10 w-10"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                <div className="h-4 bg-gray-300 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return null;
  }, [authLoading, loadingState.isLoading]);

  // Componente de error
  const ErrorStateComponent = useMemo(() => {
    if (!loadingState.hasError) return null;

    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-red-800 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Error al cargar facturas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{loadingState.errorMessage}</p>
          <div className="flex space-x-2">
            <Button
              onClick={refreshFacturas}
              variant="outline"
              size="sm"
              disabled={loadingState.isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingState.isRefreshing ? 'animate-spin' : ''}`} />
              Reintentar
            </Button>
            {facturas.length > 0 && (
              <span className="text-sm text-gray-600 flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                Mostrando datos en cache
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }, [loadingState.hasError, loadingState.errorMessage, loadingState.isRefreshing, refreshFacturas, facturas.length]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Facturas Electrónicas
              </CardTitle>
              <CardDescription>
                Lista de facturas generadas
                {loadingState.lastUpdated && (
                  <span className="text-xs text-gray-500 block mt-1">
                    Última actualización: {loadingState.lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </CardDescription>
            </div>
            <Button
              onClick={refreshFacturas}
              variant="outline"
              size="sm"
              disabled={loadingState.isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingState.isRefreshing ? 'animate-spin' : ''}`} />
              {loadingState.isRefreshing ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {LoadingStateComponent}
          {ErrorStateComponent}

          {!loadingState.isLoading && !loadingState.hasError && facturas.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">No hay facturas disponibles</p>
              <Button onClick={refreshFacturas} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Recargar
              </Button>
            </div>
          )}

          {facturas.length > 0 && (
            <>
              <InvoiceTable
                facturas={facturas}
                onDescargarPDF={descargarPDF}
                onDescargarXML={descargarXMLFunc}
                onDescargarZIP={descargarZIPFunc}
                onDescargarCDR={descargarCDRFunc}
                onReenviarSunat={reenviarSunatFunc}
                getEstadoBadgeColor={getEstadoBadgeColor}
                construirNombreDocumento={construirNombreCorto}
                isRefreshing={loadingState.isRefreshing}
              />

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-700">
                    Página {page} de {totalPages}
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1 || loadingState.isLoading}
                      variant="outline"
                      size="sm"
                    >
                      Anterior
                    </Button>
                    <Button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages || loadingState.isLoading}
                      variant="outline"
                      size="sm"
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

InvoiceList.displayName = 'InvoiceList';
export default InvoiceList;
