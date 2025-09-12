/**
 * Utilidades de validación para empresas
 */

// Validación de RUC peruano
export function validarRuc(ruc: string): { valido: boolean; mensaje?: string } {
  if (!ruc) {
    return { valido: false, mensaje: "RUC es obligatorio" };
  }

  // Limpiar espacios
  const rucLimpio = ruc.trim();

  // Verificar longitud
  if (rucLimpio.length !== 11) {
    return { valido: false, mensaje: "RUC debe tener 11 dígitos" };
  }

  // Verificar que solo tenga números
  if (!/^\d{11}$/.test(rucLimpio)) {
    return { valido: false, mensaje: "RUC debe contener solo números" };
  }

  // Validar dígito verificador
  const digitos = rucLimpio.split('').map(Number);
  const factores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  
  let suma = 0;
  for (let i = 0; i < 10; i++) {
    suma += digitos[i] * factores[i];
  }
  
  const resto = suma % 11;
  const digitoVerificador = resto < 2 ? resto : 11 - resto;
  
  if (digitoVerificador !== digitos[10]) {
    return { valido: false, mensaje: "RUC inválido - dígito verificador incorrecto" };
  }

  return { valido: true };
}

// Validación de email
export function validarEmail(email: string): { valido: boolean; mensaje?: string } {
  if (!email) {
    return { valido: true }; // Email es opcional
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { valido: false, mensaje: "Email inválido" };
  }

  return { valido: true };
}

// Validación de teléfono peruano
export function validarTelefono(telefono: string): { valido: boolean; mensaje?: string } {
  if (!telefono) {
    return { valido: true }; // Teléfono es opcional
  }

  // Limpiar espacios y guiones
  const telefonoLimpio = telefono.replace(/[\s-]/g, '');

  // Patrones válidos para Perú
  const patronesTelefono = [
    /^01\d{7}$/, // Lima: 01 + 7 dígitos
    /^0\d{2}\d{6}$/, // Provincias: 0 + código área (2 dígitos) + 6 dígitos
    /^9\d{8}$/, // Móviles: 9 + 8 dígitos
  ];

  const esValido = patronesTelefono.some(patron => patron.test(telefonoLimpio));

  if (!esValido) {
    return { valido: false, mensaje: "Teléfono inválido. Formato: 01XXXXXXX, 0XXXXXXXX o 9XXXXXXXX" };
  }

  return { valido: true };
}

// Validación de ubigeo peruano
export function validarUbigeo(ubigeo: string): { valido: boolean; mensaje?: string } {
  if (!ubigeo) {
    return { valido: true }; // Ubigeo es opcional
  }

  // Ubigeo debe tener 6 dígitos
  if (!/^\d{6}$/.test(ubigeo)) {
    return { valido: false, mensaje: "Ubigeo debe tener 6 dígitos" };
  }

  return { valido: true };
}

// Validación de razón social
export function validarRazonSocial(razonSocial: string): { valido: boolean; mensaje?: string } {
  if (!razonSocial || razonSocial.trim().length === 0) {
    return { valido: false, mensaje: "Razón social es obligatoria" };
  }

  if (razonSocial.trim().length < 3) {
    return { valido: false, mensaje: "Razón social debe tener al menos 3 caracteres" };
  }

  if (razonSocial.length > 200) {
    return { valido: false, mensaje: "Razón social no puede exceder 200 caracteres" };
  }

  return { valido: true };
}

// Validación de moneda
export function validarMoneda(moneda: string): { valido: boolean; mensaje?: string } {
  const monedasValidas = ['PEN', 'USD', 'EUR'];
  
  if (!monedasValidas.includes(moneda)) {
    return { valido: false, mensaje: "Moneda debe ser PEN, USD o EUR" };
  }

  return { valido: true };
}

// Validación de IGV
export function validarIGV(igv: number): { valido: boolean; mensaje?: string } {
  if (igv < 0 || igv > 100) {
    return { valido: false, mensaje: "IGV debe estar entre 0 y 100" };
  }

  return { valido: true };
}

// Validación completa de empresa
export function validarEmpresa(data: Record<string, unknown>): { valido: boolean; errores: Record<string, string> } {
  const errores: Record<string, string> = {};

  // Validar RUC
  const validacionRuc = validarRuc(String(data.ruc || ''));
  if (!validacionRuc.valido) {
    errores.ruc = validacionRuc.mensaje!;
  }

  // Validar razón social
  const validacionRazonSocial = validarRazonSocial(String(data.razon_social || ''));
  if (!validacionRazonSocial.valido) {
    errores.razon_social = validacionRazonSocial.mensaje!;
  }

  // Validar email si está presente
  if (data.email) {
    const validacionEmail = validarEmail(String(data.email));
    if (!validacionEmail.valido) {
      errores.email = validacionEmail.mensaje!;
    }
  }

  // Validar teléfono si está presente
  if (data.telefono) {
    const validacionTelefono = validarTelefono(String(data.telefono));
    if (!validacionTelefono.valido) {
      errores.telefono = validacionTelefono.mensaje!;
    }
  }

  // Validar ubigeo si está presente
  if (data.ubigeo) {
    const validacionUbigeo = validarUbigeo(String(data.ubigeo));
    if (!validacionUbigeo.valido) {
      errores.ubigeo = validacionUbigeo.mensaje!;
    }
  }

  // Validar moneda si está presente
  if (data.moneda_defecto) {
    const validacionMoneda = validarMoneda(String(data.moneda_defecto));
    if (!validacionMoneda.valido) {
      errores.moneda_defecto = validacionMoneda.mensaje!;
    }
  }

  // Validar IGV si está presente
  if (data.igv_defecto !== undefined) {
    const validacionIGV = validarIGV(Number(data.igv_defecto));
    if (!validacionIGV.valido) {
      errores.igv_defecto = validacionIGV.mensaje!;
    }
  }

  return {
    valido: Object.keys(errores).length === 0,
    errores
  };
}

// Formatear RUC para mostrar
export function formatearRuc(ruc: string): string {
  if (!ruc || ruc.length !== 11) return ruc;
  return `${ruc.substring(0, 2)}-${ruc.substring(2)}`;
}

// Formatear teléfono para mostrar
export function formatearTelefono(telefono: string): string {
  if (!telefono) return telefono;
  
  const telefonoLimpio = telefono.replace(/[\s-]/g, '');
  
  if (telefonoLimpio.length === 9 && telefonoLimpio.startsWith('01')) {
    return `${telefonoLimpio.substring(0, 2)}-${telefonoLimpio.substring(2)}`;
  }
  
  if (telefonoLimpio.length === 9 && telefonoLimpio.startsWith('9')) {
    return `${telefonoLimpio.substring(0, 3)}-${telefonoLimpio.substring(3, 6)}-${telefonoLimpio.substring(6)}`;
  }
  
  return telefono;
}
