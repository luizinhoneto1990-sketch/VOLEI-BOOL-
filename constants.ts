
import { ScoreValue, ScoreOption, SkillName, AthletePosition } from './types';

export const SKILL_NAMES: SkillName[] = [
  'Saque',
  'Passe',
  'Ataque',
  'Bloqueio',
  'Levantamento',
  'Coletividade'
];

export const POSITIONS: AthletePosition[] = [
  'Levantador',
  'Ponteiro',
  'Central',
  'Oposto',
  'Líbero'
];

export const POSITION_COLORS: Record<AthletePosition, string> = {
  'Levantador': 'bg-blue-100 text-blue-700 border-blue-200',
  'Ponteiro': 'bg-orange-100 text-orange-700 border-orange-200',
  'Central': 'bg-purple-100 text-purple-700 border-purple-200',
  'Oposto': 'bg-red-100 text-red-700 border-red-200',
  'Líbero': 'bg-green-100 text-green-700 border-green-200'
};

export const SCORE_OPTIONS: ScoreOption[] = [
  { value: ScoreValue.ERROR, label: 'Erro', color: 'text-red-600', bg: 'bg-red-100 hover:bg-red-200' },
  { value: ScoreValue.POOR, label: 'Regular', color: 'text-yellow-600', bg: 'bg-yellow-100 hover:bg-yellow-200' },
  { value: ScoreValue.GOOD, label: 'Bom', color: 'text-blue-600', bg: 'bg-blue-100 hover:bg-blue-200' },
  { value: ScoreValue.EXCELLENT, label: 'Excelente', color: 'text-green-600', bg: 'bg-green-100 hover:bg-green-200' }
];

export const MAX_ATTEMPTS = 10;
