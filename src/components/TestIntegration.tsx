/**
 * Componente de prueba para validar la integración frontend-backend
 */
'use client';

import React, { useState } from 'react';
import { FacturasApiClient } from '@/services/facturas';
import type { CreateFacturaRequest, FacturaResponse, ApiResponse } from '@/services/facturas';

const TestIntegration: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse<FacturaResponse> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const facturaClient = new FacturasApiClient();

  const testData: CreateFacturaRequest = {
    serie: "F001",
    // numero se omite para que se auto-asigne
    cliente: {
      numero_documento: "10426346082",
      tipo_documento: "6", // RUC
      razon_social: "Cliente Test Frontend",
      direccion: "Lima, Perú",
      email: "test@cliente.com"
    },
    items: [
      {
        codigo: "P001",
        descripcion: "Producto Test Frontend",
        cantidad: 1,
        precio_unitario: 100.0,
        tipo_afectacion_igv: "10", // Gravado
      }
    ],
    condicion_pago: "Contado",
    observaciones: "Factura de prueba desde frontend"
  };

  const testWithExonerado: CreateFacturaRequest = {
    ...testData,
    cliente: {
      ...testData.cliente,
      razon_social: "Cliente Test Exonerado Frontend"
    },
    items: [
      {
        codigo: "P002",
        descripcion: "Producto Exonerado Frontend",
        cantidad: 1,
        precio_unitario: 100.0,
        tipo_afectacion_igv: "20" // Exonerado
      }
    ]
  };

  const handleTestGravado = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await facturaClient.crearFactura(testData, false);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleTestExonerado = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await facturaClient.crearFactura(testWithExonerado, false);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test de Integración Frontend-Backend</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={handleTestGravado}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
        >
          {loading ? 'Creando...' : 'Test Producto Gravado (IGV 18%)'}
        </button>
        
        <button
          onClick={handleTestExonerado}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
        >
          {loading ? 'Creando...' : 'Test Producto Exonerado (Sin IGV)'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Resultado de la Prueba</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Estado de la Respuesta</h3>
              <div className={`inline-flex px-3 py-1 rounded-full text-sm ${
                result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {result.success ? '✅ Éxito' : '❌ Error'}
              </div>
              <p className="text-gray-600 mt-2">{result.message}</p>
            </div>

            {result.data && (
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Datos de la Factura</h3>
                <div className="space-y-1 text-sm">
                  <div><strong>ID:</strong> {result.data.id}</div>
                  <div><strong>Número:</strong> {result.data.numero}</div>
                  <div><strong>Estado:</strong> {result.data.estado}</div>
                  <div><strong>Total:</strong> S/ {result.data.total.toFixed(2)}</div>
                  <div><strong>Fecha:</strong> {result.data.fecha_emision}</div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4">
            <h3 className="font-medium text-gray-700 mb-2">Respuesta Completa (JSON)</h3>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-medium text-yellow-800 mb-2">Casos de Prueba</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li><strong>Producto Gravado:</strong> Debe mostrar total de S/ 118.00 (100 + 18% IGV)</li>
          <li><strong>Producto Exonerado:</strong> Debe mostrar total de S/ 100.00 (sin IGV)</li>
          <li><strong>Numeración:</strong> Debe incrementar automáticamente (F001-00000XXX)</li>
          <li><strong>Estado:</strong> Debe mostrar &ldquo;PENDIENTE&rdquo; inicialmente</li>
        </ul>
      </div>
    </div>
  );
};

export default TestIntegration;
