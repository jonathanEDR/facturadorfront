// Componente para subir certificados digitales
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CertificadoUploadProps, 
  CertificadoUploadRequest,
  UploadConfig
} from '@/types/certificates';
import { useCertificados } from '@/hooks/useCertificados';

const defaultConfig: UploadConfig = {
  max_file_size: 10 * 1024 * 1024, // 10MB
  accepted_extensions: ['.p12', '.pfx'],
  require_password: true,
  validate_sunat_by_default: true,
};

export function CertificadoUpload({ 
  empresa_id, 
  onUploadSuccess, 
  onUploadError,
  config = {}
}: CertificadoUploadProps) {
  const { actions, uploading } = useCertificados();
  const finalConfig = useMemo(() => ({ ...defaultConfig, ...config }), [config]);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [validateSunat, setValidateSunat] = useState(finalConfig.validate_sunat_by_default);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Validar archivo
  const validateFile = useCallback((file: File): string | null => {
    // Verificar extensión
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!finalConfig.accepted_extensions.includes(extension)) {
      return `Formato no válido. Solo se permiten archivos ${finalConfig.accepted_extensions.join(', ')}`;
    }

    // Verificar tamaño
    if (file.size > finalConfig.max_file_size) {
      const maxSizeMB = finalConfig.max_file_size / (1024 * 1024);
      return `El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`;
    }

    return null;
  }, [finalConfig]);

  // Manejar archivos arrastrados
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedFile(file);
    setError('');
    setSuccess('');
  }, [validateFile]);

  // Configurar dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/x-pkcs12': finalConfig.accepted_extensions,
    },
    maxFiles: 1,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  // Manejar selección manual de archivo (comentada por ahora)
  // const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (!file) return;

  //   const validationError = validateFile(file);
  //   if (validationError) {
  //     setError(validationError);
  //     return;
  //   }

  //   setSelectedFile(file);
  //   setError('');
  //   setSuccess('');
  // };

  // Remover archivo seleccionado
  const removeFile = () => {
    setSelectedFile(null);
    setError('');
    setSuccess('');
  };

  // Subir certificado
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Selecciona un archivo primero');
      return;
    }

    if (finalConfig.require_password && !password.trim()) {
      setError('La contraseña es obligatoria');
      return;
    }

    try {
      setError('');
      setSuccess('');

      const uploadData: CertificadoUploadRequest = {
        file: selectedFile,
        password: password.trim(),
        validar_sunat: validateSunat,
      };

      const result = await actions.uploadCertificado(empresa_id, uploadData);
      
      setSuccess('Certificado subido exitosamente');
      setSelectedFile(null);
      setPassword('');
      
      onUploadSuccess?.(result.certificado);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al subir certificado';
      setError(errorMessage);
      onUploadError?.(errorMessage);
    }
  };

  // Formatear tamaño de archivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Área de arrastrar y soltar */}
      <Card className="p-6">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive || dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
            ${selectedFile ? 'border-green-500 bg-green-50' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          {selectedFile ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-medium text-green-800">{selectedFile.name}</p>
                <p className="text-sm text-green-600">{formatFileSize(selectedFile.size)}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }}
              >
                Cambiar archivo
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-medium text-gray-700">
                  Arrastra tu certificado aquí o haz clic para seleccionar
                </p>
                <p className="text-sm text-gray-500">
                  Formatos soportados: {finalConfig.accepted_extensions.join(', ')} 
                  (máximo {Math.round(finalConfig.max_file_size / (1024 * 1024))}MB)
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Formulario de configuración */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="password">Contraseña del certificado</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa la contraseña del certificado"
              disabled={uploading}
              required={finalConfig.require_password}
            />
            <p className="text-xs text-gray-500 mt-1">
              Esta contraseña se usará para acceder al certificado durante la validación
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="validate-sunat"
              checked={validateSunat}
              onChange={(e) => setValidateSunat(e.target.checked)}
              disabled={uploading}
              className="rounded border-gray-300"
            />
            <Label htmlFor="validate-sunat" className="text-sm">
              Validar contra estándares SUNAT
            </Label>
            <Badge variant="outline" className="text-xs">
              Recomendado
            </Badge>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>• El certificado debe estar en formato PKCS#12 (.p12 o .pfx)</p>
            <p>• Debe contener el RUC de la empresa en el campo CN</p>
            <p>• La contraseña será encriptada antes del almacenamiento</p>
          </div>
        </div>
      </Card>

      {/* Alertas */}
      {error && (
        <Alert variant="destructive">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        </Alert>
      )}

      {success && (
        <Alert>
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{success}</span>
          </div>
        </Alert>
      )}

      {/* Botón de subida */}
      <div className="flex justify-end">
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || uploading || (finalConfig.require_password && !password.trim())}
          className="min-w-32"
        >
          {uploading ? (
            <div className="flex items-center space-x-2">
              <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Subiendo...</span>
            </div>
          ) : (
            'Subir certificado'
          )}
        </Button>
      </div>
    </div>
  );
}
