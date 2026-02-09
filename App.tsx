
import React, { useState, useMemo, useEffect } from 'react';
import { SkillName, ScoreValue, MatchData, SkillStats, Athlete, AthletePosition } from './types';
import { SKILL_NAMES, MAX_ATTEMPTS, POSITIONS, POSITION_COLORS } from './constants';
import { SkillBlock } from './components/SkillBlock';
import { getCoachAnalysis } from './services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trophy, Activity, MessageSquare, RotateCcw, Save, ShieldCheck, UserPlus, Users, User, CheckCircle2, Edit3, Trash2, X, Sun, Moon } from 'lucide-react';

const STORAGE_KEY = 'volleyball_stats_pro_data';
const THEME_KEY = 'volleyball_stats_pro_theme';

const createEmptyMatchData = (): MatchData => {
  const data: MatchData = {};
  SKILL_NAMES.forEach(skill => {
    data[skill] = {
      attempts: Array(MAX_ATTEMPTS).fill(ScoreValue.EMPTY),
      successCount: 0,
      errorCount: 0,
      efficiency: 0
    };
  });
  return data;
};

const App: React.FC = () => {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_KEY, 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Persistence Loading Logic
  const getInitialData = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Erro ao carregar dados do localStorage", e);
      }
    }
    return null;
  };

  const initialData = getInitialData();

  // State for Athletes
  const [athletes, setAthletes] = useState<Athlete[]>(
    initialData?.athletes || [{ id: '1', name: 'Atleta Exemplo', position: 'Levantador' }]
  );
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(
    initialData?.athletes?.[0]?.id || '1'
  );
  
  // State for Stats mapped by Athlete ID
  const [statsByAthlete, setStatsByAthlete] = useState<Record<string, MatchData>>(
    initialData?.statsByAthlete || { '1': createEmptyMatchData() }
  );

  // Form State
  const [athleteFormMode, setAthleteFormMode] = useState<'add' | 'edit'>('add');
  const [showAthleteForm, setShowAthleteForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPosition, setFormPosition] = useState<AthletePosition>('Ponteiro');
  
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Persistence Sync
  const syncStorage = (updatedAthletes: Athlete[], updatedStats: Record<string, MatchData>) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      athletes: updatedAthletes,
      statsByAthlete: updatedStats
    }));
  };

  const handleSaveToLocalStorage = () => {
    syncStorage(athletes, statsByAthlete);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2000);
  };

  const currentAthlete = useMemo(() => 
    athletes.find(a => a.id === selectedAthleteId) || athletes[0],
    [athletes, selectedAthleteId]
  );

  const currentMatchData = useMemo(() => 
    statsByAthlete[selectedAthleteId] || createEmptyMatchData(),
    [statsByAthlete, selectedAthleteId]
  );

  const calculateStats = (attempts: ScoreValue[]): Omit<SkillStats, 'attempts'> => {
    const filtered = attempts.filter(a => a !== ScoreValue.EMPTY);
    const successCount = filtered.filter(a => a >= 2).length;
    const errorCount = filtered.filter(a => a === 0).length;
    const totalPoints = filtered.reduce((acc, curr) => acc + (curr as number), 0);
    const efficiency = filtered.length > 0 ? (totalPoints / (filtered.length * 3)) * 100 : 0;
    return { successCount, errorCount, efficiency };
  };

  const handleUpdateAttempt = (skill: SkillName, index: number, value: ScoreValue) => {
    setStatsByAthlete(prev => {
      const currentData = prev[selectedAthleteId] || createEmptyMatchData();
      const newAttempts = [...currentData[skill].attempts];
      newAttempts[index] = value;
      const newStats = calculateStats(newAttempts);
      
      const nextStats = {
        ...prev,
        [selectedAthleteId]: {
          ...currentData,
          [skill]: {
            attempts: newAttempts,
            ...newStats
          }
        }
      };
      return nextStats;
    });
  };

  const openAddForm = () => {
    setAthleteFormMode('add');
    setFormName('');
    setFormPosition('Ponteiro');
    setShowAthleteForm(true);
  };

  const openEditForm = () => {
    if (!currentAthlete) return;
    setAthleteFormMode('edit');
    setFormName(currentAthlete.name);
    setFormPosition(currentAthlete.position);
    setShowAthleteForm(true);
  };

  const handleSubmitAthlete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    let updatedAthletes = [...athletes];
    let updatedStats = { ...statsByAthlete };

    if (athleteFormMode === 'add') {
      const newId = Date.now().toString();
      const newAthlete: Athlete = {
        id: newId,
        name: formName,
        position: formPosition
      };
      updatedAthletes.push(newAthlete);
      updatedStats[newId] = createEmptyMatchData();
      setSelectedAthleteId(newId);
    } else {
      updatedAthletes = athletes.map(a => 
        a.id === selectedAthleteId ? { ...a, name: formName, position: formPosition } : a
      );
    }

    setAthletes(updatedAthletes);
    setStatsByAthlete(updatedStats);
    setShowAthleteForm(false);
    syncStorage(updatedAthletes, updatedStats);
  };

  const handleDeleteAthlete = () => {
    if (athletes.length <= 1) {
      alert("Não é possível remover o único atleta cadastrado.");
      return;
    }
    
    if (confirm(`Deseja realmente remover ${currentAthlete.name}? Todos os seus dados serão apagados.`)) {
      const updatedAthletes = athletes.filter(a => a.id !== selectedAthleteId);
      const { [selectedAthleteId]: _, ...updatedStats } = statsByAthlete;
      
      setAthletes(updatedAthletes);
      setStatsByAthlete(updatedStats);
      setSelectedAthleteId(updatedAthletes[0].id);
      setAiAnalysis(null);
      syncStorage(updatedAthletes, updatedStats);
    }
  };

  const handleReset = () => {
    if (confirm(`Isso limpará APENAS as estatísticas atuais de ${currentAthlete.name}. Continuar?`)) {
      setStatsByAthlete(prev => ({
        ...prev,
        [selectedAthleteId]: createEmptyMatchData()
      }));
      setAiAnalysis(null);
    }
  };

  const handleFullReset = () => {
    if (confirm(`Isso apagará TODOS os atletas e estatísticas salvos permanentemente. Deseja continuar?`)) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  };

  const handleAiAnalysis = async () => {
    setIsAnalyzing(true);
    const analysis = await getCoachAnalysis(currentMatchData);
    setAiAnalysis(analysis);
    setIsAnalyzing(false);
  };

  const barChartData = SKILL_NAMES.map(skill => ({
    name: skill,
    efficiency: parseFloat(currentMatchData[skill].efficiency.toFixed(1))
  }));

  const getBarColor = (efficiency: number) => {
    if (efficiency >= 70) return '#10b981';
    if (efficiency >= 40) return '#6366f1';
    return '#f43f5e';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 pb-20">
      <header className="bg-indigo-700 dark:bg-indigo-900 text-white p-6 shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white dark:bg-slate-800 p-2 rounded-full text-indigo-700 dark:text-indigo-400 shadow-md">
              <Activity size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight uppercase leading-none">VolleyStats <span className="text-indigo-200">Pro</span></h1>
              <p className="text-[10px] text-indigo-200 uppercase tracking-widest mt-1 font-bold">Gestão de Alta Performance</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-indigo-800 hover:bg-indigo-600 dark:bg-indigo-800 dark:hover:bg-indigo-700 transition-colors shadow-inner text-indigo-100"
              title={isDarkMode ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="flex-1 md:flex-none relative">
               <select 
                value={selectedAthleteId}
                onChange={(e) => setSelectedAthleteId(e.target.value)}
                className="w-full md:w-64 bg-indigo-800 dark:bg-slate-800 text-white border border-indigo-500 dark:border-slate-700 rounded-lg px-4 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {athletes.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.position})</option>
                ))}
              </select>
              <Users className="absolute right-3 top-2.5 pointer-events-none opacity-50" size={18} />
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={handleSaveToLocalStorage}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all shadow-md text-sm
                  ${saveFeedback ? 'bg-green-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white'}
                `}
                title="Salvar Dados"
              >
                {saveFeedback ? <CheckCircle2 size={18} /> : <Save size={18} />}
                {saveFeedback ? 'Salvo!' : 'Salvar'}
              </button>
              
              <button 
                onClick={openAddForm}
                className="bg-indigo-500 hover:bg-indigo-400 p-2 rounded-lg transition-colors shadow-inner"
                title="Adicionar Atleta"
              >
                <UserPlus size={22} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6">
        {showAthleteForm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-indigo-600 dark:bg-indigo-700 p-6 text-white flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {athleteFormMode === 'add' ? <UserPlus size={24} /> : <Edit3 size={24} />}
                  {athleteFormMode === 'add' ? 'Novo Cadastro' : 'Editar Atleta'}
                </h2>
                <button onClick={() => setShowAthleteForm(false)} className="hover:bg-white/10 p-1 rounded transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmitAthlete} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="Ex: Gilberto Amauri"
                    className="w-full border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl px-4 py-2 focus:border-indigo-500 outline-none transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Posição em Quadra</label>
                  <div className="grid grid-cols-2 gap-2">
                    {POSITIONS.map(pos => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setFormPosition(pos)}
                        className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                          formPosition === pos 
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' 
                          : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:border-slate-200'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAthleteForm(false)}
                    className="flex-1 py-3 rounded-xl font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all"
                  >
                    {athleteFormMode === 'add' ? 'Cadastrar' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 transition-colors duration-300">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 border-4 border-white dark:border-slate-600 shadow-sm flex items-center justify-center text-slate-400">
                    <User size={32} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{currentAthlete?.name}</h2>
                      <button 
                        onClick={openEditForm}
                        className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" 
                        title="Editar Nome/Posição"
                      >
                        <Edit3 size={18} />
                      </button>
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${POSITION_COLORS[currentAthlete?.position || 'Ponteiro']}`}>
                      {currentAthlete?.position}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                   <button 
                    onClick={handleReset}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1 text-xs font-bold text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 border border-orange-100 dark:border-orange-900 px-3 py-2 rounded-lg transition-colors"
                  >
                    <RotateCcw size={14} /> Resetar Dados
                  </button>
                  <button 
                    onClick={handleDeleteAthlete}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-100 dark:border-red-900 px-3 py-2 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} /> Remover Atleta
                  </button>
                  <button 
                    onClick={handleFullReset}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1 text-xs font-bold text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors"
                  >
                    Limpar Tudo
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-tight text-sm">
              <Trophy size={18} className="text-indigo-600 dark:text-indigo-400" />
              <span>Fundamentos em Tempo Real</span>
            </div>
            
            <div className="space-y-2">
              {SKILL_NAMES.map(skill => (
                <SkillBlock 
                  key={`${selectedAthleteId}-${skill}`} 
                  name={skill} 
                  stats={currentMatchData[skill]} 
                  onUpdateAttempt={handleUpdateAttempt} 
                />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sticky top-28 transition-colors duration-300">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                <Activity size={20} className="text-indigo-500 dark:text-indigo-400" />
                Eficiência por Fundamento
              </h3>
              
              <div className="h-72 w-full mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#f1f5f9"} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 10, fontWeight: 700, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      angle={-25}
                      textAnchor="end"
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      tick={{ fontSize: 10, fill: isDarkMode ? '#64748b' : '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc' }}
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                        color: isDarkMode ? '#f8fafc' : '#1e293b'
                      }}
                      formatter={(value: number) => [`${value}%`, 'Eficiência']}
                    />
                    <Bar 
                      dataKey="efficiency" 
                      radius={[6, 6, 0, 0]}
                      barSize={24}
                    >
                      {barChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(entry.efficiency)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <button 
                onClick={handleAiAnalysis}
                disabled={isAnalyzing}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all shadow-lg
                  ${isAnalyzing ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none' : 'bg-indigo-600 dark:bg-indigo-700 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 hover:-translate-y-0.5 active:translate-y-0'}
                `}
              >
                <MessageSquare size={20} />
                {isAnalyzing ? 'Analisando Dados...' : 'Gerar Relatório IA'}
              </button>

              {aiAnalysis && (
                <div className="mt-6 p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 text-sm text-indigo-900 dark:text-indigo-200 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center gap-2 mb-3 font-bold text-indigo-700 dark:text-indigo-400">
                    <ShieldCheck size={20} /> Relatório do Treinador
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed text-xs opacity-90">
                    {aiAnalysis}
                  </div>
                </div>
              )}
            </section>

            <section className="bg-slate-900 dark:bg-black text-white rounded-2xl p-6 shadow-xl overflow-hidden relative transition-colors duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Users size={80} />
              </div>
              <h4 className="font-bold text-indigo-400 mb-4 text-xs uppercase tracking-widest">Elenco Atual ({athletes.length})</h4>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {athletes.map(a => (
                  <div 
                    key={a.id}
                    onClick={() => setSelectedAthleteId(a.id)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                      selectedAthleteId === a.id ? 'bg-indigo-600/30 border-indigo-500' : 'bg-white/5 border-transparent hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${selectedAthleteId === a.id ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'}`}></div>
                      <span className="text-sm font-medium">{a.name}</span>
                    </div>
                    <span className="text-[10px] opacity-60 uppercase font-bold">{a.position}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto px-6 py-12 text-center">
        <div className="flex justify-center gap-8 mb-4 opacity-30 grayscale">
          <Activity size={32} />
          <Trophy size={32} />
          <Users size={32} />
        </div>
        <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">
          &copy; 2024 VolleyStats Pro - Elite Data Analysis
        </p>
      </footer>
    </div>
  );
};

export default App;
