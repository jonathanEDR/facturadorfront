// Componente para consulta masiva/batch de comprobantes
'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Download, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2
} from 'lucide-react';

import { useConsultaValidez } from '@/services/consulta-validez';
import { useEmpresa } from '@/hooks/useEmpresa';
import { 
  ConsultaValidezRequest, 
  ConsultaValidezResponse 
} from '@/types/consulta-validez';

interface ConsultaBatchItem extends ConsultaValidezRequest {
  id: string;
  status?: 'pending' | 'processing' | 'success' | 'error';
  resultado?: ConsultaValidezResponse;
}

export default function ConsultaBatch() {
  const { consultarComprobantesBatch, validateRequest, loading } = useConsultaValidez();
  const { empresaActual } = useEmpresa();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados
  const [comprobantes, setComprobantes] = useState<ConsultaBatchItem[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const parsedData = parseCSV(csv);
        setComprobantes(parsedData);
        setValidationErrors([]);
      } catch (error) {
        setValidationErrors(['Error al procesar el archivo CSV. Verifique el formato.']);
      }
    };
    reader.readAsText(file);
  };

  const parseCSV = (csv: string): ConsultaBatchItem[] => {
    const lines = csv.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Validar headers requeridos
    const requiredHeaders = ['ruc_emisor', 'tipo_comprobante', 'serie', 'numero', 'fecha_emision', 'monto'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(`Faltan columnas requeridas: ${missingHeaders.join(', ')}`);
    }

    return lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim());
      const item: ConsultaBatchItem = {
        id: `batch-${index}`,
        ruc_emisor: values[headers.indexOf('ruc_emisor')] || '',
        tipo_comprobante: values[headers.indexOf('tipo_comprobante')] || '',
        serie: values[headers.indexOf('serie')] || '',
        numero: parseInt(values[headers.indexOf('numero')]) || 0,
        fecha_emision: values[headers.indexOf('fecha_emision')] || '',
        monto: parseFloat(values[headers.indexOf('monto')]) || 0,
        status: 'pending'
      };
      return item;
    }).filter(item => item.ruc_emisor); // Filtrar filas vacías
  };

  const handleManualAdd = () => {
    const newItem: ConsultaBatchItem = {
      id: `manual-${Date.now()}`,
      ruc_emisor: '',
      tipo_comprobante: '',
      serie: '',
      numero: 0,
      fecha_emision: '',
      monto: 0,
      status: 'pending'
    };
    setComprobantes(prev => [...prev, newItem]);
  };

  const handleUpdateItem = (id: string, field: keyof ConsultaValidezRequest, value: string | number) => {
    setComprobantes(prev => prev.map(item => 
      item.id === id 
        ? { ...item, [field]: field === 'numero' || field === 'monto' ? Number(value) : value }
        : item
    ));
  };

  const handleRemoveItem = (id: string) => {
    setComprobantes(prev => prev.filter(item => item.id !== id));
  };

  const handleProcessBatch = async () => {
    if (!empresaActual) {
      setValidationErrors(['Debe seleccionar una empresa antes de procesar el lote']);
      return;
    }

    if (comprobantes.length === 0) {
      setValidationErrors(['Debe agregar al menos un comprobante para procesar']);
      return;
    }

    // Validar todos los items
    const errors: string[] = [];
    comprobantes.forEach((item, index) => {
      const validation = validateRequest(item);
      if (!validation.valid) {
        errors.push(`Fila ${index + 1}: ${validation.errors.join(', ')}`);
      }
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setIsProcessing(true);
      setValidationErrors([]);
      
      // Marcar todos como processing
      setComprobantes(prev => prev.map(item => ({ ...item, status: 'processing' as const })));

      // Enviar al backend
      const requests = comprobantes.map(({ id, status, resultado, ...request }) => request);
      const responses = await consultarComprobantesBatch(empresaActual.id, requests);

      // Actualizar resultados
      setComprobantes(prev => prev.map((item, index) => {
        const response = responses[index];
        return {
          ...item,
          status: response?.success ? 'success' : 'error',
          resultado: response
        };
      }));

      setProcessingProgress(100);
      
    } catch (error) {
      console.error('Error procesando lote:', error);
      setValidationErrors(['Error interno al procesar el lote. Intente nuevamente.']);
      
      // Marcar todos como error
      setComprobantes(prev => prev.map(item => ({ ...item, status: 'error' as const })));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportResults = () => {
    const csvData = comprobantes.map(item => {
      const base = {
        ruc_emisor: item.ruc_emisor,
        tipo_comprobante: item.tipo_comprobante,
        serie: item.serie,
        numero: item.numero,
        fecha_emision: item.fecha_emision,
        monto: item.monto,
        status: item.status,
        success: item.resultado?.success ? 'Sí' : 'No',
        message: item.resultado?.message || '',
        estado_comprobante: item.resultado?.comprobante?.estado_comprobante || ''
      };
      return base;
    });

    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `consulta_batch_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const template = [
      'ruc_emisor,tipo_comprobante,serie,numero,fecha_emision,monto',
      '20123456789,01,F001,123,01/12/2024,118.00',
      '20987654321,03,B001,456,02/12/2024,59.00'
    ].join('\n');

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plantilla_consulta_batch.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'processing':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />;
    }
  };

  const getStatusStats = () => {
    const stats = comprobantes.reduce((acc, item) => {
      acc[item.status || 'pending']++;
      return acc;
    }, { pending: 0, processing: 0, success: 0, error: 0 });
    
    return stats;
  };

  const stats = getStatusStats();

  return (
    <div className="space-y-6">
      {/* Instrucciones y carga de archivo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Consulta Masiva de Comprobantes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Empresa seleccionada */}
          {empresaActual && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Empresa:</strong> {empresaActual.razon_social} (RUC: {empresaActual.ruc})
              </p>
            </div>
          )}

          {/* Errores */}
          {validationErrors.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription className="text-red-800">
                <ul className="list-disc pl-4">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={downloadTemplate} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Descargar Plantilla CSV
            </Button>
            
            <Button onClick={() => fileInputRef.current?.click()} variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Cargar Archivo CSV
            </Button>
            
            <Button onClick={handleManualAdd} variant="outline">
              Agregar Manualmente
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Estadísticas */}
          {comprobantes.length > 0 && (
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center space-x-1">
                <Badge variant="outline">{stats.pending} Pendientes</Badge>
              </div>
              <div className="flex items-center space-x-1">
                <Badge className="bg-blue-100 text-blue-800">{stats.processing} Procesando</Badge>
              </div>
              <div className="flex items-center space-x-1">
                <Badge className="bg-green-100 text-green-800">{stats.success} Exitosos</Badge>
              </div>
              <div className="flex items-center space-x-1">
                <Badge className="bg-red-100 text-red-800">{stats.error} Errores</Badge>
              </div>
            </div>
          )}

          {/* Progreso */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Procesando lote...</span>
                <span>{processingProgress}%</span>
              </div>
              <Progress value={processingProgress} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de comprobantes */}
      {comprobantes.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Comprobantes a Procesar ({comprobantes.length})
              </CardTitle>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleProcessBatch}
                  disabled={isProcessing || loading || !empresaActual}
                  className="flex items-center"
                >
                  {isProcessing ? 'Procesando...' : 'Procesar Lote'}
                </Button>
                
                {stats.success > 0 && (
                  <Button 
                    onClick={handleExportResults}
                    variant="outline"
                    className="flex items-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Resultados
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Estado</th>
                    <th className="text-left p-2">RUC Emisor</th>
                    <th className="text-left p-2">Tipo</th>
                    <th className="text-left p-2">Serie</th>
                    <th className="text-left p-2">Número</th>
                    <th className="text-left p-2">Fecha</th>
                    <th className="text-left p-2">Monto</th>
                    <th className="text-left p-2">Resultado</th>
                    <th className="text-left p-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {comprobantes.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(item.status)}
                        </div>
                      </td>
                      <td className="p-2">
                        <Input
                          value={item.ruc_emisor}
                          onChange={(e) => handleUpdateItem(item.id, 'ruc_emisor', e.target.value)}
                          disabled={isProcessing}
                          className="w-32"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={item.tipo_comprobante}
                          onChange={(e) => handleUpdateItem(item.id, 'tipo_comprobante', e.target.value)}
                          disabled={isProcessing}
                          className="w-20"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={item.serie}
                          onChange={(e) => handleUpdateItem(item.id, 'serie', e.target.value)}
                          disabled={isProcessing}
                          className="w-20"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={item.numero || ''}
                          onChange={(e) => handleUpdateItem(item.id, 'numero', e.target.value)}
                          disabled={isProcessing}
                          className="w-24"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={item.fecha_emision}
                          onChange={(e) => handleUpdateItem(item.id, 'fecha_emision', e.target.value)}
                          disabled={isProcessing}
                          placeholder="dd/mm/yyyy"
                          className="w-32"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.monto || ''}
                          onChange={(e) => handleUpdateItem(item.id, 'monto', e.target.value)}
                          disabled={isProcessing}
                          className="w-24"
                        />
                      </td>
                      <td className="p-2">
                        {item.resultado && (
                          <span className={`text-xs ${item.resultado.success ? 'text-green-600' : 'text-red-600'}`}>
                            {item.resultado.message.substring(0, 30)}...
                          </span>
                        )}
                      </td>
                      <td className="p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={isProcessing}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}