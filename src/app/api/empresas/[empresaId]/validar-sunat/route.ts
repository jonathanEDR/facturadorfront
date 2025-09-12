import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Extraer el ID de la empresa de la URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const empresaId = pathParts[3]; // /api/empresas/[id]/validar-sunat
    
    console.log('🔍 API Route - Empresa ID:', empresaId);
    console.log('🔍 API Route - URL completa:', request.url);
    
    // Obtener token de Authorization header
    const authHeader = request.headers.get('Authorization');
    console.log('🔍 API Route - Auth Header:', authHeader ? `Bearer ${authHeader.slice(0, 20)}...` : 'No header');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 });
    }
    
    // Llamar al backend real usando el endpoint de producción
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1'}/empresas/${empresaId}/validar-sunat`;
    console.log('🔍 API Route - Backend URL (PRODUCTION MODE):', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    });
    
    console.log('🔍 API Route - Backend Response Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔍 API Route - Backend Error:', errorText);
      return NextResponse.json({ 
        error: `Backend error: ${response.status} ${response.statusText}`,
        details: errorText 
      }, { status: response.status });
    }
    
    const data = await response.json();
    console.log('🔍 API Route - Success:', data);
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('🔍 API Route - Error:', error);
    return NextResponse.json({ 
      error: 'Error interno del proxy',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
