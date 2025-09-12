'use client'

import { EmpresaDetailResponse } from '@/types/empresa'
import EmpresaForm from './EmpresaForm'

interface EmpresaFormModalProps {
  empresa?: EmpresaDetailResponse | null
  isEditing?: boolean
  onSave: (empresa: EmpresaDetailResponse) => void
  onCancel: () => void
}

export default function EmpresaFormModal({ empresa, isEditing = false, onSave, onCancel }: EmpresaFormModalProps) {
  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-200">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Editar Empresa' : 'Nueva Empresa'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <EmpresaForm
            empresa={empresa}
            isEditing={isEditing}
            onSave={onSave}
            onCancel={onCancel}
          />
        </div>
      </div>
    </div>
  )
}
