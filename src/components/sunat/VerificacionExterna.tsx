'use client';

import React, { useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { ExternalLink, Copy, CheckCircle, AlertCircle, Globe, XCircle } from 'lucide-react';

interface VerificacionExternaProps {
  factura?: {
    serie: string;
    numero: number;
    fecha_emision: string;
    total: number;
    cliente: {
      numero_documento: string;
      razon_social: string;
    };
  };
  rucEmisor?: string;
}

const VerificacionExterna: React.FC<VerificacionExternaProps> = ({ 
  factura,
  rucEmisor = "20612969125" 
}) => {
  const [copiado, setCopiado] = useState<string | null>(null);

  const datosVerificacion = factura ? {
    rucEmisor: rucEmisor,
    tipoComprobante: "01", // Factura
    serie: factura.serie,
    numero: String(factura.numero).padStart(8, '0'),
    fechaEmision: factura.fecha_emision,
    montoTotal: factura.total.toFixed(2)
  } : null;

  const urlsSunat = {
    consultaValidez: "https://e-consulta.sunat.gob.pe/ol-ti-itconsvalicpe/ConsValiCpe.htm",
    portalSol: "https://www.sunat.gob.pe/operatividadhist/index.html",
    consultaRuc: "https://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsruc/FrameCriterioBusquedaWeb.jsp"
  };

  const copiarAlPortapapeles = async (texto: string, tipo: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(tipo);
      setTimeout(() => setCopiado(null), 2000);
    } catch (error) {
      console.error('Error copiando al portapapeles:', error);
    }
  };

  const abrirPortalSunat = () => {
    window.open(urlsSunat.consultaValidez, '_blank', 'noopener,noreferrer');
  };

  if (!factura) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Verificación Externa SUNAT
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              Selecciona una factura para ver las opciones de verificación externa
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Verificación Externa en SUNAT
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Información de la factura */}
        {datosVerificacion && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-3">Datos para Verificación</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-blue-700">RUC Emisor:</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-blue-900 font-mono">{datosVerificacion.rucEmisor}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copiarAlPortapapeles(datosVerificacion.rucEmisor, 'ruc')}
                    className="h-6 w-6 p-0"
                  >
                    {copiado === 'ruc' ? (
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-blue-700">Tipo:</label>
                <span className="text-sm text-blue-900 font-mono ml-2">01 (Factura)</span>
              </div>
              <div>
                <label className="text-sm font-medium text-blue-700">Serie:</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-blue-900 font-mono">{datosVerificacion.serie}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copiarAlPortapapeles(datosVerificacion.serie, 'serie')}
                    className="h-6 w-6 p-0"
                  >
                    {copiado === 'serie' ? (
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-blue-700">Número:</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-blue-900 font-mono">{datosVerificacion.numero}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copiarAlPortapapeles(datosVerificacion.numero, 'numero')}
                    className="h-6 w-6 p-0"
                  >
                    {copiado === 'numero' ? (
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-blue-700">Fecha:</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-blue-900 font-mono">
                    {new Date(datosVerificacion.fechaEmision).toLocaleDateString('es-PE')}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copiarAlPortapapeles(
                      new Date(datosVerificacion.fechaEmision).toLocaleDateString('es-PE'), 
                      'fecha'
                    )}
                    className="h-6 w-6 p-0"
                  >
                    {copiado === 'fecha' ? (
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-blue-700">Monto:</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-blue-900 font-mono">{datosVerificacion.montoTotal}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copiarAlPortapapeles(datosVerificacion.montoTotal, 'monto')}
                    className="h-6 w-6 p-0"
                  >
                    {copiado === 'monto' ? (
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Información del cliente */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">Cliente</h3>
          <div className="space-y-1">
            <div className="text-sm">
              <span className="font-medium">Razón Social:</span> {factura.cliente.razon_social}
            </div>
            <div className="text-sm">
              <span className="font-medium">Documento:</span> {factura.cliente.numero_documento}
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="space-y-3">
          <Button
            onClick={abrirPortalSunat}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir Portal SUNAT para Verificación
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Se abrirá en una nueva ventana. Completa los datos mostrados arriba.
            </p>
          </div>
        </div>

        {/* Instrucciones paso a paso */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-3">Pasos para Verificar:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Haz clic en &ldquo;Abrir Portal SUNAT&rdquo; (abre nueva ventana)</li>
            <li>El formulario ya aparece con algunos campos prellenados</li>
            <li>Completa los campos faltantes usando los botones de copiar:</li>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li><strong>Número de RUC del Emisor:</strong> Usar botón copiar</li>
              <li><strong>Tipo de Comprobante:</strong> Ya debe estar en &ldquo;FACTURA ELECTRONICA&rdquo;</li>
              <li><strong>Número Documento de Identidad del Receptor:</strong> Número del cliente</li>
              <li><strong>Número del Comprobante:</strong> Serie y número (ej: F001 - 00000004)</li>
              <li><strong>Fecha de Emisión:</strong> Usar formato DD/MM/YYYY</li>
              <li><strong>Total por Honorarios o Importe Total:</strong> Monto de la factura</li>
            </ul>
            <li>Haz clic en &ldquo;Buscar&rdquo;</li>
            <li>Revisa el resultado (puede ser válido, no existe, o no válido)</li>
          </ol>
        </div>

        {/* Enlaces adicionales */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-2">Enlaces Útiles:</h4>
          <div className="space-y-2">
            <a
              href={urlsSunat.consultaValidez}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="w-3 h-3" />
              Consulta de Validez del Comprobante de Pago Electrónico
            </a>
            <a
              href="/ayuda-sunat"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-green-600 hover:text-green-800"
            >
              <ExternalLink className="w-3 h-3" />
              📚 Ayuda - Interpretar Resultados SUNAT
            </a>
            <a
              href={urlsSunat.portalSol}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="w-3 h-3" />
              Portal SOL SUNAT
            </a>
          </div>
        </div>

        {/* Posibles resultados */}
        <div className="space-y-2">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">
                ✅ &ldquo;COMPROBANTE VÁLIDO&rdquo; - Factura aceptada por SUNAT
              </span>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-900">
                ⚠️ &ldquo;NO EXISTE EN LOS REGISTROS&rdquo; - Factura no reportada aún (puede tomar 24-48h)
              </span>
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-900">
                ❌ &ldquo;COMPROBANTE NO VÁLIDO&rdquo; - Factura rechazada o con errores
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VerificacionExterna;
