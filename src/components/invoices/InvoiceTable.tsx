'use client';

import React, { memo, useCallback } from 'react';
import { Button, Badge } from '@/components/ui';
import { Download, RefreshCw, Calendar, FileText, Package, Receipt, Send } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

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
  ruta_zip?: string;
  moneda?: string;
}

interface InvoiceTableProps {
  facturas: Factura[];
  onDescargarPDF: (factura: Factura) => Promise<void>;
  onDescargarXML: (factura: Factura) => Promise<void>;
  onDescargarZIP: (factura: Factura) => Promise<void>;
  onDescargarCDR: (factura: Factura) => Promise<void>;
  onReenviarSunat: (factura: Factura) => Promise<void>;
  getEstadoBadgeColor: (estado: string) => string;
  construirNombreDocumento: (factura: Factura) => string;
  isRefreshing?: boolean;
}

// Componente optimizado para las acciones de cada fila
const InvoiceTableActions = memo<{
  factura: Factura;
  onDescargarPDF: (factura: Factura) => Promise<void>;
  onDescargarXML: (factura: Factura) => Promise<void>;
  onDescargarZIP: (factura: Factura) => Promise<void>;
  onDescargarCDR: (factura: Factura) => Promise<void>;
  onReenviarSunat: (factura: Factura) => Promise<void>;
  isRefreshing?: boolean;
}>(({ 
  factura, 
  onDescargarPDF, 
  onDescargarXML, 
  onDescargarZIP, 
  onDescargarCDR, 
  onReenviarSunat,
  isRefreshing 
}) => {
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);

  const handleAction = useCallback(async (action: string, func: () => Promise<void>) => {
    setLoadingAction(action);
    try {
      await func();
    } catch (error) {
      console.error(`Error en ${action}:`, error);
    } finally {
      setLoadingAction(null);
    }
  }, []);

  const isActionLoading = (action: string) => loadingAction === action || isRefreshing;

  return (
    <div className="flex space-x-1">
      <Button
        onClick={() => handleAction('pdf', () => onDescargarPDF(factura))}
        disabled={isActionLoading('pdf')}
        variant="ghost"
        size="sm"
        title="Descargar PDF">
        <FileText className={`h-4 w-4 ${isActionLoading('pdf') ? 'animate-pulse' : ''}`} />
      </Button>
      
      <Button
        onClick={() => handleAction('xml', () => onDescargarXML(factura))}
        disabled={isActionLoading('xml')}
        variant="ghost"
        size="sm"
        title="Descargar XML">
        <Download className={`h-4 w-4 ${isActionLoading('xml') ? 'animate-pulse' : ''}`} />
      </Button>
      
      <Button
        onClick={() => handleAction('zip', () => onDescargarZIP(factura))}
        disabled={isActionLoading('zip')}
        variant="ghost"
        size="sm"
        title="Descargar ZIP">
        <Package className={`h-4 w-4 ${isActionLoading('zip') ? 'animate-pulse' : ''}`} />
      </Button>
      
      <Button
        onClick={() => handleAction('cdr', () => onDescargarCDR(factura))}
        disabled={isActionLoading('cdr')}
        variant="ghost"
        size="sm"
        title="Descargar CDR">
        <Receipt className={`h-4 w-4 ${isActionLoading('cdr') ? 'animate-pulse' : ''}`} />
      </Button>
      
      <Button
        onClick={() => handleAction('reenviar', () => onReenviarSunat(factura))}
        disabled={isActionLoading('reenviar')}
        variant="ghost"
        size="sm"
        title="Reenviar a SUNAT">
        <Send className={`h-4 w-4 ${isActionLoading('reenviar') ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
});

InvoiceTableActions.displayName = 'InvoiceTableActions';

// Componente optimizado para cada fila
const InvoiceTableRow = memo<{
  factura: Factura;
  onDescargarPDF: (factura: Factura) => Promise<void>;
  onDescargarXML: (factura: Factura) => Promise<void>;
  onDescargarZIP: (factura: Factura) => Promise<void>;
  onDescargarCDR: (factura: Factura) => Promise<void>;
  onReenviarSunat: (factura: Factura) => Promise<void>;
  getEstadoBadgeColor: (estado: string) => string;
  construirNombreDocumento: (factura: Factura) => string;
  isRefreshing?: boolean;
}>(({ 
  factura, 
  onDescargarPDF, 
  onDescargarXML, 
  onDescargarZIP, 
  onDescargarCDR, 
  onReenviarSunat,
  getEstadoBadgeColor,
  construirNombreDocumento,
  isRefreshing
}) => {
  // Formatear fecha de manera optimizada
  const fechaFormateada = React.useMemo(() => {
    if (!factura.fecha_emision) return 'N/A';
    
    try {
      let fecha: Date;
      
      // Intentar parsear la fecha en diferentes formatos
      if (factura.fecha_emision.includes('T')) {
        fecha = parseISO(factura.fecha_emision);
      } else {
        fecha = new Date(factura.fecha_emision);
      }
      
      if (isNaN(fecha.getTime())) {
        return factura.fecha_emision;
      }
      
      return format(fecha, 'dd/MM/yyyy', { locale: es });
    } catch {
      return factura.fecha_emision;
    }
  }, [factura.fecha_emision]);

  // Obtener estado de manera optimizada
  const estadoFinal = React.useMemo(() => {
    return factura.estado_sunat || factura.estado_xml || factura.estado || 'PENDIENTE';
  }, [factura.estado_sunat, factura.estado_xml, factura.estado]);

  // Obtener total de manera optimizada
  const totalFinal = React.useMemo(() => {
    const totalValue = factura.totales?.importe_total || factura.total || 0;
    const total = typeof totalValue === 'number' ? totalValue : parseFloat(totalValue) || 0;
    const moneda = factura.moneda || 'PEN';
    return { total, moneda };
  }, [factura.totales?.importe_total, factura.total, factura.moneda]);

  // Obtener número de documento
  const numeroDocumento = React.useMemo(() => {
    return construirNombreDocumento(factura);
  }, [factura, construirNombreDocumento]);

  return (
    <tr className={`border-b hover:bg-gray-50 transition-colors ${isRefreshing ? 'opacity-60' : ''}`}>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {numeroDocumento}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-1 text-gray-400" />
          {fechaFormateada}
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
        <div className="truncate" title={factura.cliente?.razon_social}>
          {factura.cliente?.razon_social || 'Cliente no especificado'}
        </div>
        {factura.cliente?.numero_documento && (
          <div className="text-xs text-gray-500">
            {factura.cliente.numero_documento}
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
        <div className="font-medium">
          {totalFinal.moneda} {totalFinal.total.toFixed(2)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge 
          className={`${getEstadoBadgeColor(estadoFinal)} text-xs font-medium px-2 py-1 rounded-full`}
        >
          {estadoFinal}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <InvoiceTableActions
          factura={factura}
          onDescargarPDF={onDescargarPDF}
          onDescargarXML={onDescargarXML}
          onDescargarZIP={onDescargarZIP}
          onDescargarCDR={onDescargarCDR}
          onReenviarSunat={onReenviarSunat}
          isRefreshing={isRefreshing}
        />
      </td>
    </tr>
  );
});

InvoiceTableRow.displayName = 'InvoiceTableRow';

// Componente principal optimizado
const InvoiceTable = memo<InvoiceTableProps>(({
  facturas,
  onDescargarPDF,
  onDescargarXML,
  onDescargarZIP,
  onDescargarCDR,
  onReenviarSunat,
  getEstadoBadgeColor,
  construirNombreDocumento,
  isRefreshing = false
}) => {
  // Memoizar las filas para evitar re-renders innecesarios
  const facturaRows = React.useMemo(() => {
    return facturas.map((factura) => (
      <InvoiceTableRow
        key={factura.id || factura._id || `${factura.serie}-${factura.numero}`}
        factura={factura}
        onDescargarPDF={onDescargarPDF}
        onDescargarXML={onDescargarXML}
        onDescargarZIP={onDescargarZIP}
        onDescargarCDR={onDescargarCDR}
        onReenviarSunat={onReenviarSunat}
        getEstadoBadgeColor={getEstadoBadgeColor}
        construirNombreDocumento={construirNombreDocumento}
        isRefreshing={isRefreshing}
      />
    ));
  }, [
    facturas,
    onDescargarPDF,
    onDescargarXML,
    onDescargarZIP,
    onDescargarCDR,
    onReenviarSunat,
    getEstadoBadgeColor,
    construirNombreDocumento,
    isRefreshing
  ]);

  if (facturas.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600">No hay facturas para mostrar</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documento
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {facturaRows}
            </tbody>
          </table>
          
          {isRefreshing && (
            <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-sm text-gray-600">Actualizando datos...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

InvoiceTable.displayName = 'InvoiceTable';
export default InvoiceTable;
