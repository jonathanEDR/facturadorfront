'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Download,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface LogoInfo {
  has_logo: boolean;
  original?: {
    path: string;
    info: {
      size: [number, number];
      format: string;
      mode: string;
    };
  };
  versions: {
    small?: { 
      path: string;
      info: {
        size: [number, number];
        format: string;
        mode: string;
      };
    };
    medium?: { 
      path: string;
      info: {
        size: [number, number];
        format: string;
        mode: string;
      };
    };
    large?: { 
      path: string;
      info: {
        size: [number, number];
        format: string;
        mode: string;
      };
    };
  };
}

interface LogoManagerProps {
  empresaId?: string;
  onLogoChange?: (hasLogo: boolean) => void;
}

export function LogoManager({ empresaId, onLogoChange }: LogoManagerProps) {
  const [logoInfo, setLogoInfo] = useState<LogoInfo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  const loadLogoPreview = useCallback(async (version: 'small' | 'medium' | 'large' = 'medium') => {
    if (!empresaId) return;

    try {
      const response = await fetch(`${baseUrl}/logos/${empresaId}/${version}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      }
    } catch (err) {
      console.error('Error loading logo preview:', err);
    }
  }, [empresaId, baseUrl]);

  const loadLogoInfo = useCallback(async () => {
    if (!empresaId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${baseUrl}/logos/${empresaId}/info`);
      
      if (response.ok) {
        const data = await response.json();
        setLogoInfo(data);
        onLogoChange?.(data.has_logo);
        
        // Si tiene logo, cargar preview
        if (data.has_logo) {
          loadLogoPreview('medium');
        }
      } else if (response.status === 404) {
        // No tiene logo
        setLogoInfo({ has_logo: false, versions: {} });
        onLogoChange?.(false);
      } else {
        throw new Error('Error al cargar información del logo');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error loading logo info:', err);
    } finally {
      setIsLoading(false);
    }
  }, [empresaId, baseUrl, onLogoChange, loadLogoPreview]);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !empresaId) return;

    // Validaciones
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Formato de archivo no válido. Use PNG, JPG, JPEG o GIF.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      setError('El archivo es demasiado grande. Máximo 5MB.');
      return;
    }

    await uploadLogo(file);
  };

  const uploadLogo = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setSuccess(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('logo_file', file);
      formData.append('filename', file.name);

      const xhr = new XMLHttpRequest();

      // Configurar progreso de subida
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadProgress(progress);
        }
      });

      // Promesa para manejar la respuesta
      const uploadPromise = new Promise<{success: boolean, message?: string}>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Error ${xhr.status}: ${xhr.statusText}`));
          }
        };
        xhr.onerror = () => reject(new Error('Error de red'));
      });

      xhr.open('POST', `${baseUrl}/logos/${empresaId}/upload`);
      xhr.send(formData);

      await uploadPromise;
      
      setSuccess('¡Logo subido exitosamente!');
      setUploadProgress(100);
      
      // Recargar información del logo
      await loadLogoInfo();
      
      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el logo');
      console.error('Error uploading logo:', err);
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setSuccess(null);
      }, 3000);
    }
  };

  const handleDeleteLogo = async () => {
    if (!empresaId || !logoInfo?.has_logo) return;

    if (!confirm('¿Está seguro de que desea eliminar el logo? Esta acción no se puede deshacer.')) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${baseUrl}/logos/${empresaId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccess('Logo eliminado exitosamente');
        setPreviewUrl(null);
        await loadLogoInfo();
      } else {
        throw new Error('Error al eliminar el logo');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el logo');
    } finally {
      setIsLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const downloadLogo = async (version: 'small' | 'medium' | 'large' | 'original' = 'original') => {
    if (!empresaId) return;

    try {
      const response = await fetch(`${baseUrl}/logos/${empresaId}/${version}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logo_${empresaId}_${version}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error downloading logo:', err);
    }
  };

  // Cargar información del logo al montar el componente
  useEffect(() => {
    if (empresaId) {
      loadLogoInfo();
    }
  }, [empresaId, loadLogoInfo]);

  if (!empresaId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Seleccione una empresa para gestionar su logo.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Gestión de Logo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mensajes de estado */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Progreso de subida */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Subiendo logo...</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {/* Vista previa del logo actual */}
        {logoInfo?.has_logo && previewUrl && (
          <div className="space-y-3">
            <Label>Logo Actual</Label>
            <div className="border rounded-lg p-4 bg-gray-50 flex flex-col items-center space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={previewUrl} 
                alt="Logo actual" 
                className="max-w-full max-h-32 object-contain"
              />
              
              {/* Información del logo */}
              {logoInfo.original?.info && (
                <div className="text-xs text-gray-600 text-center space-y-1">
                  <div>Archivo: logo.{logoInfo.original.info.format.toLowerCase()}</div>
                  <div>Tamaño: {logoInfo.original.info.size[0]} × {logoInfo.original.info.size[1]} px</div>
                  <div>Formato: {logoInfo.original.info.format}</div>
                  <div>Modo: {logoInfo.original.info.mode}</div>
                </div>
              )}
              
              {/* Botones de acción */}
              <div className="flex gap-2">
                <Select defaultValue="medium" onValueChange={(value: 'small' | 'medium' | 'large') => loadLogoPreview(value)}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Pequeño</SelectItem>
                    <SelectItem value="medium">Mediano</SelectItem>
                    <SelectItem value="large">Grande</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => downloadLogo('original')}
                >
                  <Download className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDeleteLogo}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Selector de archivo */}
        <div className="space-y-3">
          <Label>
            {logoInfo?.has_logo ? 'Cambiar Logo' : 'Subir Logo'}
          </Label>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading || isLoading}
            />
            
            <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Arrastra tu logo aquí o
              </p>
              <Button 
                variant="outline" 
                onClick={handleFileSelect}
                disabled={isUploading || isLoading}
                className="mx-auto"
              >
                <Upload className="h-4 w-4 mr-2" />
                {logoInfo?.has_logo ? 'Cambiar Logo' : 'Seleccionar Archivo'}
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 mt-3">
              Formatos soportados: PNG, JPG, JPEG, GIF (máx. 5MB)
            </p>
          </div>
        </div>

        {/* Información de versiones optimizadas */}
        {logoInfo?.has_logo && logoInfo.versions && (
          <div className="space-y-2">
            <Label>Versiones Optimizadas</Label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-gray-50 p-2 rounded">
                <div className="font-medium">Pequeño</div>
                <div>{logoInfo.versions.small?.info?.size[0] || 0}×{logoInfo.versions.small?.info?.size[1] || 0}</div>
                <div>{logoInfo.versions.small?.info?.format || 'N/A'}</div>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <div className="font-medium">Mediano</div>
                <div>{logoInfo.versions.medium?.info?.size[0] || 0}×{logoInfo.versions.medium?.info?.size[1] || 0}</div>
                <div>{logoInfo.versions.medium?.info?.format || 'N/A'}</div>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <div className="font-medium">Grande</div>
                <div>{logoInfo.versions.large?.info?.size[0] || 0}×{logoInfo.versions.large?.info?.size[1] || 0}</div>
                <div>{logoInfo.versions.large?.info?.format || 'N/A'}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
