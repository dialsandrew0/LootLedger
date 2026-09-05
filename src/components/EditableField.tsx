import React, { useState, useEffect } from 'react';
import { Edit2, Check, X } from 'lucide-react';

interface EditableFieldProps {
  value: string | number;
  label?: string;
  type?: 'text' | 'textarea' | 'number';
  onSave: (val: string | number) => void;
  className?: string;
  textClassName?: string;
}

export function EditableField({ value, label, type = 'text', onSave, className = '', textClassName = '' }: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleSave = () => {
    if (type === 'number') {
      onSave(Number(tempValue));
    } else {
      onSave(tempValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={`flex flex-col gap-1 w-full ${className}`}>
        {label && <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">{label}</label>}
        <div className="flex gap-2 w-full">
          {type === 'textarea' ? (
            <textarea
              className="flex-1 px-3 py-2 border-2 border-blue-500 rounded-lg text-sm bg-surface focus:outline-none min-h-[100px]"
              value={tempValue as string}
              onChange={(e) => setTempValue(e.target.value)}
            />
          ) : (
            <input
              type={type === 'number' ? 'number' : 'text'}
              className="flex-1 px-3 py-2 border-2 border-blue-500 rounded-lg text-sm bg-surface focus:outline-none font-medium"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
            />
          )}
          <div className="flex flex-col gap-1 shrink-0">
            <button onClick={handleSave} className="p-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-md">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={handleCancel} className="p-2 bg-surface-hover text-primary hover:bg-surface-hover border border-subtle rounded-md">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`group relative flex items-start gap-2 ${className}`}>
      <div className="flex-1 min-w-0">
        {label && <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">{label}</p>}
        <div className={textClassName}>{type === 'number' && typeof value === 'number' ? `$${value.toFixed(2)}` : value}</div>
      </div>
      <button
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-muted hover:text-accent hover:bg-blue-50 rounded-md shrink-0 mt-0.5"
        title="Edit"
      >
        <Edit2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
