/**
 * Hook personalizado para usar el cliente de facturas con autenticación JWT de Clerk
 */
import { useAuth } from '@clerk/nextjs';
import { createAuthenticatedFacturasClient, FacturasApiClient } from '@/services/facturas';
import { useMemo } from 'react';

/**
 * Hook que proporciona un cliente de facturas autenticado con JWT de Clerk
 * @returns Cliente de facturas con autenticación automática
 */
export function useAuthenticatedFacturas(): FacturasApiClient | null {
  const { getToken, isSignedIn, isLoaded } = useAuth();

  // Crear el cliente autenticado solo cuando el usuario esté autenticado
  const authenticatedClient = useMemo(() => {
    if (!isLoaded || !isSignedIn || !getToken) {
      return null;
    }

    return createAuthenticatedFacturasClient(getToken);
  }, [getToken, isSignedIn, isLoaded]);

  return authenticatedClient;
}

/**
 * Hook que proporciona métodos de facturas con autenticación automática
 * @returns Métodos del cliente de facturas o null si no está autenticado
 */
export function useFacturasAuth() {
  const client = useAuthenticatedFacturas();
  const { isSignedIn, isLoaded } = useAuth();

  // Memoizar los valores booleanos para evitar recreaciones innecesarias
  const isAuthenticated = useMemo(() => isSignedIn && isLoaded, [isSignedIn, isLoaded]);
  const isLoading = useMemo(() => !isLoaded, [isLoaded]);

  return useMemo(() => ({
    client,
    isAuthenticated,
    isLoading,
  }), [client, isAuthenticated, isLoading]);
}
