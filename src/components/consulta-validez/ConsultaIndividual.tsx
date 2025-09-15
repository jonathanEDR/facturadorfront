// Componente para consulta individual de comprobantes
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Calendar,
  Building,
  FileText,
  DollarSign,
  Copy
} from 'lucide-react';

import { useConsultaValidez } from '@/services/consulta-validez';
import { useEmpresa } from '@/hooks/useEmpresa';
import { 
  ConsultaValidezRequest, 
  ConsultaValidezResponse 
} from '@/types/consulta-validez';

export default function ConsultaIndividual() {
  const { consultarComprobante, validateRequest, formatResponse, loading } = useConsultaValidez();
  const { empresaActual } = useEmpresa();

  // Estados del formulario
  const [formData, setFormData] = useState<ConsultaValidezRequest>({
    ruc_emisor: '',
    tipo_comprobante: '',
    serie: '',
    numero: 0,
    fecha_emision: '',
    monto: 0
  });

  // Estados de resultado
  const [resultado, setResultado] = useState<ConsultaValidezResponse | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Tipos de comprobante disponibles
  const tiposComprobante = [
    { value: '01', label: '01 - Factura' },
    { value: '03', label: '03 - Boleta de Venta' },
    { value: '07', label: '07 - Nota de Crédito' },
    { value: '08', label: '08 - Nota de Débito' },
    { value: 'R1', label: 'R1 - Recibo por Honorarios' },
    { value: 'R7', label: 'R7 - Nota de Crédito Recibo' }
  ];

  const handleInputChange = (field: keyof ConsultaValidezRequest, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'numero' || field === 'monto' ? Number(value) : value
    }));
    
    // Limpiar errores cuando el usuario modifica el formulario
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleDateChange = (value: string) => {
    // Convertir fecha de input date (yyyy-mm-dd) a formato dd/mm/yyyy
    if (value) {
      const [year, month, day] = value.split('-');
      const fechaFormateada = `${day}/${month}/${year}`;
      handleInputChange('fecha_emision', fechaFormateada);
    } else {
      handleInputChange('fecha_emision', '');
    }
  };

  const formatDateForInput = (dateString: string): string => {
    // Convertir de dd/mm/yyyy a yyyy-mm-dd para el input date
    if (!dateString) return '';
    const [day, month, year] = dateString.split('/');
    return `${year}-${month}-${day}`;
  };

  const handleConsultar = async () => {
    try {
      // Validar empresa seleccionada
      if (!empresaActual) {
        setValidationErrors(['Debe seleccionar una empresa antes de realizar la consulta']);
        return;
      }

      // Validar datos del formulario
      const validation = validateRequest(formData);
      if (!validation.valid) {
        setValidationErrors(validation.errors);
        return;
      }

      // Limpiar errores y resultado anterior
      setValidationErrors([]);
      setResultado(null);

      // Realizar consulta
      const response = await consultarComprobante(empresaActual.id, formData);
      setResultado(response);

    } catch (error) {
      console.error('Error en consulta:', error);
      setValidationErrors(['Error interno al realizar la consulta. Intente nuevamente.']);
    }
  };

  const handleLimpiarFormulario = () => {
    setFormData({
      ruc_emisor: '',
      tipo_comprobante: '',
      serie: '',
      numero: 0,
      fecha_emision: '',
      monto: 0
    });
    setResultado(null);
    setValidationErrors([]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderResultado = () => {
    if (!resultado) return null;

    const formatted = formatResponse(resultado);
    
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            {formatted.status === 'success' && <CheckCircle className="w-5 h-5 text-green-500 mr-2" />}
            {formatted.status === 'error' && <XCircle className="w-5 h-5 text-red-500 mr-2" />}
            {formatted.status === 'warning' && <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />}
            Resultado de la Consulta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estado general */}
          <div className="flex items-center space-x-2">
            <span className="font-medium">Estado:</span>
            <Badge className={
              formatted.status === 'success' ? 'bg-green-100 text-green-800' :
              formatted.status === 'error' ? 'bg-red-100 text-red-800' :
              'bg-orange-100 text-orange-800'
            }>
              {formatted.title}
            </Badge>
          </div>

          {/* Mensaje */}
          <div>
            <span className="font-medium">Mensaje:</span>
            <p className="text-gray-700 mt-1">{formatted.description}</p>
          </div>

          {/* Detalles del comprobante (si está disponible) */}
          {resultado.comprobante && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <h4 className="font-medium flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Información del Comprobante
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">RUC Emisor:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono">{resultado.comprobante.ruc_emisor}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard(resultado.comprobante!.ruc_emisor)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Tipo:</span>
                  <span className="font-mono">{resultado.comprobante.tipo_comprobante}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Serie:</span>
                  <span className="font-mono">{resultado.comprobante.serie}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Número:</span>
                  <span className="font-mono">{resultado.comprobante.numero}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Fecha Emisión:</span>
                  <span>{resultado.comprobante.fecha_emision}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Monto:</span>
                  <span>S/ {resultado.comprobante.monto.toFixed(2)}</span>
                </div>

                {resultado.comprobante.estado_comprobante && (
                  <div className="flex items-center justify-between md:col-span-2">
                    <span className="text-gray-600">Estado Comprobante:</span>
                    <Badge>{resultado.comprobante.estado_comprobante}</Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Información de la consulta */}
          {resultado.consulta && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Información de la Consulta</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Fecha:</strong> {new Date(resultado.consulta.fecha_consulta).toLocaleString()}</p>
                <p><strong>API utilizada:</strong> {resultado.consulta.api_used}</p>
                <p><strong>Tiempo de respuesta:</strong> {resultado.consulta.response_time_ms} ms</p>
              </div>
            </div>
          )}

          {/* Error details (si hay error) */}
          {resultado.error && (
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Detalles del Error</h4>
              <div className="text-sm text-red-700 space-y-1">
                <p><strong>Código:</strong> {resultado.error.code}</p>
                <p><strong>Mensaje:</strong> {resultado.error.message}</p>
                {resultado.error.details && (
                  <p><strong>Detalles:</strong> {resultado.error.details}</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Formulario de consulta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="w-5 h-5 mr-2" />
            Datos del Comprobante a Consultar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Empresa seleccionada */}
          {empresaActual && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <Building className="w-4 h-4 inline mr-1" />
                <strong>Empresa:</strong> {empresaActual.razon_social} (RUC: {empresaActual.ruc})
              </p>
            </div>
          )}

          {/* Errores de validación */}
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

          {/* Campos del formulario */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* RUC Emisor */}
            <div className="space-y-2">
              <Label htmlFor="ruc_emisor">RUC Emisor *</Label>
              <Input
                id="ruc_emisor"
                value={formData.ruc_emisor}
                onChange={(e) => handleInputChange('ruc_emisor', e.target.value)}
                placeholder="20123456789"
                maxLength={11}
              />
            </div>

            {/* Tipo de Comprobante */}
            <div className="space-y-2">
              <Label htmlFor="tipo_comprobante">Tipo de Comprobante *</Label>
              <Select value={formData.tipo_comprobante} onValueChange={(value) => handleInputChange('tipo_comprobante', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposComprobante.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Serie */}
            <div className="space-y-2">
              <Label htmlFor="serie">Serie *</Label>
              <Input
                id="serie"
                value={formData.serie}
                onChange={(e) => handleInputChange('serie', e.target.value)}
                placeholder="F001"
                maxLength={4}
              />
            </div>

            {/* Número */}
            <div className="space-y-2">
              <Label htmlFor="numero">Número *</Label>
              <Input
                id="numero"
                type="number"
                value={formData.numero || ''}
                onChange={(e) => handleInputChange('numero', e.target.value)}
                placeholder="123"
                min={1}
                max={99999999}
              />
            </div>

            {/* Fecha de Emisión */}
            <div className="space-y-2">
              <Label htmlFor="fecha_emision">Fecha de Emisión *</Label>
              <Input
                id="fecha_emision"
                type="date"
                value={formatDateForInput(formData.fecha_emision)}
                onChange={(e) => handleDateChange(e.target.value)}
              />
            </div>

            {/* Monto */}
            <div className="space-y-2">
              <Label htmlFor="monto">Monto Total *</Label>
              <Input
                id="monto"
                type="number"
                step="0.01"
                value={formData.monto || ''}
                onChange={(e) => handleInputChange('monto', e.target.value)}
                placeholder="118.00"
                min={0}
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-2 pt-4">
            <Button 
              onClick={handleConsultar}
              disabled={loading || !empresaActual}
              className="flex items-center"
            >
              <Search className="w-4 h-4 mr-2" />
              {loading ? 'Consultando...' : 'Consultar Comprobante'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleLimpiarFormulario}
              disabled={loading}
            >
              Limpiar Formulario
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultado */}
      {renderResultado()}
    </div>
  );
}