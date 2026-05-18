import React from 'react';
import { Sliders, RotateCcw, Activity } from 'lucide-react';

interface ControlCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  min: number;
  max: number;
  step: number;
  currentValue: number;
  onChange: (val: number) => void;
  onReset: () => void;
}

export const EffectCard = ({ label, value, icon, min, max, step, currentValue, onChange, onReset }: ControlCardProps) => (
  <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group">
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-50 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
          {icon}
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{value}</span>
        <button onClick={onReset} className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={currentValue}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600 mb-2"
    />
  </div>
);
