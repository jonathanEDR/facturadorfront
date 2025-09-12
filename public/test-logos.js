// Script para probar la funcionalidad de logos desde el navegador
// Abrir DevTools (F12) y ejecutar este código en la consola

console.log('🖼️ PROBANDO FUNCIONALIDAD DE LOGOS EN EL FRONTEND');
console.log('==================================================');

// 1. Verificar que los endpoints estén disponibles
async function verificarEndpoints() {
    console.log('\n📝 Verificando endpoints de la API...');
    
    const baseUrl = window.location.origin.replace('3000', '8000'); // Cambiar puerto del frontend al backend
    const empresaId = '20612969125'; // Empresa de prueba
    
    try {
        // Verificar endpoint de info
        const infoResponse = await fetch(`${baseUrl}/api/v1/logos/${empresaId}/info`);
        console.log(`✅ Endpoint info: ${infoResponse.status} ${infoResponse.statusText}`);
        
        if (infoResponse.ok) {
            const infoData = await infoResponse.json();
            console.log('📊 Información del logo:', infoData);
        }
        
        // Verificar endpoint de imagen
        const logoResponse = await fetch(`${baseUrl}/api/v1/logos/${empresaId}/medium`);
        console.log(`✅ Endpoint imagen: ${logoResponse.status} ${logoResponse.statusText}`);
        
        return true;
    } catch (error) {
        console.error('❌ Error verificando endpoints:', error);
        return false;
    }
}

// 2. Probar upload simulado
async function simularUpload() {
    console.log('\n📝 Simulando carga de archivo...');
    
    // Crear un canvas con un logo de prueba
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    
    // Dibujar un logo simple
    ctx.fillStyle = '#1a365d';
    ctx.fillRect(0, 0, 200, 100);
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('TEST LOGO', 100, 55);
    
    // Convertir a blob
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            console.log('✅ Logo simulado creado:', blob.size, 'bytes');
            resolve(blob);
        }, 'image/png');
    });
}

// 3. Verificar componente LogoManager en el DOM
function verificarComponente() {
    console.log('\n📝 Verificando componente LogoManager...');
    
    // Buscar elementos relacionados con logos
    const logoElements = document.querySelectorAll('[class*="logo"], [id*="logo"]');
    console.log(`📊 Elementos con "logo" encontrados: ${logoElements.length}`);
    
    logoElements.forEach((el, index) => {
        console.log(`   ${index + 1}. ${el.tagName} - ${el.className || el.id}`);
    });
    
    // Buscar dropzone o input de archivo
    const fileInputs = document.querySelectorAll('input[type="file"]');
    console.log(`📊 Inputs de archivo encontrados: ${fileInputs.length}`);
    
    // Buscar botones relacionados
    const buttons = document.querySelectorAll('button');
    const logoButtons = Array.from(buttons).filter(btn => 
        btn.textContent.toLowerCase().includes('logo') ||
        btn.textContent.toLowerCase().includes('subir') ||
        btn.textContent.toLowerCase().includes('upload')
    );
    console.log(`📊 Botones relacionados con logos: ${logoButtons.length}`);
    
    return {
        logoElements: logoElements.length,
        fileInputs: fileInputs.length,
        logoButtons: logoButtons.length
    };
}

// 4. Probar hooks de React (si están disponibles)
function verificarHooks() {
    console.log('\n📝 Verificando hooks de React...');
    
    // Verificar si React está disponible
    if (typeof window.React !== 'undefined') {
        console.log('✅ React está disponible');
    } else {
        console.log('⚠️ React no está disponible en window (normal en producción)');
    }
    
    // Verificar el estado actual de la página
    if (window.location.pathname.includes('diseno')) {
        console.log('✅ Estás en la página del diseñador de facturas');
    } else {
        console.log('⚠️ No estás en la página del diseñador');
        console.log('💡 Ve a: /diseno-facturas para probar la funcionalidad');
    }
}

// 5. Función principal para ejecutar todas las pruebas
async function probarTodo() {
    console.log('🚀 Iniciando pruebas completas...\n');
    
    const endpointsOk = await verificarEndpoints();
    const componentes = verificarComponente();
    verificarHooks();
    
    if (endpointsOk) {
        await simularUpload();
    }
    
    console.log('\n📋 RESUMEN DE PRUEBAS:');
    console.log(`✅ Endpoints API: ${endpointsOk ? 'Funcionando' : 'Error'}`);
    console.log(`📊 Elementos UI encontrados: ${JSON.stringify(componentes)}`);
    
    console.log('\n💡 INSTRUCCIONES:');
    console.log('1. Asegúrate de estar en /diseno-facturas');
    console.log('2. Ve a la pestaña "Layout"');
    console.log('3. Busca la sección "Configuración de Logo"');
    console.log('4. Selecciona una empresa del dropdown');
    console.log('5. Usa el componente LogoManager para subir un logo');
    
    console.log('\n🎯 SIGUIENTE PASO:');
    console.log('Ejecuta: probarTodo() para probar toda la funcionalidad');
}

// Exportar funciones para uso manual
window.logoTest = {
    verificarEndpoints,
    simularUpload,
    verificarComponente,
    verificarHooks,
    probarTodo
};

console.log('\n✅ Script cargado exitosamente!');
console.log('💡 Ejecuta: logoTest.probarTodo() para iniciar las pruebas');
console.log('📚 Funciones disponibles:', Object.keys(window.logoTest));
