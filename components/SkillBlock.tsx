
import React, { useState } from 'react';
import { SkillName, ScoreValue, SkillStats } from '../types';
import { MAX_ATTEMPTS, SCORE_OPTIONS } from '../constants';
import { RotateCcw } from 'lucide-react';

interface SkillBlockProps {
  name: SkillName;
  stats: SkillStats;
  onUpdateAttempt: (skill: SkillName, index: number, value: ScoreValue) => void;
}

export const SkillBlock: React.FC<SkillBlockProps> = ({ name, stats, onUpdateAttempt }) => {
  const [lastUpdatedIdx, setLastUpdatedIdx] = useState<number | null>(null);
  const recordedCount = stats.attempts.filter(a => a !== ScoreValue.EMPTY).length;

  const handleScoreSelect = (idx: number, val: ScoreValue) => {
    if (idx < 0 || idx >= MAX_ATTEMPTS) return;
    setLastUpdatedIdx(idx);
    onUpdateAttempt(name, idx, val);
    
    setTimeout(() => {
      setLastUpdatedIdx(null);
    }, 600);
  };

  const handleQuickScore = (val: ScoreValue) => {
    // Encontra o primeiro índice vazio
    const nextIdx = stats.attempts.findIndex(a => a === ScoreValue.EMPTY);
    if (nextIdx !== -1) {
      handleScoreSelect(nextIdx, val);
    }
  };

  const handleUndo = () => {
    // Encontra o último índice preenchido
    const lastFilledIdx = [...stats.attempts].reverse().findIndex(a => a !== ScoreValue.EMPTY);
    if (lastFilledIdx !== -1) {
      const actualIdx = MAX_ATTEMPTS - 1 - lastFilledIdx;
      handleScoreSelect(actualIdx, ScoreValue.EMPTY);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-4 transition-all hover:border-indigo-300 dark:hover:border-indigo-500 duration-300">
      {/* Cabeçalho do Fundamento */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <div>
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-indigo-600 dark:bg-indigo-400 rounded-full"></span>
            {name}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider">
          <span className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg border border-green-100 dark:border-green-800">Eficiência: {stats.efficiency.toFixed(1)}%</span>
          <span className="text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-800">Registros: {recordedCount}/10</span>
        </div>
      </div>

      {/* PAINEL DE MARCAÇÃO RÁPIDA */}
      <div className="flex items-center gap-2 mb-6 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="grid grid-cols-4 gap-2 flex-1">
          {SCORE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleQuickScore(opt.value)}
              disabled={recordedCount >= MAX_ATTEMPTS}
              className={`flex flex-col items-center justify-center py-3 rounded-xl border-b-4 transition-all active:translate-y-1 active:border-b-0 disabled:opacity-30 disabled:grayscale
                ${opt.value === ScoreValue.ERROR ? 'bg-red-500 dark:bg-red-600 border-red-700 dark:border-red-800 text-white shadow-red-200 dark:shadow-none' : 
                  opt.value === ScoreValue.POOR ? 'bg-amber-400 dark:bg-amber-500 border-amber-600 dark:border-amber-700 text-amber-950 dark:text-amber-950 shadow-amber-100 dark:shadow-none' :
                  opt.value === ScoreValue.GOOD ? 'bg-indigo-500 dark:bg-indigo-600 border-indigo-700 dark:border-indigo-800 text-white shadow-indigo-100 dark:shadow-none' :
                  'bg-emerald-500 dark:bg-emerald-600 border-emerald-700 dark:border-emerald-800 text-white shadow-emerald-100 dark:shadow-none'} shadow-lg
              `}
            >
              <span className="text-xl font-black">{opt.value}</span>
              <span className="text-[9px] font-bold uppercase opacity-80">{opt.label}</span>
            </button>
          ))}
        </div>
        
        <button 
          onClick={handleUndo}
          title="Desfazer último registro"
          className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-orange-500 dark:hover:text-orange-400 hover:border-orange-200 dark:hover:border-orange-900 transition-colors shadow-sm active:scale-95"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      {/* Linha do Tempo das Tentativas */}
      <div className="grid grid-cols-5 md:grid-cols-10 gap-1.5">
        {stats.attempts.map((val, idx) => {
          const isAnimating = lastUpdatedIdx === idx;
          const isSuccess = val >= 2;
          const isError = val === 0;

          return (
            <div key={idx} className="flex flex-col items-center">
              <div className="relative group w-full">
                <button
                  className={`w-full aspect-square rounded-lg border transition-all flex items-center justify-center font-bold text-sm
                    ${val === ScoreValue.EMPTY ? 'border-dashed border-slate-200 dark:border-slate-700 bg-transparent text-slate-200 dark:text-slate-700' : 
                      val === ScoreValue.ERROR ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400' :
                      val === ScoreValue.POOR ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-400' :
                      val === ScoreValue.GOOD ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400' :
                      'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400'}
                    ${isAnimating ? 'animate-pop' : ''}
                    ${isAnimating && isSuccess ? 'animate-success-feedback' : ''}
                    ${isAnimating && isError ? 'animate-error-feedback' : ''}
                  `}
                >
                  {val === ScoreValue.EMPTY ? idx + 1 : val}
                </button>
                
                {/* Popover para ajuste manual rápido */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-32 bg-white dark:bg-slate-800 shadow-2xl rounded-xl border border-slate-200 dark:border-slate-700 p-1.5 hidden group-hover:block z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                  {SCORE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleScoreSelect(idx, opt.value)}
                      className="w-full text-left px-2 py-1.5 text-xs font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 dark:text-slate-300"
                    >
                      <span className={`w-2 h-2 rounded-full ${opt.bg.split(' ')[0]}`}></span>
                      {opt.label} ({opt.value})
                    </button>
                  ))}
                  <button
                    onClick={() => handleScoreSelect(idx, ScoreValue.EMPTY)}
                    className="w-full mt-1 border-t border-slate-100 dark:border-slate-700 pt-1 text-center text-[10px] text-red-400 font-bold"
                  >
                    LIMPAR
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Barra de Progresso Sutil */}
      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-indigo-600 dark:bg-indigo-400 h-full transition-all duration-500 ease-out" 
            style={{ width: `${(recordedCount / MAX_ATTEMPTS) * 100}%` }}
          ></div>
        </div>
        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 whitespace-nowrap uppercase">
          {recordedCount}/10 Concluído
        </span>
      </div>
    </div>
  );
};
