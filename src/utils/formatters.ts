import { DateTimeManager } from './datetime';

/**
 * Format currency values
 */
export function formatCurrency(amount: number, currency: string = 'PEN'): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format dates using Peru timezone
 */
export function formatDate(date: Date | string, includeTime: boolean = false): string {
  return DateTimeManager.formatForDisplay(date, includeTime);
}

/**
 * Generate invoice number with Peru timezone
 */
export function generateInvoiceNumber(): string {
  const timestamp = DateTimeManager.formatForFilename();
  const random = Math.floor(Math.random() * 1000);
  return `INV-${timestamp}-${random}`;
}

/**
 * Calculate tax amount
 */
export function calculateTax(amount: number, taxRate: number = 0.16): number {
  return amount * taxRate;
}

/**
 * Calculate total with tax
 */
export function calculateTotal(subtotal: number, taxRate: number = 0.16): number {
  return subtotal + calculateTax(subtotal, taxRate);
}
