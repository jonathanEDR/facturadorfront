import { useState, useEffect, useCallback } from 'react';
import { validarEmpresa } from '@/utils/validations/empresa';

interface UseFormValidationOptions {
  validateOnChange?: boolean;
  debounceMs?: number;
}

export function useFormValidation(
  data: Record<string, unknown>,
  options: UseFormValidationOptions = {}
) {
  const { validateOnChange = true, debounceMs = 300 } = options;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(false);

  const validateData = useCallback((formData: Record<string, unknown>) => {
    const result = validarEmpresa(formData);
    setErrors(result.errores);
    setIsValid(result.valido);
    return result;
  }, []);

  const validateField = useCallback((fieldName: string, value: unknown) => {
    const tempData = { ...data, [fieldName]: value };
    const result = validarEmpresa(tempData);
    
    // Solo actualizar el error de este campo específico
    setErrors(prev => {
      const newErrors = { ...prev };
      if (result.errores[fieldName]) {
        newErrors[fieldName] = result.errores[fieldName];
      } else {
        delete newErrors[fieldName];
      }
      return newErrors;
    });
    
    return !result.errores[fieldName];
  }, [data]);

  const clearError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Validación automática con debounce
  useEffect(() => {
    if (!validateOnChange) return;

    const timer = setTimeout(() => {
      validateData(data);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [data, validateOnChange, debounceMs, validateData]);

  return {
    errors,
    isValid,
    validateData,
    validateField,
    clearError,
    clearAllErrors,
  };
}
