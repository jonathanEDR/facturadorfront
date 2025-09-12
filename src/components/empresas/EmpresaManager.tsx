'use client'

import React, { useState } from 'react'
import { EmpresaResponse, EmpresaDetailResponse } from '@/types/empresa'
import { useEmpresa } from '@/hooks/useEmpresa'
import EmpresaList from './EmpresaList'
import EmpresaFormModal from './EmpresaFormModal'
import EmpresaDetail from './EmpresaDetail'
import EmpresaConfiguration from './EmpresaConfiguration'

type ViewMode = 'list' | 'detail' | 'configure'
type ModalMode = 'create' | 'edit' | null

export default function EmpresaManager() {
  const { obtenerEmpresa } = useEmpresa()
  const [currentView, setCurrentView] = useState<ViewMode>('list')
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedEmpresa, setSelectedEmpresa] = useState<EmpresaResponse | EmpresaDetailResponse | null>(null)
  const [loadingEdit, setLoadingEdit] = useState(false)

  const handleSelectEmpresa = async (empresa: EmpresaResponse) => {
    try {
      // Cargar datos completos antes de mostrar el detalle
      const empresaCompleta = await obtenerEmpresa(empresa.id)
      
      if (empresaCompleta) {
        setSelectedEmpresa(empresaCompleta)
        setCurrentView('detail')
      } else {
        // Fallback: usar los datos básicos disponibles
        setSelectedEmpresa(empresa)
        setCurrentView('detail')
      }
    } catch (error) {
      console.error('Error cargando datos completos de empresa para detalle:', error)
      // Fallback: usar los datos básicos disponibles
      setSelectedEmpresa(empresa)
      setCurrentView('detail')
    }
  }

  const handleEditEmpresa = async (empresa: EmpresaResponse) => {
    try {
      setLoadingEdit(true)
      
      // Cargar datos completos antes de abrir el modal
      const empresaCompleta = await obtenerEmpresa(empresa.id)
      
      // Usar los datos retornados directamente
      if (empresaCompleta) {
        setSelectedEmpresa(empresaCompleta)
        setModalMode('edit')
      } else {
        // Fallback: usar los datos básicos disponibles
        console.warn('⚠️ No se pudieron cargar datos completos, usando datos básicos')
        setSelectedEmpresa(empresa)
        setModalMode('edit')
      }
    } catch (error) {
      console.error('Error cargando datos completos de empresa:', error)
      // Fallback: usar los datos básicos disponibles
      setSelectedEmpresa(empresa)
      setModalMode('edit')
    } finally {
      setLoadingEdit(false)
    }
  }

  const handleConfigureEmpresa = (empresa: EmpresaResponse) => {
    setSelectedEmpresa(empresa)
    setCurrentView('configure')
  }

  const handleCreateNew = () => {
    setSelectedEmpresa(null)
    setModalMode('create')
  }

  const handleSave = (empresa: EmpresaDetailResponse) => {
    setSelectedEmpresa(empresa)
    setModalMode(null)
    // Si estaba editando, volver a la vista de detalle
    if (modalMode === 'edit') {
      setCurrentView('detail')
    }
  }

  const handleCancel = () => {
    setModalMode(null)
  }

  const handleBackToList = () => {
    setSelectedEmpresa(null)
    setCurrentView('list')
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'list':
        return (
          <EmpresaList
            onSelectEmpresa={handleSelectEmpresa}
            onEditEmpresa={handleEditEmpresa}
            onConfigureEmpresa={handleConfigureEmpresa}
            onCreateNew={handleCreateNew}
          />
        )

      case 'detail':
        return (
          <EmpresaDetail
            empresa={selectedEmpresa as EmpresaDetailResponse}
            onEdit={() => setModalMode('edit')}
            onConfigure={() => setCurrentView('configure')}
            onBack={handleBackToList}
          />
        )

      case 'configure':
        if (!selectedEmpresa) return null
        return (
          <EmpresaConfiguration
            empresa={selectedEmpresa}
            onBack={handleBackToList}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1 overflow-y-auto p-6">
        {renderCurrentView()}
      </div>
      
      {/* Modal para crear/editar empresa */}
      {modalMode && (
        <EmpresaFormModal
          empresa={modalMode === 'edit' ? selectedEmpresa as EmpresaDetailResponse : null}
          isEditing={modalMode === 'edit'}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
      
      {/* Loading overlay para edición */}
      {loadingEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Cargando datos de empresa...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
