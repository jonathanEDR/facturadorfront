'use client';

import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

const PRESET_COLORS = [
  '#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed',
  '#db2777', '#0891b2', '#65a30d', '#ea580c', '#9333ea',
  '#1f2937', '#374151', '#6b7280', '#9ca3af', '#d1d5db',
  '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1'
];

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  const handleColorSelect = (color: string) => {
    setInputValue(color);
    onChange(color);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Validar que sea un color hexadecimal válido
    if (/^#[0-9A-F]{6}$/i.test(newValue)) {
      onChange(newValue);
    }
  };

  return (
    <div className="space-y-2 relative">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <div 
          className="w-10 h-10 rounded-md border-2 border-gray-300 cursor-pointer flex-shrink-0"
          style={{ backgroundColor: value }}
          onClick={() => setIsOpen(!isOpen)}
        />
        <Input
          value={inputValue}
          onChange={handleInputChange}
          placeholder="#000000"
          className="font-mono text-sm"
        />
      </div>
      
      {isOpen && (
        <div className="absolute z-50 bg-white border rounded-lg shadow-lg p-4 mt-2 w-64">
          <div className="grid grid-cols-5 gap-2 mb-4">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                className="w-8 h-8 rounded-md border-2 border-gray-300 hover:border-gray-400 transition-colors"
                style={{ backgroundColor: color }}
                onClick={() => handleColorSelect(color)}
                title={color}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              type="color"
              value={value}
              onChange={(e) => handleColorSelect(e.target.value)}
              className="w-16 h-8 p-1"
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsOpen(false)}
            >
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
