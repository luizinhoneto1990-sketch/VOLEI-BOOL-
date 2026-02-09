
export enum ScoreValue {
  EMPTY = -1,
  ERROR = 0,
  POOR = 1,
  GOOD = 2,
  EXCELLENT = 3
}

export type SkillName = 'Saque' | 'Passe' | 'Ataque' | 'Bloqueio' | 'Levantamento' | 'Coletividade';

export type AthletePosition = 'Levantador' | 'Ponteiro' | 'Central' | 'Oposto' | 'Líbero';

export interface Athlete {
  id: string;
  name: string;
  position: AthletePosition;
}

export interface SkillStats {
  attempts: ScoreValue[];
  successCount: number;
  errorCount: number;
  efficiency: number;
}

export interface MatchData {
  [key: string]: SkillStats;
}

export interface ScoreOption {
  value: ScoreValue;
  label: string;
  color: string;
  bg: string;
}
