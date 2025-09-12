/**
 * Modal para el formulario de clientes
 */

"use client";

import React, { useState, useEffect } from 'react';
import { UserPlus, Edit } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

import { ClientForm } from './ClientForm';
import { Cliente } from '@/types/cliente';

interface ClientFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: Cliente;
  onSuccess?: () => void;
}

export function ClientFormModal({ 
  open, 
  onOpenChange, 
  cliente,
  onSuccess 
}: ClientFormModalProps) {
  const [hasChanges, setHasChanges] = useState(false);

  const handleSuccess = () => {
    setHasChanges(false);
    onOpenChange(false);
    
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm('¿Estás seguro de cerrar? Los cambios no guardados se perderán.')) {
        setHasChanges(false);
        onOpenChange(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && hasChanges) {
      if (window.confirm('¿Estás seguro de cerrar? Los cambios no guardados se perderán.')) {
        setHasChanges(false);
        onOpenChange(false);
      }
    } else {
      onOpenChange(newOpen);
    }
  };

  // Reset hasChanges when modal opens/closes
  useEffect(() => {
    if (!open) {
      setHasChanges(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {cliente ? (
              <>
                <Edit className="h-5 w-5" />
                Editar Cliente - {cliente.razon_social}
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                Nuevo Cliente
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {cliente ? 
              'Modifica la información del cliente seleccionado.' : 
              'Completa el formulario para registrar un nuevo cliente en el sistema.'
            }
          </DialogDescription>
        </DialogHeader>
        
        {/* Solo renderizar el form cuando el modal está abierto */}
        {open && (
          <div className="mt-4">
            <ClientForm
              cliente={cliente}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
              onFormChange={setHasChanges}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
