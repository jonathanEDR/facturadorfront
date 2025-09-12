// Test simple para verificar que los templates predefinidos se pueden obtener
const API_BASE_URL = 'http://localhost:8000/api/v1';

async function testPredefinedTemplates() {
    try {
        const response = await fetch(`${API_BASE_URL}/templates/predefined/list`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const templates = await response.json();
        console.log('✅ Templates predefinidos obtenidos:', templates);
        
        // Mostrar en el DOM
        const container = document.getElementById('test-results');
        if (container) {
            container.innerHTML = `
                <h3>✅ Templates Predefinidos (${templates.length})</h3>
                <pre>${JSON.stringify(templates, null, 2)}</pre>
            `;
        }
        
        return templates;
    } catch (error) {
        console.error('❌ Error obteniendo templates predefinidos:', error);
        
        const container = document.getElementById('test-results');
        if (container) {
            container.innerHTML = `
                <h3>❌ Error</h3>
                <p>${error.message}</p>
            `;
        }
        
        throw error;
    }
}

// Ejecutar test cuando la página cargue
if (typeof window !== 'undefined') {
    window.addEventListener('load', testPredefinedTemplates);
}
