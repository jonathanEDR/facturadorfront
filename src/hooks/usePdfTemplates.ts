"use client";

import { useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useApi } from './useApi';
import type { TemplateConfig, TemplateListItem, PreviewData } from '@/types/pdf-templates';

export function usePdfTemplates() {
  const { apiCall } = useApi();
  const { getToken, isSignedIn } = useAuth();

  const getTemplates = useCallback(async () => {
    const response = await apiCall<TemplateListItem[]>('/templates/');
    return response;
  }, [apiCall]);

  const getTemplate = useCallback(async (id: string) => {
    const response = await apiCall<TemplateConfig>(`/templates/${id}`);
    return response;
  }, [apiCall]);

  const createTemplate = useCallback(async (template: Omit<TemplateConfig, 'id'>) => {
    const response = await apiCall<TemplateConfig>('/templates/', {
      method: 'POST',
      body: JSON.stringify(template),
    });
    return response;
  }, [apiCall]);

  const updateTemplate = useCallback(async (id: string, template: Partial<TemplateConfig>) => {
    const response = await apiCall<TemplateConfig>(`/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(template),
    });
    return response;
  }, [apiCall]);

  const deleteTemplate = useCallback(async (id: string) => {
    const response = await apiCall<void>(`/templates/${id}`, {
      method: 'DELETE',
    });
    return response;
  }, [apiCall]);

  const getDefaultTemplate = useCallback(async () => {
    const response = await apiCall<TemplateConfig>('/templates/default/current');
    return response;
  }, [apiCall]);

  const setDefaultTemplate = useCallback(async (id: string) => {
    const response = await apiCall<void>(`/templates/${id}/set-default`, {
      method: 'POST',
    });
    return response;
  }, [apiCall]);

  const getPredefinedTemplates = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await apiCall<any[]>('/templates/predefined/list');
    return response;
  }, [apiCall]);

  const createFromPredefined = useCallback(async (templateName: string) => {
    const response = await apiCall<TemplateConfig>(`/templates/predefined/${templateName}/create`, {
      method: 'POST',
    });
    return response;
  }, [apiCall]);

  const initializePredefinedTemplates = useCallback(async () => {
    const response = await apiCall<TemplateConfig[]>('/templates/initialize', {
      method: 'POST',
    });
    return response;
  }, [apiCall]);

  const exportTemplate = useCallback(async (id: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await apiCall<any>(`/templates/${id}/export`);
    return response;
  }, [apiCall]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const importTemplate = useCallback(async (importData: any, customName?: string) => {
    const response = await apiCall<TemplateConfig>('/templates/import', {
      method: 'POST',
      body: JSON.stringify({ import_data: importData, custom_name: customName }),
    });
    return response;
  }, [apiCall]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const validateTemplate = useCallback(async (templateData: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await apiCall<any>('/templates/validate', {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
    return response;
  }, [apiCall]);

  const generatePreview = useCallback(async (template: TemplateConfig, data: PreviewData) => {
    if (!isSignedIn) {
      throw new Error('Usuario no autenticado');
    }

    const token = await getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    const response = await fetch(`${API_BASE_URL}/pdf/preview`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        template_config: template,
        invoice_data: data,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
    }

    return response.blob();
  }, [getToken, isSignedIn]);

  const getColorPalettes = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await apiCall<any[]>('/pdf/templates/color-palettes');
    return response;
  }, [apiCall]);

  return {
    getTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    generatePreview,
    getColorPalettes,
    getDefaultTemplate,
    setDefaultTemplate,
    getPredefinedTemplates,
    createFromPredefined,
    initializePredefinedTemplates,
    exportTemplate,
    importTemplate,
    validateTemplate,
  };
}
