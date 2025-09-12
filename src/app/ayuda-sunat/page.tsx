'use client';

import React from 'react';
import InterpreterResultadosSunat from '@/components/sunat/InterpreterResultadosSunat';

const AyudaSunatPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Ayuda - Verificación SUNAT</h1>
        <p className="text-gray-600 mt-2">
          Guía completa para entender los resultados de verificación en SUNAT
        </p>
      </div>
      
      <InterpreterResultadosSunat />
    </div>
  );
};

export default AyudaSunatPage;
