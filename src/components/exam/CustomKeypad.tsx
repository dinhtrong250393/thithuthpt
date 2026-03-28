import React from 'react';
import { Delete } from 'lucide-react';

interface CustomKeypadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onClear: () => void;
}

export function CustomKeypad({ onKeyPress, onDelete, onClear }: CustomKeypadProps) {
  const keys = [
    '7', '8', '9', '/',
    '4', '5', '6', '*',
    '1', '2', '3', '-',
    '0', '.', ',', '+'
  ];

  return (
    <div className="bg-slate-100 p-4 rounded-xl shadow-lg border border-slate-200 w-64">
      <div className="grid grid-cols-4 gap-2 mb-2">
        {keys.map((key) => (
          <button
            key={key}
            onClick={() => onKeyPress(key)}
            className="h-12 bg-white rounded-lg shadow-sm border border-slate-200 text-lg font-medium hover:bg-blue-50 active:bg-blue-100 transition-colors flex items-center justify-center text-slate-700"
          >
            {key}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onClear}
          className="h-12 bg-red-50 text-red-600 rounded-lg shadow-sm border border-red-100 font-medium hover:bg-red-100 active:bg-red-200 transition-colors"
        >
          Xóa hết
        </button>
        <button
          onClick={onDelete}
          className="h-12 bg-slate-200 text-slate-700 rounded-lg shadow-sm border border-slate-300 font-medium hover:bg-slate-300 active:bg-slate-400 transition-colors flex items-center justify-center"
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
