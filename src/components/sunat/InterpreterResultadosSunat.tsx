'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { AlertTriangle, CheckCircle, XCircle, Clock, Info } from 'lucide-react';

const InterpreterResultadosSunat: React.FC = () => {
  const resultados = [
    {
      mensaje: "COMPROBANTE VÁLIDO",
      tipo: "exitoso",
      icono: CheckCircle,
      color: "bg-green-50 border-green-200 text-green-900",
      descripcion: "La factura está correctamente registrada y aceptada por SUNAT.",
      accion: "✅ Todo correcto, no se requiere acción adicional."
    },
    {
      mensaje: "La Factura Electrónica [SERIE-NUMERO] no existe en los registros de SUNAT",
      tipo: "pendiente",
      icono: Clock,
      color: "bg-yellow-50 border-yellow-200 text-yellow-900",
      descripcion: "La factura no aparece en los registros de SUNAT. Esto puede ocurrir por varias razones:",
      accion: "⏳ Esperar 24-48 horas y verificar nuevamente. Si persiste, revisar el envío."
    },
    {
      mensaje: "COMPROBANTE NO VÁLIDO",
      tipo: "error",
      icono: XCircle,
      color: "bg-red-50 border-red-200 text-red-900",
      descripcion: "La factura tiene errores o fue rechazada por SUNAT.",
      accion: "❌ Revisar datos y corregir errores antes de reenviar."
    }
  ];

  const posiblesCausas = [
    "🕐 **Tiempo de procesamiento**: SUNAT puede tardar 24-48 horas en procesar facturas",
    "📤 **Envío no completado**: La factura no fue enviada correctamente a SUNAT",
    "🔧 **Error en sistema**: Problemas temporales en los sistemas de SUNAT",
    "📋 **Datos incorrectos**: Error en los datos ingresados en la consulta",
    "🚫 **Factura anulada**: La factura fue anulada después del envío"
  ];

  const recomendaciones = [
    "1. **Verificar en nuestro sistema interno** si la factura muestra 'CDR RECIBIDO'",
    "2. **Esperar 24-48 horas** antes de preocuparse por facturas recientes", 
    "3. **Revisar logs del sistema** para errores de envío",
    "4. **Contactar soporte técnico** si el problema persiste más de 48 horas",
    "5. **Re-enviar la consulta** desde nuestro sistema usando 'Consultar' en la tabla"
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Interpretación de Resultados SUNAT
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Cuando verificas una factura en el portal SUNAT, puedes obtener diferentes respuestas. 
            Aquí te explicamos qué significa cada una:
          </p>

          {resultados.map((resultado, index) => {
            const IconComponent = resultado.icono;
            return (
              <div key={index} className={`border rounded-lg p-4 ${resultado.color}`}>
                <div className="flex items-start gap-3">
                  <IconComponent className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-medium mb-2">&ldquo;{resultado.mensaje}&rdquo;</h3>
                    <p className="text-sm mb-2">{resultado.descripcion}</p>
                    <p className="text-sm font-medium">{resultado.accion}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Posibles Causas del &ldquo;No Existe en Registros&rdquo;
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {posiblesCausas.map((causa, index) => (
              <li key={index} className="text-sm text-gray-700">
                {causa}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recomendaciones de Acción</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {recomendaciones.map((recomendacion, index) => (
              <li key={index} className="text-sm text-gray-700">
                {recomendacion}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-blue-900">Nota Importante</span>
        </div>
        <p className="text-sm text-blue-800">
          El resultado <strong>&ldquo;no existe en los registros&rdquo;</strong> es muy común y normal para facturas recientes. 
          SUNAT procesa las facturas de forma asíncrona y puede tomar tiempo antes de que aparezcan en su portal de consulta pública.
        </p>
      </div>
    </div>
  );
};

export default InterpreterResultadosSunat;
