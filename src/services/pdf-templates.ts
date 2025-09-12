// Servicio para gestionar plantillas PDF
export class PDFTemplateService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  private async getAuthHeaders() {
    // En el cliente, necesitamos obtener el token desde el contexto de Clerk
    // Por ahora, devolvemos headers básicos
    return {
      'Content-Type': 'application/json',
    };
  }

  async getTemplates(): Promise<any[]> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/api/v1/pdf/templates/`, {
      headers,
    });
    if (!response.ok) {
      throw new Error('Error loading templates');
    }
    return response.json();
  }

  async getTemplate(id: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v1/pdf/templates/${id}`);
    if (!response.ok) {
      throw new Error('Error loading template');
    }
    return response.json();
  }

  async createTemplate(template: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v1/pdf/templates/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(template),
    });
    if (!response.ok) {
      throw new Error('Error creating template');
    }
    return response.json();
  }

  async updateTemplate(id: string, template: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v1/pdf/templates/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(template),
    });
    if (!response.ok) {
      throw new Error('Error updating template');
    }
    return response.json();
  }

  async deleteTemplate(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/v1/pdf/templates/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Error deleting template');
    }
  }

  async generatePreview(template: any, data: any): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/api/v1/pdf/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template_config: template,
        invoice_data: data,
      }),
    });
    if (!response.ok) {
      throw new Error('Error generating preview');
    }
    return response.blob();
  }

  async getColorPalettes(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/api/v1/pdf/templates/color-palettes`);
    if (!response.ok) {
      throw new Error('Error loading color palettes');
    }
    return response.json();
  }
}
