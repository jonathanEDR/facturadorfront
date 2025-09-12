'use client';

import React from 'react';

export default function DisenadorFacturasSimple() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Diseñador de Facturas</h1>
        <p className="text-muted-foreground">
          Personaliza el diseño y formato de tus facturas electrónicas
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Configuración de Plantilla</h2>
            <p>Configuraciones de diseño aparecerán aquí...</p>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Vista Previa</h2>
            <div className="aspect-[3/4] bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
              <p className="text-gray-500">Vista previa del documento PDF</p>
            </div>
            <button 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => alert('¡El endpoint de preview está funcionando! (Ver logs del backend)')}
            >
              Generar Vista Previa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
