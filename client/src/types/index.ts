export interface TeamStats {
  season: number;
  wins: number;
  losses: number;
  conferenceWins: number;
  conferenceLosses: number;
  pointsPerGame: number;
  pointsAllowedPerGame: number;
  yardsPerGame: number;
  yardsAllowedPerGame: number;
  turnoverMargin: number;
  strengthOfSchedule: number; // 0..1
  recentFormScore: number;    // 0..10 (wins in last 5 games * 2)
}

export interface Team {
  id: number;
  name: string;          // e.g. "Ole Miss"
  abbreviation: string;  // e.g. "MISS"
  mascot: string;        // e.g. "Rebels"
  conference: string;    // "SEC"
  city: string;
  state: string;
  primaryColor: string;  // hex
  secondaryColor: string;
  stats: TeamStats | null;
}

export interface GameTeam {
  id: number;
  name: string;
  abbreviation: string;
  primaryColor: string;
}

export interface Game {
  id: number;
  season: number;
  week: number;
  date: string; // ISO
  status: 'FINAL' | 'SCHEDULED';
  isConferenceGame: boolean;
  homeTeam: GameTeam;
  awayTeam: GameTeam;
  homeScore: number | null;
  awayScore: number | null;
}

export interface PredictionFactor {
  category: string;      // e.g. "Points Per Game"
  teamAValue: number;
  teamBValue: number;
  edge: 'A' | 'B' | 'EVEN';
  description: string;   // human-readable explanation
}

export interface PredictionResult {
  id: number | null;     // null when computed transiently (e.g. dashboard preview)
  teamA: Team;
  teamB: Team;
  homeTeamId: number | null; // null = neutral site
  winnerTeamId: number;
  teamAWinProbability: number; // 0..1
  teamBWinProbability: number; // 0..1
  projectedScoreA: number;
  projectedScoreB: number;
  factors: PredictionFactor[];
  summary: string; // e.g. "Ole Miss is favored because ..."
}

export interface SavedPrediction {
  id: number;
  createdAt: string;
  prediction: PredictionResult;
}

export interface AuthUser { id: number; email: string; name: string; }
export interface AuthResponse { token: string; user: AuthUser; }

export interface WeeklyPerformance {
  week: number;
  opponent: string;   // e.g. "vs Alabama" or "@ LSU"
  pointsFor: number;
  pointsAgainst: number;
  result: 'W' | 'L';
}

export interface OleMissDashboard {
  team: Team;
  games: Game[];              // full season ordered by week
  nextGame: Game | null;      // next SCHEDULED game
  nextGamePrediction: PredictionResult | null;
  weeklyPerformance: WeeklyPerformance[]; // FINAL games only
}
