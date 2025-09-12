/**
 * Ejemplo de componente que usa autenticación JWT con Clerk para facturas
 */
'use client';

import { useFacturasAuth } from '@/hooks/useAuthenticatedFacturas';
import { useState } from 'react';

export default function FacturasAuthExample() {
  const { client, isAuthenticated, isLoading } = useFacturasAuth();
  const [pdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadPDF = async (facturaId: string) => {
    if (!client || !isAuthenticated) {
      setError('Usuario no autenticado');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Usar el cliente autenticado para descargar PDF
      await client.descargarPDF(facturaId);
      
      // Si llegamos aquí, la descarga fue exitosa
      setError(null);
      // El PDF se descarga automáticamente por el método descargarPDF
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleListFacturas = async () => {
    if (!client || !isAuthenticated) {
      setError('Usuario no autenticado');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await client.listarFacturas();
      console.log('Facturas:', response);
      
      if (response.success && response.data && response.data.length > 0) {
        // Mostrar información de la primera factura como ejemplo
        const primeraFactura = response.data[0];
        console.log('Primera factura:', primeraFactura);
      }
    } catch (err) {
      console.error('Error listing facturas:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <div>Cargando autenticación...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded">
        <p className="text-red-600">
          Debes iniciar sesión para acceder a las funciones de facturas.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold">Demo de Autenticación JWT con Facturas</h2>
      
      {error && (
        <div className="p-3 border border-red-300 bg-red-50 rounded">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <button
          onClick={handleListFacturas}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Cargando...' : 'Listar Facturas (Autenticado)'}
        </button>

        <button
          onClick={() => handleDownloadPDF('test-factura-id')}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 ml-2"
        >
          {loading ? 'Descargando...' : 'Descargar PDF de Prueba'}
        </button>
      </div>

      {pdfUrl && (
        <div className="mt-4">
          <p className="text-green-600">PDF generado exitosamente:</p>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            Ver PDF en nueva ventana
          </a>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Estado:</strong> Autenticado con JWT</p>
        <p><strong>Cliente:</strong> {client ? 'Disponible' : 'No disponible'}</p>
      </div>
    </div>
  );
}
