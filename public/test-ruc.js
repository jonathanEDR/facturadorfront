/**
 * Test simple para verificar la consulta RUC
 */

// Para usar en la consola del navegador:
// testConsultaRuc('20610056351')

window.testConsultaRuc = async function(ruc) {
  try {
    console.log('🧪 Iniciando test de consulta RUC:', ruc);
    
    const response = await fetch(`http://127.0.0.1:8000/api/v1/consultas/ruc/${ruc}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await window.Clerk?.session?.getToken()}`
      }
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('📦 Response data:', data);
    
    return data;
  } catch (error) {
    console.error('❌ Error en test:', error);
    return null;
  }
}

console.log('🧪 Test de consulta RUC cargado. Usar: testConsultaRuc("20610056351")');
