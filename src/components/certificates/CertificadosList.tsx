// Componente para listar certificados digitales de una empresa
'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { CertificadoCard } from './CertificadoCard';
import { 
  CertificadosListProps
} from '@/types/certificates';
import { useCertificados } from '@/hooks/useCertificados';

export function CertificadosList({
  empresa_id,
  showActions = true,
}: CertificadosListProps) {
  const { certificados, certificado_activo, loading, error, actions } = useCertificados(empresa_id);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'todos' | 'activos' | 'vencidos' | 'por_vencer'>('todos');
  const [showActivateModal, setShowActivateModal] = useState<string | null>(null);
  const [activateReason, setActivateReason] = useState('');

  // Filtrar certificados según criterios
  const filteredCertificados = certificados.filter(certificado => {
    // Filtro de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        certificado.filename.toLowerCase().includes(searchLower) ||
        certificado.ruc_certificado.includes(searchTerm) ||
        certificado.subject_dn.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // Filtros de estado
    switch (selectedFilter) {
      case 'activos':
        return certificado.activo;
      case 'vencidos':
        return !certificado.vigente;
      case 'por_vencer':
        return certificado.vigente && certificado.requiere_renovacion;
      default:
        return true;
    }
  });

  // Estadísticas
  const stats = {
    total: certificados.length,
    activos: certificados.filter(c => c.activo).length,
    vencidos: certificados.filter(c => !c.vigente).length,
    por_vencer: certificados.filter(c => c.vigente && c.requiere_renovacion).length,
  };

  // Manejar activación de certificado
  const handleActivate = async (certificadoId: string) => {
    if (!activateReason.trim()) {
      alert('Por favor, ingresa una razón para activar el certificado');
      return;
    }

    try {
      await actions.activateCertificado(empresa_id, certificadoId, activateReason);
      setShowActivateModal(null);
      setActivateReason('');
    } catch (error) {
      console.error('Error al activar certificado:', error);
    }
  };

  // Manejar desactivación
  const handleDeactivate = async (certificadoId: string) => {
    if (!confirm('¿Estás seguro de que quieres desactivar este certificado?')) {
      return;
    }

    try {
      await actions.deactivateCertificado(empresa_id, certificadoId);
    } catch (error) {
      console.error('Error al desactivar certificado:', error);
    }
  };

  // Manejar eliminación
  const handleDelete = async (certificadoId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este certificado? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await actions.deleteCertificado(empresa_id, certificadoId);
    } catch (error) {
      console.error('Error al eliminar certificado:', error);
    }
  };

  // Manejar validación
  const handleValidate = async (certificadoId: string) => {
    try {
      const result = await actions.validateCertificado(empresa_id, certificadoId);
      
      // Mostrar resultado de validación
      if (result.valido) {
        alert('✅ Certificado válido según estándares SUNAT');
      } else {
        const errores = result.errores.join('\n');
        alert(`❌ Certificado inválido:\n\n${errores}`);
      }
    } catch (error) {
      console.error('Error al validar certificado:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Cargando certificados...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Error al cargar certificados: {error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => actions.refreshCertificados()}>
            Reintentar
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros y búsqueda */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nombre, RUC o subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => actions.refreshCertificados()}
              disabled={loading}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualizar
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4">
          {[
            { key: 'todos', label: 'Todos', count: stats.total },
            { key: 'activos', label: 'Activos', count: stats.activos },
            { key: 'vencidos', label: 'Vencidos', count: stats.vencidos },
            { key: 'por_vencer', label: 'Por vencer', count: stats.por_vencer },
          ].map(filter => (
            <Button
              key={filter.key}
              variant={selectedFilter === filter.key ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter(filter.key as 'todos' | 'activos' | 'vencidos' | 'por_vencer')}
              className="flex items-center space-x-1"
            >
              <span>{filter.label}</span>
              <Badge variant="secondary" className="ml-1">
                {filter.count}
              </Badge>
            </Button>
          ))}
        </div>
      </Card>

      {/* Lista de certificados */}
      {filteredCertificados.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <h3 className="text-lg font-medium text-gray-700">
                {searchTerm || selectedFilter !== 'todos' 
                  ? 'No se encontraron certificados' 
                  : 'No hay certificados registrados'
                }
              </h3>
              <p className="text-gray-500">
                {searchTerm || selectedFilter !== 'todos'
                  ? 'Intenta cambiar los filtros de búsqueda'
                  : 'Sube tu primer certificado digital para comenzar'
                }
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCertificados.map((certificado) => (
            <CertificadoCard
              key={certificado.id}
              certificado={certificado}
              isActive={certificado.id === certificado_activo?.id}
              onActivate={showActions ? (id) => setShowActivateModal(id) : undefined}
              onDeactivate={showActions ? handleDeactivate : undefined}
              onDelete={showActions ? handleDelete : undefined}
              onValidate={showActions ? handleValidate : undefined}
              onDownload={showActions ? (id) => console.log('Download:', id) : undefined}
            />
          ))}
        </div>
      )}

      {/* Modal de activación */}
      {showActivateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full m-4 bg-white">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Activar Certificado</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Razón para activar este certificado:
                </label>
                <Input
                  value={activateReason}
                  onChange={(e) => setActivateReason(e.target.value)}
                  placeholder="Ej: Renovación del certificado anterior"
                  className="w-full"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowActivateModal(null);
                    setActivateReason('');
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={() => handleActivate(showActivateModal)}>
                  Activar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
