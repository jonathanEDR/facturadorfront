/**
 * Componente principal para gestionar clientes con sincronización mejorada
 */

"use client";

import React, { useState } from 'react';
import { Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { ClientList } from './ClientList';
import { ClientFormModal } from './ClientFormModal';
import { Cliente } from '@/types/cliente';
import { useClientesContext } from '@/contexts/ClientesContext';

export function ClientManager() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | undefined>();
  const { pagination, refrescarLista } = useClientesContext();

  const handleOpenNewModal = () => {
    setSelectedCliente(undefined);
    setModalOpen(true);
  };

  const handleEditCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setModalOpen(true);
  };

  const handleClienteSuccess = () => {
    setModalOpen(false);
    setSelectedCliente(undefined);
  };

  const handleRefreshList = () => {
    console.log('🔄 [ClientManager] Refrescando lista explícitamente');
    refrescarLista();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6" />
            Clientes
            {pagination && (
              <Badge variant="secondary" className="ml-2">
                {pagination.total} total
              </Badge>
            )}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Gestiona tu base de datos de clientes
          </p>
        </div>
        
        <Button onClick={handleOpenNewModal} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Lista de clientes */}
      <ClientList 
        showActions={true}
        onEditCliente={handleEditCliente}
        onRefreshNeeded={handleRefreshList}
      />

      {/* Modal del formulario */}
      <ClientFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        cliente={selectedCliente}
        onSuccess={handleClienteSuccess}
      />
    </div>
  );
}
